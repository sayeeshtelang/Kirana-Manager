const mongoose = require('mongoose');
const { ALL_ROLES } = require('../config/roles');

// This is the join table that makes multi-business + RBAC work:
// a User can have multiple Memberships (one per Business), each with its own role.
// EVERY authorization check should go through Membership, never assume
// a user only has one business.
const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    role: { type: String, enum: ALL_ROLES, required: true },

    // Custom permission overrides beyond the role default (optional, additive only).
    extraPermissions: [{ type: String }],

    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
    },

    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedEmail: { type: String, trim: true, lowercase: true }, // used before the invited user has an account
    inviteToken: { type: String, select: false },
    inviteExpires: { type: Date },

    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A user can only have ONE membership per business.
membershipSchema.index({ user: 1, business: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true } } });

module.exports = mongoose.model('Membership', membershipSchema);
