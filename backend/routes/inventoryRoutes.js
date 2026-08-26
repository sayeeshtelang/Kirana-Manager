const express = require('express');
const router = express.Router();

const { adjustStock, listMovements, listLowStock } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/movements', requirePermission(PERMISSIONS.INVENTORY_VIEW), listMovements);
router.get('/low-stock', requirePermission(PERMISSIONS.INVENTORY_VIEW), listLowStock);
router.post('/adjust', requirePermission(PERMISSIONS.INVENTORY_MANAGE), adjustStock);

module.exports = router;
