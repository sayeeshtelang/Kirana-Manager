const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');

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

module.exports = { salesReport, productPerformanceReport, paymentMethodReport };
