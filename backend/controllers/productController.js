const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @route GET /api/products?search=&category=&page=&limit=&lowStock=true
const listProducts = asyncHandler(async (req, res) => {
  const { search, category, lowStock, page = 1, limit = 20 } = req.query;

  const filter = { business: req.businessId };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) filter.category = category;
  if (lowStock === 'true') filter.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, business: req.businessId }).populate('category', 'name');
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }
  res.json({ product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, barcode, category, unit, sellingPrice, mrp, taxPercent, lowStockThreshold } = req.body;

  if (!name || sellingPrice === undefined) {
    res.status(400);
    throw new Error('Name and selling price are required.');
  }

  let imageUrl = '';
  let imagePublicId = '';
  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, `grocery/${req.businessId}/products`);
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const product = await Product.create({
    business: req.businessId,
    name,
    sku,
    barcode,
    category: category || undefined,
    unit,
    sellingPrice,
    mrp,
    taxPercent,
    lowStockThreshold,
    imageUrl,
    imagePublicId,
  });

  res.status(201).json({ product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, business: req.businessId });
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const editableFields = [
    'name', 'sku', 'barcode', 'category', 'unit', 'sellingPrice',
    'mrp', 'taxPercent', 'lowStockThreshold', 'isActive',
  ];
  for (const field of editableFields) {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  }

  if (req.file) {
    if (product.imagePublicId) await deleteFromCloudinary(product.imagePublicId);
    const result = await uploadBufferToCloudinary(req.file.buffer, `grocery/${req.businessId}/products`);
    product.imageUrl = result.secure_url;
    product.imagePublicId = result.public_id;
  }

  await product.save();
  res.json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, business: req.businessId },
    { isActive: false },
    { new: true }
  );
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }
  res.json({ message: 'Product deactivated.' });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
