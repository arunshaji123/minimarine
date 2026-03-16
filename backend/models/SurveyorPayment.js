const mongoose = require('mongoose');

const surveyorPaymentSchema = new mongoose.Schema({
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  surveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: true
  },
  survey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
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

module.exports = mongoose.model('SurveyorPayment', surveyorPaymentSchema);