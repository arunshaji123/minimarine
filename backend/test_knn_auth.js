require('dotenv').config();
const mongoose = require('mongoose');
const { Vessel, Survey } = require('./models');

// Simple KNN test without authentication
async function testKNN() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get a vessel with completed surveys
    const vessels = await Vessel.find({}).limit(1);
    if (vessels.length === 0) {
      console.log('No vessels found');
      return;
    }
    
    const vessel = vessels[0];
    console.log('Testing KNN for vessel:', vessel.name);
    
    // Get completed surveys for this vessel
    const vesselSurveys = await Survey.find({ 
      vessel: vessel._id,
      status: 'Completed'
    })
    .sort({ completionDate: -1 })
    .limit(10);
    
    console.log('Found', vesselSurveys.length, 'completed surveys');
    
    if (vesselSurveys.length > 0) {
      console.log('Sample survey component ratings:');
      console.log('- Hull Inspection:', vesselSurveys[0].hullInspection);
      console.log('- Deck Superstructure:', vesselSurveys[0].deckSuperstructure);
      console.log('- Machinery Engine Room:', vesselSurveys[0].machineryEngineRoom);
    }
    
    // Get similar vessels' surveys for comparison
    const similarVesselSurveys = await Survey.find({
      vessel: { $ne: vessel._id },
      surveyType: { $in: vesselSurveys.map(s => s.surveyType) },
      status: 'Completed'
    })
    .populate('vessel')
    .sort({ completionDate: -1 })
    .limit(50);
    
    console.log('Found', similarVesselSurveys.length, 'surveys from similar vessels');
    
    // Simple KNN analysis
    const components = [
      'hullInspection',
      'deckSuperstructure', 
      'machineryEngineRoom',
      'electricalSystems',
      'safetyEquipment',
      'navigationEquipment',
      'pollutionControlSystems',
      'certificatesVerification'
    ];
    
    const predictions = components.map(component => {
      // Calculate current vessel's average rating for this component
      const currentRatings = vesselSurveys
        .map(survey => survey[component])
        .filter(rating => rating !== undefined && rating !== null);
      
      const currentScore = currentRatings.length > 0 
        ? currentRatings.reduce((sum, rating) => sum + rating, 0) / currentRatings.length
        : 0;
        
      console.log(`Component: ${component}, Current Score: ${currentScore}`);
      
      // Get similar vessels' ratings for this component
      const similarScores = similarVesselSurveys
        .map(survey => survey[component])
        .filter(score => score !== undefined && score !== null);
        
      console.log(`Component: ${component}, Similar Scores Count: ${similarScores.length}`);
      
      // Calculate risk score based on current and similar vessel data
      const riskScore = calculateRiskScore(currentScore, similarScores);
      const urgency = determineUrgency(riskScore);
      
      return {
        component,
        currentRating: parseFloat(currentScore.toFixed(2)),
        riskScore: parseFloat(riskScore.toFixed(2)),
        urgency,
        recommendation: generateRecommendation(component, riskScore, urgency)
      };
    });
    
    console.log('KNN Predictions:', predictions);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error testing KNN:', err.message);
  }
}

function calculateRiskScore(currentScore, similarScores) {
  // If no similar data, use a default risk calculation
  if (similarScores.length === 0) {
    // Lower scores = higher risk (1 is worst, 5 is best)
    return (5 - currentScore) * 2;
  }
  
  // Calculate average of similar vessels
  const avgSimilar = similarScores.reduce((a, b) => a + b, 0) / similarScores.length;
  
  // Risk calculation: 
  // - Lower current scores increase risk
  // - Deviation from similar vessels increases risk
  const scoreDifference = Math.abs(currentScore - avgSimilar);
  return (5 - currentScore) * (1 + scoreDifference);
}

function determineUrgency(riskScore) {
  if (riskScore > 8) return 'Critical';
  if (riskScore > 5) return 'High';
  if (riskScore > 3) return 'Medium';
  return 'Low';
}

function generateRecommendation(component, riskScore, urgency) {
  const componentNames = {
    'hullInspection': 'Hull Inspection',
    'deckSuperstructure': 'Deck & Superstructure',
    'machineryEngineRoom': 'Machinery & Engine Room',
    'electricalSystems': 'Electrical Systems',
    'safetyEquipment': 'Safety Equipment',
    'navigationEquipment': 'Navigation Equipment',
    'pollutionControlSystems': 'Pollution Control Systems',
    'certificatesVerification': 'Certificates Verification'
  };
  
  const componentName = componentNames[component] || component;

  if (urgency === 'Critical') {
    return `Immediate inspection and maintenance recommended for ${componentName}. Historical data shows high failure probability within 30 days.`;
  } else if (urgency === 'High') {
    return `Schedule maintenance for ${componentName} within 60 days. Component showing signs of degradation.`;
  } else if (urgency === 'Medium') {
    return `Monitor ${componentName} closely and schedule maintenance within 90 days.`;
  } else {
    return `${componentName} in good condition. Routine inspection recommended.`;
  }
}

testKNN();