const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, PAYMENT_STATUS, PERMISSIONS } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new payment
 * POST /api/payments
 */
const createPayment = async (req, res, next) => {
  try {
    const { amount, currency, description, paymentMethod, metadata } = req.body;

    const payment = new Payment({
      user: req.user._id,
      amount,
      currency: currency || 'USD',
      description,
      paymentMethod: paymentMethod || 'card',
      metadata: metadata || {},
      status: PAYMENT_STATUS.PENDING
    });

    await payment.save();
    await payment.populate('user', 'firstName lastName email');

    return successResponse(
      res,
      { payment },
      'Payment created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments (with filtering)
 * GET /api/payments
 */
const getAllPayments = async (req, res, next) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};

    // Regular users can only see their own payments
    const hasGlobalReadPermission = req.permissions.includes(PERMISSIONS.PAYMENTS_READ);
    if (!hasGlobalReadPermission) {
      filter.user = req.user._id;
    } else if (userId) {
      // Admins/Managers can filter by user
      filter.user = userId;
    }

    if (status) {
      filter.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(
      res,
      {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      'Payments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName email');

    if (!payment) {
      return errorResponse(
        res,
        'Payment not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check access: user owns the payment OR has global read permission
    const isOwner = payment.user._id.toString() === req.user._id.toString();
    const hasGlobalReadPermission = req.permissions.includes(PERMISSIONS.PAYMENTS_READ);

    if (!isOwner && !hasGlobalReadPermission) {
      return errorResponse(
        res,
        'You do not have permission to view this payment',
        HTTP_STATUS.FORBIDDEN
      );
    }

    return successResponse(
      res,
      { payment },
      'Payment retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a payment
 * PUT /api/payments/:id/approve
 */
const approvePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate('user', 'firstName lastName email');

    if (!payment) {
      return errorResponse(
        res,
        'Payment not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if payment is in pending status
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      return errorResponse(
        res,
        `Payment cannot be approved. Current status: ${payment.status}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Update payment status
    payment.status = PAYMENT_STATUS.APPROVED;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();

    await payment.save();
    await payment.populate('approvedBy', 'firstName lastName email');

    return successResponse(
      res,
      { payment },
      'Payment approved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a payment
 * PUT /api/payments/:id/reject
 */
const rejectPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id).populate('user', 'firstName lastName email');

    if (!payment) {
      return errorResponse(
        res,
        'Payment not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if payment is in pending status
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      return errorResponse(
        res,
        `Payment cannot be rejected. Current status: ${payment.status}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Update payment status
    payment.status = PAYMENT_STATUS.REJECTED;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    payment.failureReason = reason || 'Rejected by approver';

    await payment.save();
    await payment.populate('approvedBy', 'firstName lastName email');

    return successResponse(
      res,
      { payment },
      'Payment rejected successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Process a payment (simulated)
 * PUT /api/payments/:id/process
 */
const processPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!payment) {
      return errorResponse(
        res,
        'Payment not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if payment is in approved status
    if (payment.status !== PAYMENT_STATUS.APPROVED) {
      return errorResponse(
        res,
        `Payment cannot be processed. Current status: ${payment.status}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Update to processing status
    payment.status = PAYMENT_STATUS.PROCESSING;
    payment.processedBy = req.user._id;
    payment.processedAt = new Date();
    await payment.save();

    // Simulate payment processing (random success/failure for demo)
    const isSuccessful = Math.random() > 0.2; // 80% success rate

    if (isSuccessful) {
      payment.status = PAYMENT_STATUS.COMPLETED;
      payment.completedAt = new Date();
    } else {
      payment.status = PAYMENT_STATUS.FAILED;
      payment.failureReason = 'Payment gateway error: Insufficient funds or card declined';
    }

    await payment.save();
    await payment.populate('processedBy', 'firstName lastName email');

    return successResponse(
      res,
      { payment },
      `Payment ${isSuccessful ? 'completed' : 'failed'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment
 * DELETE /api/payments/:id
 */
const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return errorResponse(
        res,
        'Payment not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Prevent deletion of completed or processing payments
    if ([PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.COMPLETED].includes(payment.status)) {
      return errorResponse(
        res,
        'Cannot delete a payment that is processing or completed',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await payment.deleteOne();

    return successResponse(
      res,
      null,
      'Payment deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  approvePayment,
  rejectPayment,
  processPayment,
  deletePayment
};
