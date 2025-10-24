import React, { useState } from 'react';

const SurveyorAssignmentModal = ({ isOpen, onClose, booking, onSave }) => {
  const [formData, setFormData] = useState({
    shipPhotos: [],
    flightTicket: null
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';
    // No field-specific validation needed for now
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (!files || files.length === 0) {
      setErrors(prev => ({ ...prev, shipPhotos: 'Please select at least one photo' }));
      return;
    }
    
    if (files.length + formData.shipPhotos.length > 10) {
      setErrors(prev => ({ ...prev, shipPhotos: `Maximum 10 photos allowed. You can upload ${10 - formData.shipPhotos.length} more photo(s)` }));
      return;
    }
    
    // Validate file types and sizes with detailed error messages
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = [];
    
    const validFiles = files.filter(file => {
      const isValidType = validImageTypes.includes(file.type.toLowerCase());
      const isValidSize = file.size > 0 && file.size <= maxFileSize;
      
      if (!isValidType) {
        invalidFiles.push(`${file.name}: Invalid file type (only JPEG, PNG, GIF, WEBP allowed)`);
        return false;
      }
      if (!isValidSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        invalidFiles.push(`${file.name}: File too large (${sizeMB}MB, max 5MB)`);
        return false;
      }
      return true;
    });

    if (invalidFiles.length > 0) {
      setErrors(prev => ({ ...prev, shipPhotos: invalidFiles.join('; ') }));
      return;
    }
    
    if (validFiles.length === 0) {
      setErrors(prev => ({ ...prev, shipPhotos: 'No valid images selected' }));
      return;
    }

    // Convert to base64 for preview
    const newPhotos = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push({
          name: file.name,
          data: reader.result,
          file: file
        });
        if (newPhotos.length === validFiles.length) {
          setFormData(prev => ({
            ...prev,
            shipPhotos: [...prev.shipPhotos, ...newPhotos]
          }));
          setErrors(prev => ({ ...prev, shipPhotos: '' }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFlightTicketUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size === 0) {
      setErrors(prev => ({ ...prev, flightTicket: 'Invalid file (empty file)' }));
      return;
    }
    
    if (file.size > maxFileSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrors(prev => ({ ...prev, flightTicket: `File too large (${sizeMB}MB, max 10MB)` }));
      return;
    }
    
    // Validate file type (images and PDFs allowed)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrors(prev => ({ ...prev, flightTicket: 'Invalid file type (only images and PDF allowed)' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        flightTicket: {
          name: file.name,
          data: reader.result,
          file: file
        }
      }));
      setErrors(prev => ({ ...prev, flightTicket: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      shipPhotos: prev.shipPhotos.filter((_, i) => i !== index)
    }));
  };

  const removeFlightTicket = () => {
    setFormData(prev => ({ ...prev, flightTicket: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (uploading) {
      return;
    }
    
    // Mark all fields as touched for validation display
    setTouched({
      shipPhotos: true,
      flightTicket: true
    });
    
    // Validate ship photos
    let hasPhotoError = false;
    if (formData.shipPhotos.length === 0) {
      setErrors(prev => ({ ...prev, shipPhotos: 'At least one ship photo is required' }));
      hasPhotoError = true;
    } else if (formData.shipPhotos.length > 10) {
      setErrors(prev => ({ ...prev, shipPhotos: 'Maximum 10 photos allowed' }));
      hasPhotoError = true;
    }
    
    // Check if there are any validation errors
    if (hasPhotoError) {
      setErrors(prev => ({ ...prev, submit: 'Please fix all validation errors before submitting' }));
      return;
    }
    
    // Clear any previous submit errors
    setErrors(prev => ({ ...prev, submit: '' }));
    setUploading(true);
    
    try {
      await onSave({
        bookingId: booking._id,
        shipPhotos: formData.shipPhotos,
        flightTicket: formData.flightTicket
      });
      
      // Reset form
      setFormData({
        shipPhotos: [],
        flightTicket: null
      });
      setTouched({});
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to save assignment. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Assign Survey - {booking?.vesselName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Booking Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Surveyor:</span>
              <span className="ml-2 text-gray-900">{booking?.surveyor?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Survey Type:</span>
              <span className="ml-2 text-gray-900">{booking?.surveyType}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <span className="ml-2 text-gray-900">
                {booking?.inspectionDate ? new Date(booking.inspectionDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Time:</span>
              <span className="ml-2 text-gray-900">{booking?.inspectionTime || 'N/A'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ship Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ship Photos * (Max 10 photos, 5MB each)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-marine-blue transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-marine-blue hover:text-marine-dark focus-within:outline-none">
                    <span>Upload files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
            {errors.shipPhotos && (
              <p className="mt-1 text-sm text-red-600">{errors.shipPhotos}</p>
            )}

            {/* Photo Previews */}
            {formData.shipPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.shipPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.data}
                      alt={`Ship ${index + 1}`}
                      className="h-24 w-full object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flight Ticket */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flight Ticket (Optional, Max 10MB)
            </label>
            <div className="mt-1">
              <label className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-marine-blue transition-colors cursor-pointer">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-marine-blue hover:text-marine-dark">Upload flight ticket</span>
                  </div>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFlightTicketUpload}
                  className="sr-only"
                />
              </label>
            </div>
            {errors.flightTicket && (
              <p className="mt-1 text-sm text-red-600">{errors.flightTicket}</p>
            )}

            {/* Ticket Preview */}
            {formData.flightTicket && (
              <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formData.flightTicket.name}</p>
                    <p className="text-xs text-gray-500">
                      {(formData.flightTicket.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFlightTicket}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Assign Survey'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyorAssignmentModal;
