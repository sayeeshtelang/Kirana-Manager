const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'access' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'refresh', jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function refreshTokenExpiryDate() {
  // Mirrors JWT_REFRESH_EXPIRES_IN for storing alongside the hashed token in the DB.
  const days = parseInt((process.env.JWT_REFRESH_EXPIRES_IN || '7d').replace('d', ''), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const REFRESH_COOKIE_NAME = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenExpiryDate,
  hashToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
};
