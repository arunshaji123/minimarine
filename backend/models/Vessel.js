const mongoose = require('mongoose');

const vesselSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vessel name is required'],
    trim: true
  },
  imo: {
    type: String,
    required: [true, 'IMO number is required'],
    unique: true,
    trim: true,
    match: [/^IMO\s\d{7}$/, 'Please enter a valid IMO number (format: IMO 1234567)']
  },
  vesselType: {
    type: String,
    required: [true, 'Vessel type is required'],
    enum: ['Bulk Carrier', 'Container Ship', 'Tanker', 'Passenger Ship', 'Fishing Vessel', 'Other']
  },
  flag: {
    type: String,
    required: [true, 'Flag country is required'],
    trim: true
  },
  yearBuilt: {
    type: Number,
    required: [true, 'Year built is required'],
    min: [1900, 'Year built must be after 1900'],
    max: [new Date().getFullYear(), 'Year built cannot be in the future']
  },
  grossTonnage: {
    type: Number,
    required: [true, 'Gross tonnage is required'],
    min: [1, 'Gross tonnage must be positive']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vessel owner is required']
  },
  shipManagement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  classification: {
    society: String,
    notation: String,
    expiryDate: Date
  },
  dimensions: {
    length: Number,
    beam: Number,
    draft: Number
  },
  lastDrydock: Date,
  nextDrydock: Date,
  certificates: [{
    type: {
      type: String,
      required: true,
      enum: ['Safety Construction', 'Safety Equipment', 'Safety Radio', 'Load Line', 'IOPP', 'Other']
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    issuingAuthority: {
      type: String,
      required: true
    },
    documentNumber: String,
    status: {
      type: String,
      enum: ['Valid', 'Expired', 'Expiring Soon'],
      default: 'Valid'
    }
  }],
  // Media files for the vessel
  media: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'certificate'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnailUrl: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
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
vesselSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Vessel = mongoose.model('Vessel', vesselSchema);

module.exports = Vessel;