const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const KhattaTransaction = require('../models/KhattaTransaction');

// @desc  Record a khatta repayment (customer pays down their credit balance)
// @route POST /api/khatta/:customerId/repay
const recordRepayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, note } = req.body;
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('A positive repayment amount is required.');
  }

  const session = await mongoose.startSession();
  let customer;
  let transaction;
  try {
    await session.withTransaction(async () => {
      customer = await Customer.findOne({ _id: req.params.customerId, business: req.businessId }).session(session);
      if (!customer) {
        res.status(404);
        throw new Error('Customer not found.');
      }

      const before = customer.khattaBalance;
      const after = Math.max(0, before - Number(amount));
      customer.khattaBalance = after;
      await customer.save({ session });

      const created = await KhattaTransaction.create(
        [{
          business: req.businessId,
          customer: customer._id,
          type: 'repayment',
          amount: Number(amount),
          balanceBefore: before,
          balanceAfter: after,
          paymentMethod: paymentMethod || 'cash',
          reference: { kind: 'manual', id: null },
          note,
          recordedBy: req.user._id,
        }],
        { session }
      );
      transaction = created[0];
    });
  } finally {
    session.endSession();
  }

  res.status(201).json({ customer, transaction });
});

// @desc  Get khatta ledger (transaction history) for a customer
// @route GET /api/khatta/:customerId/ledger
const getLedger = asyncHandler(async (req, res) => {
  const transactions = await KhattaTransaction.find({
    business: req.businessId,
    customer: req.params.customerId,
  })
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ transactions });
});

// @desc  Overview of all customers with an outstanding khatta balance
// @route GET /api/khatta/outstanding
const listOutstanding = asyncHandler(async (req, res) => {
  const customers = await Customer.find({ business: req.businessId, khattaBalance: { $gt: 0 } }).sort({ khattaBalance: -1 });
  const totalOutstanding = customers.reduce((sum, c) => sum + c.khattaBalance, 0);
  res.json({ customers, totalOutstanding });
});

module.exports = { recordRepayment, getLedger, listOutstanding };
