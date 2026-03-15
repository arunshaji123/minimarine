const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Survey = require('../models/Survey');
const Vessel = require('../models/Vessel');
const Certificate = require('../models/Certificate');

// Test endpoint to verify routing works
router.get('/test', (req, res) => {
  res.json({ message: 'Certificate routes are working!' });
});

// @route   GET api/certificates
// @desc    Get all certificates (for ship management and admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Owners can only see certificates for their vessels
    if (req.user.role === 'owner') {
      const vessels = await Vessel.find({ owner: req.user.id });
      const vesselIds = vessels.map(v => v._id);
      query.vessel = { $in: vesselIds };
    }
    // Surveyors can only see certificates they issued
    else if (req.user.role === 'surveyor') {
      query.issuedBy = req.user.id;
    }
    // Ship management, admin, and cargo_manager can see all certificates
    
    const certificates = await Certificate.find(query)
      .populate('vessel', 'name imo vesselId')
      .populate('issuedBy', 'name email')
      .populate('survey', 'surveyType scheduledDate')
      .sort({ issueDate: -1 });

    res.json(certificates);
  } catch (err) {
    console.error('Error fetching certificates:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate Certificate for Survey
router.post('/generate/:surveyId', auth, async (req, res) => {
  try {
    console.log('📄 Certificate generation requested for survey:', req.params.surveyId);
    console.log('📄 User ID:', req.user.id);
    console.log('📄 User role:', req.user.role);
    
    // Fetch survey with all details
    const survey = await Survey.findById(req.params.surveyId)
      .populate('vessel')
      .populate('surveyor');
    
    if (!survey) {
      console.error('❌ Survey not found:', req.params.surveyId);
      return res.status(404).json({ message: 'Survey not found' });
    }

    console.log('📋 Survey found:', {
      id: survey._id,
      type: survey.surveyType,
      status: survey.status,
      vessel: survey.vessel?.name,
      surveyor: survey.surveyor?.email
    });

    // Check if surveyor exists
    if (!survey.surveyor) {
      console.error('❌ Survey has no assigned surveyor');
      return res.status(400).json({ 
        message: 'Survey has no assigned surveyor' 
      });
    }

    // Only surveyor who conducted the survey can generate certificate
    if (survey.surveyor._id.toString() !== req.user.id) {
      console.error('❌ User not authorized. Survey by:', survey.surveyor._id, 'User:', req.user.id);
      return res.status(403).json({ 
        message: 'Only the assigned surveyor can generate certificate' 
      });
    }

    if (survey.status !== 'Completed') {
      console.error('❌ Survey not completed. Status:', survey.status);
      return res.status(400).json({ 
        message: 'Certificate can only be generated for completed surveys' 
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ survey: survey._id });
    
    if (!certificate) {
      console.log('📝 Creating new certificate...');
      // Generate new certificate
      const certificateNumber = await generateCertificateNumber(survey);
      const status = determineStatus(survey);
      const overallRating = calculateOverallRating(survey);
      
      console.log('📊 Certificate data:', {
        certificateNumber,
        status,
        overallRating
      });
      
      certificate = new Certificate({
        certificateNumber,
        survey: survey._id,
        vessel: survey.vessel._id,
        surveyType: survey.surveyType,
        issueDate: new Date(),
        expiryDate: calculateExpiryDate(survey.surveyType),
        issuedBy: survey.surveyor._id,
        status,
        overallRating,
        complianceDetails: {
          hullInspection: {
            rating: survey.hullInspection || 0,
            findings: survey.hullInspectionFindings || ''
          },
          deckSuperstructure: {
            rating: survey.deckSuperstructure || 0,
            findings: survey.deckSuperstructureFindings || ''
          },
          machineryEngineRoom: {
            rating: survey.machineryEngineRoom || 0,
            findings: survey.machineryEngineRoomFindings || ''
          },
          electricalSystems: {
            rating: survey.electricalSystems || 0,
            findings: survey.electricalSystemsFindings || ''
          },
          safetyEquipment: {
            rating: survey.safetyEquipment || 0,
            findings: survey.safetyEquipmentFindings || ''
          },
          navigationEquipment: {
            rating: survey.navigationEquipment || 0,
            findings: survey.navigationEquipmentFindings || ''
          },
          pollutionControlSystems: {
            rating: survey.pollutionControlSystems || 0,
            findings: survey.pollutionControlSystemsFindings || ''
          },
          certificatesDocumentation: {
            rating: survey.certificatesDocumentation || 0,
            findings: survey.certificatesDocumentationFindings || ''
          }
        },
        recommendations: survey.recommendations || 'No specific recommendations'
      });
      
      await certificate.save();
      console.log('✅ Certificate created:', certificate.certificateNumber);
    } else {
      console.log('📄 Using existing certificate:', certificate.certificateNumber);
    }

    // Generate PDF (pass survey object which already has vessel and surveyor populated)
    console.log('🎨 Generating PDF...');
    console.log('📄 Survey vessel:', survey.vessel?.name);
    console.log('📄 Survey surveyor:', survey.surveyor?.name || survey.surveyor?.email);
    const pdfPath = await generateCertificatePDF(certificate, survey);
    console.log('✅ PDF generated at:', pdfPath);
    
    
    console.log('📥 Sending PDF to client...');
    
    // Send PDF as download
    res.download(pdfPath, `Certificate_${certificate.certificateNumber}.pdf`, (err) => {
      if (err) {
        console.error('❌ Error sending certificate:', err);
      } else {
        console.log('✅ Certificate sent successfully');
      }
      // Clean up temporary file
      try {
        fs.unlinkSync(pdfPath);
      } catch (unlinkErr) {
        console.error('Error deleting temp file:', unlinkErr);
      }
    });

  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    res.status(500).json({ 
      message: 'Error generating certificate', 
      error: error.message 
    });
  }
});

// Generate unique certificate number
async function generateCertificateNumber(survey) {
  const year = new Date().getFullYear();
  const typeCode = survey.surveyType.substring(0, 3).toUpperCase();
  
  // Count certificates this year
  const count = await Certificate.countDocuments({
    createdAt: { 
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `MSC-${typeCode}-${year}-${sequence}`;
}

// Calculate expiry date based on survey type
function calculateExpiryDate(surveyType) {
  const issueDate = new Date();
  
  const validityPeriods = {
    'Annual': 12,
    'Intermediate': 30,
    'Special': 60,
    'Drydock': 60,
    'Renewal': 60,
    'Damage': 6,
    'Pre-Purchase': 3,
    'Other': 12
  };
  
  const months = validityPeriods[surveyType] || 12;
  issueDate.setMonth(issueDate.getMonth() + months);
  
  return issueDate;
}

// Determine certificate status
function determineStatus(survey) {
  const ratings = [
    survey.hullInspection || 0,
    survey.deckSuperstructure || 0,
    survey.machineryEngineRoom || 0,
    survey.electricalSystems || 0,
    survey.safetyEquipment || 0,
    survey.navigationEquipment || 0,
    survey.pollutionControlSystems || 0,
    survey.certificatesDocumentation || 0
  ];
  
  const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  const minRating = Math.min(...ratings);
  
  if (avgRating >= 4.0 && minRating >= 3.0) return 'Approved';
  if (avgRating >= 3.0) return 'Conditional';
  return 'Deficient';
}

// Calculate overall rating
function calculateOverallRating(survey) {
  const ratings = [
    survey.hullInspection || 0,
    survey.deckSuperstructure || 0,
    survey.machineryEngineRoom || 0,
    survey.electricalSystems || 0,
    survey.safetyEquipment || 0,
    survey.navigationEquipment || 0,
    survey.pollutionControlSystems || 0,
    survey.certificatesDocumentation || 0
  ];
  
  return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2);
}

// Generate PDF Certificate
async function generateCertificatePDF(certificate, survey) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 }
      });
      
      const fileName = `cert_${certificate.certificateNumber}_${Date.now()}.pdf`;
      const tempDir = path.join(__dirname, '../temp');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const filePath = path.join(tempDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // ====================
      // HEADER SECTION
      // ====================
      doc.rect(0, 0, 612, 100).fill('#1e3a8a');
      
      doc.fontSize(28)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('MARINE SURVEY CERTIFICATE', 0, 30, { align: 'center' });
      
      doc.fontSize(11)
         .fillColor('#e0e7ff')
         .font('Helvetica')
         .text('Official Certificate of Marine Survey Inspection', 0, 65, { align: 'center' });
      
      doc.fontSize(10)
         .fillColor('#ffffff')
         .text(`Certificate No: ${certificate.certificateNumber}`, 0, 85, { align: 'center' });
      
      doc.moveDown(3);
      
      // ====================
      // STATUS BADGE
      // ====================
      const statusColors = {
        'Approved': { bg: '#22c55e', text: '#ffffff' },
        'Conditional': { bg: '#f59e0b', text: '#ffffff' },
        'Deficient': { bg: '#ef4444', text: '#ffffff' }
      };
      
      const statusColor = statusColors[certificate.status];
      const statusY = 120;
      
      doc.roundedRect(200, statusY, 212, 40, 5)
         .fill(statusColor.bg);
      
      doc.fontSize(18)
         .fillColor(statusColor.text)
         .font('Helvetica-Bold')
         .text(`STATUS: ${certificate.status.toUpperCase()}`, 50, statusY + 12, { 
           align: 'center',
           width: 512
         });
      
      doc.fillColor('#000000');
      doc.moveDown(3);
      
      // ====================
      // VESSEL INFORMATION
      // ====================
      const currentY = doc.y + 20;
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#4b5563')
         .text('This is to certify that the vessel:', 50, currentY, { align: 'center', width: 512 });
      
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text((survey.vessel?.name || 'Unknown Vessel').toUpperCase(), 50, currentY + 25, { 
           align: 'center', 
           width: 512 
         });
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(
           `IMO: ${survey.vessel?.imo || 'N/A'} | Vessel ID: ${survey.vessel?.vesselId || 'N/A'}`,
           50, currentY + 55, 
           { align: 'center', width: 512 }
         );
      
      doc.moveDown(3);
      
      // ====================
      // SURVEY DETAILS TABLE
      // ====================
      const tableY = doc.y + 10;
      const col1X = 70;
      const col2X = 300;
      
      doc.rect(50, tableY - 10, 512, 180)
         .stroke('#e5e7eb');
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('SURVEY DETAILS', 50, tableY, { align: 'center', width: 512 });
      
      const details = [
        ['Survey Type:', survey.surveyType],
        ['Survey Date:', survey.completionDate?.toLocaleDateString() || new Date().toLocaleDateString()],
        ['Vessel Type:', survey.vessel?.vesselType || 'N/A'],
        ['Flag State:', survey.vessel?.flag || 'N/A'],
        ['Year Built:', survey.vessel?.yearBuilt?.toString() || 'N/A'],
        ['Gross Tonnage:', `${survey.vessel?.grossTonnage || 'N/A'} GT`],
        ['Owner:', survey.vessel?.owner?.companyName || 'N/A']
      ];
      
      let detailY = tableY + 25;
      doc.fontSize(10);
      
      details.forEach(([label, value]) => {
        doc.font('Helvetica-Bold')
           .fillColor('#374151')
           .text(label, col1X, detailY);
        
        doc.font('Helvetica')
           .fillColor('#6b7280')
           .text(value, col2X, detailY);
        
        detailY += 20;
      });
      
      doc.moveDown(4);
      
      // ====================
      // COMPLIANCE RATINGS
      // ====================
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('INSPECTION RESULTS', 50, doc.y, { align: 'center', width: 512, underline: true });
      
      doc.moveDown(1);
      
      const components = [
        { name: 'Hull Inspection', rating: certificate.complianceDetails.hullInspection.rating },
        { name: 'Deck & Superstructure', rating: certificate.complianceDetails.deckSuperstructure.rating },
        { name: 'Machinery & Engine Room', rating: certificate.complianceDetails.machineryEngineRoom.rating },
        { name: 'Electrical Systems', rating: certificate.complianceDetails.electricalSystems.rating },
        { name: 'Safety Equipment', rating: certificate.complianceDetails.safetyEquipment.rating },
        { name: 'Navigation Equipment', rating: certificate.complianceDetails.navigationEquipment.rating },
        { name: 'Pollution Control Systems', rating: certificate.complianceDetails.pollutionControlSystems.rating },
        { name: 'Certificates & Documentation', rating: certificate.complianceDetails.certificatesDocumentation.rating }
      ];
      
      doc.fontSize(10).font('Helvetica');
      
      components.forEach(comp => {
        const y = doc.y;
        const rating = comp.rating || 0;
        
        doc.fillColor('#374151')
           .text(comp.name, col1X, y, { width: 200 });
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '★'.repeat(fullStars);
        if (hasHalfStar) stars += '⯨';
        stars += '☆'.repeat(emptyStars);
        
        doc.fillColor('#fbbf24')
           .text(stars, col2X, y, { width: 100 });
        
        doc.fillColor('#6b7280')
           .text(`${rating.toFixed(1)}/5.0`, col2X + 100, y);
        
        doc.moveDown(0.7);
      });
      
      doc.moveDown(1);
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text(`OVERALL RATING: ${certificate.overallRating}/5.0`, 50, doc.y, { 
           align: 'center', 
           width: 512 
         });
      
      doc.moveDown(2);
      
      // ====================
      // REGULATORY COMPLIANCE SECTION
      // ====================
      if (survey.complianceStatus) {
        doc.addPage();
        
        // Header for compliance page
        doc.rect(0, 0, 612, 80).fill('#1e3a8a');
        
        doc.fontSize(24)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text('REGULATORY COMPLIANCE REPORT', 0, 25, { align: 'center' });
        
        doc.fontSize(10)
           .fillColor('#e0e7ff')
           .font('Helvetica')
           .text(`Certificate No: ${certificate.certificateNumber}`, 0, 55, { align: 'center' });
        
        doc.moveDown(3);
        
        // Helper function to get compliance status text and color
        const getComplianceStatus = (status) => {
          const statusMap = {
            'not-compliant': { text: 'Not Compliant', color: '#ef4444' },
            'pending': { text: 'Pending', color: '#f59e0b' },
            'semi-moderate': { text: 'Semi Moderate', color: '#f97316' },
            'moderate': { text: 'Moderate', color: '#22c55e' },
            'compliant': { text: 'Compliant', color: '#22c55e' }
          };
          return statusMap[status] || { text: status || 'Unknown', color: '#6b7280' };
        };
        
        // Render compliance section
        const renderComplianceSection = (title, sectionData, startY) => {
          if (!sectionData) return startY;
          
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .fillColor('#1e3a8a')
             .text(title, 70, startY);
          
          let currentY = startY + 20;
          
          Object.keys(sectionData).forEach((key) => {
            const value = sectionData[key];
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const statusInfo = getComplianceStatus(value);
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#374151')
               .text(`• ${label}:`, 90, currentY);
            
            doc.fillColor(statusInfo.color)
               .font('Helvetica-Bold')
               .text(statusInfo.text, 300, currentY);
            
            currentY += 18;
          });
          
          return currentY + 10;
        };
        
        let complianceY = 110;
        
        // SOLAS Compliance
        if (survey.complianceStatus.solas) {
          complianceY = renderComplianceSection('SOLAS (Safety of Life at Sea) Compliance', survey.complianceStatus.solas, complianceY);
        }
        
        // MARPOL Compliance
        if (survey.complianceStatus.marpol) {
          complianceY = renderComplianceSection('MARPOL (Marine Pollution) Compliance', survey.complianceStatus.marpol, complianceY);
        }
        
        // Load Line Compliance
        if (survey.complianceStatus.loadLine) {
          complianceY = renderComplianceSection('Load Line Compliance', survey.complianceStatus.loadLine, complianceY);
        }
        
        // ISM Code Compliance
        if (survey.complianceStatus.ism) {
          complianceY = renderComplianceSection('ISM Code Compliance', survey.complianceStatus.ism, complianceY);
        }
        
        // Classification Compliance
        if (survey.complianceStatus.classification) {
          complianceY = renderComplianceSection('Classification Society Compliance', survey.complianceStatus.classification, complianceY);
        }
        
        doc.moveDown(2);
      }
      
      // Return to original page or add new page for signature
      if (!survey.complianceStatus) {
        doc.moveDown(2);
      }
      
      // ====================
      // VALIDITY & SIGNATURE
      // ====================
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280');
      
      const validityY = doc.y;
      
      doc.text(`Issue Date: ${certificate.issueDate.toLocaleDateString()}`, col1X, validityY);
      doc.text(`Valid Until: ${certificate.expiryDate.toLocaleDateString()}`, col2X, validityY);
      
      doc.moveDown(2);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Issued By:', col1X, doc.y);
      
      doc.font('Helvetica')
         .fillColor('#6b7280')
         .text(survey.surveyor?.name || survey.surveyor?.email || 'Unknown Surveyor', col1X, doc.y + 15);
      
      doc.text(`License: ${survey.surveyor?.licenseNumber || 'N/A'}`, col1X, doc.y + 15);
      
      doc.moveTo(col2X, doc.y - 20)
         .lineTo(col2X + 150, doc.y - 20)
         .stroke('#9ca3af');
      
      doc.fontSize(8)
         .text('Authorized Signature', col2X, doc.y, { width: 150, align: 'center' });
      
      // ====================
      // FOOTER
      // ====================
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text(
           'This is a digitally generated certificate. For verification, contact Marine Survey Management System.',
           50, 770, 
           { align: 'center', width: 512 }
         );
      
      doc.text(`Generated: ${new Date().toLocaleString()}`, 50, 785, { 
        align: 'center', 
        width: 512 
      });
      
      doc.end();
      
      stream.on('finish', () => {
        console.log('✅ PDF generated successfully:', filePath);
        resolve(filePath);
      });
      
      stream.on('error', (err) => {
        console.error('❌ PDF generation error:', err);
        reject(err);
      });
      
    } catch (error) {
      console.error('❌ PDF creation error:', error);
      reject(error);
    }
  });
}

