const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    poNumber: { type: String, required: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },

    items: { type: [purchaseOrderItemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
    },

    orderedAt: { type: Date, default: Date.now },
    receivedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ business: 1, poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ business: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
