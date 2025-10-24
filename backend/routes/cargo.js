const express = require('express');
const router = express.Router();
const { Cargo, Vessel } = require('../models');

// @route   GET api/cargo
// @desc    Get all active cargo shipments
// @access  Public
router.get('/', async (req, res) => {
  try {
    const cargo = await Cargo.find({})
      .populate('vessel', 'name imo vesselType')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(cargo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/cargo/:id
// @desc    Get cargo by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const cargo = await Cargo.findById(req.params.id)
      .populate('vessel', 'name imo vesselType flag')
      .populate('createdBy', 'name email');
    
    if (!cargo) {
      return res.status(404).json({ msg: 'Cargo not found' });
    }

    res.json(cargo);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Cargo not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/cargo
// @desc    Create a cargo shipment (disabled)
// @access  Forbidden
router.post('/', async (req, res) => {
  return res.status(403).json({ msg: 'Creating cargo shipments is disabled.' });
});

// @route   PUT api/cargo/:id
// @desc    Update a cargo shipment (disabled)
// @access  Forbidden
router.put('/:id', async (req, res) => {
  return res.status(403).json({ msg: 'Updating cargo shipments is disabled.' });
});

// @route   DELETE api/cargo/:id
// @desc    Delete a cargo shipment (disabled)
// @access  Forbidden
router.delete('/:id', async (req, res) => {
  return res.status(403).json({ msg: 'Deleting cargo shipments is disabled.' });
});

module.exports = router;