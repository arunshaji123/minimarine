const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const auth = require('../middleware/auth');
const { ShipInvoice, User, Vessel } = require('../models');

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured in .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const router = express.Router();

const generateInvoiceNumber = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${datePart}-${randomPart}`;
};

router.get('/', auth, async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'owner') {
      query.owner = req.user._id;
    } else if (req.user.role === 'surveyor') {
      query.surveyor = req.user._id;
    } else if (req.user.role === 'ship_management') {
      query.shipCompany = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view invoices' });
    }

    const invoices = await ShipInvoice.find(query)
      .populate('shipCompany', 'name email')
      .populate('owner', 'name email')
      .populate('surveyor', 'name email')
      .populate('vessel', 'name vesselId imo')
      .sort({ createdAt: -1 })
      .limit(200);

    if (req.user.role === 'owner') {
      await ShipInvoice.updateMany(
        { owner: req.user._id, status: 'sent' },
        { $set: { status: 'viewed' } }
      );
    }

    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err.message);
    res.status(500).json({ msg: 'Server error while fetching invoices' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!['ship_management', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to create invoices' });
    }

    const {
      ownerId,
      surveyorId,
      vesselId,
      completedShipSurveyCount,
      completedShipSurveyRate,
      completedComplianceSurveyCount,
      completedComplianceSurveyRate,
      managementAmount,
      dueDate,
      notes
    } = req.body;

    if (!ownerId || !surveyorId || !vesselId) {
      return res.status(400).json({ msg: 'ownerId, surveyorId and vesselId are required' });
    }

    const owner = await User.findById(ownerId).select('_id role name');
    if (!owner || !['owner', 'ship_management'].includes(owner.role)) {
      return res.status(404).json({ msg: 'Owner not found' });
    }

    const surveyor = await User.findById(surveyorId).select('_id role name');
    if (!surveyor || surveyor.role !== 'surveyor') {
      return res.status(404).json({ msg: 'Surveyor not found' });
    }

    const vessel = await Vessel.findById(vesselId).select('_id name owner shipManagement');
    if (!vessel) {
      return res.status(404).json({ msg: 'Vessel not found' });
    }

    const shipSurveyCount = Math.max(0, Number(completedShipSurveyCount) || 0);
    const shipSurveyRate = Math.max(0, Number(completedShipSurveyRate) || 0);
    const complianceSurveyCount = Math.max(0, Number(completedComplianceSurveyCount) || 0);
    const complianceSurveyRate = Math.max(0, Number(completedComplianceSurveyRate) || 0);
    const managementCharge = Math.max(0, Number(managementAmount) || 0);

    const shipSurveyAmount = shipSurveyCount * shipSurveyRate;
    const complianceSurveyAmount = complianceSurveyCount * complianceSurveyRate;
    const subtotalAmount = shipSurveyAmount + complianceSurveyAmount + managementCharge;
    const taxAmount = 0;
    const totalAmount = subtotalAmount + taxAmount;

    if (totalAmount <= 0) {
      return res.status(400).json({ msg: 'Total invoice amount must be greater than 0' });
    }

    let invoiceNumber = generateInvoiceNumber();
    let exists = await ShipInvoice.findOne({ invoiceNumber }).select('_id');
    while (exists) {
      invoiceNumber = generateInvoiceNumber();
      exists = await ShipInvoice.findOne({ invoiceNumber }).select('_id');
    }

    const created = await ShipInvoice.create({
      invoiceNumber,
      shipCompany: req.user._id,
      owner: owner._id,
      surveyor: surveyor._id,
      vessel: vessel._id,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      completedShipSurveyCount: shipSurveyCount,
      completedShipSurveyRate: shipSurveyRate,
      completedShipSurveyAmount: shipSurveyAmount,
      completedComplianceSurveyCount: complianceSurveyCount,
      completedComplianceSurveyRate: complianceSurveyRate,
      completedComplianceSurveyAmount: complianceSurveyAmount,
      managementAmount: managementCharge,
      subtotalAmount,
      taxAmount,
      totalAmount,
      currency: 'INR',
      notes: notes || '',
      status: 'sent'
    });

    const populated = await ShipInvoice.findById(created._id)
      .populate('shipCompany', 'name email')
      .populate('owner', 'name email')
      .populate('surveyor', 'name email')
      .populate('vessel', 'name vesselId imo');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creating invoice:', err.message);
    res.status(500).json({ msg: 'Server error while creating invoice' });
  }
});

// POST /api/invoices/:id/create-order — owner initiates Razorpay payment for an invoice
router.post('/:id/create-order', auth, async (req, res) => {
  try {
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to pay invoices' });
    }

    const invoice = await ShipInvoice.findById(req.params.id)
      .populate('shipCompany', 'name email')
      .populate('owner', 'name email');
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

    if (req.user.role === 'owner' && invoice.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to pay this invoice' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ msg: 'Invoice is already paid' });
    }

    const amount = Number(invoice.totalAmount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid invoice amount' });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `inv_${String(invoice._id).slice(-8)}_${Date.now()}`,
      notes: {
        invoiceId: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber
      }
    });

    // Store the order ID on the invoice
    invoice.razorpayOrderId = order.id;
    await invoice.save();

    res.json({
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        shipCompanyName: invoice.shipCompany?.name || 'Ship Management',
        ownerName: invoice.owner?.name || 'Owner',
        ownerEmail: invoice.owner?.email || ''
      }
    });
  } catch (err) {
    console.error('Error creating invoice Razorpay order:', err.message);
    res.status(500).json({ msg: err.message || 'Server error while creating payment order' });
  }
});

// POST /api/invoices/:id/verify-payment — verify Razorpay signature and mark invoice as paid
router.post('/:id/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: 'Missing Razorpay payment verification fields' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ msg: 'Razorpay secret not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: 'Invalid payment signature — payment verification failed' });
    }

    const invoice = await ShipInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

    invoice.status = 'paid';
    invoice.razorpayOrderId = razorpay_order_id;
    invoice.razorpayPaymentId = razorpay_payment_id;
    invoice.paidAt = new Date();
    await invoice.save();

    res.json({ success: true, status: 'paid', paidAt: invoice.paidAt });
  } catch (err) {
    console.error('Error verifying invoice payment:', err.message);
    res.status(500).json({ msg: 'Server error while verifying payment' });
  }
});

module.exports = router;
