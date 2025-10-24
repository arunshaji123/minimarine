const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/user-management/cargo-managers
// @desc    Get all cargo managers
// @access  Private (Admin, Ship Management)
router.get('/cargo-managers', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
      return res.status(403).json({ msg: 'Not authorized to view cargo managers' });
    }

    const cargoManagers = await User.find({ 
      role: 'cargo_manager',
      status: 'active'
    })
    .select('-password -firebaseUid') // Exclude sensitive fields
    .sort({ lastLoginAt: -1, createdAt: -1 });

    res.json(cargoManagers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-management/ship-management-companies
// @desc    Get active/logged-in ship management companies
// @access  Private (Admin, Owner, Ship Management)
router.get('/ship-management-companies', auth, async (req, res) => {
  try {
    // Allow owners, admins, and ship_management to view this list
    if (!req.user || !['admin', 'owner', 'ship_management'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view ship management companies' });
    }

    const companies = await User.find({
      role: 'ship_management',
      status: 'active',
      // Consider "logged in" as having a lastLoginAt value
      lastLoginAt: { $ne: null }
    })
      .select('-password -firebaseUid')
      .sort({ lastLoginAt: -1, createdAt: -1 });

    res.json({ success: true, companies });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-management/surveyors
// @desc    Get all surveyors
// @access  Private (Admin, Ship Management)
router.get('/surveyors', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
      return res.status(403).json({ msg: 'Not authorized to view surveyors' });
    }

    const surveyors = await User.find({ 
      role: 'surveyor',
      status: 'active'
    })
    .select('-password -firebaseUid') // Exclude sensitive fields
    .sort({ lastLoginAt: -1, createdAt: -1 });

    res.json(surveyors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-management/all-users
// @desc    Get all users with their roles and login info
// @access  Private (Admin, Ship Management)
router.get('/all-users', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
      return res.status(403).json({ msg: 'Not authorized to view all users' });
    }

    const users = await User.find({ 
      status: 'active',
      role: { $in: ['cargo_manager', 'surveyor', 'ship_management', 'owner'] }
    })
    .select('-password -firebaseUid') // Exclude sensitive fields
    .sort({ lastLoginAt: -1, createdAt: -1 });

    // Group users by role
    const groupedUsers = {
      cargo_managers: users.filter(user => user.role === 'cargo_manager'),
      surveyors: users.filter(user => user.role === 'surveyor'),
      ship_management: users.filter(user => user.role === 'ship_management'),
      owners: users.filter(user => user.role === 'owner')
    };

    res.json(groupedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/user-management/update-login/:id
// @desc    Update user's last login time
// @access  Public (for login tracking)
router.put('/update-login/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { lastLoginAt: new Date() },
      { new: true }
    ).select('-password -firebaseUid');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-management/stats
// @desc    Get user statistics
// @access  Private (Admin, Ship Management)
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'ship_management') {
      return res.status(403).json({ msg: 'Not authorized to view user statistics' });
    }

    const stats = await User.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          lastLogin: { $max: '$lastLoginAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


