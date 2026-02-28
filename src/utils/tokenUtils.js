const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {Object} user - User object with id and role
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User object with id
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id || user.id
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {String} type - Token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, type = 'access') => {
  const secret = type === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret);
};

/**
 * Calculate token expiration date
 * @param {String} expiresIn - Expiration time (e.g., '7d', '15m')
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (expiresIn) => {
  const now = new Date();
  const timeValue = parseInt(expiresIn);
  const timeUnit = expiresIn.slice(-1);

  switch (timeUnit) {
    case 'd': // days
      return new Date(now.getTime() + timeValue * 24 * 60 * 60 * 1000);
    case 'h': // hours
      return new Date(now.getTime() + timeValue * 60 * 60 * 1000);
    case 'm': // minutes
      return new Date(now.getTime() + timeValue * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // default 7 days
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getTokenExpiration
};
