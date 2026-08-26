const express = require('express');
const router = express.Router();

const { createBill, listBills, getBill, voidBill } = require('../controllers/billController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.BILLING_VIEW_HISTORY), listBills);
router.get('/:id', requirePermission(PERMISSIONS.BILLING_VIEW_HISTORY), getBill);
router.post('/', requirePermission(PERMISSIONS.BILLING_CREATE), createBill);
router.post('/:id/void', requirePermission(PERMISSIONS.BILLING_VOID), voidBill);

module.exports = router;
