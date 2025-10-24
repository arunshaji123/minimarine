import React, { useState, useRef } from 'react';

const SurveyFormModal = ({ isOpen, onClose, survey, onSurveySubmitted }) => {
  const [formData, setFormData] = useState({
    findings: '',
    recommendations: '',
    notes: ''
  });

  const [uploading, setUploading] = useState(false);

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
    
    if (!formData.findings.trim()) {
      alert('Please enter survey findings');
      return;
    }

    setUploading(true);

    try {
      // Debug: Log survey data to see what's being passed
      console.log('Survey data being passed to modal:', survey);
      
      const surveyData = {
        surveyId: survey.id || survey._id,
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
      
      alert('Survey report submitted successfully!');
      onClose();
      if (onSurveySubmitted) onSurveySubmitted();
      
      // Reset form
      setFormData({ findings: '', recommendations: '', notes: '' });
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert(error.message || 'Failed to submit survey report. Please try again.');
    } finally {
      setUploading(false);
    }
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
                {survey?.vessel} - {survey?.type}
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
