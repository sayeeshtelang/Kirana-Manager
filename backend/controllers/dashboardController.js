const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { PERMISSIONS } = require('../config/roles');

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d) { const x = startOfDay(d); const day = x.getDay(); x.setDate(x.getDate() - day); return x; }
function startOfMonth(d) { const x = startOfDay(d); x.setDate(1); return x; }

// @desc  Business dashboard summary, scoped to the caller's role/permissions.
// @route GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const baseFilter = { business: req.businessId, status: 'completed' };

  const [todaySales, weekSales, monthSales, lowStockCount, outstandingKhatta, recentBills] = await Promise.all([
    Bill.aggregate([
      { $match: { ...baseFilter, createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { ...baseFilter, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { ...baseFilter, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Product.countDocuments({ business: req.businessId, isActive: true, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }),
    Customer.aggregate([
      { $match: { business: req.businessId, khattaBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$khattaBalance' }, count: { $sum: 1 } } },
    ]),
    Bill.find(baseFilter).sort({ createdAt: -1 }).limit(5).populate('customer', 'name').populate('cashier', 'name'),
  ]);

  const summary = {
    today: { total: todaySales[0]?.total || 0, count: todaySales[0]?.count || 0 },
    week: { total: weekSales[0]?.total || 0, count: weekSales[0]?.count || 0 },
    month: { total: monthSales[0]?.total || 0, count: monthSales[0]?.count || 0 },
    lowStockCount,
    outstandingKhatta: { total: outstandingKhatta[0]?.total || 0, count: outstandingKhatta[0]?.count || 0 },
    recentBills,
  };

  // Role-adaptive: only include the wider analytics (sales trend, top products)
  // for roles with BUSINESS_VIEW_ANALYTICS. Cashiers etc. get the lighter summary above.
  if (req.permissions.has(PERMISSIONS.BUSINESS_VIEW_ANALYTICS)) {
    const trendStart = new Date(todayStart);
    trendStart.setDate(trendStart.getDate() - 13); // last 14 days

    const [salesTrend, topProducts] = await Promise.all([
      Bill.aggregate([
        { $match: { ...baseFilter, createdAt: { $gte: trendStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Bill.aggregate([
        { $match: { ...baseFilter, createdAt: { $gte: monthStart } } },
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
        { $limit: 5 },
      ]),
    ]);

    summary.salesTrend = salesTrend.map((d) => ({ date: d._id, total: d.total, count: d.count }));
    summary.topProducts = topProducts;
  }

  res.json({ summary, role: req.role });
});

module.exports = { getDashboard };
