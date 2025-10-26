const express = require('express');
const router = express.Router();
const { SurveyorBooking, User, Vessel, ServiceRequest } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/surveyor-bookings
// @desc    Get all surveyor bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, surveyorId } = req.query;
    
    let query = {};
    
    // If user is a surveyor, only show their bookings
    if (req.user.role === 'surveyor') {
      query.surveyor = req.user.id;
    }
    
    // If user is ship management, show bookings they created
    if (req.user.role === 'ship_management') {
      query.bookedBy = req.user.id;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by specific surveyor if provided (for ship management)
    if (surveyorId && req.user.role === 'ship_management') {
      query.surveyor = surveyorId;
    }

    const bookings = await SurveyorBooking.find(query)
      .populate('surveyor', 'name email')
      .populate('bookedBy', 'name email')
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .sort({ inspectionDate: -1, createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/surveyor-bookings/:id
// @desc    Update a surveyor booking
// @access  Private (Ship Management only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update bookings' });
    }

    const {
      surveyorId,
      inspectionDate,
      inspectionTime,
      shipType,
      surveyType,
      location,
      vesselId,
      vesselName,
      notes,
      specialRequirements,
      estimatedDuration
    } = req.body;

    // Build booking object
    const bookingFields = {};
    if (surveyorId) bookingFields.surveyor = surveyorId;
    if (inspectionDate) bookingFields.inspectionDate = inspectionDate;
    if (inspectionTime) bookingFields.inspectionTime = inspectionTime;
    if (shipType) bookingFields.shipType = shipType;
    if (surveyType) bookingFields.surveyType = surveyType;
    if (location) bookingFields.location = location;
    if (vesselId) bookingFields.vessel = vesselId;
    if (vesselName) bookingFields.vesselName = vesselName;
    if (notes) bookingFields.notes = notes;
    if (specialRequirements) bookingFields.specialRequirements = specialRequirements;
    if (estimatedDuration) bookingFields.estimatedDuration = estimatedDuration;
    
    // Reset status to 'Pending' when booking is edited
    bookingFields.status = 'Pending';
    bookingFields.statusUpdatedAt = Date.now();

    let booking = await SurveyorBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Make sure user owns booking
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    booking = await SurveyorBooking.findByIdAndUpdate(
      req.params.id,
      { $set: bookingFields },
      { new: true }
    )
    .populate('surveyor', 'name email')
    .populate('bookedBy', 'name email')
    .populate({
      path: 'vessel',
      select: 'name imo vesselType media',
      populate: {
        path: 'media',
        select: 'type url fileName fileSize mimeType uploadedAt'
      }
    });

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/surveyor-bookings
// @desc    Create a surveyor booking
// @access  Private (Ship Management only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to create surveyor bookings' });
    }

    let {
      surveyorId,
      inspectionDate,
      inspectionTime,
      shipType,
      surveyType,
      location,
      vesselId,
      vesselName,
      notes,
      specialRequirements,
      estimatedDuration,
      serviceRequestId
    } = req.body;

    // If booking is from a service request, auto-populate shipType from the service request
    if (serviceRequestId) {
      const serviceRequest = await ServiceRequest.findById(serviceRequestId)
        .populate('vessel', 'vesselType');
      
      if (serviceRequest && serviceRequest.vessel && serviceRequest.vessel.vesselType) {
        shipType = serviceRequest.vessel.vesselType;
      }
    }

    // Validate required fields
    // If booking is from a service request, shipType is auto-populated, so it's not required in the request body
    if (!surveyorId || !inspectionDate || !inspectionTime || !surveyType || !location || !vesselName || (!serviceRequestId && !shipType)) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if surveyor exists and is active
    const surveyor = await User.findById(surveyorId);
    if (!surveyor || surveyor.role !== 'surveyor' || surveyor.status !== 'active') {
      return res.status(400).json({ msg: 'Invalid or inactive surveyor' });
    }

    // Check if vessel exists (if vesselId provided)
    if (vesselId) {
      const vessel = await Vessel.findById(vesselId);
      if (!vessel) {
        return res.status(400).json({ msg: 'Vessel not found' });
      }
    }

    const newBooking = new SurveyorBooking({
      surveyor: surveyorId,
      bookedBy: req.user.id,
      inspectionDate,
      inspectionTime,
      shipType,
      surveyType,
      location,
      vessel: vesselId || null,
      vesselName,
      notes: notes || '',
      specialRequirements: specialRequirements || '',
      estimatedDuration: estimatedDuration || 4
    });

    const booking = await newBooking.save();
    await booking.populate('surveyor', 'name email');
    await booking.populate('bookedBy', 'name email');
    await booking.populate({
      path: 'vessel',
      select: 'name imo vesselType media',
      populate: {
        path: 'media',
        select: 'type url fileName fileSize mimeType uploadedAt'
      }
    });

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: 'Validation Error', errors });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/surveyor-bookings/:id/accept
// @desc    Accept a surveyor booking
// @access  Private (Surveyor only)
router.put('/:id/accept', auth, async (req, res) => {
  try {
    // Check if user is a surveyor
    if (req.user.role !== 'surveyor') {
      return res.status(403).json({ msg: 'Not authorized to accept bookings' });
    }

    const booking = await SurveyorBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking belongs to this surveyor
    if (booking.surveyor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to accept this booking' });
    }

    // Check if booking is still pending
    if (booking.status !== 'Pending') {
      return res.status(400).json({ msg: 'Booking is not pending' });
    }

    booking.status = 'Accepted';
    booking.acceptedAt = new Date();
    await booking.save();

    await booking.populate('surveyor', 'name email');
    await booking.populate('bookedBy', 'name email');
    await booking.populate('vessel', 'name imo vesselType');

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/surveyor-bookings/:id/decline
// @desc    Decline a surveyor booking
// @access  Private (Surveyor only)
router.put('/:id/decline', auth, async (req, res) => {
  try {
    // Check if user is a surveyor
    if (req.user.role !== 'surveyor') {
      return res.status(403).json({ msg: 'Not authorized to decline bookings' });
    }

    const booking = await SurveyorBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking belongs to this surveyor
    if (booking.surveyor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to decline this booking' });
    }

    // Check if booking is still pending
    if (booking.status !== 'Pending') {
      return res.status(400).json({ msg: 'Booking is not pending' });
    }

    booking.status = 'Declined';
    booking.declinedAt = new Date();
    await booking.save();

    await booking.populate('surveyor', 'name email');
    await booking.populate('bookedBy', 'name email');
    await booking.populate('vessel', 'name imo vesselType');

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/surveyor-bookings/:id
// @desc    Cancel a surveyor booking
// @access  Private (Ship Management only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to cancel bookings' });
    }

    const booking = await SurveyorBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking was created by this user
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
    }

    // Actually delete the booking instead of marking as cancelled
    await SurveyorBooking.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Booking deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/surveyor-bookings/:id/assign
// @desc    Assign survey with ship location, photos, and flight ticket
// @access  Private (Ship Management only)
router.put('/:id/assign', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to assign surveys' });
    }

    const booking = await SurveyorBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking was created by this user
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to assign this booking' });
    }

    // Check if booking is accepted
    if (booking.status !== 'Accepted') {
      return res.status(400).json({ msg: 'Can only assign accepted bookings' });
    }

    const { shipPhotos, flightTicket } = req.body;

    // Update booking with assignment data
    booking.shipPhotos = shipPhotos || [];
    booking.flightTicket = flightTicket || null;
    booking.assignedAt = new Date();

    await booking.save();

    await booking.populate('surveyor', 'name email');
    await booking.populate('bookedBy', 'name email');
    await booking.populate('vessel', 'name imo vesselType');

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


