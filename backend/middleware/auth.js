const asyncHandler = require('express-async-handler');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

// Verifies the access token and attaches req.user (the authenticated account).
// This does NOT establish which business the user is acting on — see
// middleware/business.js for that (business access must always be
// independently verified, never trusted from a token claim alone).
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Session expired or invalid. Please log in again.');
  }

  if (decoded.type !== 'access') {
    res.status(401);
    throw new Error('Invalid token type.');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Account not found or deactivated.');
  }

  req.user = user;
  next();
});

module.exports = { protect };
