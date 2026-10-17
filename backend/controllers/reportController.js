const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc  Sales report grouped by day/week/month within a date range.
// @route GET /api/reports/sales?from=&to=&groupBy=day|month
const salesReport = asyncHandler(async (req, res) => {
  const { from, to, groupBy = 'day' } = req.query;

  const match = { business: req.businessId, status: 'completed' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const format = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

  const results = await Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        totalSales: { $sum: '$totalAmount' },
        totalTax: { $sum: '$taxAmount' },
        totalDiscount: { $sum: '$discountAmount' },
        billCount: { $sum: 1 },
        khattaSales: { $sum: '$khattaAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    report: results.map((r) => ({
      period: r._id,
      totalSales: r.totalSales,
      totalTax: r.totalTax,
      totalDiscount: r.totalDiscount,
      billCount: r.billCount,
      khattaSales: r.khattaSales,
    })),
  });
});

// @desc  Product-level sales performance within a date range.
// @route GET /api/reports/products?from=&to=
const productPerformanceReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { business: req.businessId, status: 'completed' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const results = await Bill.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.json({ products: results });
});

// @desc  Payment-method breakdown (cash vs upi vs card vs khatta) for a period.
// @route GET /api/reports/payment-methods?from=&to=
const paymentMethodReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { business: req.businessId, status: 'completed' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const results = await Bill.aggregate([
    { $match: match },
    { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  res.json({ breakdown: results.map((r) => ({ method: r._id, total: r.total, count: r.count })) });
});

// @desc  Purchase report grouped by supplier within a date range.
// @route GET /api/reports/purchases?from=&to=
const purchaseReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { business: req.businessId };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const results = await PurchaseOrder.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$supplier',
        orderCount: { $sum: 1 },
        totalPurchases: { $sum: '$totalAmount' },
        receivedPurchases: {
          $sum: { $cond: [{ $eq: ['$status', 'received'] }, '$totalAmount', 0] },
        },
        itemQuantity: {
          $sum: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.quantity'] },
            },
          },
        },
      },
    },
    { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
    { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
    { $sort: { totalPurchases: -1 } },
  ]);
  const orders = await PurchaseOrder.find(match)
    .populate('supplier', 'name')
    .populate('items.product', 'name sku unit')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    purchases: results.map((result) => ({
      _id: result._id,
      supplier: result.supplier?.name || 'Unknown supplier',
      orderCount: result.orderCount,
      itemQuantity: result.itemQuantity,
      totalPurchases: result.totalPurchases,
      receivedPurchases: result.receivedPurchases,
    })),
    orders,
  });
});

module.exports = { salesReport, productPerformanceReport, paymentMethodReport, purchaseReport };
