const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crew member name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    enum: ['Captain', 'Chief Officer', 'Second Officer', 'Third Officer', 'Chief Engineer', 'Second Engineer', 'Third Engineer', 'Electrician', 'Bosun', 'Able Seaman', 'Ordinary Seaman', 'Cook', 'Steward', 'Other']
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: [true, 'Vessel is required']
  },
  nationality: {
    type: String,
    required: [true, 'Nationality is required']
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  contactInformation: {
    email: String,
    phone: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['Passport', 'Seaman Book', 'Visa', 'Certificate', 'Medical', 'Other'],
      required: true
    },
    number: String,
    issueDate: Date,
    expiryDate: Date,
    issuingAuthority: String,
    url: String
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    number: String,
    issueDate: Date,
    expiryDate: Date,
    issuingAuthority: String,
    status: {
      type: String,
      enum: ['Valid', 'Expired', 'Expiring Soon'],
      default: 'Valid'
    }
  }],
  contractInformation: {
    startDate: Date,
    endDate: Date,
    salary: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    contractType: {
      type: String,
      enum: ['Permanent', 'Temporary', 'Contract']
    }
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Signed Off', 'Terminated'],
    default: 'Active'
  },
  performanceReviews: [{
    date: Date,
    reviewer: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
crewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Crew = mongoose.model('Crew', crewSchema);

module.exports = Crew;