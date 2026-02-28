const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { requirePermissions } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../validators/authValidator');
const mongoose = require('mongoose');

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Private (requires roles:manage permission)
 */
router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.ROLES_MANAGE),
  roleController.getAllRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private (requires roles:manage permission)
 */
router.get(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.ROLES_MANAGE),
  [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid role ID'),
    handleValidationErrors
  ],
  roleController.getRoleById
);

/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private (requires roles:manage permission)
 */
router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.ROLES_MANAGE),
  [
    body('name').notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('description').optional().isString(),
    handleValidationErrors
  ],
  roleController.createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private (requires roles:manage permission)
 */
router.put(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.ROLES_MANAGE),
  [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid role ID'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
    body('description').optional().isString(),
    handleValidationErrors
  ],
  roleController.updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private (requires roles:manage permission)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.ROLES_MANAGE),
  [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid role ID'),
    handleValidationErrors
  ],
  roleController.deleteRole
);

module.exports = router;
