const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const KhattaTransaction = require('../models/KhattaTransaction');
const Counter = require('../models/Counter');

// @desc  Create a new bill (POS checkout). Deducts stock, and if any/all of the
//        total is put on khatta, updates the customer's credit balance.
// @route POST /api/bills
const createBill = asyncHandler(async (req, res) => {
  const { customerId, items, discountAmount = 0, paymentMethod, amountPaid = 0 } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('At least one item is required.');
  }
  if (!['cash', 'upi', 'card', 'khatta', 'split'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('A valid payment method is required.');
  }

  let customer = null;
  if (customerId) {
    customer = await Customer.findOne({ _id: customerId, business: req.businessId });
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found.');
    }
  }
  if ((paymentMethod === 'khatta' || paymentMethod === 'split') && !customer) {
    res.status(400);
    throw new Error('A customer is required for khatta or split payments.');
  }

  const session = await mongoose.startSession();
  let bill;
  try {
    await session.withTransaction(async () => {
      let subtotal = 0;
      let taxAmount = 0;
      const billItems = [];

      for (const line of items) {
        const product = await Product.findOne({ _id: line.product, business: req.businessId }).session(session);
        if (!product) {
          res.status(404);
          throw new Error(`Product not found: ${line.product}`);
        }
        if (product.stockQuantity < line.quantity) {
          res.status(409);
          throw new Error(`Insufficient stock for "${product.name}" (available: ${product.stockQuantity}).`);
        }

        const lineTotal = product.sellingPrice * line.quantity;
        const lineTax = lineTotal * (product.taxPercent / 100);
        subtotal += lineTotal;
        taxAmount += lineTax;

        billItems.push({
          product: product._id,
          name: product.name,
          quantity: line.quantity,
          unitPrice: product.sellingPrice,
          taxPercent: product.taxPercent,
          total: lineTotal + lineTax,
        });

        const before = product.stockQuantity;
        const after = before - line.quantity;
        product.stockQuantity = after;
        await product.save({ session });

        await StockMovement.create(
          [{
            business: req.businessId,
            product: product._id,
            type: 'sale_out',
            quantity: line.quantity,
            quantityBefore: before,
            quantityAfter: after,
            reference: { kind: 'bill', id: null }, // linked below once bill exists
            performedBy: req.user._id,
          }],
          { session }
        );
      }

      const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
      let khattaAmount = 0;
      if (paymentMethod === 'khatta') khattaAmount = totalAmount;
      else if (paymentMethod === 'split') khattaAmount = Math.max(0, totalAmount - amountPaid);

      const seq = await Counter.getNextSequence(req.businessId, 'invoice');
      const invoiceNumber = `${req.business.settings?.invoicePrefix || 'INV'}-${String(seq).padStart(5, '0')}`;

      const created = await Bill.create(
        [{
          business: req.businessId,
          invoiceNumber,
          customer: customer?._id || null,
          items: billItems,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          paymentMethod,
          amountPaid: paymentMethod === 'khatta' ? 0 : (paymentMethod === 'split' ? amountPaid : totalAmount),
          khattaAmount,
          cashier: req.user._id,
        }],
        { session }
      );
      bill = created[0];

      if (khattaAmount > 0 && customer) {
        const before = customer.khattaBalance;
        const after = before + khattaAmount;
        customer.khattaBalance = after;
        await customer.save({ session });

        await KhattaTransaction.create(
          [{
            business: req.businessId,
            customer: customer._id,
            type: 'credit_sale',
            amount: khattaAmount,
            balanceBefore: before,
            balanceAfter: after,
            reference: { kind: 'bill', id: bill._id },
            recordedBy: req.user._id,
          }],
          { session }
        );
      }
    });
  } finally {
    session.endSession();
  }

  const populated = await Bill.findById(bill._id).populate('customer', 'name phone').populate('cashier', 'name');
  res.status(201).json({ bill: populated });
});

// @desc  List billing history with filters
// @route GET /api/bills?status=&customerId=&from=&to=&page=&limit=
const listBills = asyncHandler(async (req, res) => {
  const { status, customerId, from, to, page = 1, limit = 20 } = req.query;
  const filter = { business: req.businessId };
  if (status) filter.status = status;
  if (customerId) filter.customer = customerId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .populate('customer', 'name phone')
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Bill.countDocuments(filter),
  ]);

  res.json({ bills, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, business: req.businessId })
    .populate('customer', 'name phone khattaBalance')
    .populate('cashier', 'name')
    .populate('items.product', 'name sku');
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found.');
  }
  res.json({ bill });
});

// @desc  Void a bill: reverses stock and any khatta charge.
// @route POST /api/bills/:id/void
const voidBill = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const session = await mongoose.startSession();
  let bill;
  try {
    await session.withTransaction(async () => {
      bill = await Bill.findOne({ _id: req.params.id, business: req.businessId }).session(session);
      if (!bill) {
        res.status(404);
        throw new Error('Bill not found.');
      }
      if (bill.status === 'voided') {
        res.status(400);
        throw new Error('Bill is already voided.');
      }

      for (const item of bill.items) {
        const product = await Product.findOne({ _id: item.product, business: req.businessId }).session(session);
        if (!product) continue;

        const before = product.stockQuantity;
        const after = before + item.quantity;
        product.stockQuantity = after;
        await product.save({ session });

        await StockMovement.create(
          [{
            business: req.businessId,
            product: product._id,
            type: 'void_reversal_in',
            quantity: item.quantity,
            quantityBefore: before,
            quantityAfter: after,
            reference: { kind: 'bill', id: bill._id },
            note: `Reversal for voided bill ${bill.invoiceNumber}`,
            performedBy: req.user._id,
          }],
          { session }
        );
      }

      if (bill.khattaAmount > 0 && bill.customer) {
        const customer = await Customer.findOne({ _id: bill.customer, business: req.businessId }).session(session);
        if (customer) {
          const before = customer.khattaBalance;
          const after = Math.max(0, before - bill.khattaAmount);
          customer.khattaBalance = after;
          await customer.save({ session });

          await KhattaTransaction.create(
            [{
              business: req.businessId,
              customer: customer._id,
              type: 'adjustment',
              amount: bill.khattaAmount,
              balanceBefore: before,
              balanceAfter: after,
              reference: { kind: 'bill', id: bill._id },
              note: `Reversal for voided bill ${bill.invoiceNumber}`,
              recordedBy: req.user._id,
            }],
            { session }
          );
        }
      }

      bill.status = 'voided';
      bill.voidedAt = new Date();
      bill.voidedBy = req.user._id;
      bill.voidReason = reason;
      await bill.save({ session });
    });
  } finally {
    session.endSession();
  }

  res.json({ bill, message: 'Bill voided, stock and khatta balance reversed.' });
});

module.exports = { createBill, listBills, getBill, voidBill };
