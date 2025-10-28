const mongoose = require('mongoose');

const cargoManagerBookingSchema = new mongoose.Schema({
  cargoManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cargo Manager is required']
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booked by user is required']
  },
  voyageDate: {
    type: Date,
    required: [true, 'Voyage date is required']
  },
  voyageTime: {
    type: String,
    required: [true, 'Voyage time is required']
  },
  cargoType: {
    type: String,
    required: [true, 'Cargo type is required'],
    enum: ['Container', 'Bulk', 'Liquid', 'Break Bulk', 'RoRo', 'Other']
  },
  departurePort: {
    type: String,
    required: [true, 'Departure port is required'],
    trim: true
  },
  destinationPort: {
    type: String,
    required: [true, 'Destination port is required'],
    trim: true
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: false // Optional if vessel not in system
  },
  vesselName: {
    type: String,
    required: [true, 'Vessel name is required'],
    trim: true
  },
  shipType: {
    type: String,
    required: false,
    enum: ['Bulk Carrier', 'Container Ship', 'Tanker', 'Passenger Ship', 'Fishing Vessel', 'Other']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  specialRequirements: {
    type: String,
    trim: true
  },
  estimatedDuration: {
    type: Number, // in days
    default: 7
  },
  cargoWeight: {
    type: Number,
    required: false
  },
  cargoUnits: {
    type: Number,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  declinedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  // Assignment data
  shipLocation: {
    type: String,
    trim: true
  },
  shipPhotos: [{
    name: String,
    data: String, // Base64 encoded image
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  cargoPhotos: [{
    name: String,
    data: String, // Base64 encoded image
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedAt: {
    type: Date
  },
  deletionReason: {
    type: String,
    trim: true
  }
});

// Update the updatedAt field before saving
cargoManagerBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
cargoManagerBookingSchema.index({ cargoManager: 1, status: 1 });
cargoManagerBookingSchema.index({ bookedBy: 1, status: 1 });
cargoManagerBookingSchema.index({ voyageDate: 1 });

const CargoManagerBooking = mongoose.model('CargoManagerBooking', cargoManagerBookingSchema);

module.exports = CargoManagerBooking;