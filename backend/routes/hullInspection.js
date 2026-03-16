const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const auth = require('../middleware/auth');

// Use memory storage - no files saved to disk
const upload = multer({ storage: multer.memoryStorage() });

const AI_SERVICE_URL = process.env.HULL_AI_SERVICE_URL || 'http://localhost:8000';

// @route   POST /api/hull-inspection/detect
// @desc    Forward image to YOLOv8 AI service and return results
// @access  Private (Surveyor)
router.post('/detect', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    console.log(`🔍 Hull inspection request: ${req.file.originalname} (${req.file.size} bytes)`);

    // Forward image to the Python FastAPI AI service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const result = aiResponse.data;
    console.log(`✅ Hull inspection complete: ${result.total_detections} defects detected`);

    res.json(result);

  } catch (err) {
    console.error('❌ Hull inspection error:', err.message);

    // Handle AI service not running
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not running. Please start the hull inspection AI service on port 8000.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Hull inspection failed: ' + err.message
    });
  }
});

// @route   GET /api/hull-inspection/status
// @desc    Check if AI service is running
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/`, { timeout: 5000 });
    res.json({ online: true, ...response.data });
  } catch (err) {
    res.json({ online: false, message: 'AI service offline' });
  }
});

module.exports = router;
