const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Counter = require('../models/Counter');

const listPurchaseOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { business: req.businessId };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(filter)
      .populate('supplier', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    PurchaseOrder.countDocuments(filter),
  ]);

  res.json({ orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const getPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findOne({ _id: req.params.id, business: req.businessId })
    .populate('supplier', 'name phone email')
    .populate('items.product', 'name sku unit');
  if (!order) {
    res.status(404);
    throw new Error('Purchase order not found.');
  }
  res.json({ order });
});

const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplier, items, notes } = req.body;

  if (!supplier || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Supplier and at least one item are required.');
  }

  let subtotal = 0;
  const preparedItems = items.map((it) => {
    const total = Number(it.quantity) * Number(it.unitCost);
    subtotal += total;
    return { product: it.product, quantity: it.quantity, unitCost: it.unitCost, total };
  });
  const taxAmount = req.body.taxAmount || 0;
  const totalAmount = subtotal + taxAmount;

  const seq = await Counter.getNextSequence(req.businessId, 'purchase_order');
  const poNumber = `PO-${String(seq).padStart(5, '0')}`;

  const order = await PurchaseOrder.create({
    business: req.businessId,
    poNumber,
    supplier,
    items: preparedItems,
    subtotal,
    taxAmount,
    totalAmount,
    createdBy: req.user._id,
    notes,
  });

  res.status(201).json({ order });
});

// @desc  Mark a PO as received, which increases stock for each item.
// @route POST /api/purchase-orders/:id/receive
const receivePurchaseOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await PurchaseOrder.findOne({ _id: req.params.id, business: req.businessId }).session(session);
      if (!order) {
        res.status(404);
        throw new Error('Purchase order not found.');
      }
      if (['received', 'cancelled'].includes(order.status)) {
        res.status(400);
        throw new Error(`Purchase order is already ${order.status}.`);
      }

      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, business: req.businessId }).session(session);
        if (!product) continue; // product may have been deleted; skip but don't fail the whole receipt

        const before = product.stockQuantity;
        const after = before + item.quantity;
        product.stockQuantity = after;
        await product.save({ session });

        await StockMovement.create(
          [{
            business: req.businessId,
            product: product._id,
            type: 'purchase_in',
            quantity: item.quantity,
            quantityBefore: before,
            quantityAfter: after,
            reference: { kind: 'purchase_order', id: order._id },
            performedBy: req.user._id,
          }],
          { session }
        );
      }

      order.status = 'received';
      order.receivedAt = new Date();
      await order.save({ session });
    });
  } finally {
    session.endSession();
  }

  res.json({ order, message: 'Purchase order received and stock updated.' });
});

const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findOne({ _id: req.params.id, business: req.businessId });
  if (!order) {
    res.status(404);
    throw new Error('Purchase order not found.');
  }
  if (order.status === 'received') {
    res.status(400);
    throw new Error('Cannot cancel a purchase order that has already been received.');
  }
  order.status = 'cancelled';
  await order.save();
  res.json({ order });
});

module.exports = {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
};
