const mongoose = require('mongoose');

// Immutable audit log of every stock change. Current stock is denormalized
// onto Product.stockQuantity for fast reads, but this collection is the
// source of truth for "why did the stock change".
const stockMovementSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

    type: {
      type: String,
      enum: ['purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out', 'return_in', 'void_reversal_in'],
      required: true,
    },

    quantity: { type: Number, required: true, min: 0 },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },

    reference: {
      kind: { type: String, enum: ['purchase_order', 'bill', 'manual', null], default: null },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    note: { type: String, trim: true, maxlength: 300 },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ business: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
