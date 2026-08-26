const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Membership = require('../models/Membership');
const { ALL_ROLES, ROLES, PERMISSIONS } = require('../config/roles');

const listEmployees = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { business: req.businessId };
  if (status) filter.status = status;
  const employees = await Employee.find(filter).sort({ name: 1 });
  res.json({ employees });
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, business: req.businessId });
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  res.json({ employee });
});

// @desc  Create an HR employee record, optionally granting them a login +
//        a Membership in this business (so they can log in with a role and
//        immediately see the modules that role permits). Granting login is
//        equivalent to what "invite member" used to do, but happens in one
//        step since the owner/admin is entering the credentials directly
//        rather than sending an email invite.
// @route POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name, phone, email, position, monthlySalary, joiningDate, address, notes,
    grantLogin, password, role,
  } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Employee name is required.');
  }

  if (!grantLogin) {
    const employee = await Employee.create({
      business: req.businessId, name, phone, email, position, monthlySalary, joiningDate, address, notes,
    });
    return res.status(201).json({ employee });
  }

  // Granting login access creates a Membership (i.e. business-level access),
  // so this branch requires the same permission "invite member" used to.
  if (req.role !== ROLES.OWNER && !req.permissions.has(PERMISSIONS.BUSINESS_MANAGE_USERS)) {
    res.status(403);
    throw new Error('You do not have permission to grant login access.');
  }

  if (!email || !password || password.length < 8) {
    res.status(400);
    throw new Error('A valid email and a password (min 8 characters) are required to grant login access.');
  }
  if (!ALL_ROLES.includes(role) || role === ROLES.OWNER) {
    res.status(400);
    throw new Error('A valid role is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const session = await mongoose.startSession();
  let employee;
  try {
    await session.withTransaction(async () => {
      let user = await User.findOne({ email: normalizedEmail }).session(session);

      const existingMembership = user
        ? await Membership.findOne({ user: user._id, business: req.businessId }).session(session)
        : null;
      if (existingMembership) {
        res.status(409);
        throw new Error('This email is already a member of this business.');
      }

      if (!user) {
        const created = await User.create([{ name, email: normalizedEmail, password }], { session });
        user = created[0];
      }

      const membership = await Membership.create(
        [{ user: user._id, business: req.businessId, role, status: 'active' }],
        { session }
      );

      const createdEmployee = await Employee.create(
        [{
          business: req.businessId,
          user: user._id,
          membership: membership[0]._id,
          name, phone, email: normalizedEmail, position, monthlySalary, joiningDate, address, notes,
        }],
        { session }
      );
      employee = createdEmployee[0];
    });
  } finally {
    session.endSession();
  }

  res.status(201).json({ employee, message: 'Employee added with login access.' });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const editable = ['name', 'phone', 'email', 'position', 'monthlySalary', 'joiningDate', 'address', 'notes', 'status'];
  const updates = {};
  for (const f of editable) if (req.body[f] !== undefined) updates[f] = req.body[f];

  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, business: req.businessId },
    updates,
    { new: true, runValidators: true }
  );
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  res.json({ employee });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOneAndDelete(
    { _id: req.params.id, business: req.businessId },
  );
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found.');
  }
  res.json({ message: 'Employee deleted.' });
});

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
