const express = require('express');
const router = express.Router();
const { Vessel } = require('../models');
const auth = require('../middleware/auth');

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
router.post('/', auth, async (req, res) => {
  // Admin, owner, and ship management can create vessels
  if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'ship_management') {
    return res.status(403).json({ msg: 'Not authorized to create vessels' });
  }

  try {
    // Ensure owner is set - if not provided, use current user
    const ownerId = req.body.owner || req.user.id;
    
    const newVessel = new Vessel({
      ...req.body,
      owner: ownerId
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
router.put('/:id', auth, async (req, res) => {
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

    // Update vessel
    vessel = await Vessel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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

module.exports = router;