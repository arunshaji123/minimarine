const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Vessel } = require('../models');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/vessels');
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
  // Define allowed file types for vessel media
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF), videos (MP4, AVI, MOV), and documents (PDF, DOC, DOCX) are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

const router = express.Router();

// @route   GET api/vessels
// @desc    Get all vessels
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Filter vessels based on user role
    let query = {};
    
    if (req.user.role === 'owner') {
      // Owners can only see their own vessels
      query.owner = req.user.id;
    } else if (req.user.role === 'ship_management') {
      // Ship management can see vessels they manage OR own
      // Use $or with proper MongoDB syntax
      query = {
        $or: [
          { shipManagement: req.user.id },
          { owner: req.user.id }
        ]
      };
    }
    // Admin, surveyor, and cargo_manager can see all vessels
    
    const vessels = await Vessel.find(query)
      .populate('owner', 'name email')
      .populate('shipManagement', 'name email');
      
    res.json(vessels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/vessels/:id
// @desc    Get vessel by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('shipManagement', 'name email');
    
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }

    // Check if user has permission to view this vessel
    if (req.user.role !== 'admin' && 
        req.user.role !== 'surveyor' && 
        req.user.role !== 'cargo_manager' && 
        req.user.id !== vessel.owner.toString() && 
        req.user.id !== vessel.shipManagement?.toString()) {
      return res.status(403).json({ msg: 'Not authorized to view this vessel' });
    }

    res.json(vessel);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/vessels
// @desc    Create a vessel
// @access  Private (Admin, Owner, Ship Management)
router.post('/', auth, upload.array('media', 15), async (req, res) => {
  // Admin, owner, and ship management can create vessels
  if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'ship_management') {
    return res.status(403).json({ msg: 'Not authorized to create vessels' });
  }

  try {
    // Parse vessel data from request body
    const vesselData = JSON.parse(req.body.vesselData || '{}');
    
    // Ensure owner is set - if not provided, use current user
    const ownerId = vesselData.owner || req.user.id;
    
    // Process uploaded media files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Determine the media type based on mimetype
        let type = 'photo';
        if (file.mimetype.startsWith('video/')) {
          type = 'video';
        } else if (file.mimetype === 'application/pdf' || 
                   file.mimetype === 'application/msword' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          type = 'certificate';
        }
        
        media.push({
          type: type,
          url: `/uploads/vessels/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        });
      });
    }
    
    const newVessel = new Vessel({
      ...vesselData,
      owner: ownerId,
      media: media
    });

    const vessel = await newVessel.save();
    res.json(vessel);
  } catch (err) {
    console.error('Vessel creation error:', err);
    // Return more specific error information
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        msg: 'Validation Error', 
        errors: errors 
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({ 
        msg: 'Vessel with this IMO number already exists' 
      });
    }
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   PUT api/vessels/:id
// @desc    Update a vessel
// @access  Private (Admin, Owner, Ship Management)
router.put('/:id', auth, upload.array('media', 15), async (req, res) => {
  try {
    let vessel = await Vessel.findById(req.params.id);
    
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }

    // Check if user has permission to update this vessel
    if (req.user.role !== 'admin' && 
        req.user.id !== vessel.owner.toString() && 
        req.user.id !== vessel.shipManagement?.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this vessel' });
    }

    // Parse vessel data from request body
    const vesselData = JSON.parse(req.body.vesselData || '{}');
    
    // Handle media deletion
    let currentMedia = vessel.media || [];
    
    // If mediaToDelete is provided, remove those items
    if (req.body.mediaToDelete) {
      try {
        const mediaToDelete = JSON.parse(req.body.mediaToDelete);
        
        // Filter out media marked for deletion
        currentMedia = currentMedia.filter(mediaItem => {
          const shouldDelete = mediaToDelete.includes(mediaItem._id.toString());
          
          // If we're deleting this item, also delete the file from disk
          if (shouldDelete) {
            const filePath = path.join(__dirname, '../uploads/vessels', path.basename(mediaItem.url));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
          
          return !shouldDelete;
        });
      } catch (err) {
        console.error('Error parsing mediaToDelete:', err);
      }
    }
    
    // Process uploaded media files if any
    if (req.files && req.files.length > 0) {
      const newMedia = [];
      req.files.forEach(file => {
        // Determine the media type based on mimetype
        let type = 'photo';
        if (file.mimetype.startsWith('video/')) {
          type = 'video';
        } else if (file.mimetype === 'application/pdf' || 
                   file.mimetype === 'application/msword' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          type = 'certificate';
        }
        
        newMedia.push({
          type: type,
          url: `/uploads/vessels/${file.filename}`,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        });
      });
      
      // Add new media to existing media
      vesselData.media = [...currentMedia, ...newMedia];
    } else if (req.body.mediaToDelete) {
      // If no new media but we're deleting some, update the media array
      vesselData.media = currentMedia;
    }

    // Update vessel
    vessel = await Vessel.findByIdAndUpdate(
      req.params.id,
      { $set: vesselData },
      { new: true }
    );

    res.json(vessel);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/vessels/:id
// @desc    Delete a vessel
// @access  Private (Admin, Owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }

    // Check if user has permission to delete this vessel
    if (req.user.role !== 'admin' && req.user.id !== vessel.owner.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this vessel' });
    }

    // Delete associated media files
    if (vessel.media && vessel.media.length > 0) {
      vessel.media.forEach(media => {
        const filePath = path.join(__dirname, '../uploads/vessels', path.basename(media.url));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await vessel.remove();
    res.json({ msg: 'Vessel removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/vessels/:id/media/:mediaId
// @desc    Delete a specific media file from a vessel
// @access  Private (Admin, Owner, Ship Management)
router.delete('/:id/media/:mediaId', auth, async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }

    // Check if user has permission to update this vessel
    if (req.user.role !== 'admin' && 
        req.user.id !== vessel.owner.toString() && 
        req.user.id !== vessel.shipManagement?.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this vessel' });
    }

    // Find the media item
    const mediaIndex = vessel.media.findIndex(m => m._id.toString() === req.params.mediaId);
    
    if (mediaIndex === -1) {
      return res.status(404).json({ msg: 'Media not found' });
    }

    // Delete the file from disk
    const mediaItem = vessel.media[mediaIndex];
    const filePath = path.join(__dirname, '../uploads/vessels', path.basename(mediaItem.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the media item from the vessel
    vessel.media.splice(mediaIndex, 1);
    await vessel.save();

    res.json({ msg: 'Media removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Vessel or media not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;