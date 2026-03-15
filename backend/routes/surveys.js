const express = require('express');
const router = express.Router();
const { Survey, Vessel, SurveyorBooking } = require('../models');
const auth = require('../middleware/auth');
const { knnCache } = require('./knn'); // Import the KNN cache
const mongoose = require('mongoose');

// @route   GET api/surveys/ai-reports
// @desc    Get AI analysis reports directly from MongoDB (bypasses Mongoose schema)
// @access  Private
router.get('/ai-reports', auth, async (req, res) => {
  try {
    // Get raw MongoDB collection
    const surveysCollection = mongoose.connection.collection('surveys');
    
    // Query for surveys with aiAnalysis.analyzed = true
    const aiSurveys = await surveysCollection.find({
      'aiAnalysis.analyzed': true
    }).sort({ completionDate: -1 }).limit(50).toArray();
    
    console.log(`🤖 AI Reports endpoint: Found ${aiSurveys.length} surveys with AI analysis`);
    
    res.json(aiSurveys);
  } catch (err) {
    console.error('❌ Error fetching AI reports:', err);
    res.status(500).json({ msg: 'Server error fetching AI reports' });
  }
});

// Helper function to determine severity based on rating
function getSeverityFromRating(rating) {
  // Handle undefined, null, or invalid ratings
  if (rating === undefined || rating === null || isNaN(rating)) {
    return 'Observation';
  }
  
  const numRating = Number(rating);
  if (numRating >= 4) return 'Minor';
  if (numRating >= 3) return 'Major';
  if (numRating >= 1) return 'Critical';
  return 'Observation';
}

