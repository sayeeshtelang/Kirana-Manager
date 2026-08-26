const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const Business = require('../models/Business');
const Membership = require('../models/Membership');
const slugify = require('../utils/slugify');
const sendEmail = require('../utils/sendEmail');
const { ROLES, getPermissionsForRole } = require('../config/roles');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiryDate,
  hashToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} = require('../utils/tokens');

// Generates a unique business slug, appending -2, -3, ... on collision.
async function generateUniqueSlug(name) {
  const base = slugify(name) || 'business';
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Business.findOne({ slug })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return slug;
}

async function issueTokensAndRespond(res, user, statusCode) {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  });
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  const memberships = await Membership.find({ user: user._id, status: 'active' })
    .populate('business', 'name slug logoUrl currency');

  res.status(statusCode).json({
    user: user.toSafeObject(),
    accessToken,
    businesses: memberships.map((m) => ({
      businessId: m.business._id,
      name: m.business.name,
      slug: m.business.slug,
      logoUrl: m.business.logoUrl,
      currency: m.business.currency,
      role: m.role,
      permissions: getPermissionsForRole(m.role),
    })),
  });
}

// @desc  Register a new user AND create their business (they become Owner)
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, businessName } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists.');
  }

  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      const created = await User.create([{ name, email, password }], { session });
      user = created[0];

      const slug = await generateUniqueSlug(businessName);
      const business = await Business.create(
        [{ name: businessName, slug, owner: user._id, contactEmail: email }],
        { session }
      );

      await Membership.create(
        [{ user: user._id, business: business[0]._id, role: ROLES.OWNER, status: 'active' }],
        { session }
      );

      user.activeBusinessId = business[0]._id;
      await user.save({ session });
    });
  } finally {
    session.endSession();
  }

  await issueTokensAndRespond(res, user, 201);
});

// @desc  Login
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated.');
  }

  await issueTokensAndRespond(res, user, 200);
});

// @desc  Issue a new access token using the refresh token cookie
// @route POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided.');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Refresh token invalid or expired. Please log in again.');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens.token');
  if (!user) {
    res.status(401);
    throw new Error('User not found.');
  }

  const hashed = hashToken(token);
  const stored = user.refreshTokens.find((rt) => rt.token === hashed);
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401);
    throw new Error('Refresh token invalid or expired. Please log in again.');
  }

  // Rotate: remove the used refresh token, issue a new pair.
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== hashed);
  const newAccessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);
  user.refreshTokens.push({ token: hashToken(newRefreshToken), expiresAt: refreshTokenExpiryDate() });
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);
  res.json({ accessToken: newAccessToken });
});

// @desc  Logout - revoke the current refresh token
// @route POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.sub).select('+refreshTokens.token');
      if (user) {
        const hashed = hashToken(token);
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== hashed);
        await user.save();
      }
    } catch (err) {
      // token already invalid - nothing to revoke
    }
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.json({ message: 'Logged out.' });
});

// @desc  Get current authenticated user + their businesses
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id, status: 'active' })
    .populate('business', 'name slug logoUrl currency');

  res.json({
    user: req.user.toSafeObject(),
    businesses: memberships.map((m) => ({
      businessId: m.business._id,
      name: m.business.name,
      slug: m.business.slug,
      logoUrl: m.business.logoUrl,
      currency: m.business.currency,
      role: m.role,
      permissions: getPermissionsForRole(m.role),
    })),
  });
});

// @desc  Request a password reset email
// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists,
  // to avoid leaking which emails are registered.
  if (user) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Reset your password using this link (valid for 30 minutes): ${resetUrl}`,
      html: `<p>Reset your password using this link (valid for 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

// @desc  Reset password using token from email
// @route POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('Password reset token is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // revoke all existing sessions
  await user.save();

  res.json({ message: 'Password has been reset. Please log in with your new password.' });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
