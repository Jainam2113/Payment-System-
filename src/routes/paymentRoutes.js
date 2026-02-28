const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { requirePermissions } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const {
  validateCreatePayment,
  validatePaymentId,
  validateApproveReject,
  validateListPayments
} = require('../validators/paymentValidator');

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private (requires payments:create permission)
 */
router.post(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_CREATE),
  validateCreatePayment,
  paymentController.createPayment
);

/**
 * @route   GET /api/payments
 * @desc    Get all payments (filtered based on user role)
 * @access  Private (requires payments:read permission)
 */
router.get(
  '/',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_READ),
  validateListPayments,
  paymentController.getAllPayments
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private (own payment or payments:read permission)
 */
router.get(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_READ),
  validatePaymentId,
  paymentController.getPaymentById
);

/**
 * @route   PUT /api/payments/:id/approve
 * @desc    Approve a payment
 * @access  Private (requires payments:approve permission)
 */
router.put(
  '/:id/approve',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_APPROVE),
  validatePaymentId,
  paymentController.approvePayment
);

/**
 * @route   PUT /api/payments/:id/reject
 * @desc    Reject a payment
 * @access  Private (requires payments:approve permission)
 */
router.put(
  '/:id/reject',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_APPROVE),
  validateApproveReject,
  paymentController.rejectPayment
);

/**
 * @route   PUT /api/payments/:id/process
 * @desc    Process a payment
 * @access  Private (requires payments:process permission)
 */
router.put(
  '/:id/process',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_PROCESS),
  validatePaymentId,
  paymentController.processPayment
);

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete a payment
 * @access  Private (requires payments:delete permission)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermissions(PERMISSIONS.PAYMENTS_DELETE),
  validatePaymentId,
  paymentController.deletePayment
);

module.exports = router;