// Get certificates issued by surveyor
router.get('/surveyor/my-certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ issuedBy: req.user.id })
      .populate('vessel', 'name vesselId imo vesselType')
      .populate('survey', 'surveyType scheduledDate completionDate')
      .sort({ issueDate: -1 });
    
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificates', error: error.message });
  }
});

// Get certificates for owner's vessels (also supports ship management companies)
router.get('/owner/my-certificates', auth, async (req, res) => {
  try {
    const Vessel = require('../models/Vessel');
    
    // For ship management companies, show ALL certificates in the system
    // For owners, show only certificates for their vessels
    let certificates;
    
    if (req.user.role === 'ship_management') {
      // Ship management sees all certificates in the system
      certificates = await Certificate.find({})
        .populate('vessel', 'name vesselId imo vesselType')
        .populate('survey', 'surveyType scheduledDate completionDate')
        .populate('issuedBy', 'name email licenseNumber')
        .sort({ issueDate: -1 });
    } else {
      // Owners see only certificates for their vessels
      const vessels = await Vessel.find({ owner: req.user.id });
      const vesselIds = vessels.map(v => v._id);
      
      certificates = await Certificate.find({ vessel: { $in: vesselIds } })
        .populate('vessel', 'name vesselId imo vesselType')
        .populate('survey', 'surveyType scheduledDate completionDate')
        .populate('issuedBy', 'name email licenseNumber')
        .sort({ issueDate: -1 });
    }
    
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificates', error: error.message });
  }
});

