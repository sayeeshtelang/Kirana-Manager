const express = require('express');
const router = express.Router();

const {
  getBusiness,
  updateBusiness,
  listMembers,
  inviteMember,
  acceptInvite,
  changeMemberRole,
  removeMember,
} = require('../controllers/businessController');

const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission, requireOwner } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect);

// Accepting an invite requires being logged in, but not yet a member of THIS business,
// so it intentionally does not go through requireBusiness.
router.post('/members/accept-invite', acceptInvite);

router.use(requireBusiness);

router.get('/', getBusiness);
router.put('/', requirePermission(PERMISSIONS.BUSINESS_MANAGE_SETTINGS), updateBusiness);

router.get('/members', requirePermission(PERMISSIONS.BUSINESS_MANAGE_USERS), listMembers);
router.post('/members/invite', requirePermission(PERMISSIONS.BUSINESS_MANAGE_USERS), inviteMember);
router.patch('/members/:membershipId/role', requirePermission(PERMISSIONS.BUSINESS_MANAGE_USERS), changeMemberRole);
router.delete('/members/:membershipId', requirePermission(PERMISSIONS.BUSINESS_MANAGE_USERS), removeMember);

module.exports = router;
