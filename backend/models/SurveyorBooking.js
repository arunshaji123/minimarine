const mongoose = require('mongoose');

const surveyorBookingSchema = new mongoose.Schema({
  surveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Surveyor is required']
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booked by user is required']
  },
  inspectionDate: {
    type: Date,
    required: [true, 'Inspection date is required']
  },
  inspectionTime: {
    type: String,
    required: [true, 'Inspection time is required']
  },
  shipType: {
    type: String,
    required: false,
    enum: ['Bulk Carrier', 'Container Ship', 'Tanker', 'Passenger Ship', 'Fishing Vessel', 'Other', 'Cargo Ship']
  },
  surveyType: {
    type: String,
    required: [true, 'Survey type is required'],
    enum: ['Annual', 'Intermediate', 'Drydock', 'Special', 'Renewal']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
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
    type: Number, // in hours
    default: 4
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
  // Assignment data from ship company
  shipLocation: {
    type: String,
    trim: true
  },
  shipPhotos: [{
    name: String,
    data: String, // base64 encoded image
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  flightTicket: {
    name: String,
    data: String, // base64 encoded file
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  assignedAt: {
    type: Date
  },
  deletionReason: {
    type: String,
    trim: true
  }
});

// Update the updatedAt field before saving
surveyorBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
surveyorBookingSchema.index({ surveyor: 1, status: 1 });
surveyorBookingSchema.index({ bookedBy: 1, status: 1 });
surveyorBookingSchema.index({ inspectionDate: 1 });

const SurveyorBooking = mongoose.model('SurveyorBooking', surveyorBookingSchema);

module.exports = SurveyorBooking;