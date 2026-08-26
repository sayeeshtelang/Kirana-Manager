const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    sku: { type: String, trim: true, uppercase: true },
    barcode: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    unit: { type: String, enum: ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'dozen'], default: 'pcs' },

    // Prices are in INR (paise not used; store as rupees with 2 decimals).
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },

    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },

    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' }, // Cloudinary public_id, for deletion/replacement

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ business: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ business: 1, name: 'text' });
productSchema.index({ business: 1, isActive: 1 });

productSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stockQuantity <= this.lowStockThreshold;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
