const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requirePermissions } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const {
  validateUpdateUser,
  validateChangeRole,
  validateUserId
} = require('../validators/userValidator');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (requires users:read permission)
 */
router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.USERS_READ),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (own profile or users:read permission)
 */
router.get(
  '/:id',
  authenticate,
  validateUserId,
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (own profile or users:write permission)
 */
router.put(
  '/:id',
  authenticate,
  validateUpdateUser,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (requires users:delete permission)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.USERS_DELETE),
  validateUserId,
  userController.deleteUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Change user role
 * @access  Private (requires users:write permission)
 */
router.put(
  '/:id/role',
  authenticate,
  requirePermissions(PERMISSIONS.USERS_WRITE),
  validateChangeRole,
  userController.changeUserRole
);

module.exports = router;
