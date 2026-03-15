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

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ship_Report_${vessel.name}_${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to add a section header
    const addSectionHeader = (title, yPosition) => {
      doc.fontSize(16)
         .fillColor('#4F46E5')
         .text(title, 50, yPosition, { underline: true })
         .fillColor('#000000')
         .fontSize(10);
      return yPosition + 30;
    };

    // Helper function to add a table row
    const addTableRow = (label, value, yPosition, labelWidth = 150) => {
      doc.fontSize(9)
         .fillColor('#4B5563')
         .text(label + ':', 50, yPosition, { width: labelWidth, continued: false })
         .fillColor('#000000')
         .text(value || 'N/A', 50 + labelWidth, yPosition, { width: 350 - labelWidth });
      return yPosition + 20;
    };

    // Page 1: Header and Ship Information
    doc.fontSize(24)
       .fillColor('#4F46E5')
       .text('COMPREHENSIVE SHIP REPORT', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#6B7280')
       .text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' })
       .moveDown(2);

    // Ship Information Section
    let yPos = 150;
    yPos = addSectionHeader('VESSEL INFORMATION', yPos);
    
    yPos = addTableRow('Vessel Name', vessel.name, yPos);
    yPos = addTableRow('IMO Number', vessel.imo, yPos);
    yPos = addTableRow('Vessel ID', vessel.vesselId, yPos);
    yPos = addTableRow('Vessel Type', vessel.vesselType, yPos);
    yPos = addTableRow('Flag', vessel.flag, yPos);
    yPos = addTableRow('Year Built', vessel.yearBuilt?.toString(), yPos);
    yPos = addTableRow('Gross Tonnage', vessel.grossTonnage ? `${vessel.grossTonnage} GT` : 'N/A', yPos);
    yPos = addTableRow('Net Tonnage', vessel.netTonnage ? `${vessel.netTonnage} NT` : 'N/A', yPos);
    yPos = addTableRow('Class Society', vessel.classSociety, yPos);

    if (vessel.dimensions) {
      yPos = addTableRow('Length', vessel.dimensions.length ? `${vessel.dimensions.length} m` : 'N/A', yPos);
      yPos = addTableRow('Beam', vessel.dimensions.beam ? `${vessel.dimensions.beam} m` : 'N/A', yPos);
      yPos = addTableRow('Draft', vessel.dimensions.draft ? `${vessel.dimensions.draft} m` : 'N/A', yPos);
    }

    // Surveys Section
    if (surveys && surveys.length > 0) {
      doc.addPage();
      yPos = 50;
      yPos = addSectionHeader('SURVEYS SUMMARY', yPos);

      const scheduled = surveys.filter(s => s.status === 'Scheduled').length;
      const inProgress = surveys.filter(s => s.status === 'In Progress').length;
      const completed = surveys.filter(s => s.status === 'Completed').length;

      yPos = addTableRow('Total Surveys', surveys.length.toString(), yPos);
      yPos = addTableRow('Scheduled', scheduled.toString(), yPos);
      yPos = addTableRow('In Progress', inProgress.toString(), yPos);
      yPos = addTableRow('Completed', completed.toString(), yPos);
      yPos += 10;

      // List recent surveys
      doc.fontSize(12)
         .fillColor('#4F46E5')
         .text('Recent Surveys:', 50, yPos)
         .fillColor('#000000')
         .fontSize(9);
      yPos += 25;

      surveys.slice(0, 10).forEach((survey, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc.fontSize(10)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${survey.surveyType}`, 60, yPos, { continued: false });
        
        yPos += 15;
        doc.fontSize(8)
           .fillColor('#6B7280')
           .text(`   Date: ${new Date(survey.scheduledDate).toLocaleDateString()}`, 60, yPos)
           .text(`Status: ${survey.status}`, 300, yPos);
        
        yPos += 20;
      });
    }

    // Certificates Section
    if (certificates && certificates.length > 0) {
      doc.addPage();
      yPos = 50;
      yPos = addSectionHeader('CERTIFICATES', yPos);

      yPos = addTableRow('Total Certificates', certificates.length.toString(), yPos);
      
      const validCerts = certificates.filter(cert => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining > 30;
      }).length;
      
      const expiringSoon = certificates.filter(cert => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 30 && daysRemaining >= 0;
      }).length;
      
      const expired = certificates.filter(cert => {
        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining < 0;
      }).length;

      yPos = addTableRow('Valid Certificates', validCerts.toString(), yPos);
      yPos = addTableRow('Expiring Soon (30 days)', expiringSoon.toString(), yPos);
      yPos = addTableRow('Expired', expired.toString(), yPos);
      yPos += 10;

      // List certificates
      doc.fontSize(12)
         .fillColor('#4F46E5')
         .text('Certificate Details:', 50, yPos)
         .fillColor('#000000')
         .fontSize(9);
      yPos += 25;

      certificates.forEach((cert, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        const statusText = daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` :
                          daysRemaining === 0 ? 'Expires today' :
                          `${daysRemaining} days remaining`;

        doc.fontSize(10)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${cert.certificateNumber}`, 60, yPos);
        
        yPos += 15;
        doc.fontSize(8)
           .fillColor('#6B7280')
           .text(`   Type: ${cert.surveyType}`, 60, yPos)
           .text(`Expiry: ${new Date(cert.expiryDate).toLocaleDateString()}`, 250, yPos);
        
        yPos += 12;
        doc.fillColor(daysRemaining < 0 ? '#DC2626' : daysRemaining <= 30 ? '#F59E0B' : '#10B981')
           .text(`   Status: ${statusText}`, 60, yPos);
        
        yPos += 20;
      });
    }

    // Surveyors Section
    if (surveyors && surveyors.length > 0) {
      if (yPos > 600) {
        doc.addPage();
        yPos = 50;
      } else {
        yPos += 20;
      }
      
      yPos = addSectionHeader('SURVEYORS', yPos);

      yPos = addTableRow('Total Surveyors', surveyors.length.toString(), yPos);
      yPos += 10;

      doc.fontSize(12)
         .fillColor('#4F46E5')
         .text('Surveyor Details:', 50, yPos)
         .fillColor('#000000')
         .fontSize(9);
      yPos += 25;

      surveyors.forEach((surveyor, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc.fontSize(10)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${surveyor.name}`, 60, yPos);
        
        yPos += 15;
        doc.fontSize(8)
           .fillColor('#6B7280')
           .text(`   Email: ${surveyor.email}`, 60, yPos);
        
        if (surveyor.licenseNumber) {
          yPos += 12;
          doc.text(`   License: ${surveyor.licenseNumber}`, 60, yPos);
        }
        
        yPos += 20;
      });
    }

    // Compliance Reports Section
    if (complianceReports && complianceReports.length > 0) {
      doc.addPage();
      yPos = 50;
      yPos = addSectionHeader('COMPLIANCE REPORTS', yPos);

      yPos = addTableRow('Total Reports', complianceReports.length.toString(), yPos);
      
      const compliant = complianceReports.filter(r => r.overallCompliance === 'Compliant').length;
      const nonCompliant = complianceReports.filter(r => r.overallCompliance === 'Non-Compliant').length;
      const partial = complianceReports.filter(r => r.overallCompliance === 'Partially Compliant').length;

      yPos = addTableRow('Compliant', compliant.toString(), yPos);
      yPos = addTableRow('Partially Compliant', partial.toString(), yPos);
      yPos = addTableRow('Non-Compliant', nonCompliant.toString(), yPos);
      yPos += 10;

      // List compliance reports
      doc.fontSize(12)
         .fillColor('#4F46E5')
         .text('Compliance Details:', 50, yPos)
         .fillColor('#000000')
         .fontSize(9);
      yPos += 25;

      complianceReports.forEach((report, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc.fontSize(10)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${report.surveyType}`, 60, yPos);
        
        yPos += 15;
        doc.fontSize(8)
           .fillColor('#6B7280')
           .text(`   Date: ${report.complianceSubmittedAt ? new Date(report.complianceSubmittedAt).toLocaleDateString() : 'N/A'}`, 60, yPos);
        
        yPos += 12;
        doc.fillColor(
          report.overallCompliance === 'Compliant' ? '#10B981' :
          report.overallCompliance === 'Non-Compliant' ? '#DC2626' :
          '#F59E0B'
        ).text(`   Status: ${report.overallCompliance || 'Pending'}`, 60, yPos);
        
        yPos += 20;
      });
    }

    // Predictive Maintenance Section
    if (maintenancePredictions && maintenancePredictions.length > 0) {
      doc.addPage();
      yPos = 50;
      yPos = addSectionHeader('PREDICTIVE MAINTENANCE INSIGHTS', yPos);

      maintenancePredictions.forEach((prediction, index) => {
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc.fontSize(11)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${prediction.component}`, 60, yPos);
        
        yPos += 18;
        doc.fontSize(9)
           .fillColor('#6B7280')
           .text(`Prediction: ${prediction.prediction}`, 70, yPos, { width: 450 });
        
        yPos += doc.heightOfString(`Prediction: ${prediction.prediction}`, { width: 450 }) + 5;
        
        doc.fillColor(
          prediction.risk === 'High' ? '#DC2626' :
          prediction.risk === 'Medium' ? '#F59E0B' :
          '#10B981'
        ).text(`Risk Level: ${prediction.risk}`, 70, yPos);
        
        yPos += 15;
        
        if (prediction.recommendation) {
          doc.fillColor('#6B7280')
             .text(`Recommendation: ${prediction.recommendation}`, 70, yPos, { width: 450 });
          yPos += doc.heightOfString(`Recommendation: ${prediction.recommendation}`, { width: 450 }) + 10;
        }
        
        yPos += 15;
      });
    }

    // Footer on last page
    doc.fontSize(8)
       .fillColor('#9CA3AF')
       .text(
         `Report generated by Marine Survey System on ${new Date().toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         })}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );

    // Finalize PDF
    doc.end();

  } catch (err) {
    console.error('Error generating ship report:', err);
    res.status(500).json({ msg: 'Error generating report', error: err.message });
  }
});

module.exports = router;
