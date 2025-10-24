import React, { useState } from 'react';

const CargoManagerAssignmentModal = ({ isOpen, onClose, booking, onSave }) => {
  const [formData, setFormData] = useState({
    shipPhotos: [],
    cargoPhotos: []
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

  const handleShipPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (!files || files.length === 0) {
      setErrors(prev => ({ ...prev, shipPhotos: 'Please select at least one photo' }));
      return;
    }
    
    if (files.length + formData.shipPhotos.length > 10) {
      setErrors(prev => ({ ...prev, shipPhotos: `Maximum 10 ship photos allowed. You can upload ${10 - formData.shipPhotos.length} more photo(s)` }));
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

  const handleCargoPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (!files || files.length === 0) {
      setErrors(prev => ({ ...prev, cargoPhotos: 'Please select at least one photo' }));
      return;
    }
    
    if (files.length + formData.cargoPhotos.length > 10) {
      setErrors(prev => ({ ...prev, cargoPhotos: `Maximum 10 cargo photos allowed. You can upload ${10 - formData.cargoPhotos.length} more photo(s)` }));
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
      setErrors(prev => ({ ...prev, cargoPhotos: invalidFiles.join('; ') }));
      return;
    }
    
    if (validFiles.length === 0) {
      setErrors(prev => ({ ...prev, cargoPhotos: 'No valid images selected' }));
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
            cargoPhotos: [...prev.cargoPhotos, ...newPhotos]
          }));
          setErrors(prev => ({ ...prev, cargoPhotos: '' }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeShipPhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      shipPhotos: prev.shipPhotos.filter((_, i) => i !== index)
    }));
  };

  const removeCargoPhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      cargoPhotos: prev.cargoPhotos.filter((_, i) => i !== index)
    }));
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
      cargoPhotos: true
    });
    
    // Validate ship photos
    let hasShipPhotoError = false;
    if (formData.shipPhotos.length === 0) {
      setErrors(prev => ({ ...prev, shipPhotos: 'At least one ship photo is required' }));
      hasShipPhotoError = true;
    } else if (formData.shipPhotos.length > 10) {
      setErrors(prev => ({ ...prev, shipPhotos: 'Maximum 10 ship photos allowed' }));
      hasShipPhotoError = true;
    }
    
    // Validate cargo photos
    let hasCargoPhotoError = false;
    if (formData.cargoPhotos.length === 0) {
      setErrors(prev => ({ ...prev, cargoPhotos: 'At least one cargo photo is required' }));
      hasCargoPhotoError = true;
    } else if (formData.cargoPhotos.length > 10) {
      setErrors(prev => ({ ...prev, cargoPhotos: 'Maximum 10 cargo photos allowed' }));
      hasCargoPhotoError = true;
    }
    
    // Check if there are any validation errors
    if (hasShipPhotoError || hasCargoPhotoError) {
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
        cargoPhotos: formData.cargoPhotos
      });
      
      // Reset form
      setFormData({
        shipPhotos: [],
        cargoPhotos: []
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
            Assign Cargo Manager - {booking?.vesselName}
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
              <span className="font-medium text-gray-700">Cargo Manager:</span>
              <span className="ml-2 text-gray-900">{booking?.cargoManager?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Cargo Type:</span>
              <span className="ml-2 text-gray-900">{booking?.cargoType}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Voyage Date:</span>
              <span className="ml-2 text-gray-900">
                {booking?.voyageDate ? new Date(booking.voyageDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Route:</span>
              <span className="ml-2 text-gray-900">
                {booking?.departurePort} → {booking?.destinationPort}
              </span>
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
                    <span>Upload ship photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleShipPhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
              </div>
            </div>
            {errors.shipPhotos && (
              <p className="mt-1 text-sm text-red-600">{errors.shipPhotos}</p>
            )}
            
            {/* Ship Photo Previews */}
            {formData.shipPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.shipPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.data}
                      alt={photo.name}
                      className="w-full h-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeShipPhoto(index)}
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

          {/* Cargo Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo Photos * (Max 10 photos, 5MB each)
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
                    <span>Upload cargo photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleCargoPhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
              </div>
            </div>
            {errors.cargoPhotos && (
              <p className="mt-1 text-sm text-red-600">{errors.cargoPhotos}</p>
            )}
            
            {/* Cargo Photo Previews */}
            {formData.cargoPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.cargoPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.data}
                      alt={photo.name}
                      className="w-full h-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeCargoPhoto(index)}
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

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
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
                'Assign Cargo Manager'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CargoManagerAssignmentModal;
