const mongoose = require('mongoose');
require('dotenv').config();

async function checkContainersSurvey() {
  console.log('🔍 CHECKING CONTAINERS VESSEL SURVEY DATA\n');
  console.log('='.repeat(70));
  
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Survey = require('./models/Survey');
  const Vessel = require('./models/Vessel');
  
  // Find containers vessel
  const vessel = await Vessel.findOne({ name: /containers/i });
  
  if (!vessel) {
    console.log('❌ Containers vessel not found');
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log(`\n✅ Found vessel: ${vessel.name}`);
  console.log(`   ID: ${vessel._id}`);
  console.log(`   Owner: ${vessel.owner}`);
  
  // Get all surveys for this vessel
  const surveys = await Survey.find({ vessel: vessel._id }).sort({ createdAt: -1 });
  
  console.log(`\n📋 Total surveys: ${surveys.length}`);
  console.log('='.repeat(70));
  
  if (surveys.length === 0) {
    console.log('\n❌ NO SURVEYS FOUND for containers vessel');
    console.log('   This means predictions CANNOT be based on real data!');
    await mongoose.disconnect();
    process.exit(0);
  }
  
  // Analyze each survey
  surveys.forEach((survey, index) => {
    console.log(`\n📊 SURVEY ${index + 1}:`);
    console.log('-'.repeat(70));
    console.log(`Title: ${survey.title || 'Untitled'}`);
    console.log(`Status: ${survey.status}`);
    console.log(`Created: ${survey.createdAt || 'Unknown'}`);
    console.log(`Completed: ${survey.completedAt || 'Not completed'}`);
    
    console.log('\n🔢 COMPONENT RATINGS:');
    const components = [
      { name: 'Hull Inspection', field: 'hullInspection' },
      { name: 'Deck/Superstructure', field: 'deckSuperstructure' },
      { name: 'Machinery/Engine', field: 'machineryEngineRoom' },
      { name: 'Electrical Systems', field: 'electricalSystems' },
      { name: 'Safety Equipment', field: 'safetyEquipment' },
      { name: 'Navigation Equipment', field: 'navigationEquipment' },
      { name: 'Pollution Control', field: 'pollutionControlSystems' },
      { name: 'Certificates/Docs', field: 'certificatesDocumentation' }
    ];
    
    let hasAnyRating = false;
    let missingRatings = [];
    
    components.forEach(comp => {
      const value = survey[comp.field];
      if (value !== undefined && value !== null) {
        console.log(`   ${comp.name.padEnd(25)} = ${value}`);
        hasAnyRating = true;
      } else {
        console.log(`   ${comp.name.padEnd(25)} = ❌ MISSING/NULL`);
        missingRatings.push(comp.name);
      }
    });
    
    if (!hasAnyRating) {
      console.log('\n⚠️  WARNING: NO RATINGS PROVIDED in this survey!');
    }
    
    if (missingRatings.length > 0) {
      console.log(`\n⚠️  Missing ratings: ${missingRatings.length}/${components.length}`);
    }
    
    console.log('\n📝 FINDINGS/DESCRIPTIONS:');
    console.log(`   General findings: ${survey.findings || '❌ None'}`);
    console.log(`   Hull findings: ${survey.hullInspectionFindings || '❌ None'}`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('🤖 ML PREDICTION BEHAVIOR:\n');
  
  const completedSurveys = surveys.filter(s => s.status === 'Completed');
  
  if (completedSurveys.length === 0) {
    console.log('❌ NO COMPLETED SURVEYS');
    console.log('   Prediction should return: "No data available"');
  } else {
    console.log(`✅ ${completedSurveys.length} completed survey(s) found`);
    
    const hasRatings = completedSurveys.some(s => 
      s.hullInspection !== undefined || 
      s.deckSuperstructure !== undefined ||
      s.machineryEngineRoom !== undefined
    );
    
    if (!hasRatings) {
      console.log('\n⚠️  CRITICAL FINDING:');
      console.log('   Surveys exist but have NO RATINGS!');
      console.log('\n🎯 HOW ML HANDLES THIS:');
      console.log('   1. Python script reads survey documents');
      console.log('   2. Finds NULL/undefined for all ratings');
      console.log('   3. Uses DEFAULT VALUE = 3.0 for missing ratings');
      console.log('   4. Generates predictions using these DEFAULT values');
      console.log('\n❌ RESULT: Predictions are NOT based on your actual survey!');
      console.log('   They are FAKE - using assumed average ratings (3.0/5.0)');
    } else {
      console.log('✅ Ratings provided - predictions are REAL');
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('💡 RECOMMENDATION:\n');
  console.log('When surveyor completes a survey, they MUST provide:');
  console.log('  1. Component ratings (1-5 stars) for each component');
  console.log('  2. Text descriptions of findings');
  console.log('  3. Mark survey as "Completed"');
  console.log('\nWithout ratings, ML uses default 3.0 = FAKE predictions!');
  
  await mongoose.disconnect();
  process.exit(0);
}

checkContainersSurvey().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
