const express = require('express');
const router = express.Router();

const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { requireBusiness, requirePermission } = require('../middleware/business');
const { PERMISSIONS } = require('../config/roles');
const upload = require('../middleware/upload');

router.use(protect, requireBusiness);

router.get('/', requirePermission(PERMISSIONS.PRODUCTS_VIEW), listProducts);
router.get('/:id', requirePermission(PERMISSIONS.PRODUCTS_VIEW), getProduct);
router.post('/', requirePermission(PERMISSIONS.PRODUCTS_MANAGE), upload.single('image'), createProduct);
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTS_MANAGE), upload.single('image'), updateProduct);
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTS_MANAGE), deleteProduct);

module.exports = router;
