const asyncHandler = require('express-async-handler');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');

const listSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ business: req.businessId }).sort({ name: 1 });
  res.json({ suppliers });
});

const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, business: req.businessId });
  if (!supplier) {
    res.status(404);
    throw new Error('Supplier not found.');
  }
  res.json({ supplier });
});

const createSupplier = asyncHandler(async (req, res) => {
  const { name, contactPerson, phone, email, address, gstNumber, notes } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Supplier name is required.');
  }
  const supplier = await Supplier.create({ business: req.businessId, name, contactPerson, phone, email, address, gstNumber, notes });
  res.status(201).json({ supplier });
});

const updateSupplier = asyncHandler(async (req, res) => {
  const editable = ['name', 'contactPerson', 'phone', 'email', 'address', 'gstNumber', 'notes', 'isActive'];
  const updates = {};
  for (const f of editable) if (req.body[f] !== undefined) updates[f] = req.body[f];

  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, business: req.businessId },
    updates,
    { new: true, runValidators: true }
  );
  if (!supplier) {
    res.status(404);
    throw new Error('Supplier not found.');
  }
  res.json({ supplier });
});

const deleteSupplier = asyncHandler(async (req, res) => {
  const inUse = await PurchaseOrder.exists({ business: req.businessId, supplier: req.params.id });
  if (inUse) {
    res.status(409);
    throw new Error('Cannot delete a supplier with existing purchase orders. Deactivate instead.');
  }
  const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, business: req.businessId });
  if (!supplier) {
    res.status(404);
    throw new Error('Supplier not found.');
  }
  res.json({ message: 'Supplier deleted.' });
});

module.exports = { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
