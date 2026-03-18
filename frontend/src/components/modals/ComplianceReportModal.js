import React from 'react';
import { jsPDF } from 'jspdf';

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
        pdf.text('Marine Survey System • Compliance Report', margin, 11);

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

      const getStatusSummary = (sectionData = {}) => {
        const values = Object.values(sectionData);
        const counts = values.reduce((acc, status) => {
          const key = getStatusText(status);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(counts).map(([status, count]) => `${status}: ${count}`).join(' | ') || 'N/A';
      };

      const addComplianceTable = (title, sectionData = {}) => {
        const entries = Object.entries(sectionData);
        if (entries.length === 0) return;

        addSectionHeader(title);
        entries.forEach(([key, value]) => {
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/([a-z])([A-Z])/g, '$1 $2');

          addFieldRow(label, getStatusText(value));
        });
      };

      addPageFrame();

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(30, 58, 138);
      pdf.text('COMPLIANCE ASSESSMENT REPORT', pageWidth / 2, y, { align: 'center' });
      y += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(17, 24, 39);
      pdf.text(textValue(survey.title || survey.surveyType || 'Compliance Report'), pageWidth / 2, y, { align: 'center' });
      y += 7;

      addSectionHeader('Survey Information');
      addFieldRow('Vessel', survey.vessel?.name || survey.vesselName);
      addFieldRow('Survey Type', survey.surveyType);
      addFieldRow('Surveyor', survey.surveyor?.name);
      addFieldRow('Client', survey.client);
      addFieldRow('Scheduled Date', formatDate(survey.scheduledDate));
      addFieldRow('Submitted Date', formatDate(survey.complianceSubmittedAt));

      addSectionHeader('Compliance Summary');
      addFieldRow('SOLAS', getStatusSummary(survey.complianceStatus.solas));
      addFieldRow('MARPOL', getStatusSummary(survey.complianceStatus.marpol));
      addFieldRow('Load Line', getStatusSummary(survey.complianceStatus.loadLine));
      addFieldRow('ISM Code', getStatusSummary(survey.complianceStatus.ism));
      addFieldRow('Classification', getStatusSummary(survey.complianceStatus.classification));

      addComplianceTable('SOLAS Compliance Details', survey.complianceStatus.solas);
      addComplianceTable('MARPOL Compliance Details', survey.complianceStatus.marpol);
      addComplianceTable('Load Line Compliance Details', survey.complianceStatus.loadLine);
      addComplianceTable('ISM Code Compliance Details', survey.complianceStatus.ism);
      addComplianceTable('Classification Compliance Details', survey.complianceStatus.classification);

      if (survey.overallCompliance) {
        addSectionHeader('Overall Assessment');
        addFieldRow('Overall Compliance', getStatusText(survey.overallCompliance));
      }

      const vesselName = textValue(survey.vessel?.name || survey.vesselName || 'Unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
      const surveyType = textValue(survey.surveyType || 'Unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
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