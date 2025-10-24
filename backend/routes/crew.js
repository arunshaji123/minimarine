const express = require('express');
const router = express.Router();
const { Crew, Vessel } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/crew
// @desc    Get all crew records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Filter crew based on user role
    let query = {};
    
    if (req.user.role === 'owner') {
      // Owners can only see crew for their vessels
      const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
      const vesselIds = ownerVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    } else if (req.user.role === 'ship_management') {
      // Ship management can see crew for vessels they manage
      const managedVessels = await Vessel.find({ shipManagement: req.user.id }).select('_id');
      const vesselIds = managedVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    }
    // Admin, surveyor, and cargo_manager can see all crew records
    
    const crew = await Crew.find(query)
      .populate('vessel', 'name imoNumber')
      .sort({ name: 1 });
      
    res.json(crew);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/crew/:id
// @desc    Get crew by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const crew = await Crew.findById(req.params.id)
      .populate('vessel', 'name imoNumber');
    
    if (!crew) {
      return res.status(404).json({ msg: 'Crew record not found' });
    }

    // Check if user has permission to view this crew record
    if (req.user.role !== 'admin' && req.user.role !== 'surveyor' && req.user.role !== 'cargo_manager') {
      const vessel = await Vessel.findById(crew.vessel);
      if (!vessel) {
        return res.status(404).json({ msg: 'Associated vessel not found' });
      }
      
      if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
        return res.status(403).json({ msg: 'Not authorized to view this crew record' });
      }
      
      if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
        return res.status(403).json({ msg: 'Not authorized to view this crew record' });
      }
    }

    res.json(crew);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Crew record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/crew
// @desc    Create a crew record
// @access  Private (Admin, Ship Management)
router.post('/', auth, async (req, res) => {
  // Only admin and ship_management can create crew records
  if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
    return res.status(403).json({ msg: 'Not authorized to create crew records' });
  }

  try {
    // Check if vessel exists and user has permission
    const vessel = await Vessel.findById(req.body.vessel);
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    
    if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
      return res.status(403).json({ msg: 'Not authorized to create crew for this vessel' });
    }

    const newCrew = new Crew(req.body);

    const crew = await newCrew.save();
    res.json(crew);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/crew/:id
// @desc    Update a crew record
// @access  Private (Admin, Ship Management for their vessels)
router.put('/:id', auth, async (req, res) => {
  try {
    let crew = await Crew.findById(req.params.id);
    
    if (!crew) {
      return res.status(404).json({ msg: 'Crew record not found' });
    }

    // Check if user has permission to update this crew record
    if (req.user.role !== 'admin') {
      if (req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(crew.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to update this crew record' });
        }
      } else {
        return res.status(403).json({ msg: 'Not authorized to update crew records' });
      }
    }

    // Update crew
    crew = await Crew.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(crew);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Crew record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/crew/:id
// @desc    Delete a crew record
// @access  Private (Admin, Ship Management for their vessels)
router.delete('/:id', auth, async (req, res) => {
  try {
    const crew = await Crew.findById(req.params.id);
    
    if (!crew) {
      return res.status(404).json({ msg: 'Crew record not found' });
    }

    // Check if user has permission to delete this crew record
    if (req.user.role !== 'admin') {
      if (req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(crew.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to delete this crew record' });
        }
      } else {
        return res.status(403).json({ msg: 'Not authorized to delete crew records' });
      }
    }

    await crew.remove();
    res.json({ msg: 'Crew record removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Crew record not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;