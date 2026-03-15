const mongoose = require('mongoose');
require('dotenv').config();

async function diagnoseSurveyError() {
  console.log('🔍 DIAGNOSING SURVEY SUBMISSION ERROR\n');
  console.log('='.repeat(70));
  
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Survey = require('./models/Survey');
  const Vessel = require('./models/Vessel');
  const SurveyorBooking = require('./models/SurveyorBooking');
  const User = require('./models/User'); // Load User model
  
  // Get the booking ID from the error
  const bookingId = '6967bb092e614734fbbe40e2';
  
  console.log(`\n📋 CHECKING BOOKING: ${bookingId}`);
  console.log('-'.repeat(70));
  
  const booking = await SurveyorBooking.findById(bookingId)
    .populate('vessel')
    .populate('surveyor')
    .populate('bookedBy');
  
  if (!booking) {
    console.log('❌ Booking not found!');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log('✅ Booking found:');
  console.log(`   Type: ${booking.surveyType}`);
  console.log(`   Vessel: ${booking.vessel?.name || 'Unknown'} (${booking.vessel?._id})`);
  console.log(`   Surveyor: ${booking.surveyor?.name || 'Unknown'} (${booking.surveyor?._id})`);
  console.log(`   Booked By: ${booking.bookedBy?.name || 'Unknown'}`);
  console.log(`   Inspection Date: ${booking.inspectionDate}`);
  console.log(`   Status: ${booking.status}`);
  
  // Check for existing surveys for this vessel
  console.log('\n🔍 CHECKING EXISTING SURVEYS FOR THIS VESSEL:');
  console.log('-'.repeat(70));
  
  const existingSurveys = await Survey.find({ 
    vessel: booking.vessel._id 
  }).sort({ createdAt: -1 });
  
  console.log(`Found ${existingSurveys.length} existing surveys for this vessel:\n`);
  
  existingSurveys.forEach((s, idx) => {
    console.log(`Survey ${idx + 1}:`);
    console.log(`   ID: ${s._id}`);
    console.log(`   Type: ${s.surveyType}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Created: ${s.createdAt}`);
    console.log(`   Surveyor: ${s.surveyor}`);
    console.log(`   Scheduled: ${s.scheduledDate}`);
    console.log('');
  });
  
  // Check if a survey already exists for this specific booking
  console.log('\n🔍 CHECKING FOR DUPLICATE SURVEY:');
  console.log('-'.repeat(70));
  
  const duplicateSurvey = await Survey.findOne({
    vessel: booking.vessel._id,
    surveyor: booking.surveyor._id,
    surveyType: booking.surveyType,
    scheduledDate: booking.inspectionDate,
    requestedBy: booking.bookedBy._id
  });
  
  if (duplicateSurvey) {
    console.log('⚠️  DUPLICATE FOUND! A survey already exists for this booking:');
    console.log(`   Survey ID: ${duplicateSurvey._id}`);
    console.log(`   Status: ${duplicateSurvey.status}`);
    console.log(`   Created: ${duplicateSurvey.createdAt}`);
    
    if (duplicateSurvey.status === 'Completed') {
      console.log('\n❌ PROBLEM: Survey is already completed!');
      console.log('   This booking should not allow resubmission.');
    } else {
      console.log('\n✅ Survey exists but not completed - can be updated');
    }
  } else {
    console.log('✅ No duplicate - safe to create new survey');
  }
  
  // Try to simulate creating the survey data
  console.log('\n🧪 SIMULATING SURVEY CREATION:');
  console.log('-'.repeat(70));
  
  const testSurveyData = {
    title: `${booking.surveyType} Survey - ${booking.vessel?.name || booking.vesselName}`,
    vessel: booking.vessel._id,
    surveyType: booking.surveyType,
    surveyor: booking.surveyor._id,
    requestedBy: booking.bookedBy._id,
    scheduledDate: booking.inspectionDate,
    status: 'In Progress',
    
    // Simulate submitted data
    hullInspection: 0,
    deckSuperstructure: 0,
    machineryEngineRoom: 0,
    electricalSystems: 0,
    safetyEquipment: 0,
    navigationEquipment: 0,
    pollutionControlSystems: 0,
    certificatesVerification: 0,
    
    findings: [],
    completionDate: new Date()
  };
  
  console.log('Test survey data:', JSON.stringify(testSurveyData, null, 2));
  
  try {
    // Validate without saving
    const testSurvey = new Survey(testSurveyData);
    await testSurvey.validate();
    console.log('\n✅ Survey data validation PASSED');
  } catch (validationError) {
    console.log('\n❌ VALIDATION ERROR FOUND!');
    console.log('Error:', validationError.message);
    console.log('\nValidation errors:');
    if (validationError.errors) {
      Object.keys(validationError.errors).forEach(key => {
        console.log(`   ${key}: ${validationError.errors[key].message}`);
      });
    }
  }
  
  // Check vessel data integrity
  console.log('\n🚢 CHECKING VESSEL DATA:');
  console.log('-'.repeat(70));
  
  const vessel = booking.vessel;
  const requiredFields = ['vesselId', 'name', 'imo', 'vesselType', 'flag', 'yearBuilt', 'grossTonnage', 'owner'];
  
  let missingFields = [];
  requiredFields.forEach(field => {
    if (!vessel[field] || vessel[field] === '') {
      console.log(`   ❌ ${field}: MISSING`);
      missingFields.push(field);
    } else {
      console.log(`   ✅ ${field}: ${vessel[field]}`);
    }
  });
  
  if (missingFields.length > 0) {
    console.log(`\n⚠️  WARNING: Vessel missing fields: ${missingFields.join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📝 DIAGNOSIS SUMMARY:\n');
  
  if (duplicateSurvey && duplicateSurvey.status === 'Completed') {
    console.log('❌ ISSUE: Trying to resubmit an already completed survey');
    console.log('\nSOLUTION: The frontend should:');
    console.log('  1. Check if survey is already completed before allowing submission');
    console.log('  2. Or use the existing survey ID instead of creating new one');
  } else if (missingFields.length > 0) {
    console.log('❌ ISSUE: Vessel has missing required fields');
    console.log(`\nMissing: ${missingFields.join(', ')}`);
    console.log('\nSOLUTION: Fix vessel data first');
  } else {
    console.log('✅ Data looks valid');
    console.log('\nCheck backend console logs when submitting for the actual error');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

diagnoseSurveyError().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
