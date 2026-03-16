import React, { useState, useEffect } from 'react';
import { FaClipboardList, FaClipboardCheck, FaFileAlt, FaFolderOpen, FaChartLine } from 'react-icons/fa';
import DashboardLayout from '../layouts/DashboardLayout';
import UserProfileModal from '../UserProfileModal.jsx';
import DocumentList from '../DocumentList';
import SurveyFormModal from '../modals/SurveyFormModal';
import SurveyDetailsModal from '../modals/SurveyDetailsModal';
import ComplianceReportModal from '../modals/ComplianceReportModal';
import PremiumInspectionDetailsModal from '../modals/PremiumInspectionDetailsModal';
import HullInspectionReportModal from '../modals/HullInspectionReportModal';
import PredictiveMaintenanceTab from './PredictiveMaintenanceTab';
import HullInspection from '../HullInspection';
import { downloadHullInspectionPdf, getHullConditionLabel } from '../../utils/hullInspectionPdf';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';

// Certificate PDF Viewer Component
const CertificatePdfViewer = ({ certificate, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/api/certificates/${certificate._id}/download`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load certificate');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [certificate._id]);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/certificates/${certificate._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${certificate.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Marine Survey Certificate
            </h3>
            <p className="text-sm text-gray-600 mt-1">Certificate #{certificate.certificateNumber}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
              title="Download PDF"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading certificate...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Download Certificate Instead
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Certificate ${certificate.certificateNumber}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function SurveyorDashboard() {
  const { user } = useAuth();
  const { warning, success, error: showError } = useToast();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  // Derived from accepted bookings
  const [upcomingSurveys, setUpcomingSurveys] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [aiReports, setAiReports] = useState([]); // Separate state for AI reports
  const [hullInspectionSurvey, setHullInspectionSurvey] = useState(null); // Hull inspection survey
  const [complianceIssues, setComplianceIssues] = useState([]);
  // State for compliance reports
  const [complianceReports, setComplianceReports] = useState([]);
  // State for premium reports from localStorage
  const [premiumReports, setPremiumReports] = useState([]);
  const [hullInspectionReports, setHullInspectionReports] = useState([]);
  // Add state for delete confirmation modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, reportId: null, reportName: '' });
  const [hullDeleteConfirmModal, setHullDeleteConfirmModal] = useState({ open: false, reportId: null, reportName: '' });
  
  // State for compliance reports filters
  const [complianceReportsFilters, setComplianceReportsFilters] = useState({
    vesselType: '',
    dateRange: '',
    alphabetical: ''
  });

  // Booking state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const { counts } = useUnreadCounts();
  const [shipMgmtUserId, setShipMgmtUserId] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ open: false, booking: null });

  // Survey form modal state
  const [surveyFormModal, setSurveyFormModal] = useState({ open: false, survey: null });
  const [surveyDetailsModal, setSurveyDetailsModal] = useState({ open: false, survey: null });
  
  // Compliance report modal state
  const [complianceReportModal, setComplianceReportModal] = useState({ open: false, survey: null });
  
  // Premium inspection details modal state
  const [premiumInspectionDetailsModal, setPremiumInspectionDetailsModal] = useState({ open: false, report: null });
    const [hullInspectionDetailsModal, setHullInspectionDetailsModal] = useState({ open: false, report: null });
  
  // Certificate detail modal state
  const [certificateDetailModal, setCertificateDetailModal] = useState({ open: false, certificate: null });
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(null);
  
  // State for action dropdown
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null);
  
  // State for filters
  const [activeSurveysFilters, setActiveSurveysFilters] = useState({
    vesselType: '',
    dateRange: '',
    alphabetical: ''
  });
  
  const [recentReportsFilters, setRecentReportsFilters] = useState({
    vesselType: '',
    dateRange: '',
    alphabetical: ''
  });
  
  // State for booking notifications filters
  const [bookingNotificationsFilters, setBookingNotificationsFilters] = useState({
    vesselType: '',
    dateRange: '',
    status: '',
    alphabetical: ''
  });
  
  // State for search
  const [bookingNotificationsSearch, setBookingNotificationsSearch] = useState('');
  const [activeSurveysSearch, setActiveSurveysSearch] = useState('');
  const [upcomingSurveysSearch, setUpcomingSurveysSearch] = useState('');
  const [recentReportsSearch, setRecentReportsSearch] = useState('');
  const [complianceReportsSearch, setComplianceReportsSearch] = useState('');
  // State for compliance status tracking
  const [complianceStatus, setComplianceStatus] = useState({
    solas: {},
    marpol: {},
    loadLine: {},
    ism: {},
    classification: {}
  });

  // State for predictive maintenance
  const [vessels, setVessels] = useState([]);
  const [knnPredictions, setKnnPredictions] = useState([]);
  const [knnLoading, setKnnLoading] = useState(false);
  const [knnError, setKnnError] = useState(null);
  const [knnRefreshKey, setKnnRefreshKey] = useState(0);
  const [selectedVessel, setSelectedVessel] = useState(null);

  // State for certificates
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);

  // State to track if we are in view-only mode for compliance
  const [isComplianceViewOnly, setIsComplianceViewOnly] = useState(false);

  // Helper function to check if all checkboxes in a section are checked
  const areAllChecked = (section) => {
    return Object.values(section).every(value => value === true);
  };

  // Helper function to check if all compliance items in a section have a status
  const areAllStatusSet = (section) => {
    return Object.values(section).every(value => value !== undefined && value !== null);
  };

  // Helper function to check if all compliance sections are completed
  const isAllComplianceCompleted = () => {
    return (
      areAllStatusSet(complianceStatus.solas) &&
      areAllStatusSet(complianceStatus.marpol) &&
      areAllStatusSet(complianceStatus.loadLine) &&
      areAllStatusSet(complianceStatus.ism) &&
      areAllStatusSet(complianceStatus.classification)
    );
  };

  // State to track the current survey for compliance tracking
  const [currentSurveyForCompliance, setCurrentSurveyForCompliance] = useState(null);

  // Function to submit compliance data for a specific survey
  const submitComplianceData = async () => {
    if (!currentSurveyForCompliance || !isAllComplianceCompleted()) {
      return; // Don't submit if no survey is selected or compliance is not complete
    }
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Prepare the compliance data to submit
      const complianceData = {
        surveyId: currentSurveyForCompliance.id || currentSurveyForCompliance._id,
        complianceStatus: complianceStatus,
        submittedAt: new Date().toISOString(),
        submittedBy: user?.id
      };
      
      // Submit compliance data to the backend
      await axios.put(`/api/surveys/${currentSurveyForCompliance.id || currentSurveyForCompliance._id}/compliance`, complianceData, config);
      
      // Show success message
      setSuccessMessage('Compliance data submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload completed surveys to reflect the updated status
      loadCompletedSurveys();
      // Also reload bookings to update the status in the surveys table
      loadBookings();
      
      // Update the current survey with the compliance data
      if (currentSurveyForCompliance) {
        // Update the current survey object with the new compliance status
        setCurrentSurveyForCompliance(prev => ({
          ...prev,
          complianceStatus: complianceData.complianceStatus,
          complianceSubmittedAt: complianceData.submittedAt,
          complianceSubmittedBy: complianceData.submittedBy
        }));
      }
      
    } catch (err) {
      console.error('Error submitting compliance data:', err);
      setError('Failed to submit compliance data');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to check if a specific survey has its compliance completed
  const isSurveyComplianceCompleted = (survey) => {
    // Check if the survey has compliance data submitted
    if (survey.complianceStatus) {
      // Check if all compliance sections have status values
      const complianceStatus = survey.complianceStatus;
      
      // Check all SOLAS compliance items
      const solasComplete = complianceStatus.solas && 
        Object.values(complianceStatus.solas).every(value => value !== undefined && value !== null);
      
      // Check all MARPOL compliance items
      const marpolComplete = complianceStatus.marpol && 
        Object.values(complianceStatus.marpol).every(value => value !== undefined && value !== null);
      
      // Check all Load Line compliance items
      const loadLineComplete = complianceStatus.loadLine && 
        Object.values(complianceStatus.loadLine).every(value => value !== undefined && value !== null);
      
      // Check all ISM compliance items
      const ismComplete = complianceStatus.ism && 
        Object.values(complianceStatus.ism).every(value => value !== undefined && value !== null);
      
      // Check all Classification compliance items
      const classificationComplete = complianceStatus.classification && 
        Object.values(complianceStatus.classification).every(value => value !== undefined && value !== null);
      
      // All sections must be complete for compliance to be considered complete
      return solasComplete && marpolComplete && loadLineComplete && ismComplete && classificationComplete;
    }
    return false;
  };

  // Function to fetch predictions for a specific vessel
  const fetchKNNPredictions = async (vesselId) => {
    if (!vesselId || knnLoading) return;
    
    try {
      setKnnLoading(true);
      setKnnError(null);
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const url = `/api/knn/predictions/${vesselId}`;
      const vessel = vessels.find(v => v._id === vesselId);
      console.log('Fetching predictions for vessel:', vessel?.name, vesselId);
      
      const response = await axios.get(url, config);
      console.log('Prediction API response:', response.data);
      
      // Extract predictions from the response
      if (response.data.predictions && Array.isArray(response.data.predictions)) {
        // Add vessel info to each prediction
        const predictionsWithVessel = response.data.predictions.map(pred => ({
          ...pred,
          vesselName: vessel?.name || response.data.vessel?.name,
          vesselId: vesselId,
          vesselIMO: vessel?.imo || response.data.vessel?.imo
        }));
        setKnnPredictions(predictionsWithVessel);
      } else if (response.data.message) {
        setKnnError(response.data.message);
        setKnnPredictions([]);
      }
    } catch (err) {
      console.error('Error fetching KNN predictions:', err);
      console.error('Error details:', err.response?.data);
      setKnnError(err.response?.data?.error || err.message || 'Failed to load predictive maintenance data');
      setKnnPredictions([]);
    } finally {
      setKnnLoading(false);
    }
  };

  const handleStartSurvey = (survey) => {
    // Format the survey data to match what SurveyFormModal expects
    const surveyData = {
      id: survey.id || survey._id,
      vessel: survey.vessel?.name || survey.vesselName || 'Unknown Vessel',
      type: survey.type || survey.surveyType || 'Unknown Type',
      vesselId: survey.vessel?.vesselId || survey.vessel?._id || 'N/A',
      surveyType: survey.surveyType || survey.type,
      inspectionDate: survey.scheduled || survey.inspectionDate,
      vesselInfo: survey.vessel, // Pass the full vessel object for use in the form
      // Include other relevant fields that might be needed
      ...survey // Spread the original survey data to preserve other fields
    };
    
    console.log('Starting survey with data:', surveyData);
    console.log('Survey ID being used:', surveyData.id);
    setSurveyFormModal({ open: true, survey: surveyData });
  };

  // Add this function to handle survey submission completion
  const handleSurveySubmitted = () => {
    // Reload completed surveys to show the newly submitted report
    loadCompletedSurveys();
    // Also reload bookings to update the status in the surveys table
    loadBookings();
  };

  // Navigation state
  const [activeSection, setActiveSection] = useState(location.state?.activeSection || 'bookings');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for AI Image Analysis
  const [currentSurveyForAI, setCurrentSurveyForAI] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [aiAnalysisResults, setAiAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [expandedAIReport, setExpandedAIReport] = useState(null);
  const [selectedImageTypes, setSelectedImageTypes] = useState({});

  useEffect(() => {
    // Fetch Ship Management users to chat with
    (async () => {
      try {
        const res = await axios.get('/api/messages/users', { params: { role: 'ship_management' } });
        const first = (res.data.users || [])[0];
        if (first) setShipMgmtUserId(first._id);
      } catch (e) {
        // ignore errors here
      }
    })();
  }, []);

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
    loadCompletedSurveys(); // Load survey reports
    loadAiReports(); // Load AI damage detection reports
    loadComplianceReports(); // Load compliance reports
    loadPremiumReports(); // Load premium reports from localStorage
    loadHullInspectionReports(); // Load hull inspection reports from localStorage
    loadCertificates(); // Load generated certificates
  }, []);

  // Check for deletion notifications
  useEffect(() => {
    // Check if any bookings have deletion reasons and show notifications
    if (bookings && bookings.length > 0) {
      bookings.forEach(booking => {
        if (booking.deletionReason) {
          warning(`Booking for ${booking.vesselName} was deleted. Reason: ${booking.deletionReason}`);
        }
      });
    }
  }, [bookings]);

  // Handle closing dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown if click is outside and dropdown is open
      if (actionDropdownOpen && event.target.closest('.relative.inline-block.text-left') === null) {
        setActionDropdownOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [actionDropdownOpen]);

  // Add this new function to load completed surveys
  const loadCompletedSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('/api/surveys/completed', config);
      
      console.log('📊 Loaded completed surveys:', response.data.length);
      console.log('📊 Surveys with aiAnalysis field:', response.data.filter(s => s.aiAnalysis).length);
      console.log('📊 Surveys with aiAnalysis.analyzed=true:', response.data.filter(s => s.aiAnalysis?.analyzed === true).length);
      console.log('📊 First 5 surveys:', response.data.slice(0, 5).map(s => ({ 
        id: s._id, 
        title: s.title, 
        hasAI: !!s.aiAnalysis,
        aiAnalyzed: s.aiAnalysis?.analyzed,
        aiType: typeof s.aiAnalysis,
        aiKeys: s.aiAnalysis ? Object.keys(s.aiAnalysis) : []
      })));
      
      // Store the full survey objects
      setRecentReports(response.data);
    } catch (err) {
      console.error('Error loading completed surveys:', err);
      // Don't set error state here as it's not critical
      // Set empty array to prevent undefined errors
      setRecentReports([]);
    }
  };

  // Load AI reports from dedicated endpoint
  const loadAiReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('/api/surveys/ai-reports', config);
      
      console.log('🤖 Loaded AI reports:', response.data.length);
      console.log('🤖 AI reports data:', response.data.map(r => ({
        id: r._id,
        title: r.title,
        hasAI: !!r.aiAnalysis,
        analyzed: r.aiAnalysis?.analyzed,
        totalImages: r.aiAnalysis?.totalImages,
        damagesDetected: r.aiAnalysis?.damagesDetected
      })));
      
      setAiReports(response.data);
    } catch (err) {
      console.error('Error loading AI reports:', err);
      setAiReports([]);
    }
  };

  // Function to load certificates
  const loadCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('/api/certificates/surveyor/my-certificates', config);
      setCertificates(response.data);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };

  // Derive "Upcoming Surveys" from accepted and completed bookings
  useEffect(() => {
    const items = (bookings || [])
      .filter(b => b.status === 'Accepted' || b.completedAt)
      .map(b => ({
        id: b._id,
        vessel: b.vessel, // Preserve the entire vessel object
        vesselName: b.vessel?.name || b.vesselName,
        type: b.surveyType,
        scheduled: b.inspectionDate,
        time: b.inspectionTime,
        location: b.location,
        client: b.bookedBy?.name || 'Ship Management',
        status: b.completedAt ? 'Completed' : b.status, // Show 'Completed' if survey was completed
        shipPhotos: b.shipPhotos || [],
        flightTicket: b.flightTicket,
        assignedAt: b.assignedAt,
        completedAt: b.completedAt // Include completedAt for filtering
      }));
    setUpcomingSurveys(items);
  }, [bookings]);

  // Fetch vessels that this surveyor has inspected (from completed surveys/recent reports)
  useEffect(() => {
    const fetchInspectedVessels = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        // Get completed surveys (same as recent reports section uses)
        const surveysRes = await axios.get('/api/surveys/completed', config);
        const completedSurveys = surveysRes.data;
        
        if (!completedSurveys || completedSurveys.length === 0) {
          console.log('No completed surveys found for this surveyor');
          setVessels([]);
          return;
        }
        
        // Extract unique vessels from completed surveys
        const uniqueVesselsMap = new Map();
        completedSurveys.forEach(survey => {
          if (survey.vessel) {
            const vesselData = typeof survey.vessel === 'object' ? survey.vessel : null;
            if (vesselData && vesselData._id) {
              // Store vessel object with ID as key to ensure uniqueness
              uniqueVesselsMap.set(vesselData._id, {
                _id: vesselData._id,
                name: vesselData.name || 'Unknown Vessel',
                imo: vesselData.imo || vesselData.imoNumber || '',
                vesselType: vesselData.vesselType || '',
                flag: vesselData.flag || ''
              });
            }
          }
        });
        
        const inspectedVessels = Array.from(uniqueVesselsMap.values());
        console.log(`Surveyor has completed surveys for ${inspectedVessels.length} vessels (from recent reports)`);
        setVessels(inspectedVessels);
        
        // Auto-select the first vessel
        if (inspectedVessels.length > 0 && !selectedVessel) {
          setSelectedVessel(inspectedVessels[0]._id);
        }
      } catch (err) {
        console.error('Error fetching inspected vessels:', err);
        setVessels([]);
      }
    };
    
    // Fetch when component mounts or when recentReports changes
    if (recentReports.length > 0) {
      fetchInspectedVessels();
    }
  }, [recentReports]);

  // Fetch predictions when selected vessel changes or refresh is triggered
  useEffect(() => {
    if (activeSection === 'predictive' && selectedVessel) {
      fetchKNNPredictions(selectedVessel);
    }
  }, [activeSection, selectedVessel, knnRefreshKey]);

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      console.log('Loading surveyor bookings...');
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('/api/surveyor-bookings', config);
      setBookings(response.data);
      
      console.log('Surveyor bookings loaded:', response.data.length, 'bookings');
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load booking data');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.put(`/api/surveyor-bookings/${bookingId}/accept`, {}, config);
      setSuccessMessage('Booking accepted successfully!');
      loadBookings(); // Reload bookings
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error accepting booking:', err);
      setError('Failed to accept booking');
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.put(`/api/surveyor-bookings/${bookingId}/decline`, {}, config);
      setSuccessMessage('Booking declined successfully!');
      loadBookings(); // Reload bookings
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error declining booking:', err);
      setError('Failed to decline booking');
    }
  };

  // Add this new function to load compliance reports
  const loadComplianceReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Fetch all completed surveys that have compliance data
      const response = await axios.get('/api/surveys/completed', config);
      
      // Filter to get only surveys that have compliance data submitted
      const complianceReports = response.data.filter(survey => {
        return survey.complianceStatus && 
               survey.complianceSubmittedAt && 
               isSurveyComplianceCompleted(survey);
      });
      
      setComplianceReports(complianceReports);
    } catch (err) {
      console.error('Error loading compliance reports:', err);
      // Don't set error state here as it's not critical
      // Set empty array to prevent undefined errors
      setComplianceReports([]);
    }
  };

  // Load premium reports from localStorage
  const loadPremiumReports = () => {
    try {
      const reports = JSON.parse(localStorage.getItem('premiumReports') || '[]');
      setPremiumReports(reports);
    } catch (err) {
      console.error('Error loading premium reports:', err);
      setPremiumReports([]);
    }
  };

  const loadHullInspectionReports = () => {
    try {
      const reports = JSON.parse(localStorage.getItem('hullInspectionReports') || '[]');
      const objectIdRegex = /^[a-f\d]{24}$/i;

      const normalizedReports = reports.map((report) => {
        const fallbackReadableId =
          report?.surveyMeta?.originalSurvey?.vessel?.vesselId ||
          report?.surveyMeta?.originalSurvey?.vesselId ||
          report?.surveyMeta?.vesselId ||
          report?.shipId ||
          report?.surveyId;

        const looksLikeObjectId = objectIdRegex.test(String(report?.displayId || report?.shipId || ''));

        if (looksLikeObjectId && fallbackReadableId && !objectIdRegex.test(String(fallbackReadableId))) {
          return {
            ...report,
            shipId: fallbackReadableId,
            displayId: fallbackReadableId
          };
        }

        return {
          ...report,
          displayId: report?.displayId || fallbackReadableId || report?.surveyId || report?.id
        };
      });

      localStorage.setItem('hullInspectionReports', JSON.stringify(normalizedReports));
      setHullInspectionReports(normalizedReports);
    } catch (err) {
      console.error('Error loading hull inspection reports:', err);
      setHullInspectionReports([]);
    }
  };

  const handleHullInspectionReportSaved = (report) => {
    setHullInspectionReports((prevReports) => [report, ...prevReports.filter((item) => item.id !== report.id)]);
  };

  const handleDeleteHullInspectionReport = (reportId) => {
    try {
      const updatedReports = hullInspectionReports.filter((report) => report.id !== reportId);
      setHullInspectionReports(updatedReports);
      localStorage.setItem('hullInspectionReports', JSON.stringify(updatedReports));
      setHullDeleteConfirmModal({ open: false, reportId: null, reportName: '' });
      setSuccessMessage('Hull inspection report deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting hull inspection report:', err);
      setError('Failed to delete hull inspection report.');
      setHullDeleteConfirmModal({ open: false, reportId: null, reportName: '' });
      setTimeout(() => setError(null), 3000);
    }
  };

  const cancelHullDeleteReport = () => {
    setHullDeleteConfirmModal({ open: false, reportId: null, reportName: '' });
  };

  const handleHullReportAction = (action, report) => {
    if (action === 'view') {
      setHullInspectionDetailsModal({ open: true, report });
      return;
    }

    if (action === 'download') {
      downloadHullInspectionPdf(report);
      return;
    }

    if (action === 'delete') {
      setHullDeleteConfirmModal({
        open: true,
        reportId: report.id,
        reportName: report.shipName || report.displayId || report.shipId || 'Hull Inspection Report'
      });
    }
  };

  // Add this function to actually perform the deletion
  const confirmDeleteReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.delete(`/api/surveys/${reportId}`, config);
      
      // Remove the deleted report from the recentReports state
      setRecentReports(prevReports => prevReports.filter(report => report._id !== reportId));
      
      // Remove the deleted report from the complianceReports state
      setComplianceReports(prevReports => prevReports.filter(report => report._id !== reportId));
      
      // Close the confirmation modal
      setDeleteConfirmModal({ open: false, reportId: null, reportName: '' });
      
      // Show success message
      setSuccessMessage('Survey report deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting survey report:', err);
      setError('Failed to delete survey report');
      
      // Close the confirmation modal
      setDeleteConfirmModal({ open: false, reportId: null, reportName: '' });
    }
  };

  // Add this function to cancel the deletion
  const cancelDeleteReport = () => {
    setDeleteConfirmModal({ open: false, reportId: null, reportName: '' });
  };
  
  // Function to handle active surveys filter changes
  const handleActiveSurveysFilterChange = (filterName, value) => {
    setActiveSurveysFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Function to handle recent reports filter changes
  const handleRecentReportsFilterChange = (filterName, value) => {
    setRecentReportsFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Function to handle booking notifications filter changes
  const handleBookingNotificationsFilterChange = (filterName, value) => {
    setBookingNotificationsFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Function to handle search changes
  const handleBookingNotificationsSearchChange = (value) => {
    setBookingNotificationsSearch(value);
  };
  
  const handleActiveSurveysSearchChange = (value) => {
    setActiveSurveysSearch(value);
  };
  
  const handleUpcomingSurveysSearchChange = (value) => {
    setUpcomingSurveysSearch(value);
  };
  
  const handleRecentReportsSearchChange = (value) => {
    setRecentReportsSearch(value);
  };
  
  const handleComplianceReportsSearchChange = (value) => {
    setComplianceReportsSearch(value);
  };
  
  // Function to handle compliance reports filter changes
  const handleComplianceReportsFilterChange = (filterName, value) => {
    setComplianceReportsFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Function to filter and sort active surveys
  const getFilteredActiveSurveys = () => {
    let filteredSurveys = [...upcomingSurveys];
    const now = new Date();

    // Filter by vessel type
    if (activeSurveysFilters.vesselType) {
      filteredSurveys = filteredSurveys.filter(survey => {
        // Extract vessel type from vessel name or other fields if available
        const vesselName = survey.vessel?.name?.toLowerCase() || survey.vesselName?.toLowerCase() || '';
        return vesselName.includes(activeSurveysFilters.vesselType.toLowerCase());
      });
    }
    
    // Apply search filter
    if (activeSurveysSearch) {
      filteredSurveys = filteredSurveys.filter(survey => {
        const searchLower = activeSurveysSearch.toLowerCase();
        return (
          (survey.vessel?.name?.toLowerCase().includes(searchLower)) ||
          (survey.vesselName?.toLowerCase().includes(searchLower)) ||
          (survey.type?.toLowerCase().includes(searchLower)) ||
          (survey.client?.toLowerCase().includes(searchLower)) ||
          (survey.location?.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by date range
    if (activeSurveysFilters.dateRange) {
      const today = new Date();
      const dateFilters = {
        'today': (date) => {
          const surveyDate = new Date(date);
          return surveyDate.toDateString() === today.toDateString();
        },
        'this-week': (date) => {
          const surveyDate = new Date(date);
          const oneWeekFromNow = new Date(today);
          oneWeekFromNow.setDate(today.getDate() + 7);
          return surveyDate >= today && surveyDate <= oneWeekFromNow;
        },
        'this-month': (date) => {
          const surveyDate = new Date(date);
          return surveyDate.getMonth() === today.getMonth() && 
                 surveyDate.getFullYear() === today.getFullYear();
        },
        'past': (date) => {
          const surveyDate = new Date(date);
          return surveyDate < today;
        }
      };
      
      if (dateFilters[activeSurveysFilters.dateRange]) {
        filteredSurveys = filteredSurveys.filter(survey => {
          if (!survey.scheduled) return false;
          return dateFilters[activeSurveysFilters.dateRange](survey.scheduled);
        });
      }
    }

    // Sort alphabetically if selected
    if (activeSurveysFilters.alphabetical) {
      filteredSurveys.sort((a, b) => {
        const nameA = (a.vessel?.name || a.vesselName || '').toLowerCase();
        const nameB = (b.vessel?.name || b.vesselName || '').toLowerCase();
        
        if (activeSurveysFilters.alphabetical === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }

    // Apply the same logic as the original filter (active surveys)
    return filteredSurveys.filter(survey => {
      // Include completed surveys in active list
      if (survey.status === 'Completed') return true;
      
      if (!survey.scheduled) return false;
      
      // Parse survey date and time
      const surveyDateTime = new Date(survey.scheduled);
      if (survey.time) {
        const timeStr = survey.time.trim();
        let hours, minutes;
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [h, m] = time.split(':');
          hours = parseInt(h);
          minutes = parseInt(m) || 0;
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
        } else {
          const [h, m] = timeStr.split(':');
          hours = parseInt(h) || 0;
          minutes = parseInt(m) || 0;
        }
        surveyDateTime.setHours(hours, minutes, 0, 0);
      }
      
      // Active: survey date/time is today or in the past
      return surveyDateTime <= now;
    });
  };
  
  // Function to filter booking notifications
  const getFilteredBookingNotifications = () => {
    let filteredBookings = [...bookings];
    
    // Filter by vessel type
    if (bookingNotificationsFilters.vesselType) {
      filteredBookings = filteredBookings.filter(booking => {
        const vesselName = booking.vesselName?.toLowerCase() || '';
        return vesselName.includes(bookingNotificationsFilters.vesselType.toLowerCase());
      });
    }
    
    // Filter by status
    if (bookingNotificationsFilters.status) {
      filteredBookings = filteredBookings.filter(booking => {
        return booking.status?.toLowerCase().includes(bookingNotificationsFilters.status.toLowerCase());
      });
    }
    
    // Filter by date range
    if (bookingNotificationsFilters.dateRange) {
      const today = new Date();
      const dateFilters = {
        'today': (date) => {
          const bookingDate = new Date(date);
          return bookingDate.toDateString() === today.toDateString();
        },
        'this-week': (date) => {
          const bookingDate = new Date(date);
          const oneWeekFromNow = new Date(today);
          oneWeekFromNow.setDate(today.getDate() + 7);
          return bookingDate >= today && bookingDate <= oneWeekFromNow;
        },
        'this-month': (date) => {
          const bookingDate = new Date(date);
          return bookingDate.getMonth() === today.getMonth() && 
                 bookingDate.getFullYear() === today.getFullYear();
        },
        'past': (date) => {
          const bookingDate = new Date(date);
          return bookingDate < today;
        }
      };
      
      if (dateFilters[bookingNotificationsFilters.dateRange]) {
        filteredBookings = filteredBookings.filter(booking => {
          if (!booking.inspectionDate) return false;
          return dateFilters[bookingNotificationsFilters.dateRange](booking.inspectionDate);
        });
      }
    }
    
    // Apply search filter
    if (bookingNotificationsSearch) {
      filteredBookings = filteredBookings.filter(booking => {
        const searchLower = bookingNotificationsSearch.toLowerCase();
        return (
          (booking.vesselName?.toLowerCase().includes(searchLower)) ||
          (booking.surveyType?.toLowerCase().includes(searchLower)) ||
          (booking.location?.toLowerCase().includes(searchLower)) ||
          (booking.status?.toLowerCase().includes(searchLower)) ||
          (booking.bookedBy?.name?.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Sort alphabetically if selected
    if (bookingNotificationsFilters.alphabetical) {
      filteredBookings.sort((a, b) => {
        const nameA = (a.vesselName || '').toLowerCase();
        const nameB = (b.vesselName || '').toLowerCase();
        
        if (bookingNotificationsFilters.alphabetical === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }
    
    return filteredBookings;
  };

  // Function to filter and sort recent reports
  const getFilteredRecentReports = () => {
    let filteredReports = [...recentReports];

    // Filter by vessel type
    if (recentReportsFilters.vesselType) {
      filteredReports = filteredReports.filter(report => {
        const vesselName = report.vessel?.name?.toLowerCase() || 'unknown vessel';
        return vesselName.includes(recentReportsFilters.vesselType.toLowerCase());
      });
    }
    
    // Apply search filter
    if (recentReportsSearch) {
      filteredReports = filteredReports.filter(report => {
        const searchLower = recentReportsSearch.toLowerCase();
        return (
          (report.vessel?.name?.toLowerCase().includes(searchLower)) ||
          (report.surveyType?.toLowerCase().includes(searchLower)) ||
          (report.completionDate && formatDate(report.completionDate).toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by date range
    if (recentReportsFilters.dateRange) {
      const today = new Date();
      const dateFilters = {
        'today': (date) => {
          const reportDate = new Date(date);
          return reportDate.toDateString() === today.toDateString();
        },
        'this-week': (date) => {
          const reportDate = new Date(date);
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);
          return reportDate >= oneWeekAgo && reportDate <= today;
        },
        'this-month': (date) => {
          const reportDate = new Date(date);
          return reportDate.getMonth() === today.getMonth() && 
                 reportDate.getFullYear() === today.getFullYear();
        },
        'past': (date) => {
          const reportDate = new Date(date);
          return reportDate < today;
        }
      };
      
      if (dateFilters[recentReportsFilters.dateRange]) {
        filteredReports = filteredReports.filter(report => {
          if (!report.completionDate) return false;
          return dateFilters[recentReportsFilters.dateRange](report.completionDate);
        });
      }
    }

    // Sort alphabetically if selected
    if (recentReportsFilters.alphabetical) {
      filteredReports.sort((a, b) => {
        const nameA = (a.vessel?.name || 'Unknown Vessel').toLowerCase();
        const nameB = (b.vessel?.name || 'Unknown Vessel').toLowerCase();
        
        if (recentReportsFilters.alphabetical === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }

    return filteredReports;
  };
  
  // Function to filter compliance reports
  const getFilteredComplianceReports = () => {
    let filteredReports = [...complianceReports];
    
    // Filter by vessel type
    if (complianceReportsFilters.vesselType) {
      filteredReports = filteredReports.filter(report => {
        const vesselName = report.vessel?.name?.toLowerCase() || 'unknown vessel';
        return vesselName.includes(complianceReportsFilters.vesselType.toLowerCase());
      });
    }
    
    // Apply search filter
    if (complianceReportsSearch) {
      filteredReports = filteredReports.filter(report => {
        const searchLower = complianceReportsSearch.toLowerCase();
        return (
          (report.vessel?.name?.toLowerCase().includes(searchLower)) ||
          (report.surveyType?.toLowerCase().includes(searchLower)) ||
          (report.complianceSubmittedAt && formatDate(report.complianceSubmittedAt).toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Filter by date range
    if (complianceReportsFilters.dateRange) {
      const today = new Date();
      const dateFilters = {
        'today': (date) => {
          const reportDate = new Date(date);
          return reportDate.toDateString() === today.toDateString();
        },
        'this-week': (date) => {
          const reportDate = new Date(date);
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);
          return reportDate >= oneWeekAgo && reportDate <= today;
        },
        'this-month': (date) => {
          const reportDate = new Date(date);
          return reportDate.getMonth() === today.getMonth() && 
                 reportDate.getFullYear() === today.getFullYear();
        },
        'past': (date) => {
          const reportDate = new Date(date);
          return reportDate < today;
        }
      };
      
      if (dateFilters[complianceReportsFilters.dateRange]) {
        filteredReports = filteredReports.filter(report => {
          if (!report.complianceSubmittedAt) return false;
          return dateFilters[complianceReportsFilters.dateRange](report.complianceSubmittedAt);
        });
      }
    }
    
    // Sort alphabetically if selected
    if (complianceReportsFilters.alphabetical) {
      filteredReports.sort((a, b) => {
        const nameA = (a.vessel?.name || 'Unknown Vessel').toLowerCase();
        const nameB = (b.vessel?.name || 'Unknown Vessel').toLowerCase();
        
        if (complianceReportsFilters.alphabetical === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }
    
    return filteredReports;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const openSurveyDetails = (surveyId) => {
    const found = (bookings || []).find(b => b._id === surveyId);
    if (found) {
      setDetailsModal({ open: true, booking: found });
    } else {
      const item = (upcomingSurveys || []).find(s => s.id === surveyId);
      setDetailsModal({ open: true, booking: item || null });
    }
  };

  // Countdown Timer Component
  const CountdownTimer = ({ surveyDate, surveyTime }) => {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
      const calculateTimeRemaining = () => {
        if (!surveyDate) {
          setTimeRemaining('No date set');
          return;
        }

        try {
          // Parse the date - handle both ISO format and other formats
          let surveyDateTime;
          
          if (surveyTime) {
            // Combine date and time
            const dateStr = new Date(surveyDate).toISOString().split('T')[0]; // Get YYYY-MM-DD
            const timeStr = surveyTime.trim();
            
            // Convert 12-hour format to 24-hour if needed
            let hours, minutes;
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
              const [time, period] = timeStr.split(' ');
              const [h, m] = time.split(':');
              hours = parseInt(h);
              minutes = parseInt(m) || 0;
              
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
            } else {
              // 24-hour format
              const [h, m] = timeStr.split(':');
              hours = parseInt(h) || 0;
              minutes = parseInt(m) || 0;
            }
            
            surveyDateTime = new Date(dateStr);
            surveyDateTime.setHours(hours, minutes, 0, 0);
          } else {
            // No time specified, use start of day
            surveyDateTime = new Date(surveyDate);
            surveyDateTime.setHours(0, 0, 0, 0);
          }

          const now = new Date();
          const diff = surveyDateTime - now;

          if (diff <= 0) {
            setTimeRemaining('Survey started');
            return;
          }

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          // Format based on time remaining
          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          } else if (minutes > 0) {
            setTimeRemaining(`${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining(`${seconds}s`);
          }
        } catch (error) {
          console.error('Error calculating time:', error);
          setTimeRemaining('Invalid date/time');
        }
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }, [surveyDate, surveyTime]);

    // Color coding based on time remaining
    const getColorClass = () => {
      if (!surveyDate || timeRemaining === 'Survey started' || timeRemaining === 'Invalid date/time' || timeRemaining === 'No date set') {
        return 'text-gray-500';
      }
      
      try {
        let surveyDateTime;
        
        if (surveyTime) {
          const dateStr = new Date(surveyDate).toISOString().split('T')[0];
          const timeStr = surveyTime.trim();
          
          let hours, minutes;
          if (timeStr.includes('AM') || timeStr.includes('PM')) {
            const [time, period] = timeStr.split(' ');
            const [h, m] = time.split(':');
            hours = parseInt(h);
            minutes = parseInt(m) || 0;
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
          } else {
            const [h, m] = timeStr.split(':');
            hours = parseInt(h) || 0;
            minutes = parseInt(m) || 0;
          }
          
          surveyDateTime = new Date(dateStr);
          surveyDateTime.setHours(hours, minutes, 0, 0);
        } else {
          surveyDateTime = new Date(surveyDate);
          surveyDateTime.setHours(0, 0, 0, 0);
        }

        const now = new Date();
        const diff = surveyDateTime - now;
        const hoursRemaining = diff / (1000 * 60 * 60);

        if (hoursRemaining <= 1) return 'text-red-600 font-semibold';
        if (hoursRemaining <= 24) return 'text-orange-600 font-medium';
        return 'text-green-600';
      } catch (error) {
        return 'text-gray-500';
      }
    };

    return (
      <div className={`text-sm ${getColorClass()}`}>
        {timeRemaining}
      </div>
    );
  };

  // Navigation configuration
  const navigationItems = [
    {
      id: 'bookings',
      name: 'Booking Notifications',
      icon: <FaClipboardList className="text-xl text-blue-500" />,
      description: 'Manage inspection bookings'
    },
    {
      id: 'surveys',
      name: 'Surveys',
      icon: <FaClipboardCheck className="text-xl text-green-500" />,
      description: 'Active and upcoming inspections'
    },
    {
      id: 'reports',
      name: 'Recent Reports',
      icon: <FaFileAlt className="text-xl text-purple-500" />,
      description: 'Completed survey reports'
    },
    {
      id: 'predictive',
      name: 'Predictive Maintenance',
      icon: <FaChartLine className="text-xl text-blue-500" />,
      description: 'AI-powered maintenance predictions'
    },
    {
      id: 'documents',
      name: 'Documents',
      icon: <FaFolderOpen className="text-xl text-yellow-500" />,
      description: 'Survey documents and files'
    }
  ];

  return (
    <DashboardLayout title="Surveyor Dashboard" description="Inspection schedules and reports." onProfileClick={() => setShowProfile(s => !s)} fullWidth={true}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Enhanced Sidebar - Fixed */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0`}>
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
            <h2 className="text-lg font-bold text-white">Navigation</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="mt-8 px-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 transform ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-green-50 hover:scale-102'
                }`}
              >
                <span className={`text-xl mr-3 ${activeSection === item.id ? 'animate-pulse' : ''}`}>{item.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className={`text-xs ${activeSection === item.id ? 'text-green-100' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Mobile header - sticky */}
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navigationItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
            </h1>
            <div className="w-6"></div>
          </div>

          {/* Content area - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
        
        {/* Enhanced Success/Error Messages */}
        {successMessage && (
          <div className="animate-slideInDown">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl p-4 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-green-500 p-1">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-bold text-green-900">Success!</h3>
                  <p className="mt-1 text-sm text-green-800">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="ml-4 text-green-500 hover:text-green-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-slideInDown">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-xl p-4 shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-red-500 p-1">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L9 11.414l1.293 1.293a1 1 0 001.414-1.414L10.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-bold text-red-900">Error!</h3>
                  <p className="mt-1 text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Booking Notifications */}
        {activeSection === 'bookings' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn">
          <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Booking Notifications</h3>
                <p className="text-sm text-gray-600">Manage your inspection bookings and requests</p>
              </div>
              {shipMgmtUserId && (
                <Link to={`/chat/${shipMgmtUserId}`} className="text-marine-blue hover:text-marine-dark relative mt-2 sm:mt-0">
                  Messages
                  {counts[String(shipMgmtUserId)] > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {counts[String(shipMgmtUserId)]}
                    </span>
                  )}
                </Link>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={bookingNotificationsSearch}
                  onChange={(e) => handleBookingNotificationsSearchChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {bookingNotificationsSearch && (
                  <button
                    onClick={() => handleBookingNotificationsSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Vessel Type Filter */}
              <select
                value={bookingNotificationsFilters.vesselType}
                onChange={(e) => handleBookingNotificationsFilterChange('vesselType', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">All Vessel Types</option>
                <option value="container">Container Ship</option>
                <option value="tanker">Tanker</option>
                <option value="bulk">Bulk Carrier</option>
                <option value="cargo">Cargo Ship</option>
                <option value="passenger">Passenger Ship</option>
                <option value="oil">Oil Tanker</option>
              </select>
              
              {/* Status Filter */}
              <select
                value={bookingNotificationsFilters.status}
                onChange={(e) => handleBookingNotificationsFilterChange('status', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
              </select>
              
              {/* Date Range Filter */}
              <select
                value={bookingNotificationsFilters.dateRange}
                onChange={(e) => handleBookingNotificationsFilterChange('dateRange', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="past">Past Dates</option>
              </select>
              
              {/* Alphabetical Sort */}
              <select
                value={bookingNotificationsFilters.alphabetical}
                onChange={(e) => handleBookingNotificationsFilterChange('alphabetical', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">Sort by Date</option>
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {bookingsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading bookings...</p>
              </div>
            ) : getFilteredBookingNotifications().length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No booking requests found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredBookingNotifications().map((booking) => (
                    <tr key={booking._id} onClick={() => openSurveyDetails(booking._id)} className="cursor-pointer hover:bg-green-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                              <span className="text-base font-bold text-white">
                                {booking.vesselName?.charAt(0)?.toUpperCase() || 'V'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{booking.vesselName}</div>
                            <div className="text-xs text-gray-500">ID: {booking.vessel?.vesselId || booking.vessel?._id || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{booking.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(booking.inspectionDate)}</div>
                        <div className="text-gray-500">{booking.inspectionTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{booking.surveyType}</div>
                        <div className="text-gray-500">{booking.shipType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'Accepted' ? 'bg-green-100 text-green-800 font-bold' :
                          booking.status === 'Declined' ? 'bg-red-100 text-red-800' :
                          booking.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'Pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcceptBooking(booking._id); }}
                              className="text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeclineBooking(booking._id); }}
                              className="text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}
        
        {/* Surveys Section - Active and Upcoming */}
        {activeSection === 'surveys' && (
          <>
            {/* Enhanced Active Surveys */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn">
              <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Active Surveys</h3>
                    <p className="text-sm text-gray-600">Current and ongoing inspections</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Search active surveys..."
                        value={activeSurveysSearch}
                        onChange={(e) => handleActiveSurveysSearchChange(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {activeSurveysSearch && (
                        <button
                          onClick={() => handleActiveSurveysSearchChange('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {/* Vessel Type Filter */}
                    <select
                      value={activeSurveysFilters.vesselType}
                      onChange={(e) => handleActiveSurveysFilterChange('vesselType', e.target.value)}
                      className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                    >
                      <option value="">All Vessel Types</option>
                      <option value="container">Container Ship</option>
                      <option value="tanker">Tanker</option>
                      <option value="bulk">Bulk Carrier</option>
                      <option value="cargo">Cargo Ship</option>
                      <option value="passenger">Passenger Ship</option>
                      <option value="oil">Oil Tanker</option>
                    </select>
                    
                    {/* Date Range Filter */}
                    <select
                      value={activeSurveysFilters.dateRange}
                      onChange={(e) => handleActiveSurveysFilterChange('dateRange', e.target.value)}
                      className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="this-week">This Week</option>
                      <option value="this-month">This Month</option>
                      <option value="past">Past Dates</option>
                    </select>
                    
                    {/* Alphabetical Sort */}
                    <select
                      value={activeSurveysFilters.alphabetical}
                      onChange={(e) => handleActiveSurveysFilterChange('alphabetical', e.target.value)}
                      className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                    >
                      <option value="">Sort by Date</option>
                      <option value="asc">A to Z</option>
                      <option value="desc">Z to A</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey Type</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Gallery</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Flight Ticket</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const filteredActiveSurveys = getFilteredActiveSurveys();

                      return filteredActiveSurveys.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No active surveys found.
                          </td>
                        </tr>
                      ) : (
                        filteredActiveSurveys.map((survey) => (
                          <tr 
                            key={survey.id} 
                            onClick={(e) => { if (!e.target.closest('.relative.inline-block.text-left')) openSurveyDetails(survey.id); }} 
                            className={`cursor-pointer transition-all duration-200 ${
                              survey.type === 'Premium Quality' 
                                ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 hover:from-purple-100 hover:via-indigo-100 hover:to-purple-100 border-l-4 border-purple-500' 
                                : 'hover:bg-green-50'
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${survey.type === 'Premium Quality' ? 'text-purple-900' : 'text-gray-900'}`}>
                                {survey.vessel?.name || survey.vesselName || 'Unknown Ship'}
                                {survey.type === 'Premium Quality' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">ID: {survey.vessel?.vesselId || survey.vessel?._id || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${survey.type === 'Premium Quality' ? 'text-purple-700' : 'text-gray-900'}`}>
                                {survey.type}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(survey.scheduled)}</div>
                              <div className="text-xs text-gray-500">{survey.time || 'Time TBD'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {survey.shipPhotos && survey.shipPhotos.length > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Gallery functionality removed
                                  }}
                                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {survey.shipPhotos.length} Photo{survey.shipPhotos.length !== 1 ? 's' : ''}
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400">No photos</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!survey.flightTicket || !survey.flightTicket.data || !survey.flightTicket.name) {
                                    warning('Flight ticket has not been uploaded by the ship company yet');
                                    return;
                                  }
                                  const link = document.createElement('a');
                                  link.href = survey.flightTicket.data;
                                  link.download = survey.flightTicket.name;
                                  link.click();
                                }}
                                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                  survey.flightTicket && survey.flightTicket.data && survey.flightTicket.name
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' 
                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {survey.flightTicket && survey.flightTicket.data && survey.flightTicket.name ? 'Download' : 'Not uploaded'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{survey.client}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                survey.status === 'Completed' && isSurveyComplianceCompleted(survey) ? 'bg-green-100 text-green-800' :
                                survey.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                                survey.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                survey.status === 'Declined' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {survey.status === 'Completed' && isSurveyComplianceCompleted(survey) ? 'Completed' : survey.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="relative inline-block text-left">
                                <button 
                                  onClick={() => setActionDropdownOpen(actionDropdownOpen === survey.id ? null : survey.id)}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm"
                                >
                                  Actions
                                  <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                {actionDropdownOpen === survey.id && (
                                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-10 focus:outline-none z-10 border border-gray-200">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                      {survey.type === 'Premium Quality' ? (
                                        <>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Navigate to premium inspection page
                                              window.location.href = `/premium-inspection/${survey.id}`;
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                            Start Premium Inspection
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveSection('ai-analysis');
                                              setCurrentSurveyForAI(survey);
                                              setUploadedImages([]);
                                              setAiAnalysisResults([]);
                                              setSelectedImageTypes({});
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            AI Image Analysis
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setHullInspectionSurvey(survey);
                                              setActiveSection('hull-inspection');
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                                            </svg>
                                            Start Hull Inspection
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStartSurvey(survey);
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Start Survey
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveSection('compliance');
                                              setCurrentSurveyForCompliance(survey); // Set the current survey for compliance tracking
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Compliance Tracking
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveSection('ai-analysis');
                                              setCurrentSurveyForAI(survey);
                                              setUploadedImages([]);
                                              setAiAnalysisResults([]);
                                              setSelectedImageTypes({});
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            AI Image Analysis
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setHullInspectionSurvey(survey);
                                              setActiveSection('hull-inspection');
                                              setActionDropdownOpen(null);
                                            }}
                                            className="block w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 text-left flex items-center"
                                            role="menuitem"
                                          >
                                            <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                                            </svg>
                                            Start Hull Inspection
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enhanced Upcoming Surveys */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn mt-8">
              <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                      <svg className="w-7 h-7 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upcoming Surveys
                    </h3>
                    <p className="text-sm text-gray-600">Scheduled future inspections and assessments</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Search upcoming surveys..."
                        value={upcomingSurveysSearch}
                        onChange={(e) => handleUpcomingSurveysSearchChange(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {upcomingSurveysSearch && (
                        <button
                          onClick={() => handleUpcomingSurveysSearchChange('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {/* Vessel Type Filter */}
                    <select
                      value={activeSurveysFilters.vesselType}
                      onChange={(e) => handleActiveSurveysFilterChange('vesselType', e.target.value)}
                      className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                    >
                      <option value="">All Vessel Types</option>
                      <option value="container">Container Ship</option>
                      <option value="tanker">Tanker</option>
                      <option value="bulk">Bulk Carrier</option>
                      <option value="cargo">Cargo Ship</option>
                      <option value="passenger">Passenger Ship</option>
                      <option value="oil">Oil Tanker</option>
                    </select>
                    
                    {/* Date Range Filter */}
                    <select
                      value={activeSurveysFilters.dateRange}
                      onChange={(e) => handleActiveSurveysFilterChange('dateRange', e.target.value)}
                      className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="this-week">This Week</option>
                      <option value="this-month">This Month</option>
                      <option value="past">Past Dates</option>
                    </select>
                    
                    {/* Alphabetical Sort */}
                    <select
                      value={activeSurveysFilters.alphabetical}
                      onChange={(e) => handleActiveSurveysFilterChange('alphabetical', e.target.value)}
                      className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                    >
                      <option value="">Sort by Date</option>
                      <option value="asc">A to Z</option>
                      <option value="desc">Z to A</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey Type</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Time Remaining</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Gallery</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Flight Ticket</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const now = new Date();
                      let futureSurveys = upcomingSurveys.filter(survey => {
                        // Exclude completed surveys from upcoming list
                        if (survey.status === 'Completed') return false;
                        
                        if (!survey.scheduled) return false;
                        
                        // Parse survey date and time
                        const surveyDateTime = new Date(survey.scheduled);
                        if (survey.time) {
                          const timeStr = survey.time.trim();
                          let hours, minutes;
                          if (timeStr.includes('AM') || timeStr.includes('PM')) {
                            const [time, period] = timeStr.split(' ');
                            const [h, m] = time.split(':');
                            hours = parseInt(h);
                            minutes = parseInt(m) || 0;
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;
                          } else {
                            const [h, m] = timeStr.split(':');
                            hours = parseInt(h) || 0;
                            minutes = parseInt(m) || 0;
                          }
                          surveyDateTime.setHours(hours, minutes, 0, 0);
                        }
                        
                        // Upcoming: survey date/time is in the future
                        return surveyDateTime > now;
                      });

                      // Apply filters to upcoming surveys
                      // Filter by vessel type
                      if (activeSurveysFilters.vesselType) {
                        futureSurveys = futureSurveys.filter(survey => {
                          const vesselName = survey.vessel?.name?.toLowerCase() || survey.vesselName?.toLowerCase() || '';
                          return vesselName.includes(activeSurveysFilters.vesselType.toLowerCase());
                        });
                      }

                      // Filter by date range
                      if (activeSurveysFilters.dateRange) {
                        const today = new Date();
                        const dateFilters = {
                          'today': (date) => {
                            const surveyDate = new Date(date);
                            return surveyDate.toDateString() === today.toDateString();
                          },
                          'this-week': (date) => {
                            const surveyDate = new Date(date);
                            const oneWeekFromNow = new Date(today);
                            oneWeekFromNow.setDate(today.getDate() + 7);
                            return surveyDate >= today && surveyDate <= oneWeekFromNow;
                          },
                          'this-month': (date) => {
                            const surveyDate = new Date(date);
                            return surveyDate.getMonth() === today.getMonth() && 
                                   surveyDate.getFullYear() === today.getFullYear();
                          },
                          'past': (date) => {
                            const surveyDate = new Date(date);
                            return surveyDate < today;
                          }
                        };
                        
                        if (dateFilters[activeSurveysFilters.dateRange]) {
                          futureSurveys = futureSurveys.filter(survey => {
                            if (!survey.scheduled) return false;
                            return dateFilters[activeSurveysFilters.dateRange](survey.scheduled);
                          });
                        }
                      }

                      // Sort alphabetically if selected
                      if (activeSurveysFilters.alphabetical) {
                        futureSurveys.sort((a, b) => {
                          const nameA = (a.vessel?.name || a.vesselName || '').toLowerCase();
                          const nameB = (b.vessel?.name || b.vesselName || '').toLowerCase();
                          
                          if (activeSurveysFilters.alphabetical === 'asc') {
                            return nameA.localeCompare(nameB);
                          } else {
                            return nameB.localeCompare(nameA);
                          }
                        });
                      }

                      return futureSurveys.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No upcoming surveys found.
                          </td>
                        </tr>
                      ) : (
                        futureSurveys.map((survey) => (
                          <tr key={survey.id} onClick={(e) => { if (!e.target.closest('.relative.inline-block.text-left')) openSurveyDetails(survey.id); }} className="cursor-pointer hover:bg-purple-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{survey.vessel?.name || survey.vesselName || 'Unknown Ship'}</div>
                              <div className="text-xs text-gray-500">ID: {survey.vessel?.vesselId || survey.vessel?._id || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{survey.type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(survey.scheduled)}</div>
                              <div className="text-xs text-gray-500">{survey.time || 'Time TBD'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <CountdownTimer surveyDate={survey.scheduled} surveyTime={survey.time} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {survey.shipPhotos && survey.shipPhotos.length > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Gallery functionality removed
                                  }}
                                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {survey.shipPhotos.length} Photo{survey.shipPhotos.length !== 1 ? 's' : ''}
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400">No photos</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!survey.flightTicket || !survey.flightTicket.data || !survey.flightTicket.name) {
                                    warning('Flight ticket has not been uploaded by the ship company yet');
                                    return;
                                  }
                                  const link = document.createElement('a');
                                  link.href = survey.flightTicket.data;
                                  link.download = survey.flightTicket.name;
                                  link.click();
                                }}
                                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                  survey.flightTicket && survey.flightTicket.data && survey.flightTicket.name
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' 
                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {survey.flightTicket && survey.flightTicket.data && survey.flightTicket.name ? 'Download' : 'Not uploaded'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{survey.client}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${survey.status === 'Completed' && isSurveyComplianceCompleted(survey) ? 'bg-green-100 text-green-800' : survey.status === 'Completed' ? 'bg-blue-100 text-blue-800' : survey.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : survey.status === 'Declined' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                {survey.status === 'Completed' && isSurveyComplianceCompleted(survey) ? 'Survey & Compliance' : survey.status === 'Completed' ? 'Survey Only' : survey.status === 'Pending' ? 'Pending' : survey.status === 'Declined' ? 'Declined' : 'Upcoming'}
                              </span>
                            </td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Enhanced Recent Reports */}
        {activeSection === 'reports' && (
        <>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn">
          <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                  <svg className="w-7 h-7 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Survey Reports
                </h3>
                <p className="text-sm text-gray-600">Your recently completed survey reports</p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search survey reports..."
                    value={recentReportsSearch}
                    onChange={(e) => handleRecentReportsSearchChange(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {recentReportsSearch && (
                    <button
                      onClick={() => handleRecentReportsSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Vessel Type Filter */}
                <select
                  value={recentReportsFilters.vesselType}
                  onChange={(e) => handleRecentReportsFilterChange('vesselType', e.target.value)}
                  className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                >
                  <option value="">All Vessel Types</option>
                  <option value="container">Container Ship</option>
                  <option value="tanker">Tanker</option>
                  <option value="bulk">Bulk Carrier</option>
                  <option value="cargo">Cargo Ship</option>
                  <option value="passenger">Passenger Ship</option>
                  <option value="oil">Oil Tanker</option>
                </select>
                
                {/* Date Range Filter */}
                <select
                  value={recentReportsFilters.dateRange}
                  onChange={(e) => handleRecentReportsFilterChange('dateRange', e.target.value)}
                  className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="past">Past Dates</option>
                </select>
                
                {/* Alphabetical Sort */}
                <select
                  value={recentReportsFilters.alphabetical}
                  onChange={(e) => handleRecentReportsFilterChange('alphabetical', e.target.value)}
                  className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
                >
                  <option value="">Sort by Date</option>
                  <option value="asc">A to Z</option>
                  <option value="desc">Z to A</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship Information</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Completion</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const filteredRecentReports = getFilteredRecentReports();
                  return filteredRecentReports.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">No recent reports found</p>
                          <p className="text-gray-400 text-sm mt-1">Complete surveys to see reports here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecentReports.map((report) => (
                      <tr key={report._id} className="hover:bg-green-50 transition-colors duration-200">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md mr-4">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{report.vessel?.name || 'Unknown Ship'}</div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                ID: {report.vessel?.vesselId || report.vessel?._id || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="px-3 py-1 rounded-full bg-green-100 border border-green-300">
                              <span className="text-sm font-semibold text-green-800">{report.surveyType || 'Unknown Type'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{formatDate(report.completionDate)}</span>
                          </div>
                        </td>


                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                          <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setActionDropdownOpen(actionDropdownOpen === report._id ? null : report._id)}
                          className="inline-flex items-center px-4 py-2 border-2 border-green-300 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Actions
                          <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {actionDropdownOpen === report._id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-10 focus:outline-none z-10 border border-gray-200 overflow-hidden">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                              <button 
                                onClick={() => {
                                  setSurveyDetailsModal({ open: true, survey: report });
                                  setActionDropdownOpen(null);
                                }}
                                className="block w-full px-4 py-3 text-sm text-green-700 hover:bg-green-50 focus:bg-green-50 transition-colors duration-150 text-left flex items-center font-medium"
                                role="menuitem"
                              >
                                <svg className="h-5 w-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Report
                              </button>
                              <div className="border-t border-gray-100"></div>
                              <button 
                                onClick={() => {
                                  setDeleteConfirmModal({ open: true, reportId: report._id, reportName: report.vessel?.name || 'Unknown Vessel' });
                                  setActionDropdownOpen(null);
                                }}
                                className="block w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors duration-150 text-left flex items-center font-medium"
                                role="menuitem"
                              >
                                <svg className="h-5 w-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Report
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              );
            })()}
            </tbody>
            </table>
          </div>

          {/* AI Analysis Results Section */}
          <div className="mt-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-cyan-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h4 className="text-lg font-bold text-gray-900">AI Damage Detection Reports</h4>
            </div>
            
            {(() => {
              console.log('🤖 AI Reports from dedicated endpoint:', aiReports.length);
              if (aiReports.length > 0) {
                console.log('🤖 Sample AI report:', {
                  id: aiReports[0]._id,
                  title: aiReports[0].title,
                  totalImages: aiReports[0].aiAnalysis?.totalImages,
                  damagesDetected: aiReports[0].aiAnalysis?.damagesDetected
                });
              }
              
              if (aiReports.length === 0) {
                return (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">No AI analysis reports yet</p>
                    <p className="text-xs text-gray-500">Use "AI Image Analysis" feature to generate AI damage detection reports</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {aiReports.map((report) => {
                    const aiData = report.aiAnalysis;
                    return (
                      <div key={report._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-cyan-200">
                        <div className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 flex justify-between items-center">
                          <div>
                            <h5 className="font-bold text-white">
                              {report.vessel?.name || report.title || 'AI Damage Analysis Report'}
                            </h5>
                            <p className="text-xs text-cyan-100">
                              Analysis Date: {new Date(aiData.analysisDate).toLocaleDateString()} at {new Date(aiData.analysisDate).toLocaleTimeString()}
                            </p>
                            {!report.vessel?.name && report.sourceBookingId && (
                              <p className="text-xs text-cyan-200">
                                Survey ID: {report.sourceBookingId.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-cyan-700">
                              {aiData.modelVersion || 'ResNet18'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              aiData.modelStatus === 'trained' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {aiData.modelStatus === 'trained' ? '✅ Real AI' : '⚠️ Mock'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {/* Summary Stats */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                              <p className="text-2xl font-bold text-blue-600">{aiData.totalImages}</p>
                              <p className="text-xs text-gray-600">Total Images</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                              <p className="text-2xl font-bold text-red-600">{aiData.damagesDetected}</p>
                              <p className="text-xs text-gray-600">Damages Found</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                              <p className="text-2xl font-bold text-green-600">{aiData.cleanImages}</p>
                              <p className="text-xs text-gray-600">Clean Areas</p>
                            </div>
                          </div>
                          
                          {/* Detailed Results */}
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                const currentOpen = expandedAIReport === report._id;
                                setExpandedAIReport(currentOpen ? null : report._id);
                              }}
                              className="w-full flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <span className="text-sm font-semibold text-gray-700">View Detailed Results</span>
                              <svg 
                                className={`w-5 h-5 text-gray-500 transition-transform ${expandedAIReport === report._id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {expandedAIReport === report._id && aiData.results && (
                              <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Image Type</th>
                                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Status</th>
                                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Damage</th>
                                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Confidence</th>
                                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Severity</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {aiData.results.map((result, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">
                                          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                            {result.imageType}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2">
                                          {result.damageDetected ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                                              ⚠️ Damage
                                            </span>
                                          ) : (
                                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                                              ✅ Clean
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 font-semibold text-gray-900">
                                          {result.damageType || '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center">
                                            <span className="text-sm font-medium">{result.confidence}%</span>
                                            <div className="ml-2 w-12 bg-gray-200 rounded-full h-1.5">
                                              <div
                                                className={`h-1.5 rounded-full ${
                                                  result.confidence > 80 ? 'bg-green-500' : 
                                                  result.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${result.confidence}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          {result.severity !== 'None' && result.severity ? (
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                              result.severity === 'High' ? 'bg-red-100 text-red-800' :
                                              result.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-blue-100 text-blue-800'
                                            }`}>
                                              {result.severity}
                                            </span>
                                          ) : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
        
        {/* Enhanced Compliance Reports Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8 animate-fadeIn">
          <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                  <svg className="w-7 h-7 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Compliance Reports
                </h3>
                <p className="text-sm text-gray-600">Your compliance tracking reports</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search compliance reports..."
                  value={complianceReportsSearch}
                  onChange={(e) => handleComplianceReportsSearchChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {complianceReportsSearch && (
                  <button
                    onClick={() => handleComplianceReportsSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Vessel Type Filter */}
              <select
                value={complianceReportsFilters.vesselType}
                onChange={(e) => handleComplianceReportsFilterChange('vesselType', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">All Vessel Types</option>
                <option value="container">Container Ship</option>
                <option value="tanker">Tanker</option>
                <option value="bulk">Bulk Carrier</option>
                <option value="cargo">Cargo Ship</option>
                <option value="passenger">Passenger Ship</option>
                <option value="oil">Oil Tanker</option>
              </select>
              
              {/* Date Range Filter */}
              <select
                value={complianceReportsFilters.dateRange}
                onChange={(e) => handleComplianceReportsFilterChange('dateRange', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="past">Past Dates</option>
              </select>
              
              {/* Alphabetical Sort */}
              <select
                value={complianceReportsFilters.alphabetical}
                onChange={(e) => handleComplianceReportsFilterChange('alphabetical', e.target.value)}
                className="block w-full sm:w-auto rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:border-green-500 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none"
              >
                <option value="">Sort by Date</option>
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship Information</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Compliance Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredComplianceReports().length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No compliance reports found.
                    </td>
                  </tr>
                ) : (
                  getFilteredComplianceReports().map((report) => (
                    <tr key={report._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.vessel?.name || 'Unknown Ship'}</div>
                        <div className="text-xs text-gray-500">ID: {report.vessel?.vesselId || report.vessel?._id || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.surveyType || 'Unknown Type'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(report.complianceSubmittedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => setActionDropdownOpen(actionDropdownOpen === `compliance-${report._id}` ? null : `compliance-${report._id}`)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm"
                          >
                            Actions
                            <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {actionDropdownOpen === `compliance-${report._id}` && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-10 focus:outline-none z-10 border border-gray-200">
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <button 
                                  onClick={() => {
                                    setComplianceReportModal({ open: true, survey: report });
                                    setActionDropdownOpen(null);
                                  }}
                                  className="block w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 transition-colors duration-150 text-left flex items-center"
                                  role="menuitem"
                                >
                                  <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Compliance Report
                                </button>
                                <button 
                                  onClick={async () => {
                                    try {
                                      setActionDropdownOpen(null);
                                      const token = localStorage.getItem('token');
                                      
                                      if (!token) {
                                        alert('Authentication token not found. Please log in again.');
                                        return;
                                      }
                                      
                                      const config = {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        },
                                        responseType: 'blob'
                                      };
                                      
                                      const response = await axios.post(
                                        `/api/certificates/generate/${report._id}`,
                                        {},
                                        config
                                      );
                                      
                                      // Create a download link
                                      const blob = new Blob([response.data], { type: 'application/pdf' });
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `Marine_Survey_Certificate_${report.vessel?.name || 'Vessel'}_${new Date().getTime()}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                      
                                      // Reload certificates to show the newly generated one
                                      loadCertificates();
                                    } catch (error) {
                                      console.error('Error generating certificate:', error);
                                      if (error.response?.status === 401) {
                                        alert('Authentication failed. Please log in again.');
                                      } else if (error.response?.status === 403) {
                                        alert('You are not authorized to generate this certificate.');
                                      } else if (error.response?.status === 404) {
                                        alert('Survey not found.');
                                      } else {
                                        alert('Failed to generate certificate. Please try again.');
                                      }
                                    }
                                  }}
                                  className="block w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700 transition-colors duration-150 text-left flex items-center"
                                  role="menuitem"
                                >
                                  <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Generate Certificate
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeleteConfirmModal({ open: true, reportId: report._id, reportName: report.vessel?.name || 'Unknown Vessel' });
                                    setActionDropdownOpen(null);
                                  }}
                                  className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 transition-colors duration-150 text-left flex items-center"
                                  role="menuitem"
                                >
                                  <svg className="h-4 w-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reports (Premium Inspection) Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8 animate-fadeIn">
          <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                <svg className="w-7 h-7 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Premium Inspection Reports
              </h3>
              <p className="text-sm text-gray-600">Premium / VIP Ship Quality Inspection Reports</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship Information</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">VIP Grade</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quality Level</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Charter Readiness</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {premiumReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No premium inspection reports found</p>
                        <p className="text-gray-400 text-sm mt-1">Submit premium inspections to see reports here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  premiumReports.map((report) => (
                    <tr key={report.id} className="hover:bg-purple-50 transition-colors duration-200">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">{report.shipId || report.surveyId}</td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{report.shipName || 'VIP Ship'}</div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Premium Quality
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{new Date(report.timestamp).toLocaleString('en-GB')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.vipGrade === 'Platinum' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                          report.vipGrade === 'Gold' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                          report.vipGrade === 'Silver' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {report.vipGrade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.vipQualityLevel === 'Excellent' ? 'bg-green-100 text-green-800 border border-green-300' :
                          report.vipQualityLevel === 'Good' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          report.vipQualityLevel === 'Fair' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                          report.vipQualityLevel === 'Poor' ? 'bg-red-100 text-red-800 border border-red-300' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {report.vipQualityLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.charterReadiness === 'Yes' ? 'bg-green-100 text-green-800 border border-green-300' :
                          report.charterReadiness === 'Conditional' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                          report.charterReadiness === 'No' ? 'bg-red-100 text-red-800 border border-red-300' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {report.charterReadiness || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setPremiumInspectionDetailsModal({ open: true, report: report });
                          }}
                          className="inline-flex items-center px-3 py-2 border-2 border-purple-300 text-sm font-semibold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8 animate-fadeIn">
          <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-sky-50 to-cyan-50 border-b-2 border-sky-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                <svg className="w-7 h-7 mr-2 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0012.586 3H4zm6 1.414L14.586 9H11a1 1 0 01-1-1V4.414z" clipRule="evenodd" />
                </svg>
                Ship Hull Inspection Reports
              </h3>
              <p className="text-sm text-gray-600">Saved hull inspection reports with AI summary and bounding box output</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-sky-50 to-cyan-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship Information</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Defects</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Condition</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hullInspectionReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0012.586 3H4zm6 1.414L14.586 9H11a1 1 0 01-1-1V4.414z" clipRule="evenodd" />
                        </svg>
                        <p className="text-gray-500 font-medium">No hull inspection reports found</p>
                        <p className="text-gray-400 text-sm mt-1">Run hull inspection and save the result to see it here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hullInspectionReports.map((report) => (
                    (() => {
                      const reportDisplayId =
                        report.displayId ||
                        report.shipId ||
                        report.surveyMeta?.originalSurvey?.vessel?.vesselId ||
                        report.surveyMeta?.originalSurvey?.vesselId ||
                        report.surveyMeta?.vesselId ||
                        report.surveyId ||
                        report.id;

                      return (
                    <tr key={report.id} className="hover:bg-sky-50 transition-colors duration-200">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">{reportDisplayId}</td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0012.586 3H4z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{report.shipName || 'Hull Inspection Survey'}</div>
                            <div className="text-xs text-gray-500 mt-1">{report.filename || 'Hull image'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                        {report.timestamp ? new Date(report.timestamp).toLocaleString('en-GB') : 'N/A'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{report.totalDetections || 0} total</div>
                        <div className="text-xs text-gray-500 mt-1">Crack: {report.crackCount || 0} • Corrosion: {report.corrosionCount || 0}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getHullConditionLabel(report) === 'Clean'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : getHullConditionLabel(report).includes('Crack')
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {report.overallCondition || getHullConditionLabel(report)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const selectedAction = e.target.value;
                            if (!selectedAction) return;
                            handleHullReportAction(selectedAction, report);
                            e.target.value = '';
                          }}
                          className="px-3 py-2 border-2 border-sky-300 text-sm font-semibold rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 hover:border-sky-400 transition-all duration-200 shadow-sm"
                        >
                          <option value="" disabled>Actions</option>
                          <option value="view">View Details</option>
                          <option value="download">Download PDF</option>
                          <option value="delete">Delete Report</option>
                        </select>
                      </td>
                    </tr>
                      );
                    })()
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}



        {/* Compliance Tracking */}
        {activeSection === 'compliance' && (
          <div className="space-y-6">
            {/* Back button */}
            <div className="mb-4">
              <button 
                onClick={() => setActiveSection('reports')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Recent Reports
              </button>
            </div>
            
            {/* Page Heading */}
            <div className="pb-5 border-b border-gray-200">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Compliance Tracking</h2>
              <p className="mt-1 text-sm text-gray-500">Review and track compliance requirements for maritime regulations</p>
            </div>
            
            {/* SOLAS Compliance */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-50">
              <div className="px-6 py-5 sm:px-6 bg-gradient-to-r from-blue-400 to-indigo-500 border-b border-gray-50">
                <h3 className="text-xl leading-6 font-bold text-white">SOLAS (Safety of Life at Sea) Compliance</h3>
                <p className="mt-2 max-w-3xl text-sm text-blue-100">
                  Ensures ship safety related to structure, machinery, fire protection, navigation, and life-saving appliances. The surveyor verifies hull condition, fire systems, lifeboats, navigation and radio equipment. Mandatory for renewing Safety Construction, Safety Equipment, and Safety Radio Certificates.
                </p>
              </div>
              <div className="px-6 py-3 bg-blue-50 border-b border-gray-100">
                <div className="text-sm font-medium text-blue-800">
                  <p className="mb-1"><strong>Checkbox Legend:</strong></p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-red-100 text-red-800 border border-red-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg></span> Not Compliant - Serious deficiencies found</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg></span> Pending - Awaiting further inspection or documentation</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-orange-100 text-orange-800 border border-orange-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" />
                            </svg></span> Semi-Moderate - Minor deficiencies that need attention</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg></span> Moderate - Generally compliant with minor observations</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg></span> Compliant - Fully meets regulatory requirements</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">                  <thead className="bg-gray-25">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Compliance Item</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    <tr className="hover:bg-blue-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Hull structural integrity</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    hull: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.hull === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    hull: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.hull === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    hull: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.hull === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    hull: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.hull === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    hull: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.hull === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.solas.hull === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.solas.hull === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.solas.hull === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.solas.hull === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.solas.hull === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fire detection & fire-fighting systems</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    fire: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.fire === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    fire: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.fire === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    fire: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.fire === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    fire: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.fire === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    fire: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.fire === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.solas.fire === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.solas.fire === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.solas.fire === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.solas.fire === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.solas.fire === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Lifesaving appliances (lifeboats, life jackets)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    lifesaving: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.lifesaving === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    lifesaving: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.lifesaving === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    lifesaving: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.lifesaving === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    lifesaving: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.lifesaving === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  solas: {
                                    ...prev.solas,
                                    lifesaving: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.lifesaving === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.solas.lifesaving === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.solas.lifesaving === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.solas.lifesaving === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.solas.lifesaving === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.solas.lifesaving === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Navigation equipment (Radar, GPS, AIS)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                navigation: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.navigation === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                navigation: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.navigation === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                navigation: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.navigation === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                navigation: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.navigation === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                navigation: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.navigation === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.solas.navigation === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.solas.navigation === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.solas.navigation === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.solas.navigation === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.solas.navigation === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Radio & emergency communication systems</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                radio: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.radio === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                radio: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.radio === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                radio: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.radio === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                radio: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.radio === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                radio: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.radio === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.solas.radio === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.solas.radio === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.solas.radio === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.solas.radio === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.solas.radio === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Emergency power supply & alarms</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                emergency: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.emergency === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                emergency: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.emergency === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                emergency: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.emergency === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                emergency: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.emergency === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              solas: {
                                ...prev.solas,
                                emergency: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.solas.emergency === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.solas.emergency === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.solas.emergency === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.solas.emergency === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.solas.emergency === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.solas.emergency === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MARPOL Compliance */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-50">
              <div className="px-6 py-5 sm:px-6 bg-gradient-to-r from-green-400 to-teal-500 border-b border-gray-50">
                <h3 className="text-xl leading-6 font-bold text-white">MARPOL (Marine Pollution Prevention) Compliance</h3>
                <p className="mt-2 max-w-3xl text-sm text-green-100">
                  Prevents marine pollution from oil, sewage, garbage, and air emissions. The surveyor checks oil water separator, sewage treatment plant, garbage management plan, and emission controls. Required for renewal of IOPP and other MARPOL certificates.
                </p>
              </div>
              <div className="px-6 py-3 bg-green-50 border-b border-gray-100">
                <div className="text-sm font-medium text-green-800">
                  <p className="mb-1"><strong>Checkbox Legend:</strong></p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-red-100 text-red-800 border border-red-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg></span> Not Compliant - Serious deficiencies found</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg></span> Pending - Awaiting further inspection or documentation</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-orange-100 text-orange-800 border border-orange-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" />
                            </svg></span> Semi-Moderate - Minor deficiencies that need attention</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg></span> Moderate - Generally compliant with minor observations</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg></span> Compliant - Fully meets regulatory requirements</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">
                  <thead className="bg-gray-25">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Compliance Item</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    <tr className="hover:bg-green-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Oily Water Separator (OWS)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    ows: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.ows === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    ows: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.ows === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    ows: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.ows === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    ows: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.ows === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    ows: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.ows === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.marpol.ows === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.marpol.ows === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.marpol.ows === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.marpol.ows === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.marpol.ows === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-green-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sewage treatment system</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    sewage: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.sewage === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    sewage: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.sewage === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    sewage: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.sewage === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    sewage: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.sewage === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    sewage: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.sewage === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.marpol.sewage === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.marpol.sewage === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.marpol.sewage === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.marpol.sewage === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.marpol.sewage === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-green-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Garbage Management Plan</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    garbage: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.garbage === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    garbage: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.garbage === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    garbage: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.garbage === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    garbage: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.garbage === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  marpol: {
                                    ...prev.marpol,
                                    garbage: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.garbage === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.marpol.garbage === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.marpol.garbage === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.marpol.garbage === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.marpol.garbage === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.marpol.garbage === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-green-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Oil Record Book properly maintained</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                oilRecord: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.oilRecord === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                oilRecord: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.oilRecord === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                oilRecord: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.oilRecord === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                oilRecord: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.oilRecord === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                oilRecord: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.oilRecord === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.marpol.oilRecord === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.marpol.oilRecord === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.marpol.oilRecord === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.marpol.oilRecord === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.marpol.oilRecord === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-green-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Air emission compliance (MARPOL Annex VI)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                airEmission: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.airEmission === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                airEmission: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.airEmission === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                airEmission: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.airEmission === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                airEmission: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.airEmission === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              marpol: {
                                ...prev.marpol,
                                airEmission: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.marpol.airEmission === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.marpol.airEmission === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.marpol.airEmission === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.marpol.airEmission === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.marpol.airEmission === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.marpol.airEmission === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load Line Convention Compliance */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-50">
              <div className="px-6 py-5 sm:px-6 bg-gradient-to-r from-purple-400 to-indigo-500 border-b border-gray-50">
                <h3 className="text-xl leading-6 font-bold text-white">Load Line Convention Compliance</h3>
                <p className="mt-2 max-w-3xl text-sm text-purple-100">
                  Ensures ship stability, buoyancy, and safe loading limits. The surveyor checks freeboard marks, hull openings, watertight integrity, and structural condition. Required to renew the International Load Line Certificate.
                </p>
              </div>
              <div className="px-6 py-3 bg-purple-50 border-b border-gray-100">
                <div className="text-sm font-medium text-purple-800">
                  <p className="mb-1"><strong>Checkbox Legend:</strong></p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-red-100 text-red-800 border border-red-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg></span> Not Compliant - Serious deficiencies found</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg></span> Pending - Awaiting further inspection or documentation</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-orange-100 text-orange-800 border border-orange-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" />
                            </svg></span> Semi-Moderate - Minor deficiencies that need attention</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg></span> Moderate - Generally compliant with minor observations</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg></span> Compliant - Fully meets regulatory requirements</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">
                  <thead className="bg-gray-25">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Compliance Item</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    <tr className="hover:bg-purple-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Freeboard & load line marks</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    freeboard: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.freeboard === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    freeboard: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.freeboard === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    freeboard: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.freeboard === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    freeboard: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.freeboard === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    freeboard: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.freeboard === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.loadLine.freeboard === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.loadLine.freeboard === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.loadLine.freeboard === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.loadLine.freeboard === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.loadLine.freeboard === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-purple-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Watertight doors & hatch covers</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    watertight: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.watertight === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    watertight: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.watertight === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    watertight: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.watertight === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    watertight: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.watertight === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    watertight: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.watertight === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.loadLine.watertight === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.loadLine.watertight === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.loadLine.watertight === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.loadLine.watertight === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.loadLine.watertight === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-purple-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Hull openings & closures</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    hullOpenings: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.hullOpenings === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    hullOpenings: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.hullOpenings === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    hullOpenings: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.hullOpenings === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    hullOpenings: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.hullOpenings === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  loadLine: {
                                    ...prev.loadLine,
                                    hullOpenings: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.hullOpenings === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.loadLine.hullOpenings === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.loadLine.hullOpenings === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.loadLine.hullOpenings === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.loadLine.hullOpenings === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.loadLine.hullOpenings === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-purple-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Structural condition of hull</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                structural: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.structural === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                structural: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.structural === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                structural: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.structural === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                structural: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.structural === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                structural: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.structural === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.loadLine.structural === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.loadLine.structural === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.loadLine.structural === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.loadLine.structural === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.loadLine.structural === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-purple-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Stability condition compliance</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                stability: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.stability === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                stability: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.stability === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                stability: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.stability === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                stability: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.stability === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              loadLine: {
                                ...prev.loadLine,
                                stability: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.loadLine.stability === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.loadLine.stability === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.loadLine.stability === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.loadLine.stability === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.loadLine.stability === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.loadLine.stability === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ISM Code Compliance */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-50">
              <div className="px-4 py-4 sm:px-6 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-gray-50">
                <h3 className="text-lg leading-6 font-semibold text-gray-900">ISM Code (International Safety Management) Compliance</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  Ensures the ship is operated under an effective Safety Management System (SMS). The surveyor verifies Document of Compliance (DOC), Safety Management Certificate (SMC), emergency procedures, and maintenance records. Mandatory for operational approval and certificate renewal.
                </p>
              </div>
              <div className="px-6 py-3 bg-blue-50 border-b border-gray-100">
                <div className="text-sm font-medium text-blue-800">
                  <p className="mb-1"><strong>Checkbox Legend:</strong></p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-red-100 text-red-800 border border-red-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg></span> Not Compliant - Serious deficiencies found</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg></span> Pending - Awaiting further inspection or documentation</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-orange-100 text-orange-800 border border-orange-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" />
                            </svg></span> Semi-Moderate - Minor deficiencies that need attention</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg></span> Moderate - Generally compliant with minor observations</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg></span> Compliant - Fully meets regulatory requirements</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">
                  <thead className="bg-gray-25">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Compliance Item</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    <tr className="hover:bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Safety Management System implemented</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    sms: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.sms === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    sms: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.sms === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    sms: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.sms === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    sms: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.sms === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    sms: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.sms === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.ism.sms === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.ism.sms === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.ism.sms === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.ism.sms === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.ism.sms === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Document of Compliance (DOC) valid</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    doc: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.doc === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    doc: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.doc === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    doc: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.doc === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    doc: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.doc === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    doc: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.doc === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.ism.doc === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.ism.doc === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.ism.doc === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.ism.doc === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.ism.doc === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Safety Management Certificate (SMC) valid</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    smc: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.smc === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    smc: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.smc === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    smc: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.smc === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    smc: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.smc === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  ism: {
                                    ...prev.ism,
                                    smc: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.smc === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.ism.smc === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.ism.smc === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.ism.smc === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.ism.smc === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.ism.smc === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Emergency procedures available & updated</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                emergency: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.emergency === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                emergency: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.emergency === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                emergency: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.emergency === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                emergency: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.emergency === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                emergency: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.emergency === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.ism.emergency === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.ism.emergency === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.ism.emergency === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.ism.emergency === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.ism.emergency === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Maintenance & inspection records</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                maintenance: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.maintenance === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                maintenance: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.maintenance === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                maintenance: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.maintenance === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                maintenance: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.maintenance === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                maintenance: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.maintenance === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.ism.maintenance === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.ism.maintenance === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.ism.maintenance === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.ism.maintenance === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.ism.maintenance === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Crew drills and familiarization</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                crew: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.crew === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                crew: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.crew === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                crew: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.crew === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                crew: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.crew === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              ism: {
                                ...prev.ism,
                                crew: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.ism.crew === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.ism.crew === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.ism.crew === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.ism.crew === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.ism.crew === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.ism.crew === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Classification Society & Flag State Rules */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-50">
              <div className="px-6 py-5 sm:px-6 bg-gradient-to-r from-yellow-300 to-amber-400 border-b border-gray-50">
                <h3 className="text-xl leading-6 font-bold text-white">Classification Society & Flag State Rules</h3>
                <p className="mt-2 max-w-3xl text-sm text-yellow-100">
                  Ship must comply with rules issued by Classification Societies (DNV, ABS, Lloyd's Register, etc.) and Flag State authorities. Includes inspection of hull, machinery, tanks, and survey schedules (annual, intermediate, dry dock). Only class-approved and flag-approved surveys allow certificate renewal.
                </p>
              </div>
              <div className="px-6 py-3 bg-yellow-50 border-b border-gray-100">
                <div className="text-sm font-medium text-yellow-800">
                  <p className="mb-1"><strong>Checkbox Legend:</strong></p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-red-100 text-red-800 border border-red-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg></span> Not Compliant - Serious deficiencies found</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg></span> Pending - Awaiting further inspection or documentation</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-orange-100 text-orange-800 border border-orange-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" />
                            </svg></span> Semi-Moderate - Minor deficiencies that need attention</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg></span> Moderate - Generally compliant with minor observations</p>
                  <p className="flex items-center"><span className="inline-block w-4 h-4 bg-green-100 text-green-800 border border-green-300 rounded mr-2 text-center text-xs"><svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg></span> Compliant - Fully meets regulatory requirements</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-50">
                  <thead className="bg-gray-25">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Compliance Item</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    <tr className="hover:bg-yellow-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Classification certificate validity</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    certificate: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.certificate === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    certificate: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.certificate === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    certificate: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.certificate === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    certificate: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.certificate === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    certificate: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.certificate === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.classification.certificate === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.classification.certificate === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.classification.certificate === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.classification.certificate === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.classification.certificate === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-yellow-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Flag State statutory certificates</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    flagState: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.flagState === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    flagState: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.flagState === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    flagState: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.flagState === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    flagState: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.flagState === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    flagState: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.flagState === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.classification.flagState === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.classification.flagState === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.classification.flagState === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.classification.flagState === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.classification.flagState === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-yellow-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Survey schedule compliance</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    surveySchedule: 'not-compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.surveySchedule === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    surveySchedule: 'pending'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.surveySchedule === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    surveySchedule: 'semi-moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.surveySchedule === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    surveySchedule: 'moderate'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.surveySchedule === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => {
                              if (!isComplianceViewOnly) {
                                setComplianceStatus(prev => ({
                                  ...prev,
                                  classification: {
                                    ...prev.classification,
                                    surveySchedule: 'compliant'
                                  }
                                }));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.surveySchedule === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : isComplianceViewOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            disabled={isComplianceViewOnly}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.classification.surveySchedule === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.classification.surveySchedule === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.classification.surveySchedule === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.classification.surveySchedule === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.classification.surveySchedule === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-yellow-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Hull condition as per class rules</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                hullCondition: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.hullCondition === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                hullCondition: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.hullCondition === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                hullCondition: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.hullCondition === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                hullCondition: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.hullCondition === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                hullCondition: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.hullCondition === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.classification.hullCondition === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.classification.hullCondition === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.classification.hullCondition === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.classification.hullCondition === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.classification.hullCondition === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-yellow-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Machinery condition as per class rules</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                machineryCondition: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.machineryCondition === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                machineryCondition: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.machineryCondition === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                machineryCondition: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.machineryCondition === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                machineryCondition: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.machineryCondition === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                machineryCondition: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.machineryCondition === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.classification.machineryCondition === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.classification.machineryCondition === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.classification.machineryCondition === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.classification.machineryCondition === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.classification.machineryCondition === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-yellow-25 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tank inspection & structural integrity</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                tankInspection: 'not-compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.tankInspection === 'not-compliant' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ❌
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                tankInspection: 'pending'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.tankInspection === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ⚠️
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                tankInspection: 'semi-moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.tankInspection === 'semi-moderate' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◐
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                tankInspection: 'moderate'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.tankInspection === 'moderate' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ◉
                          </button>
                          <button 
                            onClick={() => setComplianceStatus(prev => ({
                              ...prev,
                              classification: {
                                ...prev.classification,
                                tankInspection: 'compliant'
                              }
                            }))}
                            className={`px-2 py-1 rounded text-xs font-medium ${complianceStatus.classification.tankInspection === 'compliant' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ✅
                          </button>
                        </div>
                        {complianceStatus.classification.tankInspection === 'not-compliant' && (
                          <div className="mt-1 text-xs text-red-600 font-medium">Not Compliant</div>
                        )}
                        {complianceStatus.classification.tankInspection === 'pending' && (
                          <div className="mt-1 text-xs text-yellow-600 font-medium">Pending</div>
                        )}
                        {complianceStatus.classification.tankInspection === 'semi-moderate' && (
                          <div className="mt-1 text-xs text-orange-600 font-medium">Semi Moderate</div>
                        )}
                        {complianceStatus.classification.tankInspection === 'moderate' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Moderate</div>
                        )}
                        {complianceStatus.classification.tankInspection === 'compliant' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Compliant</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
              <div className="relative group">
                <button 
                  onClick={() => console.log('Generate PDF clicked')}
                  disabled={!isAllComplianceCompleted()}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isAllComplianceCompleted() 
                    ? 'border-blue-300 text-blue-800 bg-blue-100 hover:bg-blue-200 cursor-pointer' 
                    : 'border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed'}`}
                >
                  <svg className={`-ml-1 mr-2 h-5 w-5 ${isAllComplianceCompleted() ? 'text-blue-600' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Generate PDF
                </button>
                {!isAllComplianceCompleted() && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                    Complete all compliance sections to enable PDF generation
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
              {!isComplianceViewOnly && (
                <button 
                  onClick={submitComplianceData}
                  disabled={!isAllComplianceCompleted() || !currentSurveyForCompliance}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isAllComplianceCompleted() && currentSurveyForCompliance
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Submit Compliance
                </button>
              )}
              {isComplianceViewOnly && (
                <button 
                  onClick={() => setIsComplianceViewOnly(false)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a1 1 0 111.414 1.414L11.414 8.586a2 2 0 00-2.828 0L6.5 10.672l-1.086 3.258a1 1 0 001.17.795l3.258-1.086 2.086-2.086a2 2 0 000-2.828L11.414 6.586z" />
                    <path d="M19 11a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Edit Compliance
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hull Inspection Section */}
        {activeSection === 'hull-inspection' && (
          <HullInspection
            survey={hullInspectionSurvey}
            onSaveReport={handleHullInspectionReportSaved}
            onClose={() => {
              setActiveSection('surveys');
              setHullInspectionSurvey(null);
            }}
          />
        )}

        {/* AI Image Analysis Section */}
        {activeSection === 'ai-analysis' && (
          <div className="space-y-6">
            {/* Back button */}
            <div className="mb-4">
              <button 
                onClick={() => {
                  setActiveSection('surveys');
                  setCurrentSurveyForAI(null);
                  setUploadedImages([]);
                  setAiAnalysisResults([]);
                  setSelectedImageTypes({});
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Active Surveys
              </button>
            </div>
            
            {/* Page Heading */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h2 className="text-3xl font-bold text-gray-900">AI Ship Damage Detection</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {currentSurveyForAI ? (
                      <>Analyzing vessel: <span className="font-semibold">{currentSurveyForAI.vesselName}</span></>
                    ) : (
                      'Upload ship images for automated damage analysis'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-5 bg-gradient-to-r from-cyan-500 to-blue-500">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Ship Images
                </h3>
                <p className="mt-1 text-sm text-cyan-100">
                  Upload multiple images of the ship hull for damage detection (Rust, Cracks, Corrosion, Dents)
                </p>
              </div>

              <div className="p-6">
                {/* File Upload Area */}
                <div className="mt-2">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-cyan-500 transition-colors">
                    <div className="space-y-2 text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500"
                        >
                          <span className="text-lg">Click to upload</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              const newImages = files.map((file, index) => ({
                                id: Date.now() + index,
                                file: file,
                                preview: URL.createObjectURL(file),
                                name: file.name,
                                size: (file.size / 1024).toFixed(2) + ' KB'
                              }));
                              setUploadedImages([...uploadedImages, ...newImages]);
                            }}
                          />
                        </label>
                        <p className="pl-1 text-lg">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                      <p className="text-sm font-semibold text-cyan-600 mt-2">Maximum 10 images per analysis</p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Selected Images ({uploadedImages.length})
                      </h4>
                      <button
                        onClick={() => {
                          setUploadedImages([]);
                          setSelectedImageTypes({});
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative group border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="h-40 w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setUploadedImages(uploadedImages.filter(img => img.id !== image.id));
                              URL.revokeObjectURL(image.preview);
                              // Remove from selectedImageTypes as well
                              const newTypes = {...selectedImageTypes};
                              delete newTypes[image.id];
                              setSelectedImageTypes(newTypes);
                            }}
                            className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <p className="mt-2 text-xs text-gray-600 truncate">{image.name}</p>
                          <p className="text-xs text-gray-500 mb-2">{image.size}</p>
                          
                          {/* Image Type Dropdown */}
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Image Type (Optional)
                            </label>
                            <select
                              value={selectedImageTypes[image.id] || ''}
                              onChange={(e) => {
                                setSelectedImageTypes({
                                  ...selectedImageTypes,
                                  [image.id]: e.target.value
                                });
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                            >
                              <option value="">General</option>
                              <option value="Hull">Hull</option>
                              <option value="Deck">Deck</option>
                              <option value="Bow">Bow</option>
                              <option value="Stern">Stern</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Analyze Button */}
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={async () => {
                          console.log('🔵 ANALYZE BUTTON CLICKED!');
                          console.log('Uploaded images:', uploadedImages);
                          console.log('Selected image types:', selectedImageTypes);
                          
                          setIsAnalyzing(true);
                          
                          try {
                            console.log('🔵 Creating FormData...');
                            // Create FormData for API request
                            const formData = new FormData();
                            
                            // Append images and their types
                            uploadedImages.forEach((image) => {
                              formData.append('images', image.file);
                              formData.append('imageTypes', selectedImageTypes[image.id] || 'General');
                            });
                            
                            // Add survey ID if available
                            if (currentSurveyForAI && (currentSurveyForAI._id || currentSurveyForAI.id)) {
                              formData.append('surveyId', currentSurveyForAI._id || currentSurveyForAI.id);
                            }
                            
                            console.log('🔵 Sending request to AI server...');
                            // Call AI Analysis API
                            const response = await fetch('http://localhost:5001/api/ai/analyze-images', {
                              method: 'POST',
                              body: formData
                            });
                            
                            console.log('🔵 Response received:', response.status, response.statusText);
                            
                            if (!response.ok) {
                              throw new Error(`API Error: ${response.status} ${response.statusText}`);
                            }
                            
                            const data = await response.json();
                            console.log('🔵 Response data:', data);
                            
                            if (data.success) {
                              // Map results to include image preview
                              const resultsWithPreviews = data.results.map((result) => {
                                const originalImage = uploadedImages.find(img => 
                                  img.name === result.imageName
                                );
                                return {
                                  ...result,
                                  preview: originalImage?.preview
                                };
                              });
                              
                              setAiAnalysisResults(resultsWithPreviews);
                              
                              // Show success message
                              if (data.modelStatus === 'mock') {
                                warning('Analysis completed using mock predictions. Train the model for real results.', 10000);
                              } else {
                                success('AI analysis completed successfully!', 10000);
                              }
                            } else {
                              throw new Error(data.error || 'Analysis failed');
                            }
                          } catch (error) {
                            console.error('🔴 ERROR analyzing images:', error);
                            console.error('🔴 Error message:', error.message);
                            console.error('🔴 Error type:', error.name);
                            
                            // Check if AI server is running
                            if (error.message.includes('Failed to fetch')) {
                              console.error('🔴 AI server connection failed!');
                              showError('AI server is not running. Please start the AI API server on port 5001.', 10000);
                              
                              // Fallback to mock data for demo
                              const mockResults = uploadedImages.map((image, index) => ({
                                imageId: image.id,
                                imageName: image.name,
                                imageType: selectedImageTypes[image.id] || 'General',
                                damageDetected: Math.random() > 0.5,
                                damageType: ['Rust', 'Crack', 'Corrosion', 'Dent'][Math.floor(Math.random() * 4)],
                                confidence: (Math.random() * 30 + 70).toFixed(1),
                                severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                                location: ['Hull Port Side', 'Hull Starboard', 'Bow Section', 'Stern Section'][Math.floor(Math.random() * 4)],
                                preview: image.preview
                              }));
                              setAiAnalysisResults(mockResults);
                              warning('Using demo mode with mock results', 10000);
                            } else {
                              showError(`Analysis failed: ${error.message}`, 10000);
                            }
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }}
                        disabled={isAnalyzing || uploadedImages.length === 0}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${
                          isAnalyzing || uploadedImages.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
                        }`}
                      >
                        {isAnalyzing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing Images...
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Analyze Images
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Results Section */}
            {aiAnalysisResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-5 bg-gradient-to-r from-green-500 to-emerald-500">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analysis Results
                  </h3>
                  <p className="mt-1 text-sm text-green-100">
                    AI-powered damage detection completed
                  </p>
                </div>

                <div className="p-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Damages Detected</p>
                          <p className="text-2xl font-bold text-red-600">
                            {aiAnalysisResults.filter(r => r.damageDetected).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Clean Images</p>
                          <p className="text-2xl font-bold text-green-600">
                            {aiAnalysisResults.filter(r => !r.damageDetected).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Analyzed</p>
                          <p className="text-2xl font-bold text-blue-600">{aiAnalysisResults.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image Type</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Damage Type</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Confidence</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Severity</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {aiAnalysisResults.map((result, index) => {
                          return (
                            <tr key={result.imageId || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img
                                    src={result.preview}
                                    alt={result.imageName}
                                    className="h-12 w-12 rounded object-cover"
                                  />
                                  <span className="ml-3 text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {result.imageName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {result.imageType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {result.damageDetected ? (
                                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    ⚠️ Damage Detected
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    ✅ No Damage
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.damageDetected ? (
                                  <span className="font-semibold text-red-600">{result.damageType}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-gray-900">{result.confidence}%</span>
                                  <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        result.confidence > 80 ? 'bg-green-500' : 
                                        result.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${result.confidence}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {result.damageDetected ? (
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    result.severity === 'High' ? 'bg-red-100 text-red-800' :
                                    result.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {result.severity}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {result.damageDetected ? result.location : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => {
                        // Generate PDF report
                        alert('PDF Report generation will be implemented with backend API');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF Report
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (!currentSurveyForAI || (!currentSurveyForAI.id && !currentSurveyForAI._id)) {
                          showError('No survey selected', 10000);
                          return;
                        }

                        setIsSavingResults(true);
                        
                        try {
                          // Get survey ID (handle both _id and id fields)
                          const surveyId = currentSurveyForAI._id || currentSurveyForAI.id;
                          console.log('Saving AI results for survey:', { surveyId, survey: currentSurveyForAI });
                          
                          // Prepare data to save
                          const dataToSave = {
                            surveyId: surveyId,
                            surveyorId: user?._id || user?.id,  // Include surveyor ID
                            results: aiAnalysisResults.map(r => ({
                              imageName: r.imageName,
                              imageType: r.imageType,
                              damageDetected: r.damageDetected,
                              damageType: r.damageType,
                              confidence: r.confidence,
                              severity: r.severity,
                              location: r.location,
                              timestamp: r.timestamp || new Date().toISOString()
                            })),
                            summary: {
                              totalImages: aiAnalysisResults.length,
                              damagesDetected: aiAnalysisResults.filter(r => r.damageDetected).length,
                              cleanImages: aiAnalysisResults.filter(r => !r.damageDetected).length
                            }
                          };
                          
                          // Send to backend
                          const response = await fetch('http://localhost:5001/api/ai/save-results', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(dataToSave)
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            success('✅ AI analysis results saved to survey report successfully!', 10000);
                            
                            // Refresh Recent Reports to show updated AI analysis
                            loadCompletedSurveys();
                            loadAiReports(); // Refresh AI reports
                          } else {
                            showError('Failed to save results: ' + (result.error || 'Unknown error'), 10000);
                          }
                          
                        } catch (error) {
                          console.error('Error saving results:', error);
                          showError('Failed to save results to database', 10000);
                        } finally {
                          setIsSavingResults(false);
                        }
                      }}
                      disabled={isSavingResults}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingResults ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save to Survey Report
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setUploadedImages([]);
                        setAiAnalysisResults([]);
                        setSelectedImageTypes({});
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Start New Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Predictive Maintenance */}
        {activeSection === 'predictive' && (
          <div className="space-y-6">
            {/* Vessel Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-xl font-bold text-gray-900">Select Vessel</h3>
                <select
                  value={selectedVessel || ''}
                  onChange={(e) => setSelectedVessel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select a vessel...</option>
                  {vessels.map((vessel) => (
                    <option key={vessel._id} value={vessel._id}>
                      {vessel.name} {vessel.imo ? `(IMO: ${vessel.imo})` : ''}
                    </option>
                  ))}
                </select>
                
                {selectedVessel && (
                  <button
                    onClick={() => fetchKNNPredictions(selectedVessel)}
                    disabled={knnLoading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {knnLoading ? '🔄 Loading...' : '🔄 Refresh'}
                  </button>
                )}
              </div>
              
              {/* Show which vessel is currently displayed */}
              {selectedVessel && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    📊 Showing predictions for: <span className="font-semibold text-gray-900">
                      {vessels.find(v => v._id === selectedVessel)?.name || 'Unknown Vessel'}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <PredictiveMaintenanceTab 
              knnPredictions={knnPredictions}
              knnLoading={knnLoading}
              knnError={knnError}
              setKnnRefreshKey={setKnnRefreshKey}
              selectedVessel={vessels.find(v => v._id === selectedVessel)}
            />
          </div>
        )}

        {/* Recent Documents */}
        {activeSection === 'documents' && (
          <div className="mt-8 space-y-6">
            {/* Generated Certificates Section */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                    <svg className="w-7 h-7 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Generated Certificates
                  </h3>
                  <p className="text-sm text-gray-600">Marine survey certificates issued by you</p>
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Certificate No</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vessel</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Survey Type</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Issue Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rating</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificatesLoading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <span className="ml-3 text-gray-600">Loading certificates...</span>
                          </div>
                        </td>
                      </tr>
                    ) : certificates.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                            </svg>
                            <p className="text-gray-500 font-medium">No certificates generated yet</p>
                            <p className="text-gray-400 text-sm mt-1">Generate certificates from completed surveys</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      certificates.map((cert) => {
                        // Calculate days remaining until expiry
                        const expiryDate = new Date(cert.expiryDate);
                        const today = new Date();
                        const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        const isExpired = daysRemaining < 0;
                        const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;
                        const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
                        
                        return (
                        <tr 
                          key={cert._id} 
                          onClick={() => setCertificateDetailModal({ open: true, certificate: cert })}
                          className="hover:bg-green-50 transition-colors duration-200 cursor-pointer"
                        >
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cert.certificateNumber}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md mr-3">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">{cert.vessel?.name || 'Unknown Vessel'}</div>
                                <div className="text-xs text-gray-500">IMO: {cert.vessel?.imo || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                            {cert.surveyType || cert.survey?.surveyType || 'N/A'}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                            {new Date(cert.issueDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-600">
                                {new Date(cert.expiryDate).toLocaleDateString('en-GB')}
                              </div>
                              <div className={`text-xs font-semibold mt-1 flex items-center ${
                                isExpired ? 'text-red-600' :
                                isUrgent ? 'text-red-600 animate-pulse' :
                                isExpiringSoon ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {isExpired ? (
                                  `Expired ${Math.abs(daysRemaining)} days ago`
                                ) : daysRemaining === 0 ? (
                                  'Expires today!'
                                ) : daysRemaining === 1 ? (
                                  '1 day remaining'
                                ) : (
                                  `${daysRemaining} days remaining`
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              cert.status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                              cert.status === 'Conditional' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                              cert.status === 'Deficient' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {cert.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="text-yellow-500 mr-1">★</span>
                              {cert.overallRating || 'N/A'}/5.0
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const token = localStorage.getItem('token');
                                  const response = await axios.get(
                                    `/api/certificates/${cert._id}/download`,
                                    {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob'
                                    }
                                  );
                                  
                                  const blob = new Blob([response.data], { type: 'application/pdf' });
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `Certificate_${cert.certificateNumber}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Error downloading certificate:', error);
                                  alert('Failed to download certificate');
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 border-2 border-green-300 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document List Component */}
            <DocumentList 
              relatedEntityType="Survey"
              relatedEntityId="sample-survey-id"
              showUploadButton={true}
              limit={3}
            />
          </div>
        )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Survey Booking Details</h3>
              <button onClick={() => setDetailsModal({ open: false, booking: null })} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Ship</div>
                <div className="text-gray-900">{detailsModal.booking?.vessel?.name || detailsModal.booking?.vesselName || '-'}</div>
                <div className="text-xs text-gray-500">ID: {detailsModal.booking?.vessel?.vesselId || detailsModal.booking?.vessel?._id || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Survey Type</div>
                <div className="text-gray-900">{detailsModal.booking?.surveyType || detailsModal.booking?.type || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Inspection Date</div>
                <div className="text-gray-900">{detailsModal.booking?.inspectionDate ? formatDate(detailsModal.booking?.inspectionDate) : '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Inspection Time</div>
                <div className="text-gray-900">{detailsModal.booking?.inspectionTime || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Location</div>
                <div className="text-gray-900">{detailsModal.booking?.location || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Client</div>
                <div className="text-gray-900">{detailsModal.booking?.bookedBy?.name || detailsModal.booking?.client || 'Ship Management'}</div>
              </div>
              {detailsModal.booking?.notes && (
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Notes</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{detailsModal.booking?.notes}</div>
                </div>
              )}
              {detailsModal.booking?.specialRequirements && (
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Special Requirements</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{detailsModal.booking?.specialRequirements}</div>
                </div>
              )}
              {/* Vessel Media Section */}
              {detailsModal.booking?.vessel?.media && detailsModal.booking?.vessel?.media.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-gray-500 mb-2">Vessel Media Files</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailsModal.booking.vessel.media.map((media, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {media.type === 'photo' ? (
                              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : media.type === 'video' ? (
                              <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            <div>
                              <div className="text-gray-900 text-sm font-medium">{media.fileName || `File ${index + 1}`}</div>
                              <div className="text-gray-500 text-xs">{media.type} • {(media.fileSize / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = media.url;
                              link.download = media.fileName || `vessel-media-${index}.${media.type === 'photo' ? 'jpg' : media.type === 'video' ? 'mp4' : 'pdf'}`;
                              link.target = '_blank';
                              link.click();
                            }}
                            className="text-marine-blue hover:text-marine-dark"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button onClick={() => setDetailsModal({ open: false, booking: null })} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <UserProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={{
          name: user?.name || 'Surveyor',
          email: user?.email || 'surveyor@example.com',
          role: user?.role || 'surveyor',
          status: user?.status || 'active',
        }}
        variant="sidebar"
        title="My Profile"
      />

      {/* Gallery Modal - Removed as per requirements */}

      {/* Survey Form Modal */}
      <SurveyFormModal
        isOpen={surveyFormModal.open}
        onClose={() => setSurveyFormModal({ open: false, survey: null })}
        survey={surveyFormModal.survey}
        onSurveySubmitted={handleSurveySubmitted}
      />
      
      {/* Survey Details Modal */}
      <SurveyDetailsModal
        isOpen={surveyDetailsModal.open}
        onClose={() => setSurveyDetailsModal({ open: false, survey: null })}
        survey={surveyDetailsModal.survey}
      />
      
      {/* Compliance Report Modal */}
      <ComplianceReportModal
        isOpen={complianceReportModal.open}
        onClose={() => setComplianceReportModal({ open: false, survey: null })}
        survey={complianceReportModal.survey}
      />
      
      {/* Premium Inspection Details Modal */}
      <PremiumInspectionDetailsModal
        isOpen={premiumInspectionDetailsModal.open}
        onClose={() => setPremiumInspectionDetailsModal({ open: false, report: null })}
        report={premiumInspectionDetailsModal.report}
      />

      <HullInspectionReportModal
        isOpen={hullInspectionDetailsModal.open}
        onClose={() => setHullInspectionDetailsModal({ open: false, report: null })}
        report={hullInspectionDetailsModal.report}
      />
      
      {/* Certificate PDF Viewer Modal */}
      {certificateDetailModal.open && certificateDetailModal.certificate && (
        <CertificatePdfViewer 
          certificate={certificateDetailModal.certificate}
          onClose={() => {
            setCertificateDetailModal({ open: false, certificate: null });
            if (certificatePdfUrl) {
              window.URL.revokeObjectURL(certificatePdfUrl);
              setCertificatePdfUrl(null);
            }
          }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/3">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete the survey report for <strong>{deleteConfirmModal.reportName}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={cancelDeleteReport}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteReport(deleteConfirmModal.reportId)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {hullDeleteConfirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/3">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete the hull inspection report for <strong>{hullDeleteConfirmModal.reportName}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={cancelHullDeleteReport}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteHullInspectionReport(hullDeleteConfirmModal.reportId)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

