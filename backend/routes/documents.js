const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, Excel, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   GET api/documents
// @desc    Get all documents with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      documentType,
      category,
      status,
      relatedEntityType,
      relatedEntityId,
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build query based on user role and filters
    let query = {};

    // Role-based access control
    if (req.user.role !== 'admin') {
      query.$or = [
        { 'accessControl.allowedRoles': req.user.role },
        { 'accessControl.allowedUsers': req.user.id },
        { uploadedBy: req.user.id }
      ];
    }

    // Apply filters
    if (documentType) query.documentType = documentType;
    if (category) query.category = category;
    if (status) query.status = status;
    if (relatedEntityType) query['relatedEntity.type'] = relatedEntityType;
    if (relatedEntityId) query['relatedEntity.entityId'] = relatedEntityId;

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('approvalWorkflow.reviewers.user', 'name email')
      .populate('approvalWorkflow.approvers.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('approvalWorkflow.reviewers.user', 'name email')
      .populate('approvalWorkflow.approvers.user', 'name email');

    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      const hasAccess = 
        document.accessControl.allowedRoles.includes(req.user.role) ||
        document.accessControl.allowedUsers.includes(req.user.id) ||
        document.uploadedBy.toString() === req.user.id;

      if (!hasAccess) {
        return res.status(403).json({ msg: 'Not authorized to view this document' });
      }
    }

    res.json(document);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/documents
// @desc    Upload a new document
// @access  Private
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const {
      title,
      description,
      documentType,
      category,
      relatedEntityType,
      relatedEntityId,
      tags,
      expiryDate,
      issuedBy,
      issuedDate,
      documentNumber,
      visibility = 'Restricted',
      allowedRoles = [],
      allowedUsers = []
    } = req.body;

    // Parse tags if provided as string
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    const newDocument = new Document({
      title,
      description,
      documentType,
      category,
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      relatedEntity: {
        type: relatedEntityType,
        entityId: relatedEntityId
      },
      tags: parsedTags,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      issuedBy,
      issuedDate: issuedDate ? new Date(issuedDate) : undefined,
      documentNumber,
      accessControl: {
        visibility,
        allowedRoles: allowedRoles.length > 0 ? allowedRoles : [req.user.role],
        allowedUsers
      },
      uploadedBy: req.user.id
    });

    const document = await newDocument.save();
    
    // Populate the response
    await document.populate('uploadedBy', 'name email');
    
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this document' });
    }

    // Update document
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user.id
    };

    // Parse tags if provided
    if (req.body.tags) {
      updateData.tags = typeof req.body.tags === 'string' 
        ? req.body.tags.split(',').map(tag => tag.trim())
        : req.body.tags;
    }

    document = await Document.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('uploadedBy', 'name email')
     .populate('lastModifiedBy', 'name email');

    res.json(document);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/documents/:id/review
// @desc    Submit document for review
// @access  Private
router.post('/:id/review', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to submit this document for review' });
    }

    // Update workflow status
    document.status = 'Pending Review';
    document.approvalWorkflow.currentStep = 'Review';
    document.lastModifiedBy = req.user.id;

    await document.save();

    res.json({ msg: 'Document submitted for review successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/documents/:id/approve
// @desc    Approve or reject document
// @access  Private (Reviewers/Approvers)
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check if user is a reviewer or approver
    const isReviewer = document.approvalWorkflow.reviewers.some(
      reviewer => reviewer.user.toString() === req.user.id
    );
    const isApprover = document.approvalWorkflow.approvers.some(
      approver => approver.user.toString() === req.user.id
    );

    if (!isReviewer && !isApprover && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to approve this document' });
    }

    // Update reviewer status
    if (isReviewer) {
      const reviewerIndex = document.approvalWorkflow.reviewers.findIndex(
        reviewer => reviewer.user.toString() === req.user.id
      );
      document.approvalWorkflow.reviewers[reviewerIndex].status = action === 'approve' ? 'Approved' : 'Rejected';
      document.approvalWorkflow.reviewers[reviewerIndex].reviewDate = new Date();
      document.approvalWorkflow.reviewers[reviewerIndex].comments = comments;
    }

    // Update approver status
    if (isApprover) {
      const approverIndex = document.approvalWorkflow.approvers.findIndex(
        approver => approver.user.toString() === req.user.id
      );
      document.approvalWorkflow.approvers[approverIndex].status = action === 'approve' ? 'Approved' : 'Rejected';
      document.approvalWorkflow.approvers[approverIndex].approvalDate = new Date();
      document.approvalWorkflow.approvers[approverIndex].comments = comments;
    }

    // Check if all reviewers have approved
    const allReviewersApproved = document.approvalWorkflow.reviewers.every(
      reviewer => reviewer.status === 'Approved'
    );

    // Check if all approvers have approved
    const allApproversApproved = document.approvalWorkflow.approvers.every(
      approver => approver.status === 'Approved'
    );

    // Update document status
    if (action === 'reject') {
      document.status = 'Rejected';
    } else if (allReviewersApproved && allApproversApproved) {
      document.status = 'Approved';
      document.approvalWorkflow.currentStep = 'Final';
    }

    document.lastModifiedBy = req.user.id;
    await document.save();

    res.json({ msg: `Document ${action}d successfully` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/documents/:id/download
// @desc    Download document file
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      const hasAccess = 
        document.accessControl.allowedRoles.includes(req.user.role) ||
        document.accessControl.allowedUsers.includes(req.user.id) ||
        document.uploadedBy.toString() === req.user.id;

      if (!hasAccess) {
        return res.status(403).json({ msg: 'Not authorized to download this document' });
      }
    }

    // Check if file exists
    if (!fs.existsSync(document.file.filePath)) {
      return res.status(404).json({ msg: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.file.originalName}"`);
    res.setHeader('Content-Type', document.file.mimeType);

    // Stream the file
    const fileStream = fs.createReadStream(document.file.filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this document' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file.filePath)) {
      fs.unlinkSync(document.file.filePath);
    }

    // Delete document from database
    await document.remove();
    
    res.json({ msg: 'Document deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;



