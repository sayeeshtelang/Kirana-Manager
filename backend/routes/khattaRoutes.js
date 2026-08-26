const express = require('express');
const router = express.Router();

const { recordRepayment, getLedger, listOutstanding } = require('../controllers/khattaController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/outstanding', requirePermission(PERMISSIONS.KHATTA_VIEW), listOutstanding);
router.get('/:customerId/ledger', requirePermission(PERMISSIONS.KHATTA_VIEW), getLedger);
router.post('/:customerId/repay', requirePermission(PERMISSIONS.KHATTA_MANAGE), recordRepayment);

module.exports = router;
