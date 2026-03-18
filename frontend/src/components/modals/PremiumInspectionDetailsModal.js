import React from 'react';
import { jsPDF } from 'jspdf';

const PremiumInspectionDetailsModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const statusBadge = (value) => {
    const colors = {
      'Good': 'bg-green-100 text-green-800 border-green-300',
      'Needs Attention': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Unsatisfactory': 'bg-red-100 text-red-800 border-red-300',
      'N/A': 'bg-gray-100 text-gray-600 border-gray-300',
      'Excellent': 'bg-green-100 text-green-800 border-green-300',
      'Fair': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Poor': 'bg-red-100 text-red-800 border-red-300',
      'Ready': 'bg-green-100 text-green-800 border-green-300',
      'Conditional': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Not Ready': 'bg-red-100 text-red-800 border-red-300',
      'Yes': 'bg-green-100 text-green-800 border-green-300',
      'No': 'bg-red-100 text-red-800 border-red-300',
      'Platinum': 'bg-purple-100 text-purple-800 border-purple-300',
      'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Silver': 'bg-gray-100 text-gray-800 border-gray-300',
      'Recommended': 'bg-green-100 text-green-800 border-green-300',
      'Not Recommended': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[value] || 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const renderSection = (title, icon, items) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="text-xl mr-2">{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusBadge(value)}`}>
                {value || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const sectionConfigs = [
    {
      title: 'Swimming Pool & Deck Facilities',
      icon: '🏊',
      items: [
        { label: 'Pool structural condition', value: report.poolStructure },
        { label: 'Water quality & hygiene', value: report.waterQuality },
        { label: 'Filtration & circulation system', value: report.filtrationSystem },
        { label: 'Pool safety signage', value: report.poolSafetySigns },
        { label: 'Lifeguard equipment availability', value: report.lifeguardEquipment },
        { label: 'Anti-slip flooring condition', value: report.antiSlipFlooring },
      ]
    },
    {
      title: 'Helipad Facilities',
      icon: '🚁',
      items: [
        { label: 'Helideck structural condition', value: report.helideckStructure },
        { label: 'Surface friction & markings', value: report.surfaceFriction },
        { label: 'Helideck firefighting system', value: report.helideckFirefighting },
        { label: 'Lighting & night operation readiness', value: report.helideckLighting },
        { label: 'Wind direction indicator', value: report.windIndicator },
        { label: 'Emergency access routes', value: report.emergencyAccess },
      ]
    },
    {
      title: 'Dining & Restaurant Areas',
      icon: '🍽️',
      items: [
        { label: 'Kitchen hygiene standards', value: report.kitchenHygiene },
        { label: 'Food storage & refrigeration', value: report.foodStorage },
        { label: 'Galley fire safety systems', value: report.galleyFireSafety },
        { label: 'Ventilation & exhaust systems', value: report.ventilation },
        { label: 'Seating comfort & layout', value: report.seatingComfort },
        { label: 'Waste disposal practices', value: report.wasteDisposal },
      ]
    },
    {
      title: 'Bar & Lounge Facilities',
      icon: '🍹',
      items: [
        { label: 'Beverage storage condition', value: report.beverageStorage },
        { label: 'Alcohol handling safety', value: report.alcoholHandling },
        { label: 'Bar area cleanliness', value: report.barCleanliness },
        { label: 'Glassware handling safety', value: report.glasswareSafety },
        { label: 'Fire suppression in bar area', value: report.barFireSuppression },
        { label: 'Service counter ergonomics', value: report.serviceCounter },
      ]
    },
    {
      title: 'Guest Cabin Quality',
      icon: '🛎️',
      items: [
        { label: 'Cabin comfort level', value: report.cabinComfort },
        { label: 'Interior design & finish quality', value: report.interiorDesign },
        { label: 'Climate control effectiveness', value: report.climateControl },
        { label: 'Noise & vibration comfort', value: report.noiseVibration },
        { label: 'Accessibility for elderly / disabled', value: report.accessibility },
        { label: 'Housekeeping quality', value: report.housekeeping },
      ]
    },
    {
      title: 'Recreation & Wellness Facilities',
      icon: '🧘',
      items: [
        { label: 'Gym equipment condition', value: report.gymEquipment },
        { label: 'Spa & wellness facilities', value: report.spaFacilities },
        { label: 'Entertainment systems', value: report.entertainmentSystems },
        { label: 'Lounge / cinema readiness', value: report.loungeReadiness },
        { label: 'Child safety in play areas', value: report.childSafety },
      ]
    },
    {
      title: 'Passenger Safety & Comfort',
      icon: '🚨',
      items: [
        { label: 'Crowd management readiness', value: report.crowdManagement },
        { label: 'Emergency evacuation signage', value: report.evacuationSignage },
        { label: 'Muster station comfort', value: report.musterStation },
        { label: 'Public area fire safety', value: report.publicFireSafety },
        { label: 'CCTV & security monitoring', value: report.cctvSecurity },
        { label: 'Medical facility readiness', value: report.medicalFacility },
      ]
    },
    {
      title: 'Environmental Standards',
      icon: '🌍',
      items: [
        { label: 'Waste segregation in public areas', value: report.wasteSegregation },
        { label: 'Noise pollution control', value: report.noisePollution },
        { label: 'Energy-efficient lighting', value: report.energyLighting },
        { label: 'Water-saving systems', value: report.waterSaving },
        { label: 'Eco-friendly practices', value: report.ecoPractices },
      ]
    }
  ];

  const generatePDF = () => {
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
        pdf.text('Marine Survey System • Premium Inspection Report', margin, 11);

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
        pdf.setFillColor(243, 232, 255);
        pdf.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(91, 33, 182);
        pdf.text(title, margin + 2, y + 4.8);
        y += 9.5;
      };

      const addFieldRow = (label, value) => {
        const labelX = margin + 1;
        const valueX = margin + 80;
        const valueWidth = contentWidth - 81;
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

      addPageFrame();

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(91, 33, 182);
      pdf.text('PREMIUM INSPECTION REPORT', pageWidth / 2, y, { align: 'center' });
      y += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(17, 24, 39);
      pdf.text(textValue(report.shipName || 'VIP Ship'), pageWidth / 2, y, { align: 'center' });
      y += 7;

      addSectionHeader('Report Information');
      addFieldRow('Survey ID', report.shipId || report.surveyId);
      addFieldRow('Ship Name', report.shipName || 'VIP Ship');
      addFieldRow('Timestamp', report.timestamp ? new Date(report.timestamp).toLocaleString() : 'N/A');

      addSectionHeader('Overall VIP Quality Assessment');
      addFieldRow('VIP Grade', report.vipGrade);
      addFieldRow('Overall Quality Level', report.vipQualityLevel);
      addFieldRow('Charter Readiness', report.charterReadiness);
      addFieldRow('Passenger Readiness', report.passengerReadiness);
      addFieldRow('Insurance Recommendation', report.insuranceRecommendation);

      sectionConfigs.forEach((section) => {
        addSectionHeader(section.title);
        section.items.forEach((item) => {
          addFieldRow(item.label, item.value);
        });
      });

      const safeShipName = textValue(report.shipName || 'VIP_Ship').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeId = textValue(report.shipId || report.surveyId || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Premium_Inspection_${safeShipName}_${safeId}.pdf`);
    } catch (error) {
      console.error('Error generating premium inspection PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-lg bg-white mb-10">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <svg className="w-8 h-8 mr-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Premium Inspection Report Details
              </h2>
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Survey ID:</strong> {report.shipId || report.surveyId}</p>
                <p><strong>Timestamp:</strong> {new Date(report.timestamp).toLocaleString()}</p>
                <p><strong>Ship:</strong> {report.shipName || 'VIP Ship'}</p>
              </div>
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

          {/* Overall Assessment - Highlighted */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300 p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">🏆</span>
              Overall VIP Quality Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <span className="text-sm font-medium text-gray-700 block mb-1">VIP Grade</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${statusBadge(report.vipGrade)}`}>
                  {report.vipGrade || 'N/A'}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <span className="text-sm font-medium text-gray-700 block mb-1">Overall Quality Level</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${statusBadge(report.vipQualityLevel)}`}>
                  {report.vipQualityLevel || 'N/A'}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <span className="text-sm font-medium text-gray-700 block mb-1">Charter Readiness</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${statusBadge(report.charterReadiness)}`}>
                  {report.charterReadiness || 'N/A'}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <span className="text-sm font-medium text-gray-700 block mb-1">Passenger Readiness</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${statusBadge(report.passengerReadiness)}`}>
                  {report.passengerReadiness || 'N/A'}
                </span>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <span className="text-sm font-medium text-gray-700 block mb-1">Insurance Recommendation</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${statusBadge(report.insuranceRecommendation)}`}>
                  {report.insuranceRecommendation || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {sectionConfigs.map((section) => renderSection(section.title, section.icon, section.items))}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={generatePDF}
              className="mr-3 px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumInspectionDetailsModal;
