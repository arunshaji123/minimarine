const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'Survey Report',
      'Certificate',
      'Inspection Report',
      'Maintenance Record',
      'Crew Document',
      'Vessel Document',
      'Insurance Document',
      'Classification Document',
      'Port Document',
      'Other'
    ]
  },
  category: {
    type: String,
    required: [true, 'Document category is required'],
    enum: [
      'Safety',
      'Environmental',
      'Technical',
      'Administrative',
      'Legal',
      'Financial',
      'Operational',
      'Certification',
      'Other'
    ]
  },
  file: {
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['Survey', 'Vessel', 'Crew', 'Maintenance', 'Cargo', 'User'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Review', 'Approved', 'Rejected', 'Archived'],
    default: 'Draft'
  },
  version: {
    type: Number,
    default: 1
  },
  isLatestVersion: {
    type: Boolean,
    default: true
  },
  previousVersions: [{
    version: Number,
    filePath: String,
    uploadDate: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  tags: [String],
  expiryDate: Date,
  issuedBy: String,
  issuedDate: Date,
  documentNumber: String,
  approvalWorkflow: {
    currentStep: {
      type: String,
      enum: ['Upload', 'Review', 'Approval', 'Final'],
      default: 'Upload'
    },
    reviewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
      },
      reviewDate: Date,
      comments: String
    }],
    approvers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
      },
      approvalDate: Date,
      comments: String
    }]
  },
  accessControl: {
    visibility: {
      type: String,
      enum: ['Public', 'Restricted', 'Confidential'],
      default: 'Restricted'
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'surveyor', 'owner', 'ship_management', 'cargo_manager']
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  metadata: {
    checksum: String,
    thumbnail: String,
    pages: Number,
    language: {
      type: String,
      default: 'en'
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
documentSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.entityId': 1 });
documentSchema.index({ documentType: 1, category: 1 });
documentSchema.index({ status: 1, 'approvalWorkflow.currentStep': 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ expiryDate: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;



