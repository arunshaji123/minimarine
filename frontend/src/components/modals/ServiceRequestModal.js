import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Modal to create or edit a service request by Owner
export default function ServiceRequestModal({ open, onClose, onCreated, onUpdated, vessels: ownerVessels = [], editingRequest = null }) {
  const { user } = useAuth();
  const [vessels, setVessels] = useState([]);
  const [shipCompanies, setShipCompanies] = useState([]);
  const [form, setForm] = useState({ description: '', vesselId: '', shipCompanyId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        setError(null);
        // Use vessels from parent (owner's vessels state)
        setVessels(ownerVessels || []);
        // Load active/logged-in ship management companies for dropdown
        try {
          const res = await axios.get('/user-management/ship-management-companies');
          const companies = res.data?.companies || [];
          setShipCompanies(companies);
        } catch (e) {
          console.error('Failed to load ship management companies:', e);
          // Do not block form if companies fail to load; keep error informational
        }
      } catch (e) {
        console.error('Failed to load predata:', e);
        setError('Failed to load vessels');
      }
    };
    load();
  }, [open, ownerVessels]);

  // Populate form when editing
  useEffect(() => {
    if (editingRequest) {
      setForm({
        description: editingRequest.description || '',
        vesselId: editingRequest.vessel?._id || '',
        shipCompanyId: editingRequest.shipCompany?._id || ''
      });
    } else {
      setForm({ description: '', vesselId: '', shipCompanyId: '' });
    }
  }, [editingRequest]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.description || form.description.trim().length < 10) {
        setError('Description must be at least 10 characters long');
        setLoading(false);
        return;
      }
      if (!form.shipCompanyId) {
        setError('Please select a ship management company');
        setLoading(false);
        return;
      }
      const selectedVessel = vessels.find(v => v._id === form.vesselId);
      const title = `Service request for ${selectedVessel?.name || 'vessel'}`;
      const payload = {
        title,
        description: form.description,
        vesselId: form.vesselId,
        shipCompanyId: form.shipCompanyId,
      };
      console.log('Submitting service request with payload:', payload);
      
      if (editingRequest) {
        // Update existing request
        const res = await axios.put(`/service-requests/${editingRequest._id}`, payload);
        console.log('Service request updated successfully:', res.data);
        onUpdated?.(res.data.request);
      } else {
        // Create new request
        const res = await axios.post('/service-requests', payload);
        console.log('Service request created successfully:', res.data);
        onCreated?.(res.data.request);
      }
      onClose?.();
    } catch (e) {
      console.error('Service request submission error:', e);
      console.error('Error response:', e.response?.data);
      console.error('Error status:', e.response?.status);
      const msg = e.response?.data?.message || e.response?.data?.msg || 'Failed to create service request';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{editingRequest ? 'Edit Service Request' : 'New Service Request'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>
        )}

        {editingRequest && editingRequest.status !== 'pending' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-2 rounded mb-3 text-sm">
            <strong>Note:</strong> Editing this request will reset its status to "Pending" and require the ship management company to review it again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Please provide a detailed description of the service request (minimum 10 characters)"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">{form.description.length}/10 characters minimum</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ship</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.vesselId}
              onChange={(e) => setForm({ ...form, vesselId: e.target.value })}
              required
            >
              <option value="">Select Ship</option>
              {vessels.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ship Management Company</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.shipCompanyId}
              onChange={(e) => setForm({ ...form, shipCompanyId: e.target.value })}
              required
            >
              <option value="">Select ship management company</option>
              {shipCompanies.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
              ))}
            </select>
            {shipCompanies.length === 0 && (
              <p className="mt-1 text-xs text-red-600">No ship management companies available. Please contact an administrator.</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-marine-blue text-white">
              {loading ? 'Submitting...' : (editingRequest ? 'Update Request' : 'Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}