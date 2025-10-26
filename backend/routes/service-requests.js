const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Vessel, User, ServiceRequest } = require('../models');

// Create a new service request (Owner only)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating service request - User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Request body:', req.body);
    
    const { title, description, vesselId, shipCompanyId } = req.body;

    if (!title || !description || !vesselId || !shipCompanyId) {
      console.log('Missing required fields:', { title: !!title, description: !!description, vesselId: !!vesselId, shipCompanyId: !!shipCompanyId });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate actor role
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners can create service requests' });
    }

    // Validate vessel ownership
    console.log('Looking for vessel with ID:', vesselId);
    const vessel = await Vessel.findById(vesselId);
    if (!vessel) {
      console.log('Vessel not found with ID:', vesselId);
      return res.status(404).json({ success: false, message: 'Vessel not found' });
    }
    console.log('Found vessel:', vessel.name, 'Owner:', vessel.owner);
    if (req.user.role !== 'admin' && vessel.owner.toString() !== req.user.id) {
      console.log('Authorization failed - Vessel owner:', vessel.owner.toString(), 'User ID:', req.user.id);
      return res.status(403).json({ success: false, message: 'Not authorized to create request for this vessel' });
    }

    // Validate ship management user
    console.log('Looking for ship company with ID:', shipCompanyId);
    const shipCompany = await User.findById(shipCompanyId);
    if (!shipCompany) {
      console.log('Ship company not found with ID:', shipCompanyId);
      return res.status(400).json({ success: false, message: 'Ship management company not found' });
    }
    if (shipCompany.role !== 'ship_management') {
      console.log('Invalid ship company role:', shipCompany.role, 'Expected: ship_management');
      return res.status(400).json({ success: false, message: 'Invalid ship management company role' });
    }
    console.log('Found ship company:', shipCompany.name);

    const request = await ServiceRequest.create({
      title,
      description,
      vessel: vesselId,
      owner: vessel.owner,
      shipCompany: shipCompanyId,
      status: 'pending'
    });

    const populated = await ServiceRequest.findById(request._id)
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email');

    return res.json({ success: true, message: 'Service request created', request: populated });
  } catch (error) {
    console.error('Create service request error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// List service requests
// - Owners: only their own
// - Ship management: requests assigned to them
// - Admin: all
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'owner') {
      query.owner = req.user.id;
    } else if (req.user.role === 'ship_management') {
      query.shipCompany = req.user.id;
    }

    const requests = await ServiceRequest.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email')
      .populate('decisionBy', 'name email');

    res.json({ success: true, requests });
  } catch (error) {
    console.error('List service requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single request by ID (authorized parties)
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email')
      .populate('decisionBy', 'name email');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Authorization
    if (
      req.user.role !== 'admin' &&
      req.user.id !== request.owner.toString() &&
      req.user.id !== request.shipCompany.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Ship management accepts a request
router.post('/:id/accept', auth, async (req, res) => {
  try {
    console.log('Accept request - User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Request ID:', req.params.id);
    
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      console.log('Role check failed - User role:', req.user.role);
      return res.status(403).json({ success: false, message: 'Only ship management can accept requests' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      console.log('Request not found with ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    console.log('Found request:', request.title, 'Status:', request.status, 'Ship Company:', request.shipCompany);

    if (req.user.role !== 'admin' && request.shipCompany.toString() !== req.user.id) {
      console.log('Authorization failed - Request ship company:', request.shipCompany.toString(), 'User ID:', req.user.id);
      return res.status(403).json({ success: false, message: 'Not authorized to act on this request' });
    }

    if (request.status !== 'pending') {
      console.log('Status check failed - Current status:', request.status);
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'accepted';
    request.decisionBy = req.user.id;
    request.decisionAt = new Date();
    request.decisionNote = req.body.note || '';
    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email')
      .populate('decisionBy', 'name email');

    res.json({ success: true, message: 'Request accepted', request: populated });
  } catch (error) {
    console.error('Accept service request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Ship management declines a request
router.post('/:id/decline', auth, async (req, res) => {
  try {
    console.log('Decline request - User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Request ID:', req.params.id);
    
    if (req.user.role !== 'ship_management' && req.user.role !== 'admin') {
      console.log('Role check failed - User role:', req.user.role);
      return res.status(403).json({ success: false, message: 'Only ship management can decline requests' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      console.log('Request not found with ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    console.log('Found request:', request.title, 'Status:', request.status, 'Ship Company:', request.shipCompany);

    if (req.user.role !== 'admin' && request.shipCompany.toString() !== req.user.id) {
      console.log('Authorization failed - Request ship company:', request.shipCompany.toString(), 'User ID:', req.user.id);
      return res.status(403).json({ success: false, message: 'Not authorized to act on this request' });
    }

    if (request.status !== 'pending') {
      console.log('Status check failed - Current status:', request.status);
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'declined';
    request.decisionBy = req.user.id;
    request.decisionAt = new Date();
    request.decisionNote = req.body.note || '';
    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email')
      .populate('decisionBy', 'name email');

    res.json({ success: true, message: 'Request declined', request: populated });
  } catch (error) {
    console.error('Decline service request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a service request (Owner only, and only if status is pending)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Update request - User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Request ID:', req.params.id);
    console.log('Update data:', req.body);

    const { title, description, vesselId, shipCompanyId } = req.body;

    // Validate actor role
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners can update service requests' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && request.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this request' });
    }

    // Allow updates for all statuses - owners can modify their requests anytime

    // Validate vessel ownership if vesselId is being changed
    if (vesselId && vesselId !== request.vessel.toString()) {
      const vessel = await Vessel.findById(vesselId);
      if (!vessel) {
        return res.status(404).json({ success: false, message: 'Vessel not found' });
      }
      if (req.user.role !== 'admin' && vessel.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to assign this vessel' });
      }
    }

    // Validate ship management company if being changed
    if (shipCompanyId && shipCompanyId !== request.shipCompany.toString()) {
      const shipCompany = await User.findById(shipCompanyId);
      if (!shipCompany || shipCompany.role !== 'ship_management') {
        return res.status(400).json({ success: false, message: 'Invalid ship management company' });
      }
    }

    // Update the request
    if (title) request.title = title;
    if (description) request.description = description;
    if (vesselId) request.vessel = vesselId;
    if (shipCompanyId) request.shipCompany = shipCompanyId;
    
    // Reset status to pending when owner edits - requires ship company to review again
    const previousStatus = request.status;
    request.status = 'pending';
    request.decisionBy = null;
    request.decisionAt = null;
    request.decisionNote = '';
    
    console.log(`Service request ${request._id} status reset from '${previousStatus}' to 'pending' due to owner edit`);
    
    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate({
        path: 'vessel',
        select: 'name imo vesselType media',
        populate: {
          path: 'media',
          select: 'type url fileName fileSize mimeType uploadedAt'
        }
      })
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email')
      .populate('decisionBy', 'name email');

    res.json({ success: true, message: 'Service request updated', request: populated });
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a service request (Owner only, and only if status is pending)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete request - User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Request ID:', req.params.id);

    // Validate actor role
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners can delete service requests' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && request.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }

    // Allow deletion for all statuses - owners can delete their requests anytime

    await ServiceRequest.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Service request deleted' });
  } catch (error) {
    console.error('Delete service request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;