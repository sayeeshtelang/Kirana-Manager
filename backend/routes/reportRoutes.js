const express = require('express');
const router = express.Router();

const { salesReport, productPerformanceReport, paymentMethodReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness, requirePermission(PERMISSIONS.REPORTS_VIEW));

router.get('/sales', salesReport);
router.get('/products', productPerformanceReport);
router.get('/payment-methods', paymentMethodReport);

module.exports = router;
