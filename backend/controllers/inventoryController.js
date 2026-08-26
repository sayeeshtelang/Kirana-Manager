const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// @desc  Manually adjust stock (e.g. stock count correction, damage, theft)
// @route POST /api/inventory/adjust
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, quantity, direction, note } = req.body; // direction: 'in' | 'out'

  if (!productId || !quantity || quantity <= 0 || !['in', 'out'].includes(direction)) {
    res.status(400);
    throw new Error('productId, a positive quantity, and direction (in/out) are required.');
  }

  const session = await mongoose.startSession();
  let product;
  try {
    await session.withTransaction(async () => {
      product = await Product.findOne({ _id: productId, business: req.businessId }).session(session);
      if (!product) {
        res.status(404);
        throw new Error('Product not found.');
      }

      const before = product.stockQuantity;
      const after = direction === 'in' ? before + Number(quantity) : before - Number(quantity);
      if (after < 0) {
        res.status(400);
        throw new Error('Adjustment would result in negative stock.');
      }

      product.stockQuantity = after;
      await product.save({ session });

      await StockMovement.create(
        [{
          business: req.businessId,
          product: product._id,
          type: direction === 'in' ? 'adjustment_in' : 'adjustment_out',
          quantity: Number(quantity),
          quantityBefore: before,
          quantityAfter: after,
          reference: { kind: 'manual', id: null },
          note,
          performedBy: req.user._id,
        }],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  res.json({ product });
});

// @desc  List stock movement history, optionally filtered by product
// @route GET /api/inventory/movements?productId=&page=&limit=
const listMovements = asyncHandler(async (req, res) => {
  const { productId, page = 1, limit = 30 } = req.query;
  const filter = { business: req.businessId };
  if (productId) filter.product = productId;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

  const [movements, total] = await Promise.all([
    StockMovement.find(filter)
      .populate('product', 'name sku unit')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    StockMovement.countDocuments(filter),
  ]);

  res.json({ movements, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// @desc  List products at or below their low-stock threshold
// @route GET /api/inventory/low-stock
const listLowStock = asyncHandler(async (req, res) => {
  const products = await Product.find({
    business: req.businessId,
    isActive: true,
    $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
  }).sort({ stockQuantity: 1 });

  res.json({ products });
});

module.exports = { adjustStock, listMovements, listLowStock };
