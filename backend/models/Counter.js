const mongoose = require('mongoose');

// Generates gap-free, per-business sequence numbers (e.g. INV-0001, PO-0001)
// using an atomic findOneAndUpdate so concurrent requests never collide.
const counterSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  key: { type: String, required: true }, // e.g. 'invoice', 'purchase_order'
  seq: { type: Number, default: 0 },
});

counterSchema.index({ business: 1, key: 1 }, { unique: true });

counterSchema.statics.getNextSequence = async function getNextSequence(businessId, key) {
  const counter = await this.findOneAndUpdate(
    { business: businessId, key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
