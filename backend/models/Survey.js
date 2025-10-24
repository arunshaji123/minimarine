const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Survey title is required'],
    trim: true
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: [true, 'Vessel is required']
  },
  surveyType: {
    type: String,
    required: [true, 'Survey type is required'],
    enum: ['Annual', 'Intermediate', 'Special', 'Drydock', 'Damage', 'Pre-Purchase', 'Other']
  },
  surveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Surveyor is required']
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  completionDate: Date,
  location: {
    port: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  findings: [{
    category: {
      type: String,
      enum: ['Structural', 'Machinery', 'Safety Equipment', 'Navigation Equipment', 'Environmental', 'Other'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['Critical', 'Major', 'Minor', 'Observation'],
      required: true
    },
    location: String,
    images: [String],
    recommendations: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Closed', 'Overdue'],
      default: 'Open'
    }
  }],
  attachments: [{
    name: String,
    fileType: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
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
surveySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for survey age
surveySchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

const Survey = mongoose.model('Survey', surveySchema);

module.exports = Survey;