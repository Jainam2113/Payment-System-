const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } = require('../utils/constants');
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
 * Validation rules for creating payment
 */
const validateCreatePayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
    .toUpperCase(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('paymentMethod')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage(`Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),

  handleValidationErrors
];

/**
 * Validation rules for payment ID parameter
 */
const validatePaymentId = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid payment ID'),

  handleValidationErrors
];

/**
 * Validation rules for approving/rejecting payment
 */
const validateApproveReject = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid payment ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),

  handleValidationErrors
];

/**
 * Validation rules for listing payments (query parameters)
 */
const validateListPayments = [
  query('status')
    .optional()
    .isIn(Object.values(PAYMENT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(PAYMENT_STATUS).join(', ')}`),

  query('userId')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid user ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
];

module.exports = {
  validateCreatePayment,
  validatePaymentId,
  validateApproveReject,
  validateListPayments,
  handleValidationErrors
};
