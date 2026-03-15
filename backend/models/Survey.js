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
    enum: ['Annual', 'Intermediate', 'Special', 'Drydock', 'Damage', 'Pre-Purchase', 'Renewal', 'Other']
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
  // Component-specific ratings (1-5 star ratings)
  hullInspection: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  deckSuperstructure: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  machineryEngineRoom: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  electricalSystems: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  safetyEquipment: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  navigationEquipment: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  pollutionControlSystems: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  certificatesVerification: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
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
  // Compliance tracking data
  complianceStatus: {
    solas: {
      hull: String, // 'not-compliant', 'pending', 'semi-moderate', 'moderate', 'compliant'
      fire: String,
      lifesaving: String,
      navigation: String,
      radio: String,
      emergency: String
    },
    marpol: {
      ows: String,
      sewage: String,
      garbage: String,
      oilRecord: String,
      airEmission: String
    },
    loadLine: {
      freeboard: String,
      watertight: String,
      hullOpenings: String,
      structural: String,
      stability: String
    },
    ism: {
      sms: String,
      doc: String,
      smc: String,
      emergency: String,
      maintenance: String,
      crew: String
    },
    classification: {
      certificate: String,
      flagState: String,
      surveySchedule: String,
      hullCondition: String,
      machineryCondition: String,
      tankInspection: String
    }
  },
  complianceSubmittedAt: Date,
  complianceSubmittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // AI Damage Detection Analysis (using Mixed to avoid empty object creation)
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined  // Don't create empty objects
  },
  sourceBookingId: String, // Reference to booking if created from AI analysis
  notes: String,
  recommendations: String,
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