// Get certificates for a vessel
router.get('/vessel/:vesselId', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ vessel: req.params.vesselId })
      .populate('vessel', 'name vesselId imo vesselType')
      .populate('survey')
      .populate('issuedBy', 'name email licenseNumber')
      .sort({ issueDate: -1 });
    
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching certificates', error: error.message });
  }
});

// Download/View existing certificate
router.get('/:certificateId/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId)
      .populate({
        path: 'survey',
        populate: { path: 'vessel surveyor' }
      });
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    const pdfPath = await generateCertificatePDF(certificate, certificate.survey);
    
    // Check if this is for viewing (has token param) or downloading
    const isViewing = req.query.token !== undefined;
    
    if (isViewing) {
      // Send PDF for inline viewing in browser/iframe
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Certificate_${certificate.certificateNumber}.pdf"`);
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlinkSync(pdfPath);
      });
      
      fileStream.on('error', (err) => {
        console.error('Error streaming certificate:', err);
        fs.unlinkSync(pdfPath);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming certificate' });
        }
      });
    } else {
      // Force download
      res.download(pdfPath, `Certificate_${certificate.certificateNumber}.pdf`, (err) => {
        if (err) {
          console.error('Error sending certificate:', err);
        }
        fs.unlinkSync(pdfPath);
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error downloading certificate', error: error.message });
  }
});

module.exports = router;
