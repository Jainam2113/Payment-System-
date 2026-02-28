const User = require('../models/User');
const Role = require('../models/Role');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, PERMISSIONS } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all users
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .populate('role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(
      res,
      {
        users: users.map(u => u.toJSON()),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is accessing their own profile or has permission
    const isOwnProfile = req.user._id.toString() === id;
    const hasPermission = req.permissions.includes(PERMISSIONS.USERS_READ);

    if (!isOwnProfile && !hasPermission) {
      return errorResponse(
        res,
        'You do not have permission to view this user',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const user = await User.findById(id).populate('role');

    if (!user) {
      return errorResponse(
        res,
        'User not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return successResponse(
      res,
      { user: user.toJSON() },
      'User retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, isActive } = req.body;

    // Check if user is updating their own profile or has permission
    const isOwnProfile = req.user._id.toString() === id;
    const hasPermission = req.permissions.includes(PERMISSIONS.USERS_WRITE);

    if (!isOwnProfile && !hasPermission) {
      return errorResponse(
        res,
        'You do not have permission to update this user',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Users can't change their own active status
    if (isOwnProfile && isActive !== undefined) {
      return errorResponse(
        res,
        'You cannot change your own active status',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(
        res,
        'User not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Update fields
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (isActive !== undefined && hasPermission) user.isActive = isActive;

    await user.save();
    await user.populate('role');

    return successResponse(
      res,
      { user: user.toJSON() },
      'User updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Users cannot delete themselves
    if (req.user._id.toString() === id) {
      return errorResponse(
        res,
        'You cannot delete your own account',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(
        res,
        'User not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    await user.deleteOne();

    return successResponse(
      res,
      null,
      'User deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change user role
 * PUT /api/users/:id/role
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    // Users cannot change their own role
    if (req.user._id.toString() === id) {
      return errorResponse(
        res,
        'You cannot change your own role',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(
        res,
        'User not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return errorResponse(
        res,
        'Role not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    user.role = roleId;
    await user.save();
    await user.populate('role');

    return successResponse(
      res,
      { user: user.toJSON() },
      'User role updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole
};
