import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const SurveyDetailsModal = ({ isOpen, onClose, survey }) => {
  if (!isOpen || !survey) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render star ratings
  const renderStarRating = (rating) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-xl">
            {star <= rating ? (
              <span className="text-yellow-400">★</span>
            ) : (
              <span className="text-gray-300">☆</span>
            )}
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  // Render component section
  const renderComponentSection = (title, rating, findings) => {
    if (!rating && !findings) return null;
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
        {findings && (
          <div>
            <span className="text-sm text-gray-600 block mb-1">Findings:</span>
            <p className="text-gray-800 whitespace-pre-wrap">{findings}</p>
          </div>
        )}
        {rating !== undefined && (
          <div className="mb-2">
            <span className="text-sm text-gray-600 mr-2">Rating:</span>
            {renderStarRating(rating)}
          </div>
        )}
      </div>
    );
  };

  // Generate PDF certificate
  const generatePDF = async () => {
    try {
      // Get the content element to convert to PDF
      const content = document.getElementById('survey-content');
      
      if (!content) {
        console.error('Survey content not found');
        return;
      }

      // Temporarily modify styles for better PDF rendering
      const originalStyle = {
        overflow: content.style.overflow,
        maxHeight: content.style.maxHeight,
        padding: content.style.padding
      };
      
      // Remove restrictions for PDF capture
      content.style.overflow = 'visible';
      content.style.maxHeight = 'none';
      content.style.padding = '20px';
      
      // Force reflow
      void content.offsetHeight;

      // Use html2canvas to capture the content as an image
      const canvas = await html2canvas(content, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        scrollY: -window.scrollY,
        windowHeight: content.scrollHeight,
        windowWidth: content.scrollWidth
      });

      // Restore original styles
      content.style.overflow = originalStyle.overflow;
      content.style.maxHeight = originalStyle.maxHeight;
      content.style.padding = originalStyle.padding;

      // Create PDF using jsPDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is taller than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF with a meaningful filename
      const vesselName = survey.vessel?.name || 'Unknown_Vessel';
      const surveyType = survey.surveyType || 'Survey';
      const date = survey.completionDate ? new Date(survey.completionDate).toISOString().split('T')[0] : 'Unknown_Date';
      const filename = `${vesselName}_${surveyType}_Report_${date}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-green-600">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Survey Report Details</h3>
              <p className="text-sm text-green-100 mt-1">
                {survey.title} - {survey.surveyType}
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
        <div id="survey-content" className="flex-1 overflow-y-auto px-6 py-6">
          {/* Survey Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Vessel:</span>
                <p className="text-gray-900">{survey.vessel?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Surveyor:</span>
                <p className="text-gray-900">{survey.surveyor?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Requested By:</span>
                <p className="text-gray-900">{survey.requestedBy?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Scheduled Date:</span>
                <p className="text-gray-900">{formatDate(survey.scheduledDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Completion Date:</span>
                <p className="text-gray-900">{formatDate(survey.completionDate) || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  survey.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  survey.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {survey.status}
                </span>
              </div>
              {survey.location?.port && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Location:</span>
                  <p className="text-gray-900">{survey.location.port}</p>
                </div>
              )}
            </div>
          </div>

          {/* Component Ratings and Findings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description and Quality Ratings</h3>
            
            {renderComponentSection(
              "Hull Inspection", 
              survey.hullInspection, 
              survey.hullInspectionFindings
            )}
            
            {renderComponentSection(
              "Deck Superstructure", 
              survey.deckSuperstructure, 
              survey.deckSuperstructureFindings
            )}
            
            {renderComponentSection(
              "Machinery Engine Room", 
              survey.machineryEngineRoom, 
              survey.machineryEngineRoomFindings
            )}
            
            {renderComponentSection(
              "Electrical Systems", 
              survey.electricalSystems, 
              survey.electricalSystemsFindings
            )}
            
            {renderComponentSection(
              "Safety Equipment", 
              survey.safetyEquipment, 
              survey.safetyEquipmentFindings
            )}
            
            {renderComponentSection(
              "Navigation Equipment", 
              survey.navigationEquipment, 
              survey.navigationEquipmentFindings
            )}
            
            {renderComponentSection(
              "Pollution Control Systems", 
              survey.pollutionControlSystems, 
              survey.pollutionControlSystemsFindings
            )}
            
            {renderComponentSection(
              "Certificates Verification", 
              survey.certificatesVerification, 
              survey.certificatesVerificationFindings
            )}
          </div>

          {/* General Findings, Recommendations, and Notes */}
          <div className="space-y-6">
            {survey.findings && survey.findings.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">General Findings</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  {Array.isArray(survey.findings) ? (
                    <ul className="space-y-2">
                      {survey.findings.map((finding, index) => (
                        <li key={index} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex justify-between">
                            <span className="font-medium">{finding.category || 'Other'}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              finding.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                              finding.severity === 'Major' ? 'bg-orange-100 text-orange-800' :
                              finding.severity === 'Minor' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-700">{finding.description}</p>
                          {finding.location && (
                            <p className="text-sm text-gray-500 mt-1">Location: {finding.location}</p>
                          )}
                          {finding.recommendations && (
                            <p className="text-sm text-gray-600 mt-1">Recommendations: {finding.recommendations}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-800 whitespace-pre-wrap">{survey.findings}</p>
                  )}
                </div>
              </div>
            )}

            {survey.recommendations && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Recommendations</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{survey.recommendations}</p>
                </div>
              </div>
            )}

            {survey.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Notes</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{survey.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={generatePDF}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyDetailsModal;