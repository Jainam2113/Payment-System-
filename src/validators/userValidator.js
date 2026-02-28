const { body, param, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');
const { errorResponse } = require('../utils/responseFormatter');
const mongoose = require('mongoose');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return errorResponse(
      res,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      formattedErrors
    );
  }

  next();
};

/**
 * Validation rules for updating user
 */
const validateUpdateUser = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid user ID'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  handleValidationErrors
];

/**
 * Validation rules for changing user role
 */
const validateChangeRole = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid user ID'),

  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid role ID'),

  handleValidationErrors
];

/**
 * Validation rules for user ID parameter
 */
const validateUserId = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid user ID'),

  handleValidationErrors
];

module.exports = {
  validateUpdateUser,
  validateChangeRole,
  validateUserId,
  handleValidationErrors
};
