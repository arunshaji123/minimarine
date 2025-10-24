const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Maintenance title is required'],
    trim: true
  },
  vessel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vessel',
    required: [true, 'Vessel is required']
  },
  maintenanceType: {
    type: String,
    required: [true, 'Maintenance type is required'],
    enum: ['Scheduled', 'Corrective', 'Emergency', 'Drydock', 'Overhaul', 'Other']
  },
  system: {
    type: String,
    required: [true, 'System is required'],
    enum: ['Engine', 'Hull', 'Electrical', 'Navigation', 'Safety', 'Deck', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  estimatedDuration: {
    value: Number,
    unit: {
      type: String,
      enum: ['Hours', 'Days', 'Weeks']
    }
  },
  completionDate: Date,
  location: {
    port: String,
    country: String
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'],
    default: 'Planned'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  parts: [{
    name: String,
    quantity: Number,
    cost: Number,
    status: {
      type: String,
      enum: ['Available', 'Ordered', 'Backordered', 'Used'],
      default: 'Available'
    }
  }],
  cost: {
    estimated: Number,
    actual: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  documents: [{
    name: String,
    fileType: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
maintenanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;