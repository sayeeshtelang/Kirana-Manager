const asyncHandler = require('express-async-handler');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @desc  Update the logged-in user's own profile (name, phone, avatar)
// @route PUT /api/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, `grocery/users/${user._id}`);
    user.avatarUrl = result.secure_url;
  }

  await user.save();
  res.json({ user: user.toSafeObject() });
});

// @desc  Change the logged-in user's own password
// @route PUT /api/profile/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400);
    throw new Error('Current password and a new password (min 8 chars) are required.');
  }

  const User = require('../models/User');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect.');
  }

  user.password = newPassword;
  user.refreshTokens = []; // force re-login on all other devices
  await user.save();

  res.json({ message: 'Password updated. Please log in again.' });
});

module.exports = { updateProfile, changePassword };
