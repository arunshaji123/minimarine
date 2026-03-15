import React, { useState, useEffect } from 'react';

const SurveyFormModal = ({ isOpen, onClose, survey, onSurveySubmitted }) => {
  const [formData, setFormData] = useState({
    hullInspection: 0,
    hullInspectionFindings: '',
    deckSuperstructure: 0,
    deckSuperstructureFindings: '',
    machineryEngineRoom: 0,
    machineryEngineRoomFindings: '',
    electricalSystems: 0,
    electricalSystemsFindings: '',
    safetyEquipment: 0,
    safetyEquipmentFindings: '',
    navigationEquipment: 0,
    navigationEquipmentFindings: '',
    pollutionControlSystems: 0,
    pollutionControlSystemsFindings: '',
    certificatesVerification: 0,
    certificatesVerificationFindings: '',
    findings: '',
    recommendations: '',
    notes: ''
  });

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // For showing success/error messages
  
  // Debugging: Log survey data when it changes
  useEffect(() => {
    if (survey) {
      console.log('Survey data received in modal:', survey);
      console.log('Survey ID:', survey.id || survey._id);
      console.log('Vessel Info:', survey.vesselInfo);
    }
  }, [survey]);

  // Handle star rating changes
  const handleRatingChange = (field, rating) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  // Handle text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous messages
    setMessage({ type: '', text: '' });
    
    if (!formData.findings.trim()) {
      setMessage({ type: 'error', text: 'Please enter survey findings' });
      return;
    }

    setUploading(true);

    try {
      // Debug: Log survey data to see what's being passed
      console.log('Survey data being passed to modal:', survey);
      
      const surveyData = {
        surveyId: survey.id || survey._id,
        vessel: survey.vesselInfo?._id || survey.vessel || survey.vesselId,
        hullInspection: formData.hullInspection,
        hullInspectionFindings: formData.hullInspectionFindings,
        deckSuperstructure: formData.deckSuperstructure,
        deckSuperstructureFindings: formData.deckSuperstructureFindings,
        machineryEngineRoom: formData.machineryEngineRoom,
        machineryEngineRoomFindings: formData.machineryEngineRoomFindings,
        electricalSystems: formData.electricalSystems,
        electricalSystemsFindings: formData.electricalSystemsFindings,
        safetyEquipment: formData.safetyEquipment,
        safetyEquipmentFindings: formData.safetyEquipmentFindings,
        navigationEquipment: formData.navigationEquipment,
        navigationEquipmentFindings: formData.navigationEquipmentFindings,
        pollutionControlSystems: formData.pollutionControlSystems,
        pollutionControlSystemsFindings: formData.pollutionControlSystemsFindings,
        certificatesVerification: formData.certificatesVerification,
        certificatesVerificationFindings: formData.certificatesVerificationFindings,
        findings: formData.findings,
        recommendations: formData.recommendations,
        notes: formData.notes,
        completedAt: new Date().toISOString()
      };

      // Make actual API call to submit survey report
      const token = localStorage.getItem('token');
      // Use survey.id or survey._id depending on which is available
      const surveyId = survey.id || survey._id;
      
      if (!surveyId) {
        throw new Error('Survey ID is missing');
      }
      
      const response = await fetch(`/api/surveys/${surveyId}/report`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(surveyData)
      });
      
      if (!response.ok) {
        // Try to parse error response, but handle cases where it's not JSON
        let errorMessage = 'Failed to submit survey report';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorData.message || errorMessage;
          // Add more details for debugging
          if (errorData.userId && errorData.surveyorId) {
            errorMessage += `

User ID: ${errorData.userId}
Assigned Surveyor ID: ${errorData.surveyorId}
User Role: ${errorData.userRole}`;
          }
        } catch (parseError) {
          // If JSON parsing fails, use the response text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            // If even that fails, use a generic message with status
            errorMessage = `Server error (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Show success message
      setMessage({ type: 'success', text: 'Survey report submitted successfully!' });
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
        if (onSurveySubmitted) onSurveySubmitted();
      }, 1500);
      
      // Reset form
      setFormData({ 
        hullInspection: 0,
        hullInspectionFindings: '',
        deckSuperstructure: 0,
        deckSuperstructureFindings: '',
        machineryEngineRoom: 0,
        machineryEngineRoomFindings: '',
        electricalSystems: 0,
        electricalSystemsFindings: '',
        safetyEquipment: 0,
        safetyEquipmentFindings: '',
        navigationEquipment: 0,
        navigationEquipmentFindings: '',
        pollutionControlSystems: 0,
        pollutionControlSystemsFindings: '',
        certificatesVerification: 0,
        certificatesVerificationFindings: '',
        findings: '', 
        recommendations: '', 
        notes: '' 
      });
    } catch (error) {
      console.error('Error submitting survey:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Failed to submit survey report. Please try again.'}` });
    } finally {
      setUploading(false);
    }
  };

  // Star Rating Component
  const StarRating = ({ rating, onRatingChange, fieldName }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(fieldName, star)}
            className="text-2xl focus:outline-none"
          >
            {star <= rating ? (
              <span className="text-yellow-400">★</span>
            ) : (
              <span className="text-gray-300">☆</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-green-600">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Survey Report</h3>
              <p className="text-sm text-green-100 mt-1">
                {(survey?.vesselInfo?.name || survey?.vessel || survey?.vesselName) + ' - ID: ' + (survey?.vesselInfo?.vesselId || survey?.vesselId || 'N/A')} - {survey?.type}
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

        {/* Message Display */}
        {message.text && (
          <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'} border-l-4`}>
            <div className={`flex items-center ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {message.type === 'success' ? (
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 5-Star Rating Sections - New Fields at Top */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description and Quality Ratings</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hull Inspection
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="hullInspectionFindings"
                      value={formData.hullInspectionFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for hull inspection..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.hullInspection} 
                      onRatingChange={handleRatingChange} 
                      fieldName="hullInspection" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deck & Superstructure
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="deckSuperstructureFindings"
                      value={formData.deckSuperstructureFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for deck & superstructure..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.deckSuperstructure} 
                      onRatingChange={handleRatingChange} 
                      fieldName="deckSuperstructure" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Machinery & Engine Room
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="machineryEngineRoomFindings"
                      value={formData.machineryEngineRoomFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for machinery & engine room..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.machineryEngineRoom} 
                      onRatingChange={handleRatingChange} 
                      fieldName="machineryEngineRoom" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electrical Systems
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="electricalSystemsFindings"
                      value={formData.electricalSystemsFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for electrical systems..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.electricalSystems} 
                      onRatingChange={handleRatingChange} 
                      fieldName="electricalSystems" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Equipment
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="safetyEquipmentFindings"
                      value={formData.safetyEquipmentFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for safety equipment..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.safetyEquipment} 
                      onRatingChange={handleRatingChange} 
                      fieldName="safetyEquipment" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Navigation Equipment
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="navigationEquipmentFindings"
                      value={formData.navigationEquipmentFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for navigation equipment..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.navigationEquipment} 
                      onRatingChange={handleRatingChange} 
                      fieldName="navigationEquipment" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pollution Control Systems
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="pollutionControlSystemsFindings"
                      value={formData.pollutionControlSystemsFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for pollution control systems..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.pollutionControlSystems} 
                      onRatingChange={handleRatingChange} 
                      fieldName="pollutionControlSystems" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificates Verification
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="certificatesVerificationFindings"
                      value={formData.certificatesVerificationFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter findings for certificates verification..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <StarRating 
                      rating={formData.certificatesVerification} 
                      onRatingChange={handleRatingChange} 
                      fieldName="certificatesVerification" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Text Inputs - Moved to Bottom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Findings *
              </label>
              <textarea
                name="findings"
                value={formData.findings}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your survey findings..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendations
              </label>
              <textarea
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                rows={4}
                placeholder="Enter your recommendations..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
              />
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
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
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
              'Submit Survey'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyFormModal;