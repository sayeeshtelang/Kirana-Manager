const express = require('express');
const router = express.Router();

const { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.SUPPLIERS_VIEW), listSuppliers);
router.get('/:id', requirePermission(PERMISSIONS.SUPPLIERS_VIEW), getSupplier);
router.post('/', requirePermission(PERMISSIONS.SUPPLIERS_MANAGE), createSupplier);
router.put('/:id', requirePermission(PERMISSIONS.SUPPLIERS_MANAGE), updateSupplier);
router.delete('/:id', requirePermission(PERMISSIONS.SUPPLIERS_MANAGE), deleteSupplier);

module.exports = router;
