const User = require('../models/User');
const Role = require('../models/Role');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, verifyToken, getTokenExpiration } = require('../utils/tokenUtils');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(
        res,
        'Email already registered',
        HTTP_STATUS.CONFLICT
      );
    }

    // Get default 'user' role
    const userRole = await Role.findOne({ name: ROLES.USER });
    if (!userRole) {
      throw new AppError('Default user role not found. Please run database seeding.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: userRole._id
    });

    await user.save();

    // Populate role information
    await user.populate('role');

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    });

    return successResponse(
      res,
      {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'User registered successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field (it's excluded by default)
    const user = await User.findOne({ email }).select('+password').populate('role');

    if (!user) {
      return errorResponse(
        res,
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return errorResponse(
        res,
        'Account is inactive. Please contact support.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(
        res,
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: getTokenExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    });

    return successResponse(
      res,
      {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken
        }
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');

    // Check if refresh token exists in database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return errorResponse(
        res,
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if token is expired
    if (storedToken.isExpired()) {
      await storedToken.deleteOne();
      return errorResponse(
        res,
        'Refresh token expired',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Get user
    const user = await User.findById(decoded.id).populate('role');
    if (!user || !user.isActive) {
      return errorResponse(
        res,
        'User not found or inactive',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return successResponse(
      res,
      {
        accessToken
      },
      'Token refreshed successfully'
    );
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(
        res,
        'Invalid or expired refresh token',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    return successResponse(
      res,
      null,
      'Logout successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // User is already attached by authenticate middleware
    const user = await User.findById(req.user._id).populate('role');

    return successResponse(
      res,
      { user: user.toJSON() },
      'User profile retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser
};
