import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ComplianceReportModal = ({ isOpen, onClose, survey }) => {
  if (!isOpen || !survey || !survey.complianceStatus) return null;

  // Helper function to get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'not-compliant':
        return 'Not Compliant';
      case 'pending':
        return 'Pending';
      case 'semi-moderate':
        return 'Semi Moderate';
      case 'moderate':
        return 'Moderate';
      case 'compliant':
        return 'Compliant';
      default:
        return 'Unknown';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'not-compliant':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'semi-moderate':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'moderate':
      case 'compliant':
        return 'text-green-600 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render a compliance section
  const renderComplianceSection = (title, sectionData, sectionName) => {
    if (!sectionData) return null;

    const items = Object.keys(sectionData).map((key) => {
      const value = sectionData[key];
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/([a-z])([A-Z])/g, '$1 $2');

      return (
        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-700">{label}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {getStatusText(value)}
          </span>
        </div>
      );
    });

    return (
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{title}</h4>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {items}
        </div>
      </div>
    );
  };

  // Function to generate PDF
  const generatePDF = async () => {
    const contentElement = document.getElementById('compliance-content');
    
    if (!contentElement) {
      console.error('Content element not found');
      return;
    }
    
    try {
      // Use html2canvas to capture the content
      const canvas = await html2canvas(contentElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const vesselName = survey.vessel?.name || survey.vesselName || 'Unknown';
      const surveyType = survey.surveyType || 'Unknown';
      pdf.save(`Compliance_Report_${vesselName}_${surveyType}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Compliance Report</h3>
            <p className="text-sm text-gray-500 mt-1">Detailed compliance tracking for the survey</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div id="compliance-content" className="flex-1 overflow-y-auto p-6">
          {/* Survey Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Vessel:</span>
                <p className="text-gray-900">{survey.vessel?.name || survey.vesselName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Survey Type:</span>
                <p className="text-gray-900">{survey.surveyType || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Surveyor:</span>
                <p className="text-gray-900">{survey.surveyor?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Client:</span>
                <p className="text-gray-900">{survey.client || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Scheduled Date:</span>
                <p className="text-gray-900">{formatDate(survey.scheduledDate)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Submitted Date:</span>
                <p className="text-gray-900">{formatDate(survey.complianceSubmittedAt)}</p>
              </div>
            </div>
          </div>

          {/* Compliance Sections */}
          <div className="space-y-6">
            {renderComplianceSection('SOLAS Compliance', survey.complianceStatus.solas, 'solas')}
            {renderComplianceSection('MARPOL Compliance', survey.complianceStatus.marpol, 'marpol')}
            {renderComplianceSection('Load Line Compliance', survey.complianceStatus.loadLine, 'loadLine')}
            {renderComplianceSection('ISM Code Compliance', survey.complianceStatus.ism, 'ism')}
            {renderComplianceSection('Classification Compliance', survey.complianceStatus.classification, 'classification')}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={generatePDF}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Generate PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReportModal;