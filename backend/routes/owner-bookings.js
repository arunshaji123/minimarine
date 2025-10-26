const express = require('express');
const router = express.Router();
const { SurveyorBooking, CargoManagerBooking, Vessel } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/owner-bookings/surveyor
// @desc    Get surveyor bookings for owner's vessels
// @access  Private (Owner only)
router.get('/surveyor', auth, async (req, res) => {
  try {
    // Check if user is an owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Not authorized to access this resource' });
    }

    // Get all vessels owned by this owner
    const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
    const vesselIds = ownerVessels.map(vessel => vessel._id);

    // Get bookings for these vessels
    // Filter by status: only show pending and accepted bookings
    const bookings = await SurveyorBooking.find({
      vessel: { $in: vesselIds },
      status: { $in: ['Pending', 'Accepted'] }
    })
      .populate('surveyor', 'name email')
      .populate('bookedBy', 'name email company')
      .populate({
        path: 'vessel',
        select: 'name imo vesselType',
      })
      .sort({ inspectionDate: -1, createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/owner-bookings/cargo
// @desc    Get cargo manager bookings for owner's vessels
// @access  Private (Owner only)
router.get('/cargo', auth, async (req, res) => {
  try {
    // Check if user is an owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Not authorized to access this resource' });
    }

    // Get all vessels owned by this owner
    const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
    const vesselIds = ownerVessels.map(vessel => vessel._id);

    // Get bookings for these vessels
    // Filter by status: only show pending and accepted bookings
    const bookings = await CargoManagerBooking.find({
      vessel: { $in: vesselIds },
      status: { $in: ['Pending', 'Accepted'] }
    })
      .populate('cargoManager', 'name email')
      .populate('bookedBy', 'name email company')
      .populate({
        path: 'vessel',
        select: 'name imo vesselType',
      })
      .sort({ voyageDate: -1, createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/owner-bookings/surveyor/:id
// @desc    Get detailed surveyor booking by ID for owner's vessels
// @access  Private (Owner only)
router.get('/surveyor/:id', auth, async (req, res) => {
  try {
    // Check if user is an owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Not authorized to access this resource' });
    }

    // Get all vessels owned by this owner
    const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
    const vesselIds = ownerVessels.map(vessel => vessel._id);

    // Get booking by ID and ensure it's for one of owner's vessels
    const booking = await SurveyorBooking.findOne({
      _id: req.params.id,
      vessel: { $in: vesselIds }
    })
      .populate('surveyor', 'name email phone')
      .populate('bookedBy', 'name email company phone')
      .populate({
        path: 'vessel',
        select: 'name imo vesselType dimensions yearBuilt flag',
      });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/owner-bookings/cargo/:id
// @desc    Get detailed cargo manager booking by ID for owner's vessels
// @access  Private (Owner only)
router.get('/cargo/:id', auth, async (req, res) => {
  try {
    // Check if user is an owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Not authorized to access this resource' });
    }

    // Get all vessels owned by this owner
    const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
    const vesselIds = ownerVessels.map(vessel => vessel._id);

    // Get booking by ID and ensure it's for one of owner's vessels
    const booking = await CargoManagerBooking.findOne({
      _id: req.params.id,
      vessel: { $in: vesselIds }
    })
      .populate('cargoManager', 'name email phone')
      .populate('bookedBy', 'name email company phone')
      .populate({
        path: 'vessel',
        select: 'name imo vesselType dimensions yearBuilt flag',
      });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;