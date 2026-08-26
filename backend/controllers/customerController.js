const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

const listCustomers = asyncHandler(async (req, res) => {
  const { search, hasKhatta } = req.query;
  const filter = { business: req.businessId };
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
  if (hasKhatta === 'true') filter.khattaBalance = { $gt: 0 };

  const customers = await Customer.find(filter).sort({ name: 1 });
  res.json({ customers });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, business: req.businessId });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found.');
  }
  res.json({ customer });
});

const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address, khattaCreditLimit } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Customer name is required.');
  }
  const customer = await Customer.create({ business: req.businessId, name, phone, email, address, khattaCreditLimit });
  res.status(201).json({ customer });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const editable = ['name', 'phone', 'email', 'address', 'khattaCreditLimit', 'isActive'];
  const updates = {};
  for (const f of editable) if (req.body[f] !== undefined) updates[f] = req.body[f];

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, business: req.businessId },
    updates,
    { new: true, runValidators: true }
  );
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found.');
  }
  res.json({ customer });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, business: req.businessId });
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found.');
  }
  if (customer.khattaBalance > 0) {
    res.status(409);
    throw new Error('Cannot delete a customer with an outstanding khatta balance.');
  }
  const hasBills = await Bill.exists({ business: req.businessId, customer: customer._id });
  if (hasBills) {
    customer.isActive = false;
    await customer.save();
    return res.json({ message: 'Customer has billing history, so it was deactivated instead of deleted.' });
  }
  await customer.deleteOne();
  res.json({ message: 'Customer deleted.' });
});

module.exports = { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
