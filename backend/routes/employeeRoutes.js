const express = require('express');
const router = express.Router();

const { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), listEmployees);
router.get('/:id', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), getEmployee);
router.post('/', requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), createEmployee);
router.put('/:id', requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), updateEmployee);
router.delete('/:id', requirePermission(PERMISSIONS.EMPLOYEES_MANAGE), deleteEmployee);

module.exports = router;
