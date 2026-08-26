const mongoose = require('mongoose');

// HR-style record for a staff member. Optionally linked to a User+Membership
// if that staff member also has system login access. A business can have
// employees who never log in (e.g. delivery staff) as well as ones who do.
const employeeSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },

    // Optional link to the login account, if this employee has one.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    position: { type: String, trim: true },
    monthlySalary: { type: Number, min: 0, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    address: { type: String, trim: true },

    status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

employeeSchema.index({ business: 1, status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
