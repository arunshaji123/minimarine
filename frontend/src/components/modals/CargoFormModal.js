import React, { useState, useRef } from 'react';

const CargoFormModal = ({ isOpen, onClose, cargo }) => {
  const [formData, setFormData] = useState({
    cargoCondition: '',
    loadingNotes: '',
    unloadingNotes: '',
    specialInstructions: ''
  });

  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }

    const newPhotos = [];
    let processed = 0;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB limit`);
        processed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newPhotos.push({
          name: file.name,
          data: e.target.result,
          size: file.size,
          type: file.type
        });
        processed++;
        
        if (processed === files.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle video upload
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + videos.length > 5) {
      alert('Maximum 5 videos allowed');
      return;
    }

    const newVideos = [];
    let processed = 0;

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} exceeds 50MB limit`);
        processed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newVideos.push({
          name: file.name,
          data: e.target.result,
          size: file.size,
          type: file.type
        });
        processed++;
        
        if (processed === files.length) {
          setVideos(prev => [...prev, ...newVideos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle voice note upload from file
  const handleVoiceUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + voiceNotes.length > 5) {
      alert('Maximum 5 voice notes allowed');
      return;
    }

    const newVoiceNotes = [];
    let processed = 0;

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB limit`);
        processed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newVoiceNotes.push({
          name: file.name,
          data: e.target.result,
          size: file.size,
          type: file.type,
          duration: 0
        });
        processed++;
        
        if (processed === files.length) {
          setVoiceNotes(prev => [...prev, ...newVoiceNotes]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Start recording voice note
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          setVoiceNotes(prev => [...prev, {
            name: `Voice Note ${new Date().toLocaleString()}`,
            data: e.target.result,
            size: audioBlob.size,
            type: 'audio/webm',
            duration: 0
          }]);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording voice note
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Remove photo
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Remove video
  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  // Remove voice note
  const removeVoiceNote = (index) => {
    setVoiceNotes(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cargoCondition.trim()) {
      alert('Please enter cargo condition details');
      return;
    }

    setUploading(true);

    try {
      const cargoData = {
        cargoId: cargo._id,
        cargoCondition: formData.cargoCondition,
        loadingNotes: formData.loadingNotes,
        unloadingNotes: formData.unloadingNotes,
        specialInstructions: formData.specialInstructions,
        photos: photos,
        videos: videos,
        voiceNotes: voiceNotes,
        completedAt: new Date().toISOString()
      };

      // TODO: Replace with actual API call
      console.log('Submitting cargo data:', cargoData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Cargo report submitted successfully!');
      onClose();
      
      // Reset form
      setFormData({ cargoCondition: '', loadingNotes: '', unloadingNotes: '', specialInstructions: '' });
      setPhotos([]);
      setVideos([]);
      setVoiceNotes([]);
    } catch (error) {
      console.error('Error submitting cargo report:', error);
      alert('Failed to submit cargo report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-marine-blue">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Cargo Management Report</h3>
              <p className="text-sm text-blue-100 mt-1">
                {cargo?.vesselName} - {cargo?.cargoType}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Text Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo Condition *
              </label>
              <textarea
                name="cargoCondition"
                value={formData.cargoCondition}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the cargo condition..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-marine-blue focus:border-marine-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loading Notes
              </label>
              <textarea
                name="loadingNotes"
                value={formData.loadingNotes}
                onChange={handleChange}
                rows={4}
                placeholder="Enter loading notes..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-marine-blue focus:border-marine-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unloading Notes
              </label>
              <textarea
                name="unloadingNotes"
                value={formData.unloadingNotes}
                onChange={handleChange}
                rows={4}
                placeholder="Enter unloading notes..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-marine-blue focus:border-marine-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
                placeholder="Any special handling instructions..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-marine-blue focus:border-marine-blue"
              />
            </div>

            {/* Photos Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Photos ({photos.length}/10)
                </label>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Photos
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.data}
                        alt={photo.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="text-xs text-gray-500 mt-1 truncate">{photo.name}</div>
                      <div className="text-xs text-gray-400">{formatFileSize(photo.size)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Videos Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Videos ({videos.length}/5)
                </label>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Videos
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
              {videos.length > 0 && (
                <div className="space-y-3">
                  {videos.map((video, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <svg className="h-8 w-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{video.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(video.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="ml-3 text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Notes Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Voice Notes ({voiceNotes.length}/5)
                </label>
                <div className="flex gap-2">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <svg className="h-4 w-4 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                      Stop Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Record
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => voiceInputRef.current?.click()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload
                  </button>
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleVoiceUpload}
                    className="hidden"
                  />
                </div>
              </div>
              {voiceNotes.length > 0 && (
                <div className="space-y-3">
                  {voiceNotes.map((voice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <svg className="h-8 w-8 text-marine-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{voice.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(voice.size)}</p>
                        </div>
                        <audio controls className="ml-3 h-8">
                          <source src={voice.data} type={voice.type} />
                        </audio>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVoiceNote(index)}
                        className="ml-3 text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CargoFormModal;
