const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },

    // Khatta = running credit balance the customer owes the store (in INR).
    // Positive khattaBalance = customer owes money to the business.
    khattaBalance: { type: Number, default: 0 },
    khattaCreditLimit: { type: Number, default: 0 }, // 0 = use business default

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ business: 1, phone: 1 });
customerSchema.index({ business: 1, name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
