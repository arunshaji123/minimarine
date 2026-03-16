const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const auth = require('../middleware/auth');
const { SurveyorPayment, Survey, Vessel, User } = require('../models');

const router = express.Router();

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

router.get('/config', auth, async (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || ''
  });
});

router.get('/history', auth, async (req, res) => {
  try {
    if (!['ship_management', 'admin', 'owner', 'surveyor'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view payment history' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const query = { status: 'paid' };

    if (req.user.role === 'surveyor') {
      query.surveyor = req.user._id;
    } else if (req.user.role !== 'admin') {
      query.payer = req.user._id;
    }

    const payments = await SurveyorPayment.find(query)
      .populate('payer', 'name email')
      .populate('surveyor', 'name email')
      .populate('vessel', 'name vesselId imo')
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(limit)
      .select('payer surveyor vessel amount currency paidAt razorpayPaymentId razorpayOrderId createdAt');

    res.json({
      count: payments.length,
      payments
    });
  } catch (err) {
    console.error('Error fetching completed payment history:', err.message);
    res.status(500).json({ msg: 'Server error while fetching payment history' });
  }
});

router.get('/history/surveyor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'surveyor') {
      return res.status(403).json({ msg: 'Only surveyors can view surveyor payment receipts' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 300);

    const payments = await SurveyorPayment.find({
      status: 'paid',
      surveyor: req.user._id
    })
      .populate('payer', 'name email role')
      .populate('vessel', 'name vesselId imo')
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(limit)
      .select('payer vessel amount currency paidAt razorpayPaymentId razorpayOrderId createdAt');

    res.json({
      count: payments.length,
      payments
    });
  } catch (err) {
    console.error('Error fetching surveyor payment receipts:', err.message);
    res.status(500).json({ msg: 'Server error while fetching surveyor payment receipts' });
  }
});

router.get('/status/:vesselId', auth, async (req, res) => {
  try {
    if (!['ship_management', 'admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view surveyor payment status' });
    }

    const { vesselId } = req.params;
    if (!vesselId) {
      return res.status(400).json({ msg: 'vesselId is required' });
    }

    const payments = await SurveyorPayment.find({
      vessel: vesselId,
      status: 'paid'
    })
      .select('surveyor paidAt amount currency createdAt')
      .sort({ paidAt: -1, createdAt: -1 });

    const latestBySurveyor = new Map();
    payments.forEach((payment) => {
      const surveyorId = String(payment.surveyor);
      if (!latestBySurveyor.has(surveyorId)) {
        latestBySurveyor.set(surveyorId, {
          surveyorId,
          paidAt: payment.paidAt,
          amount: payment.amount,
          currency: payment.currency
        });
      }
    });

    const paymentStatuses = Array.from(latestBySurveyor.values());

    res.json({
      paidSurveyorIds: paymentStatuses.map((item) => item.surveyorId),
      paymentStatuses
    });
  } catch (err) {
    console.error('Error fetching surveyor payment statuses:', err.message);
    res.status(500).json({ msg: 'Server error while fetching surveyor payment statuses' });
  }
});

router.post('/create-order', auth, async (req, res) => {
  try {
    if (!['ship_management', 'admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to create surveyor payments' });
    }

    const { vesselId, surveyorId, surveyId, amount } = req.body;

    if (!vesselId || !surveyorId || !amount) {
      return res.status(400).json({ msg: 'vesselId, surveyorId and amount are required' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }

    const vessel = await Vessel.findById(vesselId).select('_id');
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }

    const surveyor = await User.findById(surveyorId).select('_id role name');
    if (!surveyor || surveyor.role !== 'surveyor') {
      return res.status(404).json({ msg: 'Surveyor not found' });
    }

    let linkedSurvey = null;
    if (surveyId) {
      linkedSurvey = await Survey.findById(surveyId).select('_id surveyor vessel');
      if (!linkedSurvey) {
        return res.status(404).json({ msg: 'Survey not found' });
      }
      if (linkedSurvey.surveyor.toString() !== surveyorId) {
        return res.status(400).json({ msg: 'Survey does not belong to this surveyor' });
      }
      if (linkedSurvey.vessel.toString() !== vesselId) {
        return res.status(400).json({ msg: 'Survey does not belong to this vessel' });
      }
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency: 'INR',
      receipt: `v${String(vesselId).slice(-6)}_s${String(surveyorId).slice(-6)}_${Date.now()}`,
      notes: {
        vesselId: String(vesselId),
        surveyorId: String(surveyorId),
        surveyId: surveyId ? String(surveyId) : ''
      }
    });

    const payment = await SurveyorPayment.create({
      payer: req.user._id,
      surveyor: surveyorId,
      vessel: vesselId,
      survey: linkedSurvey?._id,
      amount: numericAmount,
      currency: 'INR',
      status: 'created',
      razorpayOrderId: order.id
    });

    res.json({
      order,
      paymentId: payment._id
    });
  } catch (err) {
    const razorpayError = err.error || err.response?.data || err.message;
    console.error('Error creating payment order:', razorpayError);
    const clientMsg = (err.error?.description) || (typeof razorpayError === 'string' ? razorpayError : 'Server error while creating payment order');
    res.status(500).json({ msg: clientMsg });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: 'Missing Razorpay payment verification fields' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ msg: 'Razorpay secret is not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      const failedPayment = await SurveyorPayment.findOne({ razorpayOrderId: razorpay_order_id });
      if (failedPayment) {
        failedPayment.status = 'failed';
        await failedPayment.save();
      }
      return res.status(400).json({ msg: 'Invalid payment signature' });
    }

    const payment = await SurveyorPayment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ msg: 'Payment order not found' });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        paidAt: payment.paidAt,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (err) {
    console.error('Error verifying payment:', err.message);
    res.status(500).json({ msg: 'Server error while verifying payment' });
  }
});

module.exports = router;