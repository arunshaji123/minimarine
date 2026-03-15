const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  survey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: true
  },
  surveyType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Approved', 'Conditional', 'Deficient'],
    required: true
  },
  overallRating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  complianceDetails: {
    hullInspection: { rating: Number, findings: String },
    deckSuperstructure: { rating: Number, findings: String },
    machineryEngineRoom: { rating: Number, findings: String },
    electricalSystems: { rating: Number, findings: String },
    safetyEquipment: { rating: Number, findings: String },
    navigationEquipment: { rating: Number, findings: String },
    pollutionControlSystems: { rating: Number, findings: String },
    certificatesDocumentation: { rating: Number, findings: String }
  },
  recommendations: String,
  digitalSignature: String,
  revoked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Check if expired
certificateSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

module.exports = mongoose.model('Certificate', certificateSchema);
