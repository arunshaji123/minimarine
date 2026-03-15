const express = require('express');
const router = express.Router();
const { Survey, Vessel } = require('../models');
const auth = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');

// Simple in-memory cache for KNN predictions
const knnCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// @route   GET api/knn/predictions/:vesselId
// @desc    Get ML-based maintenance predictions for a vessel using Python model
// @access  Private (Owner, Ship Management, Surveyor, Admin)
router.get('/predictions/:vesselId', auth, async (req, res) => {
  try {
    // Check cache first
    const cacheKey = `vessel_${req.params.vesselId}`;
    const cachedResult = knnCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return res.json(cachedResult.data);
    }

    // Allow owners, ship_management, surveyors, and admins to access predictions
    const allowedRoles = ['owner', 'ship_management', 'surveyor', 'admin', 'cargo_manager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view predictions' });
    }

    // Verify vessel access based on role
    const vessel = await Vessel.findById(req.params.vesselId);
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }
    
    // For owners, verify they own the vessel
    if (req.user.role === 'owner') {
      if (vessel.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to view predictions for this vessel' });
      }
    }
    
    // For ship_management, verify they manage the vessel (or it's accessible through surveys)
    // Ship management can view predictions for any vessel their surveyors have inspected
    // No strict ownership check needed as they should see predictive maintenance for oversight
    
    // For surveyors, they can view predictions for vessels they've inspected
    // This will be handled by checking if they have completed surveys for the vessel
    if (req.user.role === 'surveyor') {
      const surveyCount = await Survey.countDocuments({
        vessel: req.params.vesselId,
        surveyor: req.user.id,
        status: 'Completed'
      });
      
      if (surveyCount === 0) {
        return res.status(403).json({ msg: 'Not authorized to view predictions for this vessel. You must have completed at least one survey for this vessel.' });
      }
    }

    // Call Python ML prediction script
    const pythonScript = path.join(__dirname, '..', 'ml', 'predict.py');
    const vesselId = req.params.vesselId;
    
    console.log(`Running ML prediction for vessel: ${vesselId}`);
    
    const pythonProcess = spawn('python', [pythonScript, '--vesselId', vesselId]);
    
    let dataString = '';
    let errorString = '';
    
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python prediction error:', errorString);
        
        // If Python script fails, fall back to simple KNN
        console.log('Falling back to simple KNN algorithm');
        fallbackToSimpleKNN(req.params.vesselId, req.user)
          .then(result => {
            knnCache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
            res.json(result);
          })
          .catch(err => {
            console.error('Fallback error:', err);
            res.status(500).json({ 
              error: 'prediction_failed', 
              message: 'Failed to generate predictions',
              detail: errorString 
            });
          });
        return;
      }
      
      try {
        const result = JSON.parse(dataString);
        
        // Check for error in response
        if (result.error) {
          console.error('Prediction error:', result.error);
          
          // Fall back to simple KNN
          fallbackToSimpleKNN(req.params.vesselId, req.user)
            .then(fallbackResult => {
              knnCache.set(cacheKey, {
                data: fallbackResult,
                timestamp: Date.now()
              });
              res.json(fallbackResult);
            })
            .catch(err => {
              console.error('Fallback error:', err);
              res.status(500).json({ 
                error: 'prediction_failed', 
                message: result.error 
              });
            });
          return;
        }
        
        // Cache and return successful result
        knnCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        res.json(result);
      } catch (parseError) {
        console.error('Failed to parse prediction result:', parseError);
        console.error('Raw output:', dataString);
        res.status(500).json({ 
          error: 'parse_error', 
          message: 'Failed to parse prediction result',
          detail: parseError.message
        });
      }
    });
    
  } catch (err) {
    console.error('Prediction route error:', err.message);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// Fallback function using simple KNN when Python model is unavailable
async function fallbackToSimpleKNN(vesselId, user) {
  const vesselSurveys = await Survey.find({ 
    vessel: vesselId,
    status: 'Completed'
  })
  .sort({ completionDate: -1 })
  .limit(5);

  if (vesselSurveys.length === 0) {
    const vessel = await Vessel.findById(vesselId);
    return {
      vessel: {
        id: vessel._id,
        name: vessel.name,
        imoNumber: vessel.imoNumber
      },
      message: 'No completed surveys available for predictions',
      predictions: [],
      usingFallback: true
    };
  }

  const vessel = await Vessel.findById(vesselId);
  const similarVesselSurveys = await Survey.find({
    vessel: { $ne: vesselId },
    surveyType: { $in: vesselSurveys.map(s => s.surveyType) },
    status: 'Completed'
  })
  .select('vessel hullInspection deckSuperstructure machineryEngineRoom electricalSystems safetyEquipment navigationEquipment pollutionControlSystems certificatesVerification')
  .sort({ completionDate: -1 })
  .limit(20);

  const predictions = performKNNAnalysis(vesselSurveys, similarVesselSurveys, vessel);
  
  return {
    vessel: {
      id: vessel._id,
      name: vessel.name,
      imoNumber: vessel.imoNumber
    },
    predictions,
    usingFallback: true,
    message: 'Using fallback prediction algorithm (ML model not available)'
  };
}

// Simple KNN implementation
function performKNNAnalysis(currentVesselSurveys, similarVesselSurveys, currentVessel) {
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
    const currentRatings = currentVesselSurveys
      .map(survey => survey[component])
      .filter(rating => rating !== undefined && rating !== null);
    
    const currentScore = currentRatings.length > 0 
      ? currentRatings.reduce((sum, rating) => sum + rating, 0) / currentRatings.length
      : 0;

    // Get similar vessels' ratings for this component
    const similarScores = similarVesselSurveys
      .map(survey => survey[component])
      .filter(score => score !== undefined && score !== null);

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

  return predictions.sort((a, b) => b.riskScore - a.riskScore);
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

// @route   GET api/knn/predictions
// @desc    Get KNN-based maintenance predictions for all owner's vessels
// @access  Private (Owner)
router.get('/predictions', auth, async (req, res) => {
  try {
    // Only owners can access predictions for all their vessels
    if (req.user.role !== 'owner') {
      return res.status(403).json({ msg: 'Not authorized to view predictions' });
    }

    // Get all vessels owned by this user
    const ownerVessels = await Vessel.find({ owner: req.user.id });
    
    if (ownerVessels.length === 0) {
      return res.json({
        message: 'No vessels found',
        predictions: []
      });
    }

    const allPredictions = [];

    // Get predictions for each vessel
    for (const vessel of ownerVessels) {
      const vesselSurveys = await Survey.find({ 
        vessel: vessel._id,
        status: 'Completed'
      })
      .sort({ completionDate: -1 })
      .limit(5); // Reduced from 10 to 5 for better performance

      if (vesselSurveys.length > 0) {
        // Get similar vessels' surveys for comparison
        const similarVesselSurveys = await Survey.find({
          vessel: { $ne: vessel._id },
          surveyType: { $in: vesselSurveys.map(s => s.surveyType) },
          status: 'Completed'
        })
        .select('vessel hullInspection deckSuperstructure machineryEngineRoom electricalSystems safetyEquipment navigationEquipment pollutionControlSystems certificatesVerification') // Only select needed fields
        .sort({ completionDate: -1 })
        .limit(20); // Reduced from 50 to 20 for better performance

        // KNN algorithm implementation
        const predictions = performKNNAnalysis(vesselSurveys, similarVesselSurveys, vessel);
        
        allPredictions.push({
          vessel: {
            id: vessel._id,
            name: vessel.name,
            imoNumber: vessel.imoNumber
          },
          predictions: predictions.sort((a, b) => b.riskScore - a.riskScore)
        });
      }
    }
    
    res.json({
      predictions: allPredictions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
module.exports.knnCache = knnCache; // Export the cache for use in other routes
