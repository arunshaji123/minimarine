const express = require('express');
const router = express.Router();
const { Maintenance, Vessel } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/maintenance
// @desc    Get all maintenance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Filter maintenance based on user role
    let query = {};
    
    if (req.user.role === 'owner') {
      // Owners can only see maintenance for their vessels
      const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
      const vesselIds = ownerVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    } else if (req.user.role === 'ship_management') {
      // Ship management can see maintenance for vessels they manage
      const managedVessels = await Vessel.find({ shipManagement: req.user.id }).select('_id');
      const vesselIds = managedVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    }
    // Admin, surveyor, and cargo_manager can see all maintenance records
    
    const maintenance = await Maintenance.find(query)
      .populate('vessel', 'name imoNumber')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1 });
      
    res.json(maintenance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/maintenance/:id
// @desc    Get maintenance by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('vessel', 'name imoNumber')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    if (!maintenance) {
      return res.status(404).json({ msg: 'Maintenance record not found' });
    }

    // Check if user has permission to view this maintenance record
    if (req.user.role !== 'admin' && req.user.role !== 'surveyor' && req.user.role !== 'cargo_manager') {
      const vessel = await Vessel.findById(maintenance.vessel);
      if (!vessel) {
        return res.status(404).json({ msg: 'Associated vessel not found' });
      }
      
      if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
        return res.status(403).json({ msg: 'Not authorized to view this maintenance record' });
      }
      
      if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
        return res.status(403).json({ msg: 'Not authorized to view this maintenance record' });
      }
    }

    res.json(maintenance);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Maintenance record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/maintenance
// @desc    Create a maintenance record
// @access  Private (Admin, Ship Management)
router.post('/', auth, async (req, res) => {
  // Only admin and ship_management can create maintenance records
  if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
    return res.status(403).json({ msg: 'Not authorized to create maintenance records' });
  }

  try {
    // Check if vessel exists and user has permission
    const vessel = await Vessel.findById(req.body.vessel);
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    
    if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
      return res.status(403).json({ msg: 'Not authorized to create maintenance for this vessel' });
    }

    const newMaintenance = new Maintenance({
      ...req.body,
      createdBy: req.user.id
    });

    const maintenance = await newMaintenance.save();
    res.json(maintenance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/maintenance/:id
// @desc    Update a maintenance record
// @access  Private (Admin, Ship Management for their vessels)
router.put('/:id', auth, async (req, res) => {
  try {
    let maintenance = await Maintenance.findById(req.params.id);
    
    if (!maintenance) {
      return res.status(404).json({ msg: 'Maintenance record not found' });
    }

    // Check if user has permission to update this maintenance record
    if (req.user.role !== 'admin') {
      if (req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(maintenance.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to update this maintenance record' });
        }
      } else {
        return res.status(403).json({ msg: 'Not authorized to update maintenance records' });
      }
    }

    // Update maintenance
    maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(maintenance);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Maintenance record not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/maintenance/:id
// @desc    Delete a maintenance record
// @access  Private (Admin, Ship Management for their vessels)
router.delete('/:id', auth, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    
    if (!maintenance) {
      return res.status(404).json({ msg: 'Maintenance record not found' });
    }

    // Check if user has permission to delete this maintenance record
    if (req.user.role !== 'admin') {
      if (req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(maintenance.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to delete this maintenance record' });
        }
      } else {
        return res.status(403).json({ msg: 'Not authorized to delete maintenance records' });
      }
    }

    await maintenance.remove();
    res.json({ msg: 'Maintenance record removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Maintenance record not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;