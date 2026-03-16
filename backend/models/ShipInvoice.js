const mongoose = require('mongoose');

const shipInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shipCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  surveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: true,
    index: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedShipSurveyCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completedShipSurveyRate: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completedShipSurveyAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completedComplianceSurveyCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completedComplianceSurveyRate: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completedComplianceSurveyAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  managementAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  subtotalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['sent', 'viewed', 'paid'],
    default: 'sent'
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShipInvoice', shipInvoiceSchema);
