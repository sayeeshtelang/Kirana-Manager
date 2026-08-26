const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// A User is a single email/account. It is NOT tied to one business —
// business association lives in the Membership model, so one email
// can belong to (or own) multiple businesses.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },

    // The business the user is currently "in" for this session (last active).
    // Used only as a convenience default; access is still verified via Membership.
    activeBusinessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    refreshTokens: [
      {
        token: { type: String, select: false },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
        userAgent: { type: String },
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatarUrl: this.avatarUrl,
    isEmailVerified: this.isEmailVerified,
    activeBusinessId: this.activeBusinessId,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
