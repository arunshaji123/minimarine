import React from 'react';
import { jsPDF } from 'jspdf';

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

  // Generate professional PDF report
  const generatePDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const footerY = pageHeight - 12;
      const lineHeight = 4.8;
      let y = 22;
      let currentPage = 1;

      const textValue = (value) => {
        if (value === 0) return '0';
        if (value === null || value === undefined || value === '') return 'N/A';
        return String(value);
      };

      const addPageFrame = () => {
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.4);
        pdf.line(margin, 14, pageWidth - margin, 14);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(75, 85, 99);
        pdf.text('Marine Survey System • Survey Report', margin, 11);

        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY);
        pdf.text(`Page ${currentPage}`, pageWidth - margin, footerY, { align: 'right' });
      };

      const ensureSpace = (requiredHeight = 12) => {
        if (y + requiredHeight > pageHeight - 22) {
          pdf.addPage();
          currentPage += 1;
          addPageFrame();
          y = 22;
        }
      };

      const addSectionHeader = (title) => {
        ensureSpace(10);
        pdf.setFillColor(238, 242, 255);
        pdf.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 58, 138);
        pdf.text(title, margin + 2, y + 4.8);
        y += 9.5;
      };

      const addFieldRow = (label, value) => {
        const labelX = margin + 1;
        const valueX = margin + 55;
        const valueWidth = contentWidth - 56;
        const lines = pdf.splitTextToSize(textValue(value), valueWidth);
        const rowHeight = Math.max(lineHeight, lines.length * lineHeight);

        ensureSpace(rowHeight + 1);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(55, 65, 81);
        pdf.text(`${label}:`, labelX, y + 3.8);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(17, 24, 39);
        pdf.text(lines, valueX, y + 3.8);
        y += rowHeight + 1;
      };

      const addParagraph = (title, text) => {
        if (!text) return;
        addSectionHeader(title);
        const lines = pdf.splitTextToSize(textValue(text), contentWidth - 4);
        ensureSpace(lines.length * lineHeight + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(31, 41, 55);
        pdf.text(lines, margin + 2, y + 3.8);
        y += lines.length * lineHeight + 2;
      };

      const addComponent = (title, rating, findings) => {
        if (rating === undefined && !findings) return;

        const findingsText = findings ? `Findings: ${textValue(findings)}` : 'Findings: N/A';
        const ratingText = rating !== undefined ? `Rating: ${textValue(rating)}/5` : 'Rating: N/A';
        const lines = [ratingText, ...pdf.splitTextToSize(findingsText, contentWidth - 8)];
        const boxHeight = 6 + lines.length * lineHeight;

        ensureSpace(boxHeight + 2);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'S');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(17, 24, 39);
        pdf.text(title, margin + 2, y + 4.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(75, 85, 99);
        pdf.text(lines, margin + 2, y + 9);
        y += boxHeight + 2;
      };

      addPageFrame();

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(30, 58, 138);
      pdf.text('COMPREHENSIVE SURVEY REPORT', pageWidth / 2, y, { align: 'center' });
      y += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(17, 24, 39);
      pdf.text(textValue(survey.title || survey.surveyType || 'Survey Report'), pageWidth / 2, y, { align: 'center' });
      y += 7;

      addSectionHeader('Survey Information');
      addFieldRow('Vessel', survey.vessel?.name);
      addFieldRow('Survey Type', survey.surveyType);
      addFieldRow('Surveyor', survey.surveyor?.name);
      addFieldRow('Requested By', survey.requestedBy?.name);
      addFieldRow('Status', survey.status);
      addFieldRow('Scheduled Date', formatDate(survey.scheduledDate));
      addFieldRow('Completion Date', formatDate(survey.completionDate));
      if (survey.location?.port) addFieldRow('Location', survey.location.port);

      addSectionHeader('Description and Quality Ratings');
      addComponent('Hull Inspection', survey.hullInspection, survey.hullInspectionFindings);
      addComponent('Deck Superstructure', survey.deckSuperstructure, survey.deckSuperstructureFindings);
      addComponent('Machinery Engine Room', survey.machineryEngineRoom, survey.machineryEngineRoomFindings);
      addComponent('Electrical Systems', survey.electricalSystems, survey.electricalSystemsFindings);
      addComponent('Safety Equipment', survey.safetyEquipment, survey.safetyEquipmentFindings);
      addComponent('Navigation Equipment', survey.navigationEquipment, survey.navigationEquipmentFindings);
      addComponent('Pollution Control Systems', survey.pollutionControlSystems, survey.pollutionControlSystemsFindings);
      addComponent('Certificates Verification', survey.certificatesVerification, survey.certificatesVerificationFindings);

      if (Array.isArray(survey.findings) && survey.findings.length > 0) {
        addSectionHeader('General Findings');
        survey.findings.forEach((finding, index) => {
          const detail = [
            `${index + 1}. Category: ${textValue(finding.category || 'Other')} | Severity: ${textValue(finding.severity || 'N/A')}`,
            `Description: ${textValue(finding.description)}`,
            `Location: ${textValue(finding.location)}`,
            `Recommendations: ${textValue(finding.recommendations)}`
          ];

          const allLines = detail.flatMap((item) => pdf.splitTextToSize(item, contentWidth - 6));
          const boxHeight = 4 + allLines.length * lineHeight;
          ensureSpace(boxHeight + 2);

          pdf.setDrawColor(229, 231, 235);
          pdf.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'S');
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(55, 65, 81);
          pdf.text(allLines, margin + 2, y + 3.8);
          y += boxHeight + 2;
        });
      } else if (survey.findings) {
        addParagraph('General Findings', survey.findings);
      }

      addParagraph('Recommendations', survey.recommendations);
      addParagraph('Additional Notes', survey.notes);

      const vesselName = textValue(survey.vessel?.name || 'Unknown_Vessel').replace(/[^a-zA-Z0-9_-]/g, '_');
      const surveyType = textValue(survey.surveyType || 'Survey').replace(/[^a-zA-Z0-9_-]/g, '_');
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