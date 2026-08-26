const express = require('express');
const router = express.Router();

const { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), listCustomers);
router.get('/:id', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), getCustomer);
router.post('/', requirePermission(PERMISSIONS.CUSTOMERS_MANAGE), createCustomer);
router.put('/:id', requirePermission(PERMISSIONS.CUSTOMERS_MANAGE), updateCustomer);
router.delete('/:id', requirePermission(PERMISSIONS.CUSTOMERS_MANAGE), deleteCustomer);

module.exports = router;
