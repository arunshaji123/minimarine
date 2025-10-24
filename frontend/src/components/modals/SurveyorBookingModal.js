import React, { useState, useEffect } from 'react';

const SurveyorBookingModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  surveyors = [], 
  vessels = [],
  booking = null
}) => {
  const [formData, setFormData] = useState({
    surveyorId: '',
    inspectionDate: '',
    inspectionTime: '',
    surveyType: '',
    location: '',
    vesselId: '',
    vesselName: '',
    notes: '',
    specialRequirements: '',
    estimatedDuration: 4
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (booking) {
        setFormData({
          surveyorId: booking.surveyor?._id || '',
          inspectionDate: booking.inspectionDate ? new Date(booking.inspectionDate).toISOString().split('T')[0] : '',
          inspectionTime: booking.inspectionTime || '',
          surveyType: booking.surveyType || '',
          location: booking.location || '',
          vesselId: booking.vesselId || (booking.vessel ? booking.vessel._id : ''),
          vesselName: booking.vesselName || (booking.vessel ? booking.vessel.name : ''),
          notes: booking.notes || '',
          specialRequirements: booking.specialRequirements || '',
          estimatedDuration: booking.estimatedDuration || 4
        });
      } else {
        setFormData({
          surveyorId: '',
          inspectionDate: '',
          inspectionTime: '',
          surveyType: '',
          location: '',
          vesselId: '',
          vesselName: '',
          notes: '',
          specialRequirements: '',
          estimatedDuration: 4
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, booking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
      case 'surveyorId':
        if (!value) error = 'Please select a surveyor';
        break;
      case 'inspectionDate':
        if (!value) error = 'Inspection date is required';
        else {
          const selectedDate = new Date(value);
          const today = new Date();
          // Set both dates to midnight for date-only comparison
          selectedDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) error = 'Inspection date cannot be in the past';
        }
        break;
      case 'inspectionTime':
        if (!value) error = 'Inspection time is required';
        break;
      case 'surveyType':
        if (!value) error = 'Survey type is required';
        break;
      case 'location':
        if (!value) error = 'Location is required';
        break;
      case 'vesselId':
        if (!value) error = 'Please select a ship';
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
    
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
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
            <h3 className="text-lg font-medium text-gray-900">Book Surveyor</h3>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Surveyor *</label>
              <select
                name="surveyorId"
                value={formData.surveyorId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                  touched.surveyorId && errors.surveyorId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a surveyor...</option>
                {surveyors.map(surveyor => (
                  <option key={surveyor._id} value={surveyor._id}>
                    {surveyor.name} ({surveyor.email})
                  </option>
                ))}
              </select>
              {touched.surveyorId && errors.surveyorId && (
                <p className="mt-1 text-sm text-red-600">{errors.surveyorId}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Inspection Date *</label>
                <input
                  type="date"
                  name="inspectionDate"
                  value={formData.inspectionDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    touched.inspectionDate && errors.inspectionDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.inspectionDate && errors.inspectionDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.inspectionDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inspection Time *</label>
                <input
                  type="time"
                  name="inspectionTime"
                  value={formData.inspectionTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    touched.inspectionTime && errors.inspectionTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.inspectionTime && errors.inspectionTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.inspectionTime}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Survey Type *</label>
                <select
                  name="surveyType"
                  value={formData.surveyType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    touched.surveyType && errors.surveyType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select survey type...</option>
                  <option value="Annual">Annual</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Drydock">Drydock</option>
                  <option value="Special">Special</option>
                  <option value="Renewal">Renewal</option>
                </select>
                {touched.surveyType && errors.surveyType && (
                  <p className="mt-1 text-sm text-red-600">{errors.surveyType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., Port of Singapore"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    touched.location && errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {touched.location && errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    touched.vesselId && errors.vesselName ? 'border-red-300' : 'border-gray-300'
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Duration (hours)</label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  min="1"
                  max="24"
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes about the inspection..."
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requirements</label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                rows={3}
                placeholder="Any special requirements or equipment needed..."
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border-gray-300"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Book Surveyor
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyorBookingModal;
