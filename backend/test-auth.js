const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
const { User } = require('./models');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint to check authentication
app.get('/test-auth', auth, async (req, res) => {
  try {
    console.log('Test auth - User:', req.user);
    res.json({ 
      success: true, 
      message: 'Authentication working',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test endpoint without authentication
app.get('/test-no-auth', (req, res) => {
  res.json({ success: true, message: 'No auth endpoint working' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log('- GET /test-no-auth (no auth required)');
  console.log('- GET /test-auth (auth required)');
});
