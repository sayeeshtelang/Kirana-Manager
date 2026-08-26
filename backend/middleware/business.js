const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const Business = require('../models/Business');
const { getPermissionsForRole, ROLES } = require('../config/roles');

/**
 * Resolves which business the current request is acting on and verifies
 * that req.user actually has an active Membership in it.
 *
 * The business id is NEVER trusted blindly from the frontend: it is only
 * accepted as a lookup key, and access is always re-verified server-side
 * against the Membership collection on every single request.
 *
 * Attaches:
 *   req.businessId   - ObjectId of the verified business
 *   req.business     - the Business document
 *   req.membership   - the caller's Membership document in this business
 *   req.role         - the caller's role string in this business
 *   req.permissions  - the caller's effective permission list in this business
 */
const requireBusiness = asyncHandler(async (req, res, next) => {
  const businessId = req.headers['x-business-id'] || req.params.businessId || req.body.businessId || req.query.businessId;

  if (!businessId || !mongoose.isValidObjectId(businessId)) {
    res.status(400);
    throw new Error('A valid businessId is required (send via X-Business-Id header).');
  }

  const membership = await Membership.findOne({
    user: req.user._id,
    business: businessId,
    status: 'active',
  });

  if (!membership) {
    res.status(403);
    throw new Error('You do not have access to this business.');
  }

  const business = await Business.findById(businessId);
  if (!business || !business.isActive) {
    res.status(404);
    throw new Error('Business not found or has been deactivated.');
  }

  req.businessId = business._id;
  req.business = business;
  req.membership = membership;
  req.role = membership.role;
  req.permissions = new Set([
    ...getPermissionsForRole(membership.role),
    ...(membership.extraPermissions || []),
  ]);

  next();
});

/**
 * Middleware factory: requires the caller's role in the current business
 * to have the given permission(s). Must run AFTER requireBusiness.
 * Owners implicitly pass every check.
 */
function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.role || !req.permissions) {
      res.status(500);
      return next(new Error('requirePermission used without requireBusiness running first.'));
    }

    if (req.role === ROLES.OWNER) return next();

    const hasAll = permissions.every((p) => req.permissions.has(p));
    if (!hasAll) {
      res.status(403);
      return next(new Error('You do not have permission to perform this action.'));
    }
    next();
  };
}

/** Restricts an action to the business Owner only (e.g. deleting the business). */
function requireOwner(req, res, next) {
  if (req.role !== ROLES.OWNER) {
    res.status(403);
    return next(new Error('Only the business owner can perform this action.'));
  }
  next();
}

module.exports = { requireBusiness, requirePermission, requireOwner };
