const express = require('express');
const router = express.Router();
const { Survey, Vessel, SurveyorBooking } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/surveys
// @desc    Get all surveys
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Filter surveys based on user role
    let query = {};
    
    if (req.user.role === 'surveyor') {
      // Surveyors can only see surveys they are assigned to
      query.surveyor = req.user.id;
    } else if (req.user.role === 'owner') {
      // Owners can only see surveys for their vessels
      const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
      const vesselIds = ownerVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    } else if (req.user.role === 'ship_management') {
      // Ship management can see surveys for vessels they manage
      const managedVessels = await Vessel.find({ shipManagement: req.user.id }).select('_id');
      const vesselIds = managedVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    }
    // Admin and cargo_manager can see all surveys
    
    const surveys = await Survey.find(query)
      .populate('vessel', 'name imoNumber')
      .populate('surveyor', 'name email')
      .populate('requester', 'name email')
      .sort({ scheduledDate: -1 });
      
    res.json(surveys);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/surveys/:id
// @desc    Get survey by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('vessel', 'name imoNumber')
      .populate('surveyor', 'name email')
      .populate('requester', 'name email');
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    // Check if user has permission to view this survey
    if (req.user.role !== 'admin') {
      if (req.user.role === 'surveyor' && req.user.id !== survey.surveyor.toString()) {
        return res.status(403).json({ msg: 'Not authorized to view this survey' });
      }
      
      if (req.user.role === 'owner' || req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(survey.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
          return res.status(403).json({ msg: 'Not authorized to view this survey' });
        }
        
        if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to view this survey' });
        }
      }
    }

    res.json(survey);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/surveys
// @desc    Create a survey
// @access  Private (Admin, Owner, Ship Management)
router.post('/', auth, async (req, res) => {
  // Only admin, owner, and ship_management can create surveys
  if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'ship_management') {
    return res.status(403).json({ msg: 'Not authorized to create surveys' });
  }

  try {
    // Check if vessel exists and user has permission
    const vessel = await Vessel.findById(req.body.vessel);
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    
    if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
      return res.status(403).json({ msg: 'Not authorized to create survey for this vessel' });
    }
    
    if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
      return res.status(403).json({ msg: 'Not authorized to create survey for this vessel' });
    }

    const newSurvey = new Survey({
      ...req.body,
      requester: req.user.id
    });

    const survey = await newSurvey.save();
    res.json(survey);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/surveys/:id
// @desc    Update a survey
// @access  Private (Admin, Surveyor for assigned surveys, Owner/Ship Management for their vessels)
router.put('/:id', auth, async (req, res) => {
  try {
    let survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    // Check if user has permission to update this survey
    if (req.user.role !== 'admin') {
      if (req.user.role === 'surveyor' && req.user.id !== survey.surveyor.toString()) {
        return res.status(403).json({ msg: 'Not authorized to update this survey' });
      }
      
      if (req.user.role === 'owner' || req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(survey.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
          return res.status(403).json({ msg: 'Not authorized to update this survey' });
        }
        
        if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to update this survey' });
        }
      }
    }

    // Update survey
    survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(survey);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/surveys/:id
// @desc    Delete a survey
// @access  Private (Admin, Owner/Ship Management for their vessels)
router.delete('/:id', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    // Check if user has permission to delete this survey
    if (req.user.role !== 'admin') {
      if (req.user.role === 'owner' || req.user.role === 'ship_management') {
        const vessel = await Vessel.findById(survey.vessel);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
          return res.status(403).json({ msg: 'Not authorized to delete this survey' });
        }
        
        if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to delete this survey' });
        }
      } else {
        return res.status(403).json({ msg: 'Not authorized to delete surveys' });
      }
    }

    await survey.remove();
    res.json({ msg: 'Survey removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/surveys/:id/report
// @desc    Submit survey report
// @access  Private (Surveyor for assigned surveys)
router.put('/:id/report', auth, async (req, res) => {
  try {
    console.log('Received request to update survey with ID:', req.params.id);
    
    // First, try to find an existing survey
    let survey = await Survey.findById(req.params.id);
    
    // If no survey exists with this ID, check if it's a booking ID and create a survey
    if (!survey) {
      console.log('Survey not found, checking if ID is a booking ID:', req.params.id);
      
      // Try to find a booking with this ID
      const booking = await SurveyorBooking.findById(req.params.id)
        .populate('vessel')
        .populate('surveyor');
      
      if (booking) {
        console.log('Found booking, creating survey from booking data');
        
        // Create a new survey from booking data
        const surveyData = {
          title: `${booking.surveyType} Survey for ${booking.vesselName}`,
          vessel: booking.vessel ? booking.vessel._id : null,
          surveyType: booking.surveyType,
          surveyor: booking.surveyor._id,
          requestedBy: booking.bookedBy,
          scheduledDate: booking.inspectionDate,
          location: {
            port: booking.location,
            country: '',
            coordinates: {
              latitude: null,
              longitude: null
            }
          },
          status: 'Scheduled'
        };
        
        const newSurvey = new Survey(surveyData);
        survey = await newSurvey.save();
        console.log('Created new survey from booking:', survey._id);
      }
    }
    
    if (!survey) {
      console.log('Survey not found in database for ID:', req.params.id);
      return res.status(404).json({ msg: 'Survey not found' });
    }

    // Check if user is the assigned surveyor
    if (req.user.role !== 'admin' && req.user.id !== survey.surveyor.toString()) {
      return res.status(403).json({ msg: 'Not authorized to submit report for this survey' });
    }

    // Update survey with report data
    const {
      findings,
      recommendations,
      notes,
      completedAt
    } = req.body;

    // Update survey fields
    // Convert simple findings string to the expected format
    if (findings && typeof findings === 'string') {
      survey.findings = [{
        category: 'Other',
        description: findings,
        severity: 'Observation',
        status: 'Open'
      }];
    } else if (Array.isArray(findings)) {
      survey.findings = findings;
    } else {
      survey.findings = [];
    }
    
    survey.recommendations = recommendations;
    survey.notes = notes;
    survey.completionDate = completedAt ? new Date(completedAt) : new Date();
    survey.status = 'Completed';
    
    // Process attachments (now empty since we removed multimedia)
    survey.attachments = [];

    await survey.save();

    res.json({ msg: 'Survey report submitted successfully', survey });
  } catch (err) {
    console.error('Error in survey report submission:', err.message);
    console.error('Stack trace:', err.stack);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Survey not found' });
    }
    // Return detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        msg: 'Server Error', 
        error: err.message,
        stack: err.stack 
      });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/surveys/completed
// @desc    Get completed surveys for a surveyor
// @access  Private (Surveyor)
router.get('/completed', auth, async (req, res) => {
  try {
    // Only surveyors and admins can fetch their completed surveys
    if (req.user.role !== 'surveyor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view completed surveys' });
    }

    // Build query
    let query = { status: 'Completed' };
    
    // If surveyor, only get their surveys
    if (req.user.role === 'surveyor') {
      query.surveyor = req.user.id;
    }
    
    const surveys = await Survey.find(query)
      .populate('vessel', 'name imoNumber')
      .populate('surveyor', 'name email')
      .sort({ completionDate: -1 })
      .limit(20); // Limit to 20 most recent
      
    res.json(surveys);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;