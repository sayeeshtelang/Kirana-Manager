const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at time of sale
    quantity: { type: Number, required: true, min: 0.001 },
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot
    taxPercent: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null }, // null = walk-in
    items: { type: [billItemSchema], validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'khatta', 'split'], required: true },
    amountPaid: { type: Number, default: 0, min: 0 },
    khattaAmount: { type: Number, default: 0, min: 0 }, // portion put on customer credit

    status: { type: String, enum: ['completed', 'voided'], default: 'completed' },
    voidedAt: { type: Date },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String, trim: true, maxlength: 300 },

    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

billSchema.index({ business: 1, invoiceNumber: 1 }, { unique: true });
billSchema.index({ business: 1, createdAt: -1 });
billSchema.index({ business: 1, status: 1 });

module.exports = mongoose.model('Bill', billSchema);
