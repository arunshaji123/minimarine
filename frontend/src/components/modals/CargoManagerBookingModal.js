import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CargoManagerBookingModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  cargoManagers = [], 
  vessels = [],
  booking = null, // Add booking prop for editing
  fromServiceRequest = false,
  serviceRequestVessel = null
}) => {
  const [formData, setFormData] = useState({
    cargoManagerId: '',
    voyageDate: '',
    voyageTime: '',
    cargoType: '',
    departurePort: '',
    destinationPort: '',
    vesselId: '',
    vesselName: '',
    notes: '',
    specialRequirements: '',
    estimatedDuration: 7,
    cargoWeight: '',
    cargoUnits: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (booking) {
        // Pre-fill form with booking data when editing
        setFormData({
          cargoManagerId: booking.cargoManager?._id || '',
          voyageDate: booking.voyageDate ? new Date(booking.voyageDate).toISOString().split('T')[0] : '',
          voyageTime: booking.voyageTime || '',
          cargoType: booking.cargoType || '',
          departurePort: booking.departurePort || '',
          destinationPort: booking.destinationPort || '',
          vesselId: booking.vesselId || (booking.vessel ? booking.vessel._id : ''),
          vesselName: booking.vesselName || (booking.vessel ? booking.vessel.name : ''),
          notes: booking.notes || '',
          specialRequirements: booking.specialRequirements || '',
          estimatedDuration: booking.estimatedDuration || 7,
          cargoWeight: booking.cargoWeight || '',
          cargoUnits: booking.cargoUnits || ''
        });
      } else if (fromServiceRequest && serviceRequestVessel) {
        // Pre-fill with service request vessel data
        setFormData({
          cargoManagerId: '',
          voyageDate: '',
          voyageTime: '',
          cargoType: '',
          departurePort: '',
          destinationPort: '',
          vesselId: serviceRequestVessel._id,
          vesselName: serviceRequestVessel.name,
          notes: '',
          specialRequirements: '',
          estimatedDuration: 7,
          cargoWeight: '',
          cargoUnits: ''
        });
      } else {
        // Reset form for new booking
        setFormData({
          cargoManagerId: '',
          voyageDate: '',
          voyageTime: '',
          cargoType: '',
          departurePort: '',
          destinationPort: '',
          vesselId: '',
          vesselName: '',
          notes: '',
          specialRequirements: '',
          estimatedDuration: 7,
          cargoWeight: '',
          cargoUnits: ''
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, booking, fromServiceRequest, serviceRequestVessel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'cargoManagerId':
        if (!value) error = 'Please select a cargo manager';
        break;
      case 'voyageDate':
        if (!value) error = 'Voyage date is required';
        else {
          const selectedDate = new Date(value);
          const today = new Date();
          // Set both dates to midnight for date-only comparison
          selectedDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) error = 'Voyage date cannot be in the past';
        }
        break;
      case 'voyageTime':
        if (!value) error = 'Voyage time is required';
        break;
      case 'cargoType':
        if (!value) error = 'Cargo type is required';
        break;
      case 'departurePort':
        if (!value) error = 'Departure port is required';
        break;
      case 'destinationPort':
        if (!value) error = 'Destination port is required';
        break;
      case 'vesselId':
        if (!fromServiceRequest && !value) error = 'Please select a ship';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validate all fields
    const isValid = Object.keys(formData).every(key => validateField(key, formData[key]));
    
    if (isValid) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {fromServiceRequest 
                ? `Booking Cargo Manager for ${serviceRequestVessel?.name || 'Ship'}` 
                : 'Book Cargo Manager'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cargo Manager Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Cargo Manager *</label>
              <select
                name="cargoManagerId"
                value={formData.cargoManagerId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                  touched.cargoManagerId && errors.cargoManagerId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a cargo manager...</option>
                {cargoManagers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
              {touched.cargoManagerId && errors.cargoManagerId && (
                <p className="mt-1 text-sm text-red-600">{errors.cargoManagerId}</p>
              )}
            </div>

            {/* Voyage Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Voyage Date *</label>
                <input
                  type="date"
                  name="voyageDate"
                  value={formData.voyageDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.voyageDate && errors.voyageDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.voyageDate && errors.voyageDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.voyageDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Voyage Time *</label>
                <input
                  type="time"
                  name="voyageTime"
                  value={formData.voyageTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.voyageTime && errors.voyageTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.voyageTime && errors.voyageTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.voyageTime}</p>
                )}
              </div>
            </div>

            {/* Cargo Type and Vessel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Type *</label>
                <select
                  name="cargoType"
                  value={formData.cargoType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.cargoType && errors.cargoType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select cargo type...</option>
                  <option value="Container">Container</option>
                  <option value="Bulk">Bulk</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Break Bulk">Break Bulk</option>
                  <option value="RoRo">RoRo</option>
                  <option value="Other">Other</option>
                </select>
                {touched.cargoType && errors.cargoType && (
                  <p className="mt-1 text-sm text-red-600">{errors.cargoType}</p>
                )}
              </div>
              {!fromServiceRequest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ship *</label>
                  <select
                    name="vesselId"
                    value={formData.vesselId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        setFormData(prev => ({ ...prev, vesselId: '', vesselName: '' }));
                      } else {
                        const v = vessels.find(v => String(v._id) === String(selectedId));
                        setFormData(prev => ({ ...prev, vesselId: selectedId, vesselName: v ? v.name : '' }));
                      }
                      if (errors.vesselId) {
                        setErrors(prev => ({ ...prev, vesselId: '' }));
                      }
                    }}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched.vesselId && errors.vesselId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a ship...</option>
                    {vessels.map(vessel => (
                      <option key={vessel._id} value={vessel._id}>
                        {vessel.name} ({vessel.imo})
                      </option>
                    ))}
                  </select>
                  {touched.vesselId && errors.vesselId && (
                    <p className="mt-1 text-sm text-red-600">{errors.vesselId}</p>
                  )}
                </div>
              )}
            </div>

            {fromServiceRequest && serviceRequestVessel && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Booking for Ship</p>
                    <p className="text-sm text-blue-700">{serviceRequestVessel.name} ({serviceRequestVessel.imo})</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Port *</label>
                <input
                  type="text"
                  name="departurePort"
                  value={formData.departurePort}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., Port of Singapore"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.departurePort && errors.departurePort ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.departurePort && errors.departurePort && (
                  <p className="mt-1 text-sm text-red-600">{errors.departurePort}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination Port *</label>
                <input
                  type="text"
                  name="destinationPort"
                  value={formData.destinationPort}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., Port of Rotterdam"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.destinationPort && errors.destinationPort ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.destinationPort && errors.destinationPort && (
                  <p className="mt-1 text-sm text-red-600">{errors.destinationPort}</p>
                )}
              </div>
            </div>

            {/* Cargo Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Weight (MT)</label>
                <input
                  type="number"
                  name="cargoWeight"
                  value={formData.cargoWeight}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 15000"
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Units</label>
                <input
                  type="number"
                  name="cargoUnits"
                  value={formData.cargoUnits}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 500"
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Duration (days)</label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                />
              </div>
            </div>



            {/* Notes and Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes about the voyage..."
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requirements</label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                rows={3}
                placeholder="Any special requirements or handling instructions..."
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
              >
                Book Cargo Manager
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CargoManagerBookingModal;


