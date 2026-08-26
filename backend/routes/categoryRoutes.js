const express = require('express');
const router = express.Router();

const { listCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.CATEGORIES_VIEW), listCategories);
router.post('/', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), createCategory);
router.put('/:id', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), updateCategory);
router.delete('/:id', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), deleteCategory);

module.exports = router;
