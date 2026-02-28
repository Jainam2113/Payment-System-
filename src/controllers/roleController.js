const Role = require('../models/Role');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Get all roles
 * GET /api/roles
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });

    return successResponse(
      res,
      { roles },
      'Roles retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by ID
 * GET /api/roles/:id
 */
const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);

    if (!role) {
      return errorResponse(
        res,
        'Role not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Get count of users with this role
    const userCount = await User.countDocuments({ role: id });

    return successResponse(
      res,
      {
        role,
        userCount
      },
      'Role retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new role
 * POST /api/roles
 */
const createRole = async (req, res, next) => {
  try {
    const { name, permissions, description } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return errorResponse(
        res,
        'Role with this name already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    const role = new Role({
      name: name.toLowerCase(),
      permissions: permissions || [],
      description: description || ''
    });

    await role.save();

    return successResponse(
      res,
      { role },
      'Role created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update role permissions
 * PUT /api/roles/:id
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions, description } = req.body;

    const role = await Role.findById(id);

    if (!role) {
      return errorResponse(
        res,
        'Role not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Update fields
    if (permissions) role.permissions = permissions;
    if (description !== undefined) role.description = description;

    await role.save();

    return successResponse(
      res,
      { role },
      'Role updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a role
 * DELETE /api/roles/:id
 */
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);

    if (!role) {
      return errorResponse(
        res,
        'Role not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if any users have this role
    const userCount = await User.countDocuments({ role: id });
    if (userCount > 0) {
      return errorResponse(
        res,
        `Cannot delete role. ${userCount} user(s) are assigned to this role.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await role.deleteOne();

    return successResponse(
      res,
      null,
      'Role deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
