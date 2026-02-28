const { verifyToken } = require('../utils/tokenUtils');
const { HTTP_STATUS } = require('../utils/constants');
const { errorResponse } = require('../utils/responseFormatter');
const { AppError } = require('./errorHandler');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Authentication middleware - Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'Access token is required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token, 'access');

    // Fetch user with role information
    const user = await User.findById(decoded.id).populate('role');

    if (!user) {
      return errorResponse(
        res,
        'User not found',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        'Account is inactive',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Attach user and permissions to request
    req.user = user;
    req.permissions = user.role ? user.role.permissions : [];

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(
        res,
        'Invalid token',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (error.name === 'TokenExpiredError') {
      return errorResponse(
        res,
        'Token expired',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    next(error);
  }
};

/**
 * Optional authentication - Attach user if token is provided, but don't require it
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.id).populate('role');

    if (user && user.isActive) {
      req.user = user;
      req.permissions = user.role ? user.role.permissions : [];
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
