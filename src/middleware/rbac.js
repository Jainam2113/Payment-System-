const { HTTP_STATUS } = require('../utils/constants');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * RBAC Middleware - Check if user has required permissions (OR logic)
 * User needs at least ONE of the specified permissions
 * @param  {...string} requiredPermissions - List of permissions (user needs any one)
 */
const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const userPermissions = req.permissions || [];

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return errorResponse(
        res,
        'You do not have permission to perform this action',
        HTTP_STATUS.FORBIDDEN,
        [{
          message: `Required permissions: ${requiredPermissions.join(' OR ')}`,
          userPermissions
        }]
      );
    }

    next();
  };
};

/**
 * RBAC Middleware - Check if user has ALL required permissions (AND logic)
 * User must have ALL specified permissions
 * @param  {...string} requiredPermissions - List of permissions (user needs all)
 */
const requireAllPermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const userPermissions = req.permissions || [];

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission)
      );

      return errorResponse(
        res,
        'You do not have permission to perform this action',
        HTTP_STATUS.FORBIDDEN,
        [{
          message: `Missing permissions: ${missingPermissions.join(', ')}`,
          userPermissions
        }]
      );
    }

    next();
  };
};

/**
 * Check if user owns the resource or has required permission
 * @param {string} resourceUserIdField - Field name containing the resource owner's ID (e.g., 'user', 'createdBy')
 * @param {string} permission - Permission required if user doesn't own the resource
 */
const requireOwnershipOrPermission = (resourceUserIdField, permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if resource is loaded (typically from previous middleware)
    const resource = req.resource || req.payment || req.targetUser;

    if (!resource) {
      return errorResponse(
        res,
        'Resource not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    const resourceUserId = resource[resourceUserIdField];
    const currentUserId = req.user._id.toString();

    // User owns the resource
    if (resourceUserId && resourceUserId.toString() === currentUserId) {
      return next();
    }

    // User has required permission
    const userPermissions = req.permissions || [];
    if (userPermissions.includes(permission)) {
      return next();
    }

    return errorResponse(
      res,
      'You do not have permission to access this resource',
      HTTP_STATUS.FORBIDDEN
    );
  };
};

module.exports = {
  requirePermissions,
  requireAllPermissions,
  requireOwnershipOrPermission
};
