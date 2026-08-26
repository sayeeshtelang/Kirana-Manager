const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

const Business = require('../models/Business');
const Membership = require('../models/Membership');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { ROLES, ALL_ROLES, getPermissionsForRole } = require('../config/roles');

// @desc  Get current business profile + settings
// @route GET /api/business
const getBusiness = asyncHandler(async (req, res) => {
  res.json({ business: req.business, role: req.role, permissions: [...req.permissions] });
});

// @desc  Update business profile/settings (Owner/Admin)
// @route PUT /api/business
const updateBusiness = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'contactEmail', 'contactPhone', 'address', 'gstNumber', 'settings'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const business = await Business.findByIdAndUpdate(req.businessId, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ business });
});

// @desc  List all members (users + pending invites) of the current business
// @route GET /api/business/members
const listMembers = asyncHandler(async (req, res) => {
  const members = await Membership.find({ business: req.businessId })
    .populate('user', 'name email avatarUrl isActive')
    .sort({ createdAt: 1 });

  res.json({
    members: members.map((m) => ({
      id: m._id,
      role: m.role,
      status: m.status,
      invitedEmail: m.invitedEmail,
      user: m.user
        ? { id: m.user._id, name: m.user.name, email: m.user.email, avatarUrl: m.user.avatarUrl }
        : null,
      joinedAt: m.joinedAt,
    })),
  });
});

// @desc  Invite a user (by email) to the current business with a role
// @route POST /api/business/members/invite
const inviteMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !ALL_ROLES.includes(role)) {
    res.status(400);
    throw new Error('A valid email and role are required.');
  }
  if (role === ROLES.OWNER) {
    res.status(400);
    throw new Error('Cannot invite a user as Owner.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  const existingMembership = await Membership.findOne({
    business: req.businessId,
    $or: [
      { user: existingUser?._id },
      { invitedEmail: normalizedEmail, status: 'invited' },
    ],
  });
  if (existingMembership) {
    res.status(409);
    throw new Error('This email is already a member of, or has a pending invite to, this business.');
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

  const membership = await Membership.create({
    business: req.businessId,
    user: existingUser ? existingUser._id : undefined,
    role,
    status: 'invited',
    invitedBy: req.user._id,
    invitedEmail: normalizedEmail,
    inviteToken: hashedToken,
    inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${inviteToken}`;
  await sendEmail({
    to: normalizedEmail,
    subject: `You've been invited to join ${req.business.name}`,
    text: `You've been invited to join ${req.business.name} as ${role}. Accept here: ${inviteUrl}`,
    html: `<p>You've been invited to join <strong>${req.business.name}</strong> as <strong>${role}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  });

  res.status(201).json({ message: 'Invitation sent.', membershipId: membership._id });
});

// @desc  Accept a pending invite (logged-in user, or creates account first via /auth flow)
// @route POST /api/business/members/accept-invite
const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const membership = await Membership.findOne({
    inviteToken: hashedToken,
    inviteExpires: { $gt: Date.now() },
    status: 'invited',
  }).select('+inviteToken');

  if (!membership) {
    res.status(400);
    throw new Error('Invitation is invalid or has expired.');
  }

  if (membership.invitedEmail !== req.user.email) {
    res.status(403);
    throw new Error('This invitation was sent to a different email address.');
  }

  membership.user = req.user._id;
  membership.status = 'active';
  membership.inviteToken = undefined;
  membership.inviteExpires = undefined;
  membership.joinedAt = new Date();
  await membership.save();

  res.json({ message: 'Invitation accepted.', businessId: membership.business });
});

// @desc  Change a member's role
// @route PATCH /api/business/members/:membershipId/role
const changeMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ALL_ROLES.includes(role)) {
    res.status(400);
    throw new Error('Invalid role.');
  }

  const membership = await Membership.findOne({ _id: req.params.membershipId, business: req.businessId });
  if (!membership) {
    res.status(404);
    throw new Error('Member not found in this business.');
  }
  if (membership.role === ROLES.OWNER) {
    res.status(400);
    throw new Error("The business owner's role cannot be changed.");
  }
  if (role === ROLES.OWNER) {
    res.status(400);
    throw new Error('Use the transfer-ownership action to make someone else Owner.');
  }

  membership.role = role;
  await membership.save();

  res.json({ message: 'Role updated.', membership: { id: membership._id, role: membership.role } });
});

// @desc  Remove a member from the business
// @route DELETE /api/business/members/:membershipId
const removeMember = asyncHandler(async (req, res) => {
  const membership = await Membership.findOne({ _id: req.params.membershipId, business: req.businessId });
  if (!membership) {
    res.status(404);
    throw new Error('Member not found in this business.');
  }
  if (membership.role === ROLES.OWNER) {
    res.status(400);
    throw new Error('The business owner cannot be removed.');
  }
  if (membership.user && membership.user.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot remove yourself. Ask another admin/owner instead.');
  }

  await membership.deleteOne();
  res.json({ message: 'Member removed from business.' });
});

module.exports = {
  getBusiness,
  updateBusiness,
  listMembers,
  inviteMember,
  acceptInvite,
  changeMemberRole,
  removeMember,
};
