const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ business: req.businessId }).sort({ name: 1 });
  res.json({ categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Category name is required.');
  }
  const category = await Category.create({ business: req.businessId, name, description });
  res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, business: req.businessId },
    { name: req.body.name, description: req.body.description, isActive: req.body.isActive },
    { new: true, runValidators: true }
  );
  if (!category) {
    res.status(404);
    throw new Error('Category not found.');
  }
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ business: req.businessId, category: req.params.id });
  if (inUse) {
    res.status(409);
    throw new Error('Cannot delete a category that still has products assigned to it.');
  }
  const category = await Category.findOneAndDelete({ _id: req.params.id, business: req.businessId });
  if (!category) {
    res.status(404);
    throw new Error('Category not found.');
  }
  res.json({ message: 'Category deleted.' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
