const express = require('express');
const router = express.Router();

const {
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
} = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.PURCHASE_ORDERS_VIEW), listPurchaseOrders);
router.get('/:id', requirePermission(PERMISSIONS.PURCHASE_ORDERS_VIEW), getPurchaseOrder);
router.post('/', requirePermission(PERMISSIONS.PURCHASE_ORDERS_MANAGE), createPurchaseOrder);
router.post('/:id/receive', requirePermission(PERMISSIONS.PURCHASE_ORDERS_MANAGE), receivePurchaseOrder);
router.post('/:id/cancel', requirePermission(PERMISSIONS.PURCHASE_ORDERS_MANAGE), cancelPurchaseOrder);

module.exports = router;
