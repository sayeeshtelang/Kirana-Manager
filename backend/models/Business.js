const mongoose = require('mongoose');

// One document per registered grocery store / business (tenant).
// Every other collection in the system references businessId and
// ALL queries must be scoped to it (enforced in middleware + controllers).
const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    gstNumber: { type: String, trim: true },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: 'INR' },

    settings: {
      lowStockThreshold: { type: Number, default: 10 },
      khattaCreditLimit: { type: Number, default: 5000 }, // default per-customer credit limit in INR
      invoicePrefix: { type: String, default: 'INV' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

businessSchema.index({ owner: 1, isActive: 1 });

module.exports = mongoose.model('Business', businessSchema);
