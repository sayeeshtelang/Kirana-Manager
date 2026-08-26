const mongoose = require('mongoose');

// Ledger entry for every khatta change: a credit sale increases khattaBalance,
// a repayment decreases it. Customer.khattaBalance is denormalized for fast reads;
// this collection is the audit trail.
const khattaTransactionSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },

    type: { type: String, enum: ['credit_sale', 'repayment', 'adjustment'], required: true },
    amount: { type: Number, required: true }, // positive value; direction determined by `type`

    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer', 'other'], default: 'cash' },

    reference: {
      kind: { type: String, enum: ['bill', 'manual', null], default: null },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    note: { type: String, trim: true, maxlength: 300 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

khattaTransactionSchema.index({ business: 1, customer: 1, createdAt: -1 });

module.exports = mongoose.model('KhattaTransaction', khattaTransactionSchema);