// @route   GET api/surveys/completed
// @desc    Get completed surveys (with optional query params: surveyor, vessel)
// @access  Private (Surveyor, Ship Management, Admin)
router.get('/completed', auth, async (req, res) => {
  try {
    // Only surveyors, ship_management, and admins can fetch completed surveys
    if (req.user.role !== 'surveyor' && req.user.role !== 'admin' && req.user.role !== 'ship_management') {
      return res.status(403).json({ msg: 'Not authorized to view completed surveys' });
    }

    // Check if specific surveyor or vessel is requested
    const requestedSurveyorId = req.query.surveyor;
    const requestedVessel = req.query.vessel;

    // Build query
    let query = { status: 'Completed' };
    
    // Apply filters based on query parameters
    if (requestedSurveyorId) {
      query.surveyor = requestedSurveyorId;
    }
    if (requestedVessel) {
      query.vessel = requestedVessel;
    }
    
    // Role-based filtering (only if no specific filters are applied)
    if (!requestedSurveyorId && !requestedVessel) {
      if (req.user.role === 'surveyor') {
        // Surveyors see their own surveys + ALL AI-generated surveys
        // Simplified: just show all completed surveys for now (includes AI surveys)
        // TODO: Filter by surveyor in production
        // query.surveyor = req.user.id;  // DISABLED for testing
      }
      // ship_management and admin can see ALL completed surveys (no additional filter)
      // This allows them to use frontend filters for surveyor/vessel selection
    }
    
    console.log('🔍 Completed surveys query:', JSON.stringify(query, null, 2));
    console.log('👤 User ID:', req.user.id, 'Role:', req.user.role);
    
    const surveys = await Survey.find(query)
      .populate('vessel', 'name imoNumber vesselId owner')
      .populate('surveyor', 'name email')
      .populate('requestedBy', 'name email')
      .lean() // Get plain JavaScript objects, bypassing Mongoose getters/setters
      .sort({ completionDate: -1 })
      .limit(100);
    
    console.log(`✅ Found ${surveys.length} completed surveys`);
    surveys.forEach(s => {
      console.log(`   • ${s._id} - ${s.title} - Surveyor: ${s.surveyor || 'NONE'} - AI: ${s.aiAnalysis?.analyzed || false}`);
    });
      
    res.json(surveys);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/surveys/vessel/:vesselId
// @desc    Get all surveys for a specific vessel
// @access  Private (Owner, Ship Management, Admin, Surveyor, Cargo Manager)
router.get('/vessel/:vesselId', auth, async (req, res) => {
  try {
    const { vesselId } = req.params;
    
    // Check authorization
    // Ship management, admin, surveyor, and cargo_manager can view all vessel surveys
    // Owners can only view surveys for their own vessels
    if (req.user.role === 'owner') {
      const vessel = await Vessel.findById(vesselId);
      if (!vessel) {
        return res.status(404).json({ msg: 'Vessel not found' });
      }
      if (vessel.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to view surveys for this vessel' });
      }
    }
    // All other roles (ship_management, admin, surveyor, cargo_manager) can view any vessel's surveys

    const surveys = await Survey.find({ vessel: vesselId })
      .populate('surveyor', 'name email licenseNumber certificationNumber')
      .populate('vessel', 'name imo vesselId')
      .sort({ scheduledDate: -1 });

    res.json(surveys);
  } catch (err) {
    console.error('Error fetching vessel surveys:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/surveys
// @desc    Get all surveys (with optional query params: surveyor, status, vessel)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Check if specific surveyor is requested (e.g., for predictive maintenance)
    // If surveyor query param is provided, ship_management can see ALL surveys by that surveyor
    const requestedSurveyorId = req.query.surveyor;
    const requestedStatus = req.query.status;
    const requestedVessel = req.query.vessel;
    
    // Filter surveys based on user role
    let query = {};
    
    // If specific surveyor is requested, allow ship_management to see all their surveys
    if (requestedSurveyorId && (req.user.role === 'ship_management' || req.user.role === 'admin' || req.user.role === 'cargo_manager')) {
      query.surveyor = requestedSurveyorId;
      if (requestedStatus) {
        query.status = requestedStatus;
      }
      if (requestedVessel) {
        query.vessel = requestedVessel;
      }
    } else if (req.user.role === 'surveyor') {
      // Surveyors can only see surveys they are assigned to
      query.surveyor = req.user.id;
    } else if (req.user.role === 'owner') {
      // Owners can only see surveys for their vessels
      const ownerVessels = await Vessel.find({ owner: req.user.id }).select('_id');
      const vesselIds = ownerVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    } else if (req.user.role === 'ship_management') {
      // Ship management can see surveys for vessels they manage or own
      // (only applies when NOT requesting a specific surveyor)
      const managedVessels = await Vessel.find({ 
        $or: [
          { shipManagement: req.user.id },
          { owner: req.user.id }
        ]
      }).select('_id');
      const vesselIds = managedVessels.map(vessel => vessel._id);
      query.vessel = { $in: vesselIds };
    }    // Admin and cargo_manager can see all surveys
    
    const surveys = await Survey.find(query)
      .populate('vessel', 'name imoNumber vesselId owner')
      .populate('surveyor', 'name email')
      .populate('requestedBy', 'name email')
      .select('+complianceStatus') // Include complianceStatus in the response
      .sort({ completionDate: -1 })
      .limit(100); // Increased limit for surveyor-specific queries
      
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
      .populate('vessel', 'name imoNumber vesselId')
      .populate('surveyor', 'name email')
      .populate('requestedBy', 'name email');
    
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
      requestedBy: req.user.id
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
// @access  Private (Admin, Surveyor for assigned surveys, Owner/Ship Management for their vessels)
router.delete('/:id', auth, async (req, res) => {
  try {
    let survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ msg: 'Survey not found' });
    }

    // Check if user has permission to delete this survey
    if (req.user.role !== 'admin') {
      if (req.user.role === 'surveyor' && req.user.id !== survey.surveyor.toString()) {
        return res.status(403).json({ msg: 'Not authorized to delete this survey' });
      }
      
      if (req.user.role === 'owner' || req.user.role === 'ship_management') {
        // Handle both cases: when survey.vessel is an ID or an object
        const vesselId = survey.vessel && typeof survey.vessel === 'object' ? survey.vessel._id : survey.vessel;
        const vessel = await Vessel.findById(vesselId);
        if (!vessel) {
          return res.status(404).json({ msg: 'Associated vessel not found' });
        }
        
        if (req.user.role === 'owner' && req.user.id !== vessel.owner.toString()) {
          return res.status(403).json({ msg: 'Not authorized to delete this survey' });
        }
        
        if (req.user.role === 'ship_management' && req.user.id !== vessel.shipManagement?.toString()) {
          return res.status(403).json({ msg: 'Not authorized to delete this survey' });
        }
      }
    }

    // Delete the survey
    await Survey.findByIdAndDelete(req.params.id);
    
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
    console.log('User making request:', req.user);
    
    // First, try to find an existing survey and populate the surveyor field
    let survey = await Survey.findById(req.params.id).populate('surveyor');
    const existingSurvey = survey;
    
    // If no survey exists with this ID, check if it's a booking ID and create or find a survey
    if (!survey) {
      console.log('Survey not found, checking if ID is a booking ID:', req.params.id);
      
      // Try to find a booking with this ID and populate required fields
      const booking = await SurveyorBooking.findById(req.params.id)
        .populate('vessel')
        .populate('surveyor');
      
      if (booking) {
        console.log('Found booking, checking if a survey already exists for this booking');
        
        // Check if a survey already exists for this booking (by vessel, surveyor, surveyType, and inspectionDate)
        survey = await Survey.findOne({
          vessel: booking.vessel?._id || booking.vessel,
          surveyor: booking.surveyor?._id || booking.surveyor,
          surveyType: booking.surveyType,
          scheduledDate: booking.inspectionDate,
          requestedBy: booking.bookedBy
        });
        
        if (survey) {
          console.log('Found existing survey for this booking:', survey._id);
          // Populate the surveyor field if not already populated
          if (!survey.surveyor || !survey.surveyor.name) {
            await survey.populate('surveyor');
          }
        } else {
          console.log('No existing survey found, creating new survey from booking data');
          
          // Create a new survey from booking data
          const surveyData = {
            title: `${booking.surveyType} Survey - ${booking.vessel?.name || booking.vesselName}`,
            vessel: booking.vessel?._id || booking.vessel,
            surveyType: booking.surveyType,
            surveyor: booking.surveyor?._id || booking.surveyor, // Ensure we're using the ID
            requestedBy: booking.bookedBy,
            scheduledDate: booking.inspectionDate,
            status: 'In Progress'
          };
          
          // Create the survey
          const newSurvey = new Survey(surveyData);
          survey = await newSurvey.save();
          // Populate the surveyor field after saving
          await survey.populate('surveyor');
          console.log('Created new survey from booking:', survey._id);
        }
      } else {
        return res.status(404).json({ msg: 'Survey not found' });
      }
    }

    // Check if user has permission to submit report for this survey
    // Allow admin users or the assigned surveyor
    console.log('Checking authorization:');
    console.log('- User role:', req.user.role);
    console.log('- User ID:', req.user.id);
    console.log('- Survey surveyor ID:', survey.surveyor?._id?.toString());
    
    // Ensure we're comparing the right IDs
    const surveyorId = survey.surveyor?._id?.toString() || survey.surveyor?.toString();
    const isAuthorized = req.user.role === 'admin' || 
                         (surveyorId && req.user.id === surveyorId);
                         
    if (!isAuthorized) {
      console.log('Authorization failed');
      return res.status(403).json({ 
        msg: 'Not authorized to submit report for this survey',
        userId: req.user.id,
        surveyorId: surveyorId,
        userRole: req.user.role
      });
    }
    
    console.log('Authorization successful');

    // Update survey with report data
    const {
      hullInspection,
      hullInspectionFindings,
      deckSuperstructure,
      deckSuperstructureFindings,
      machineryEngineRoom,
      machineryEngineRoomFindings,
      electricalSystems,
      electricalSystemsFindings,
      safetyEquipment,
      safetyEquipmentFindings,
      navigationEquipment,
      navigationEquipmentFindings,
      pollutionControlSystems,
      pollutionControlSystemsFindings,
      certificatesVerification,
      certificatesVerificationFindings,
      findings,
      recommendations,
      notes,
      completedAt
    } = req.body;

    // Update component-specific ratings
    survey.hullInspection = hullInspection || 0;
    survey.deckSuperstructure = deckSuperstructure || 0;
    survey.machineryEngineRoom = machineryEngineRoom || 0;
    survey.electricalSystems = electricalSystems || 0;
    survey.safetyEquipment = safetyEquipment || 0;
    survey.navigationEquipment = navigationEquipment || 0;
    survey.pollutionControlSystems = pollutionControlSystems || 0;
    survey.certificatesVerification = certificatesVerification || 0;

    // Build findings array with component-specific findings
    const surveyFindings = [];
    
    // Add component-specific findings if they exist
    if (hullInspectionFindings && hullInspectionFindings.trim()) {
      surveyFindings.push({
        category: 'Structural',
        description: hullInspectionFindings,
        severity: getSeverityFromRating(hullInspection),
        status: 'Open'
      });
    }
    
    if (deckSuperstructureFindings && deckSuperstructureFindings.trim()) {
      surveyFindings.push({
        category: 'Structural',
        description: deckSuperstructureFindings,
        severity: getSeverityFromRating(deckSuperstructure),
        status: 'Open'
      });
    }
    
    if (machineryEngineRoomFindings && machineryEngineRoomFindings.trim()) {
      surveyFindings.push({
        category: 'Machinery',
        description: machineryEngineRoomFindings,
        severity: getSeverityFromRating(machineryEngineRoom),
        status: 'Open'
      });
    }
    
    if (electricalSystemsFindings && electricalSystemsFindings.trim()) {
      surveyFindings.push({
        category: 'Machinery',
        description: electricalSystemsFindings,
        severity: getSeverityFromRating(electricalSystems),
        status: 'Open'
      });
    }
    
    if (safetyEquipmentFindings && safetyEquipmentFindings.trim()) {
      surveyFindings.push({
        category: 'Safety Equipment',
        description: safetyEquipmentFindings,
        severity: getSeverityFromRating(safetyEquipment),
        status: 'Open'
      });
    }
    
    if (navigationEquipmentFindings && navigationEquipmentFindings.trim()) {
      surveyFindings.push({
        category: 'Navigation Equipment',
        description: navigationEquipmentFindings,
        severity: getSeverityFromRating(navigationEquipment),
        status: 'Open'
      });
    }
    
    if (pollutionControlSystemsFindings && pollutionControlSystemsFindings.trim()) {
      surveyFindings.push({
        category: 'Environmental',
        description: pollutionControlSystemsFindings,
        severity: getSeverityFromRating(pollutionControlSystems),
        status: 'Open'
      });
    }
    
    if (certificatesVerificationFindings && certificatesVerificationFindings.trim()) {
      surveyFindings.push({
        category: 'Other',
        description: certificatesVerificationFindings,
        severity: getSeverityFromRating(certificatesVerification),
        status: 'Open'
      });
    }
    
    // Add general findings if they exist
    if (findings && typeof findings === 'string' && findings.trim()) {
      surveyFindings.push({
        category: 'Other',
        description: findings,
        severity: 'Observation',
        status: 'Open'
      });
    } else if (Array.isArray(findings)) {
      surveyFindings.push(...findings);
    }
    
    survey.findings = surveyFindings;
    survey.recommendations = recommendations;
    survey.notes = notes;
    survey.completionDate = completedAt ? new Date(completedAt) : new Date();
    survey.status = 'Completed';
    
    // Process attachments (now empty since we removed multimedia)
    survey.attachments = [];

    console.log('About to save survey with data:', {
      id: survey._id,
      status: survey.status,
      findings: survey.findings?.length,
      vessel: survey.vessel
    });
    
    await survey.save();
    console.log('Survey saved successfully');
    
    // Clear KNN cache for this vessel since we have new survey data
    if (knnCache && survey.vessel) {
      const cacheKey = `vessel_${survey.vessel}`;
      knnCache.delete(cacheKey);
    }

    // Update the associated booking status to 'Completed' if it exists
    try {
      let bookingId = req.params.id;
      
      // If we created a new survey from a booking, the booking ID is still req.params.id
      // If the survey already existed, we still want to update the associated booking
      const booking = await SurveyorBooking.findById(bookingId);
      
      if (booking) {
        // Update booking status to indicate completion
        booking.completedAt = new Date();
        // Note: We'll keep the booking status as 'Accepted' but add completedAt timestamp
        // This allows us to distinguish completed surveys in the frontend
        await booking.save();
        console.log('Updated booking with completion timestamp:', booking._id);
      } else if (survey.scheduledDate) {
        // If we couldn't find by ID, try to find by matching fields (fallback)
        const fallbackBooking = await SurveyorBooking.findOne({
          surveyor: survey.surveyor,
          inspectionDate: survey.scheduledDate,
          vessel: survey.vessel
        });
        
        if (fallbackBooking) {
          fallbackBooking.completedAt = new Date();
          await fallbackBooking.save();
          console.log('Updated booking with completion timestamp (fallback):', fallbackBooking._id);
        }
      }
    } catch (bookingErr) {
      console.error('Error updating booking status:', bookingErr.message);
      // Don't fail the survey submission if booking update fails
    }

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

// @route   PUT api/surveys/:id/compliance
// @desc    Submit compliance data for a specific survey
// @access  Private (Surveyor for assigned surveys)
router.put('/:id/compliance', auth, async (req, res) => {
  try {
    console.log('Received request to submit compliance data for survey ID:', req.params.id);
    
    // First, try to find an existing survey
    let survey = await Survey.findById(req.params.id);
    
    // If no survey exists with this ID, check if it's a booking ID and create or find a survey
    if (!survey) {
      console.log('Survey not found, checking if ID is a booking ID:', req.params.id);
      
      // Try to find a booking with this ID and populate required fields
      const booking = await SurveyorBooking.findById(req.params.id)
        .populate('vessel')
        .populate('surveyor');
      
      if (booking) {
        console.log('Found booking, checking if a survey already exists for this booking');
        
        // Check if a survey already exists for this booking (by vessel, surveyor, surveyType, and inspectionDate)
        survey = await Survey.findOne({
          vessel: booking.vessel?._id || booking.vessel,
          surveyor: booking.surveyor?._id || booking.surveyor,
          surveyType: booking.surveyType,
          scheduledDate: booking.inspectionDate,
          requestedBy: booking.bookedBy
        });
        
        if (survey) {
          console.log('Found existing survey for this booking:', survey._id);
        } else {
          console.log('No existing survey found, creating new survey from booking data');
          
          // Create a new survey from booking data
          const surveyData = {
            title: `${booking.surveyType} Survey - ${booking.vessel?.name || booking.vesselName}`,
            vessel: booking.vessel?._id || booking.vessel,
            surveyType: booking.surveyType,
            surveyor: booking.surveyor?._id || booking.surveyor, // Ensure we're using the ID
            status: 'In Progress',
            inspectionDate: booking.inspectionDate,
            location: booking.location,
            requestedBy: booking.bookedBy,
            createdAt: booking.createdAt,
            updatedAt: new Date(),
            scheduledDate: booking.inspectionDate,
            completionDate: booking.completedAt || null
          };
          
          // Create and save the new survey
          survey = new Survey(surveyData);
          await survey.save();
          
          console.log('Created new survey from booking with ID:', survey._id);
        }
      } else {
        return res.status(404).json({ msg: 'Survey not found. Please create a survey first before submitting compliance data.' });
      }
    }
    
    // Check if user has permission to submit compliance data for this survey
    // Allow admin users or the assigned surveyor
    const isAuthorized = req.user.role === 'admin' || 
                         (survey.surveyor && req.user.id === survey.surveyor.toString());
                         
    if (!isAuthorized) {
      return res.status(403).json({ 
        msg: 'Not authorized to submit compliance data for this survey',
        userId: req.user.id,
        surveyorId: survey.surveyor?.toString(),
        userRole: req.user.role
      });
    }
    
    // Extract compliance data from request body
    const { complianceStatus, submittedAt, submittedBy } = req.body;
    
    // Validate compliance status structure
    if (!complianceStatus) {
      return res.status(400).json({ msg: 'Compliance status is required' });
    }
    
    // Update the survey with compliance data
    survey.complianceStatus = complianceStatus;
    survey.complianceSubmittedAt = submittedAt ? new Date(submittedAt) : new Date();
    survey.complianceSubmittedBy = submittedBy || req.user.id;
    
    // Update survey status to completed
    survey.status = 'Completed';
    if (!survey.completionDate) {
      survey.completionDate = new Date();
    }
    
    // Save the updated survey
    await survey.save();
    
    res.json({ 
      msg: 'Compliance data submitted successfully', 
      survey: {
        id: survey._id,
        complianceStatus: survey.complianceStatus,
        complianceSubmittedAt: survey.complianceSubmittedAt,
        complianceSubmittedBy: survey.complianceSubmittedBy
      }
    });
  } catch (err) {
    console.error('Error in compliance data submission:', err.message);
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

// @route   GET api/surveys/compliance-reports/vessel/:vesselId
// @desc    Get all compliance reports for a specific vessel
// @access  Private (Owner, Ship Management, Admin)
router.get('/compliance-reports/vessel/:vesselId', auth, async (req, res) => {
  try {
    const { vesselId } = req.params;
    
    // Check authorization - only owner of vessel, ship_management, or admin can view
    if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
      // For owners, verify they own the vessel
      if (req.user.role === 'owner') {
        const vessel = await Vessel.findById(vesselId);
        if (!vessel) {
          return res.status(404).json({ msg: 'Vessel not found' });
        }
        if (vessel.owner.toString() !== req.user.id) {
          return res.status(403).json({ msg: 'Not authorized to view compliance reports for this vessel' });
        }
      } else {
        return res.status(403).json({ msg: 'Not authorized to view compliance reports' });
      }
    }

    // Find all surveys with compliance data for this vessel
    const complianceReports = await Survey.find({ 
      vessel: vesselId,
      complianceStatus: { $exists: true, $ne: null }
    })
      .select('surveyType complianceStatus complianceSubmittedAt complianceSubmittedBy status completionDate')
      .populate('surveyor', 'name email')
      .populate('vessel', 'name imo vesselId')
      .sort({ complianceSubmittedAt: -1 });

    // Map to extract overall compliance from each report
    const reports = complianceReports.map(survey => {
      // Determine overall compliance
      let overallCompliance = 'Pending';
      if (survey.complianceStatus) {
        const allStatuses = [];
        
        // Check SOLAS compliance
        if (survey.complianceStatus.solas) {
          Object.values(survey.complianceStatus.solas).forEach(item => {
            if (item.status) allStatuses.push(item.status);
          });
        }
        
        // Check MARPOL compliance
        if (survey.complianceStatus.marpol) {
          Object.values(survey.complianceStatus.marpol).forEach(item => {
            if (item.status) allStatuses.push(item.status);
          });
        }
        
        // Check MLC compliance
        if (survey.complianceStatus.mlc) {
          Object.values(survey.complianceStatus.mlc).forEach(item => {
            if (item.status) allStatuses.push(item.status);
          });
        }
        
        // Determine overall status
        if (allStatuses.includes('Non-Compliant')) {
          overallCompliance = 'Non-Compliant';
        } else if (allStatuses.includes('Partially Compliant')) {
          overallCompliance = 'Partially Compliant';
        } else if (allStatuses.every(s => s === 'Compliant') && allStatuses.length > 0) {
          overallCompliance = 'Compliant';
        }
      }
      
      return {
        _id: survey._id,
        surveyType: survey.surveyType,
        complianceStatus: survey.complianceStatus,
        overallCompliance: overallCompliance,
        complianceSubmittedAt: survey.complianceSubmittedAt,
        status: survey.status,
        completionDate: survey.completionDate
      };
    });

    res.json(reports);
  } catch (err) {
    console.error('Error fetching compliance reports:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;