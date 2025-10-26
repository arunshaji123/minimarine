const express = require('express');
const router = express.Router();
const { CargoManagerBooking, User, Vessel, ServiceRequest } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/cargo-manager-bookings
// @desc    Get all cargo manager bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, cargoManagerId } = req.query;
    
    let query = {};
    
    // If user is a cargo manager, only show their bookings
    if (req.user.role === 'cargo_manager') {
      query.cargoManager = req.user.id;
    }
    
    // If user is ship management, show bookings they created
    if (req.user.role === 'ship_management') {
      query.bookedBy = req.user.id;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by specific cargo manager if provided (for ship management)
    if (cargoManagerId && req.user.role === 'ship_management') {
      query.cargoManager = cargoManagerId;
    }

    const bookings = await CargoManagerBooking.find(query)
      .populate('cargoManager', 'name email')
      .populate('bookedBy', 'name email')
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .sort({ voyageDate: -1, createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/cargo-manager-bookings/:id
// @desc    Update a cargo manager booking
// @access  Private (Ship Management only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update bookings' });
    }

    const {
      cargoManagerId,
      voyageDate,
      voyageTime,
      cargoType,
      departurePort,
      destinationPort,
      vesselId,
      vesselName,
      notes,
      specialRequirements,
      estimatedDuration,
      cargoWeight,
      cargoUnits
    } = req.body;

    // Build booking object
    const bookingFields = {};
    if (cargoManagerId) bookingFields.cargoManager = cargoManagerId;
    if (voyageDate) bookingFields.voyageDate = voyageDate;
    if (voyageTime) bookingFields.voyageTime = voyageTime;
    if (cargoType) bookingFields.cargoType = cargoType;
    if (departurePort) bookingFields.departurePort = departurePort;
    if (destinationPort) bookingFields.destinationPort = destinationPort;
    if (vesselId) bookingFields.vessel = vesselId;
    if (vesselName) bookingFields.vesselName = vesselName;
    if (notes) bookingFields.notes = notes;
    if (specialRequirements) bookingFields.specialRequirements = specialRequirements;
    if (estimatedDuration) bookingFields.estimatedDuration = estimatedDuration;
    if (cargoWeight) bookingFields.cargoWeight = cargoWeight;
    if (cargoUnits) bookingFields.cargoUnits = cargoUnits;
    
    // Reset status to 'Pending' when booking is edited
    bookingFields.status = 'Pending';
    bookingFields.statusUpdatedAt = Date.now();

    let booking = await CargoManagerBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Make sure user owns booking
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    booking = await CargoManagerBooking.findByIdAndUpdate(
      req.params.id,
      { $set: bookingFields },
      { new: true }
    )
    .populate('cargoManager', 'name email')
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

// @route   POST api/cargo-manager-bookings
// @desc    Create a cargo manager booking
// @access  Private (Ship Management only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to create cargo manager bookings' });
    }

    let {
      cargoManagerId,
      voyageDate,
      voyageTime,
      cargoType,
      departurePort,
      destinationPort,
      vesselId,
      vesselName,
      notes,
      specialRequirements,
      estimatedDuration,
      cargoWeight,
      cargoUnits,
      serviceRequestId
    } = req.body;

    // If booking is from a service request, auto-populate shipType from the service request
    let shipType = '';
    if (serviceRequestId) {
      const serviceRequest = await ServiceRequest.findById(serviceRequestId)
        .populate('vessel', 'vesselType');
      
      if (serviceRequest && serviceRequest.vessel && serviceRequest.vessel.vesselType) {
        shipType = serviceRequest.vessel.vesselType;
      }
    }

    // Validate required fields
    if (!cargoManagerId || !voyageDate || !voyageTime || !cargoType || !departurePort || !destinationPort || !vesselName) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if cargo manager exists and is active
    const cargoManager = await User.findById(cargoManagerId);
    if (!cargoManager || cargoManager.role !== 'cargo_manager' || cargoManager.status !== 'active') {
      return res.status(400).json({ msg: 'Invalid or inactive cargo manager' });
    }

    // Check if vessel exists (if vesselId provided)
    if (vesselId) {
      const vessel = await Vessel.findById(vesselId);
      if (!vessel) {
        return res.status(400).json({ msg: 'Vessel not found' });
      }
    }

    const newBooking = new CargoManagerBooking({
      cargoManager: cargoManagerId,
      bookedBy: req.user.id,
      voyageDate,
      voyageTime,
      cargoType,
      departurePort,
      destinationPort,
      vessel: vesselId || null,
      vesselName,
      shipType: shipType || '',
      notes: notes || '',
      specialRequirements: specialRequirements || '',
      estimatedDuration: estimatedDuration || 7,
      cargoWeight: cargoWeight || null,
      cargoUnits: cargoUnits || null
    });

    const booking = await newBooking.save();
    await booking.populate('cargoManager', 'name email');
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

// @route   PUT api/cargo-manager-bookings/:id/assign
// @desc    Assign cargo manager with ship/cargo photos and location
// @access  Private (Ship Management only)
router.put('/:id/assign', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to assign bookings' });
    }

    const { shipPhotos, cargoPhotos } = req.body;

    // Validate required fields
    if (!shipPhotos || !cargoPhotos) {
      return res.status(400).json({ msg: 'Ship photos and cargo photos are required' });
    }

    let booking = await CargoManagerBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Make sure user owns booking
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Make sure booking is accepted
    if (booking.status !== 'Accepted') {
      return res.status(400).json({ msg: 'Can only assign accepted bookings' });
    }

    // Update booking with assignment data
    booking.shipPhotos = shipPhotos.map(photo => ({
      name: photo.name,
      data: photo.data,
      uploadedAt: new Date()
    }));
    booking.cargoPhotos = cargoPhotos.map(photo => ({
      name: photo.name,
      data: photo.data,
      uploadedAt: new Date()
    }));
    booking.assignedAt = new Date();

    await booking.save();
    await booking.populate('cargoManager', 'name email');
    await booking.populate('bookedBy', 'name email');
    await booking.populate('vessel', 'name imo vesselType');

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/cargo-manager-bookings/:id/accept
// @desc    Accept a cargo manager booking
// @access  Private (Cargo Manager only)
router.put('/:id/accept', auth, async (req, res) => {
  try {
    // Check if user is a cargo manager
    if (req.user.role !== 'cargo_manager') {
      return res.status(403).json({ msg: 'Not authorized to accept bookings' });
    }

    const booking = await CargoManagerBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking belongs to this cargo manager
    if (booking.cargoManager.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to accept this booking' });
    }

    // Check if booking is still pending
    if (booking.status !== 'Pending') {
      return res.status(400).json({ msg: 'Booking is not pending' });
    }

    booking.status = 'Accepted';
    booking.acceptedAt = new Date();
    await booking.save();

    await booking.populate('cargoManager', 'name email');
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

// @route   PUT api/cargo-manager-bookings/:id/decline
// @desc    Decline a cargo manager booking
// @access  Private (Cargo Manager only)
router.put('/:id/decline', auth, async (req, res) => {
  try {
    // Check if user is a cargo manager
    if (req.user.role !== 'cargo_manager') {
      return res.status(403).json({ msg: 'Not authorized to decline bookings' });
    }

    const booking = await CargoManagerBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking belongs to this cargo manager
    if (booking.cargoManager.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to decline this booking' });
    }

    // Check if booking is still pending
    if (booking.status !== 'Pending') {
      return res.status(400).json({ msg: 'Booking is not pending' });
    }

    booking.status = 'Declined';
    booking.declinedAt = new Date();
    await booking.save();

    await booking.populate('cargoManager', 'name email');
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

// @route   DELETE api/cargo-manager-bookings/:id
// @desc    Cancel a cargo manager booking
// @access  Private (Ship Management only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to cancel bookings' });
    }

    const booking = await CargoManagerBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if booking was created by this user
    if (booking.bookedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
    }

    // Actually delete the booking instead of marking as cancelled
    await CargoManagerBooking.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Booking deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;


