const mongoose = require('mongoose');
const { v4: uuidv4 } = require('crypto');
const { PAYMENT_STATUS, PAYMENT_METHODS, PAYMENT_STATUS_TRANSITIONS } = require('../utils/constants');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    default: PAYMENT_METHODS.CARD
  },

  // Workflow tracking
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },

  // Metadata
  failureReason: {
    type: String
  },
  transactionId: {
    type: String,
    unique: true,
    default: () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Method to validate status transition
paymentSchema.methods.canTransitionTo = function(newStatus) {
  const allowedTransitions = PAYMENT_STATUS_TRANSITIONS[this.status] || [];
  return allowedTransitions.includes(newStatus);
};

// Method to check if payment is in final state
paymentSchema.methods.isFinalState = function() {
  return [PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.REJECTED].includes(this.status);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
