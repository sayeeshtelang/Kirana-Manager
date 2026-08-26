const express = require('express');
const router = express.Router();

const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);
router.get('/', requirePermission(PERMISSIONS.DASHBOARD_VIEW), getDashboard);

module.exports = router;
