const express = require('express');
const router = express.Router();
const { Shipment, Vessel } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/shipments
// @desc    Get all shipments
// @access  Public (for now, can be made private later)
router.get('/', async (req, res) => {
  try {
    const shipments = await Shipment.find({})
      .populate('vessel', 'name imo vesselType')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(shipments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/shipments/:id
// @desc    Get shipment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('vessel', 'name imo vesselType flag')
      .populate('createdBy', 'name email');
    
    if (!shipment) {
      return res.status(404).json({ msg: 'Shipment not found' });
    }

    // Check if user has permission to view this shipment
    if (req.user.role !== 'admin' && 
        req.user.role !== 'surveyor' && 
        req.user.role !== 'cargo_manager' && 
        req.user.id !== shipment.createdBy.toString()) {
      
      // Check if user owns or manages the vessel
      const vessel = await Vessel.findById(shipment.vessel._id);
      if (!vessel || 
          (vessel.owner.toString() !== req.user.id && 
           vessel.shipManagement?.toString() !== req.user.id)) {
        return res.status(403).json({ msg: 'Not authorized to view this shipment' });
      }
    }

    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shipment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/shipments
// @desc    Create a shipment
// @access  Public (for now, can be made private later)
router.post('/', async (req, res) => {
  try {
    // Generate unique reference if not provided
    let reference = req.body.reference;
    if (!reference) {
      const count = await Shipment.countDocuments();
      reference = `SHM${String(count + 1).padStart(6, '0')}`;
    }

    // Check if reference already exists
    const existingShipment = await Shipment.findOne({ reference });
    if (existingShipment) {
      return res.status(400).json({ msg: 'Shipment reference already exists' });
    }

    const newShipment = new Shipment({
      ...req.body,
      reference,
      createdBy: req.user?.id || null
    });

    const shipment = await newShipment.save();
    
    // Populate the response
    await shipment.populate('vessel', 'name imo vesselType');
    await shipment.populate('createdBy', 'name email');
    
    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: 'Validation Error', errors });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/shipments/:id
// @desc    Update a shipment
// @access  Public (temporarily for frontend compatibility)
router.put('/:id', async (req, res) => {
  try {
    let shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({ msg: 'Shipment not found' });
    }

    // Skip authorization check for now (temporarily for frontend compatibility)
    // if (req.user.role !== 'admin' && 
    //     req.user.id !== shipment.createdBy.toString()) {
      
    //   // Check if user owns or manages the vessel
    //   const vessel = await Vessel.findById(shipment.vessel);
    //   if (!vessel || 
    //       (vessel.owner.toString() !== req.user.id && 
    //        vessel.shipManagement?.toString() !== req.user.id)) {
    //     return res.status(403).json({ msg: 'Not authorized to update this shipment' });
    //   }
    // }

    // Update shipment
    shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('vessel', 'name imo vesselType')
     .populate('createdBy', 'name email');

    res.json(shipment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shipment not found' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: 'Validation Error', errors });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/shipments/:id
// @desc    Delete a shipment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({ msg: 'Shipment not found' });
    }

    // Check if user has permission to delete this shipment
    if (req.user.role !== 'admin' && req.user.id !== shipment.createdBy.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this shipment' });
    }

    await shipment.deleteOne();
    res.json({ msg: 'Shipment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shipment not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;


