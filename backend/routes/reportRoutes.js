const express = require('express');
const router = express.Router();

const { salesReport, productPerformanceReport, paymentMethodReport, purchaseReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness, requirePermission(PERMISSIONS.REPORTS_VIEW));

router.get('/sales', salesReport);
router.get('/products', productPerformanceReport);
router.get('/payment-methods', paymentMethodReport);
router.get('/purchases', purchaseReport);

module.exports = router;
