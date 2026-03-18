const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');

// @route   POST api/reports/ship-comprehensive
// @desc    Generate comprehensive ship report PDF
// @access  Private (Owner, Ship Management, Admin)
router.post('/ship-comprehensive', auth, async (req, res) => {
  try {
    const { vessel, surveys, certificates, surveyors, complianceReports, maintenancePredictions } = req.body;

    if (!vessel) {
      return res.status(400).json({ msg: 'Vessel information is required' });
    }

    const safeSurveys = Array.isArray(surveys) ? surveys : [];
    const safeCertificates = Array.isArray(certificates) ? certificates : [];
    const safeSurveyors = Array.isArray(surveyors) ? surveyors : [];
    const safeComplianceReports = Array.isArray(complianceReports) ? complianceReports : [];
    const safeMaintenancePredictions = Array.isArray(maintenancePredictions) ? maintenancePredictions : [];

    const generatedAt = new Date();
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ship_Report_${vessel.name}_${generatedAt.toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    const formatDate = (value) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const textValue = (value) => {
      if (value === 0) return '0';
      if (value === null || value === undefined || value === '') return 'N/A';
      return String(value);
    };

    const left = 50;
    const right = doc.page.width - 50;
    const contentWidth = right - left;
    const bodyBottom = doc.page.height - 55;
    let yPos = 45;

    const drawPageFrame = () => {
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(left, 40).lineTo(right, 40).stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text('Marine Survey System • Comprehensive Vessel Report', left, 28, {
        width: contentWidth,
        align: 'left'
      });

      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(left, doc.page.height - 50).lineTo(right, doc.page.height - 50).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280').text(
        `Generated: ${generatedAt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        left,
        doc.page.height - 44,
        { width: contentWidth, align: 'center' }
      );
    };

    const addPage = () => {
      doc.addPage();
      drawPageFrame();
      yPos = 45;
    };

    const ensureSpace = (requiredHeight = 14) => {
      if (yPos + requiredHeight > bodyBottom) {
        addPage();
      }
    };

    const addSectionHeader = (title) => {
      ensureSpace(14);
      doc.roundedRect(left, yPos, contentWidth, 16, 2).fill('#EEF2FF');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E3A8A').text(title, left + 5, yPos + 3, {
        width: contentWidth - 10,
        align: 'left'
      });
      yPos += 17;
    };

    const addFieldRow = (label, value) => {
      const labelX = left + 3;
      const valueX = left + 150;
      const valueWidth = contentWidth - 153;
      const rowHeight = Math.max(10, doc.heightOfString(textValue(value), { width: valueWidth, align: 'left' }));

      ensureSpace(rowHeight + 1);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151').text(`${label}:`, labelX, yPos, { width: 145 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#111827').text(textValue(value), valueX, yPos, { width: valueWidth, align: 'left' });
      yPos += rowHeight;
    };

    const addCard = (title, lines = []) => {
      const cardX = left + 3;
      const cardY = yPos;
      const cardWidth = contentWidth - 6;
      const textWidth = cardWidth - 10;
      const titleHeight = Math.max(9, doc.heightOfString(title, { width: textWidth }));
      const detailsHeight = lines.reduce((sum, line) => sum + Math.max(7, doc.heightOfString(line, { width: textWidth })), 0);
      const cardHeight = titleHeight + detailsHeight + 6;

      ensureSpace(cardHeight + 1);

      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5).fillAndStroke('#FAFBFC', '#D1D5DB');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827').text(title, cardX + 5, cardY + 3, { width: textWidth });

      let lineY = cardY + 3 + titleHeight;
      lines.forEach((line) => {
        doc.font('Helvetica').fontSize(7).fillColor('#4B5563').text(line, cardX + 5, lineY, { width: textWidth });
        lineY += Math.max(7, doc.heightOfString(line, { width: textWidth }));
      });

      yPos += cardHeight + 1;
    };

    drawPageFrame();

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1E3A8A').text('COMPREHENSIVE VESSEL REPORT', left, yPos, {
      width: contentWidth,
      align: 'center'
    });
    yPos += 14;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text(
      `${textValue(vessel.name)}`,
      left,
      yPos,
      { width: contentWidth, align: 'center' }
    );
    yPos += 8;
    
    doc.font('Helvetica').fontSize(7.5).fillColor('#6B7280').text(
      `${textValue(vessel.vesselType || 'Vessel')} • IMO: ${textValue(vessel.imo)}`,
      left,
      yPos,
      { width: contentWidth, align: 'center' }
    );
    yPos += 8;

    addSectionHeader('Vessel Information');
    addFieldRow('Vessel Name', vessel.name);
    addFieldRow('IMO Number', vessel.imo);
    addFieldRow('Vessel ID', vessel.vesselId);
    addFieldRow('Vessel Type', vessel.vesselType);
    addFieldRow('Flag', vessel.flag);
    addFieldRow('Year Built', vessel.yearBuilt);
    addFieldRow('Gross Tonnage', vessel.grossTonnage ? `${vessel.grossTonnage} GT` : 'N/A');
    addFieldRow('Net Tonnage', vessel.netTonnage ? `${vessel.netTonnage} NT` : 'N/A');
    addFieldRow('Class Society', vessel.classSociety);

    if (vessel.dimensions) {
      addFieldRow('Length', vessel.dimensions.length ? `${vessel.dimensions.length} m` : 'N/A');
      addFieldRow('Beam', vessel.dimensions.beam ? `${vessel.dimensions.beam} m` : 'N/A');
      addFieldRow('Draft', vessel.dimensions.draft ? `${vessel.dimensions.draft} m` : 'N/A');
    }

    addSectionHeader('Owner Information');
    addFieldRow('Owner', vessel.owner ? textValue(vessel.owner.name || vessel.owner) : 'N/A');
    addFieldRow('Owner Contact', vessel.owner ? textValue(vessel.owner.email || 'N/A') : 'N/A');
    if (vessel.shipManagement) {
      addFieldRow('Ship Management', textValue(vessel.shipManagement.name || vessel.shipManagement));
      addFieldRow('Management Contact', textValue(vessel.shipManagement.email || 'N/A'));
    }

    if (safeSurveys.length > 0) {
      addSectionHeader('Surveys Summary');
      const scheduled = safeSurveys.filter((survey) => survey.status === 'Scheduled').length;
      const inProgress = safeSurveys.filter((survey) => survey.status === 'In Progress').length;
      const completed = safeSurveys.filter((survey) => survey.status === 'Completed').length;
      addFieldRow('Total Surveys', safeSurveys.length);
      addFieldRow('Scheduled', scheduled);
      addFieldRow('In Progress', inProgress);
      addFieldRow('Completed', completed);

      safeSurveys.slice(0, 5).forEach((survey, index) => {
        const details = [
          `${textValue(survey.status || 'Pending')} • ${formatDate(survey.scheduledDate)}`
        ];
        addCard(`${index + 1}. ${textValue(survey.surveyType || 'Survey')}`, details);
      });
    }

    if (safeCertificates.length > 0) {
      addSectionHeader('Certificates');
      const validCount = safeCertificates.filter((cert) => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining > 30;
      }).length;
      const expiringSoonCount = safeCertificates.filter((cert) => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 30 && daysRemaining >= 0;
      }).length;
      const expiredCount = safeCertificates.filter((cert) => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining < 0;
      }).length;
      addFieldRow('Total Certificates', safeCertificates.length);
      addFieldRow('Valid', validCount);
      addFieldRow('Expiring Soon (30 days)', expiringSoonCount);
      addFieldRow('Expired', expiredCount);

      safeCertificates.slice(0, 8).forEach((cert, index) => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        const statusText = daysRemaining < 0
          ? `Expired`
          : daysRemaining === 0
            ? 'Expires Today'
            : `${daysRemaining} days`;
        const certDetails = [
          `${textValue(cert.surveyType)} • Expires: ${formatDate(cert.expiryDate)}`,
          `Cert #: ${textValue(cert.certificateNumber || 'N/A')} • ${statusText}`
        ];
        addCard(`${index + 1}. ${textValue(cert.surveyType || 'Certificate')}`, certDetails);
      });
    }

    if (safeSurveyors.length > 0) {
      addSectionHeader('Surveyors');
      addFieldRow('Total Surveyors', safeSurveyors.length);
      safeSurveyors.slice(0, 5).forEach((surveyor, index) => {
        const surveyorDetails = [
          `${textValue(surveyor.email)} • License: ${textValue(surveyor.licenseNumber || 'N/A')}`
        ];
        addCard(`${index + 1}. ${textValue(surveyor.name || 'Surveyor')}`, surveyorDetails);
      });
    }

    if (safeComplianceReports.length > 0) {
      addSectionHeader('Compliance Reports');
      const compliant = safeComplianceReports.filter((report) => report.overallCompliance === 'Compliant').length;
      const partiallyCompliant = safeComplianceReports.filter((report) => report.overallCompliance === 'Partially Compliant').length;
      const nonCompliant = safeComplianceReports.filter((report) => report.overallCompliance === 'Non-Compliant').length;
      addFieldRow('Total Reports', safeComplianceReports.length);
      addFieldRow('Compliant', compliant);
      addFieldRow('Partially Compliant', partiallyCompliant);
      addFieldRow('Non-Compliant', nonCompliant);
      
      safeComplianceReports.slice(0, 6).forEach((report, index) => {
        const complianceDetails = [
          `${textValue(report.overallCompliance || 'Pending')} • ${formatDate(report.auditDate || report.complianceSubmittedAt)}`
        ];
        if (report.findings) complianceDetails.push(`${textValue(String(report.findings).substring(0, 60))}...`);
        addCard(`${index + 1}. ${textValue(report.complianceType || 'Audit')}`, complianceDetails);
      });
    }

    if (safeMaintenancePredictions.length > 0) {
      addSectionHeader('Predictive Maintenance');
      safeMaintenancePredictions.slice(0, 5).forEach((prediction, index) => {
        const maintenanceDetails = [
          `${textValue(prediction.risk || 'Unknown')} • ${textValue(prediction.prediction)}`
        ];
        if (prediction.recommendation) maintenanceDetails.push(`${textValue(prediction.recommendation)}`);
        addCard(`${index + 1}. ${textValue(prediction.component || 'Component')}`, maintenanceDetails);
      });
    }

    doc.end();

  } catch (err) {
    console.error('Error generating ship report:', err);
    res.status(500).json({ msg: 'Error generating report', error: err.message });
  }
});

module.exports = router;
