const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { CustomReport } = require('../models');

router.get('/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    if (!['premium', 'hull-inspection'].includes(type)) {
      return res.status(400).json({ msg: 'Invalid report type' });
    }

    const reports = await CustomReport.find({
      user: req.user._id,
      type
    }).sort({ createdAt: -1 }).limit(100).lean();

    const normalized = reports.map((doc) => ({
      ...doc.payload,
      _id: doc._id,
      persistedType: doc.type,
      persistedAt: doc.createdAt
    }));

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching custom reports:', err);
    res.status(500).json({ msg: 'Server error fetching reports' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ msg: 'type and payload are required' });
    }

    if (!['premium', 'hull-inspection'].includes(type)) {
      return res.status(400).json({ msg: 'Invalid report type' });
    }

    const created = await CustomReport.create({
      type,
      user: req.user._id,
      payload
    });

    res.status(201).json({
      ...created.payload,
      _id: created._id,
      persistedType: created.type,
      persistedAt: created.createdAt
    });
  } catch (err) {
    console.error('Error saving custom report:', err);
    res.status(500).json({ msg: 'Server error saving report' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await CustomReport.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    await report.deleteOne();
    res.json({ msg: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting custom report:', err);
    res.status(500).json({ msg: 'Server error deleting report' });
  }
});

module.exports = router;
