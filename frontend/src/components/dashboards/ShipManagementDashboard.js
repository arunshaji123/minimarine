import React, { useState, useEffect } from 'react';
import { FaChartLine } from 'react-icons/fa';
import DashboardLayout from '../layouts/DashboardLayout';
import UserProfileModal from '../UserProfileModal.jsx';
import SurveyorBookingModal from '../modals/SurveyorBookingModal';
import CargoManagerBookingModal from '../modals/CargoManagerBookingModal';
import SurveyDetailsModal from '../modals/SurveyDetailsModal';
import ComplianceReportModal from '../modals/ComplianceReportModal';
import PredictiveMaintenanceTab from './PredictiveMaintenanceTab';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
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
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Marine Survey Certificate
            </h3>
            <p className="text-sm text-gray-600 mt-1">Certificate #{certificate.certificateNumber}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
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
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
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

export default function ShipManagementDashboard() {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [allAccessibleVessels, setAllAccessibleVessels] = useState([]); // New state for all vessels accessible for booking
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  
  // User management state
  const [cargoManagers, setCargoManagers] = useState([]);
  const [surveyors, setSurveyors] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Booking state
  const [showSurveyorBookingModal, setShowSurveyorBookingModal] = useState(false);
  const [showCargoManagerBookingModal, setShowCargoManagerBookingModal] = useState(false);
  const [surveyorBookings, setSurveyorBookings] = useState([]);
  const [cargoManagerBookings, setCargoManagerBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [editingSurveyorBooking, setEditingSurveyorBooking] = useState(null);
  const [editingCargoManagerBooking, setEditingCargoManagerBooking] = useState(null);

  const [detailsModal, setDetailsModal] = useState({ open: false, type: null, booking: null });
  const [surveyDetailsModal, setSurveyDetailsModal] = useState({ open: false, survey: null });
  const [complianceReportModal, setComplianceReportModal] = useState({ open: false, survey: null });
  
  // Surveys state
  const [surveys, setSurveys] = useState([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    bookingId: null,
    bookingType: null,
    reason: ''
  });
  const handleDeleteSurveyorBooking = async (bookingId, bookingStatus) => {
    // For all bookings, show confirmation with reason input
    setDeleteModal({
      open: true,
      bookingId: bookingId,
      bookingType: 'surveyor',
      reason: ''
    });
  };

  const handleDeleteCargoManagerBooking = async (bookingId, bookingStatus) => {
    // For all bookings, show confirmation with reason input
    setDeleteModal({
      open: true,
      bookingId: bookingId,
      bookingType: 'cargo',
      reason: ''
    });
  };

  const confirmDeleteBooking = async () => {
    if (!deleteModal.reason.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }
    
    try {
      setBookingsLoading(true);
      setDeleteModal({ open: false, bookingId: null, bookingType: null, reason: '' });
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Include the reason in the request
      const deleteData = { reason: deleteModal.reason.trim() };
      
      if (deleteModal.bookingType === 'surveyor') {
        await axios.delete(`/api/surveyor-bookings/${deleteModal.bookingId}`, {
          ...config,
          data: deleteData
        });
        setSuccessMessage('Surveyor booking deleted successfully!');
      } else {
        await axios.delete(`/api/cargo-manager-bookings/${deleteModal.bookingId}`, {
          ...config,
          data: deleteData
        });
        setSuccessMessage('Cargo manager booking deleted successfully!');
      }
      
      loadBookings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('Failed to delete booking');
    } finally {
      setBookingsLoading(false);
    }
  };

  const cancelDeleteBooking = () => {
    setDeleteModal({ open: false, bookingId: null, bookingType: null, reason: '' });
  };

  // Assignment functionality removed as per requirements

  // Maintenance schedule and crew assignments state
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [crewAssignments, setCrewAssignments] = useState([]);

  // Service Requests state
  const [serviceRequests, setServiceRequests] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [serviceRequestDetailsModal, setServiceRequestDetailsModal] = useState({ open: false, request: null });
  const [bookingFromServiceRequest, setBookingFromServiceRequest] = useState(null);

  // Predictive Maintenance state
  const [selectedSurveyor, setSelectedSurveyor] = useState('');
  const [surveyorVessels, setSurveyorVessels] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState('');
  const [knnPredictions, setKnnPredictions] = useState([]);
  const [knnLoading, setKnnLoading] = useState(false);
  const [knnError, setKnnError] = useState(null);
  const [knnRefreshKey, setKnnRefreshKey] = useState(0);

  // Surveys filter state
  const [surveysSurveyorFilter, setSurveysSurveyorFilter] = useState('');
  const [surveysShipFilter, setSurveysShipFilter] = useState('');
  const [surveysSearch, setSurveysSearch] = useState('');
  const [surveysTab, setSurveysTab] = useState('survey'); // 'survey', 'compliance', or 'certificates'
  
  // Compliance reports state
  const [complianceReports, setComplianceReports] = useState([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceSurveyorFilter, setComplianceSurveyorFilter] = useState('');
  const [complianceShipFilter, setComplianceShipFilter] = useState('');
  const [complianceSearch, setComplianceSearch] = useState('');

  // Certificates state
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [certificatesSurveyorFilter, setCertificatesSurveyorFilter] = useState('');
  const [certificatesShipFilter, setCertificatesShipFilter] = useState('');
  const [certificatesSearch, setCertificatesSearch] = useState('');
  const [certificateDetailModal, setCertificateDetailModal] = useState({ open: false, certificate: null });

  // Navigation state
  const [activeSection, setActiveSection] = useState('overview');

  // Ship Finder states
  const [selectedShipForDetails, setSelectedShipForDetails] = useState(null);
  const [shipDetailsLoading, setShipDetailsLoading] = useState(false);
  const [shipDetailsData, setShipDetailsData] = useState(null);
  const [surveyReportModal, setSurveyReportModal] = useState({ open: false, survey: null });
  const [complianceReportModalShip, setComplianceReportModalShip] = useState({ open: false, report: null });
  const [downloadingShipReport, setDownloadingShipReport] = useState(false);

  // Helper function to get overall compliance status
  const getOverallComplianceStatus = (complianceStatus) => {
    if (!complianceStatus) return 'Pending';
    
    // Check if any section has non-compliant items
    const hasNonCompliant = 
      (complianceStatus.solas && Object.values(complianceStatus.solas).includes('not-compliant')) ||
      (complianceStatus.marpol && Object.values(complianceStatus.marpol).includes('not-compliant')) ||
      (complianceStatus.loadLine && Object.values(complianceStatus.loadLine).includes('not-compliant')) ||
      (complianceStatus.ism && Object.values(complianceStatus.ism).includes('not-compliant')) ||
      (complianceStatus.classification && Object.values(complianceStatus.classification).includes('not-compliant'));
    
    if (hasNonCompliant) return 'Non-Compliant';
    
    // Check if all sections are compliant
    const allCompliant = 
      (complianceStatus.solas && Object.values(complianceStatus.solas).every(v => v === 'compliant')) &&
      (complianceStatus.marpol && Object.values(complianceStatus.marpol).every(v => v === 'compliant')) &&
      (complianceStatus.loadLine && Object.values(complianceStatus.loadLine).every(v => v === 'compliant')) &&
      (complianceStatus.ism && Object.values(complianceStatus.ism).every(v => v === 'compliant')) &&
      (complianceStatus.classification && Object.values(complianceStatus.classification).every(v => v === 'compliant'));
    
    if (allCompliant) return 'Compliant';
    
    return 'Partial';
  };

  // Load ship details for ship finder
  const loadShipDetails = async (vessel) => {
    setShipDetailsLoading(true);
    try {
      // Fetch all related data in parallel
      const [surveysRes, certificatesRes, complianceRes] = await Promise.all([
        axios.get(`/api/surveys/vessel/${vessel._id}`),
        axios.get('/api/certificates'),
        axios.get(`/api/surveys/compliance-reports/vessel/${vessel._id}`)
      ]);

      // Filter certificates for this specific vessel
      const vesselCertificates = certificatesRes.data.filter(cert => 
        cert.vesselId === vessel._id || 
        cert.vessel?._id === vessel._id ||
        cert.vessel === vessel._id
      );

      // Extract unique surveyors from surveys
      const surveyorSet = new Set();
      const surveyorsData = [];
      surveysRes.data.forEach(survey => {
        if (survey.surveyor && typeof survey.surveyor === 'object') {
          const surveyorId = survey.surveyor._id || survey.surveyor.id;
          if (!surveyorSet.has(surveyorId)) {
            surveyorSet.add(surveyorId);
            surveyorsData.push({
              name: survey.surveyor.name || survey.surveyor.fullName || 'Unknown',
              email: survey.surveyor.email || '',
              licenseNumber: survey.surveyor.licenseNumber || survey.surveyor.certificationNumber || ''
            });
          }
        }
      });

      // Get predictive maintenance predictions from KNN API
      let maintenancePredictions = [];
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        const knnResponse = await axios.get(`/api/knn/predictions/${vessel._id}`, config);
        console.log('KNN Prediction API response for ship finder:', knnResponse.data);
        
        // Extract predictions from the response and format them for display
        if (knnResponse.data.predictions && Array.isArray(knnResponse.data.predictions)) {
          maintenancePredictions = knnResponse.data.predictions.map(pred => ({
            component: pred.component || 'Component',
            prediction: pred.prediction || pred.message || 'No prediction available',
            risk: pred.riskLevel || pred.risk || 'Low',
            recommendation: pred.recommendation || pred.details || 'Regular maintenance recommended',
            confidence: pred.confidence,
            estimatedDate: pred.estimatedMaintenanceDate
          }));
        } else if (knnResponse.data.message) {
          // Handle case where there's a message but no predictions
          console.log('No KNN predictions available:', knnResponse.data.message);
        }
      } catch (knnErr) {
        console.log('KNN predictions not available:', knnErr.message);
        // Don't show predictions if the service is unavailable - leave empty array
        maintenancePredictions = [];
      }

      setShipDetailsData({
        surveys: surveysRes.data || [],
        certificates: vesselCertificates,
        surveyors: surveyorsData,
        complianceReports: complianceRes.data || [],
        maintenancePredictions: maintenancePredictions
      });
    } catch (err) {
      console.error('Error loading ship details:', err);
      setError('Failed to load complete ship details');
      setShipDetailsData({
        surveys: [],
        certificates: [],
        surveyors: [],
        complianceReports: [],
        maintenancePredictions: []
      });
    } finally {
      setShipDetailsLoading(false);
    }
  };

  // Download comprehensive ship report as PDF
  const downloadShipReport = async () => {
    if (!selectedShipForDetails || !shipDetailsData) {
      setError('No ship selected to generate report');
      return;
    }

    setDownloadingShipReport(true);
    try {
      const response = await axios.post('/api/reports/ship-comprehensive', {
        vessel: selectedShipForDetails,
        surveys: shipDetailsData.surveys,
        certificates: shipDetailsData.certificates,
        surveyors: shipDetailsData.surveyors,
        complianceReports: shipDetailsData.complianceReports,
        maintenancePredictions: shipDetailsData.maintenancePredictions
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ship_Report_${selectedShipForDetails.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Ship report downloaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error downloading ship report:', err);
      setError('Failed to download ship report. Please try again.');
    } finally {
      setDownloadingShipReport(false);
    }
  };

  // Function to fetch KNN predictions for a vessel
  const fetchKNNPredictions = async (vesselId) => {
    if (!vesselId || knnLoading) return;
    
    try {
      setKnnLoading(true);
      setKnnError(null);
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const url = `/api/knn/predictions/${vesselId}`;
      const vessel = surveyorVessels.find(v => v._id === vesselId);
      console.log('Fetching predictions for vessel:', vessel?.name, vesselId);
      
      const response = await axios.get(url, config);
      console.log('Prediction API response:', response.data);
      
      if (response.data.predictions && Array.isArray(response.data.predictions)) {
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

  // Function to fetch vessels inspected by selected surveyor
  const fetchSurveyorVessels = async (surveyorId) => {
    if (!surveyorId) {
      setSurveyorVessels([]);
      setSelectedVessel('');
      setKnnPredictions([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log('Fetching surveys for surveyor:', surveyorId);
      
      // Get completed surveys by the specific surveyor (same approach as surveyor dashboard)
      const response = await axios.get(`/api/surveys?surveyor=${surveyorId}&status=Completed`, config);
      const completedSurveys = response.data;
      
      console.log('Completed surveys received:', completedSurveys.length);
      console.log('Survey data:', completedSurveys);
      
      if (!completedSurveys || completedSurveys.length === 0) {
        console.log('No completed surveys found for this surveyor');
        setSurveyorVessels([]);
        setSelectedVessel('');
        setKnnPredictions([]);
        return;
      }
      
      // Extract unique vessels from completed surveys
      // This will include vessels from ALL owners that the surveyor has inspected
      const uniqueVesselsMap = new Map();
      completedSurveys.forEach(survey => {
        console.log('Processing survey:', survey._id, 'vessel:', survey.vessel);
        if (survey.vessel) {
          const vesselData = typeof survey.vessel === 'object' ? survey.vessel : null;
          if (vesselData && vesselData._id) {
            console.log('Adding vessel to map:', vesselData._id, vesselData.name);
            uniqueVesselsMap.set(vesselData._id, {
              _id: vesselData._id,
              name: vesselData.name || 'Unknown Vessel',
              imo: vesselData.imo || vesselData.imoNumber || '',
              vesselType: vesselData.vesselType || '',
              flag: vesselData.flag || '',
              owner: vesselData.owner // Include owner info
            });
          }
        }
      });
      
      const inspectedVessels = Array.from(uniqueVesselsMap.values());
      console.log(`Surveyor ${surveyorId} has completed surveys for ${inspectedVessels.length} vessels (including vessels from all owners)`);
      console.log('Inspected vessels:', inspectedVessels);
      setSurveyorVessels(inspectedVessels);
      
      // Reset vessel selection
      setSelectedVessel('');
      setKnnPredictions([]);
    } catch (err) {
      console.error('Error fetching surveyor vessels:', err);
      console.error('Error response:', err.response?.data);
      setSurveyorVessels([]);
    }
  };

  // Fetch predictions when vessel is selected or refresh is triggered
  useEffect(() => {
    if (activeSection === 'maintenance' && selectedVessel) {
      fetchKNNPredictions(selectedVessel);
    }
  }, [activeSection, selectedVessel, knnRefreshKey]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadServiceRequests = async () => {
    try {
      setSrLoading(true);
      const res = await axios.get('/api/service-requests'); // role-aware: ship_management sees assigned ones
      setServiceRequests(res.data?.requests || []);
    } catch (e) {
      console.error('Failed to load service requests', e);
      setError('Failed to load service requests');
    } finally {
      setSrLoading(false);
    }
  };

  const actOnRequest = async (id, action, note) => {
    try {
      const url = `/api/service-requests/${id}/${action}`; // action: accept | decline
      await axios.post(url, note ? { note } : {});
      await loadServiceRequests();
      setSuccessMessage(`Request ${action}ed`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e) {
      console.error('Failed to update request', e);
      setError(e.response?.data?.message || 'Failed to update request');
    }
  };

  const handleServiceRequestClick = (request) => {
    setServiceRequestDetailsModal({ open: true, request });
  };

  // Load vessels, users, bookings, and service requests on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadVessels();
      loadUsers();
      loadBookings();
      loadServiceRequests();
      loadSurveys();
      loadComplianceReports();
      loadCertificates();
    };
    loadData();
  }, []);
  // Unread counts for messaging
  const { counts } = useUnreadCounts();

  const loadVessels = async () => {
    try {
      setLoading(true);
      console.log('Loading vessels...');
      const response = await axios.get('/api/vessels');
      console.log('Vessels loaded:', response.data.length, 'vessels');
      console.log('Vessels data:', response.data);
      
      // For Ship Management Dashboard:
      // In the Fleet section - show only vessels managed by this ship management company
      // In the Ship Finder section - show ALL vessels in the system (both owner and ship company vessels)
      
      // Store all vessels for ship finder
      setVessels(response.data); // ALL vessels in the system
      
      // Load all accessible vessels for booking forms (including from service requests)
      await loadAllAccessibleVessels();
    } catch (err) {
      console.error('Error loading vessels:', err);
      setError('Failed to load ships');
    } finally {
      setLoading(false);
    }
  };

  // New function to load all vessels accessible for booking and surveys
  const loadAllAccessibleVessels = async () => {
    try {
      console.log('Loading all accessible vessels...');
      
      // For surveys and bookings, ship management needs to see ALL vessels in the system
      // including those owned by individual owners, not just the ones they manage
      // We'll get this from surveys data which includes vessels from all owners
      const allVesselsMap = new Map();
      
      // 1. Load vessels from the main API (vessels ship management owns/manages)
      const vesselsResponse = await axios.get('/api/vessels');
      vesselsResponse.data.forEach(vessel => {
        allVesselsMap.set(vessel._id, vessel);
      });
      
      // 2. Get vessels from service requests (includes owner vessels)
      try {
        const serviceRequestsResponse = await axios.get('/api/service-requests');
        const serviceRequestVessels = serviceRequestsResponse.data.requests 
          ? serviceRequestsResponse.data.requests.map(req => req.vessel).filter(v => v) 
          : [];
        
        serviceRequestVessels.forEach(vessel => {
          if (vessel && !allVesselsMap.has(vessel._id)) {
            allVesselsMap.set(vessel._id, vessel);
          }
        });
      } catch (err) {
        console.log('Could not load service request vessels:', err.message);
      }
      
      // 3. Get vessels from surveys (includes all vessels that have been surveyed)
      try {
        const surveysResponse = await axios.get('/api/surveys');
        surveysResponse.data.forEach(survey => {
          if (survey.vessel && typeof survey.vessel === 'object' && survey.vessel._id) {
            if (!allVesselsMap.has(survey.vessel._id)) {
              allVesselsMap.set(survey.vessel._id, survey.vessel);
            }
          }
        });
        console.log('Added vessels from surveys');
      } catch (err) {
        console.log('Could not load survey vessels:', err.message);
      }
      
      const allVesselsArray = Array.from(allVesselsMap.values());
      console.log('Total accessible vessels loaded:', allVesselsArray.length);
      setAllAccessibleVessels(allVesselsArray);
    } catch (err) {
      console.error('Error loading all accessible vessels:', err);
      // Fallback to just the filtered vessels
      setAllAccessibleVessels(vessels);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('Loading users...');
      
      // Load cargo managers and surveyors in parallel
      const [cargoManagersRes, surveyorsRes, statsRes] = await Promise.all([
        axios.get('/api/user-management/cargo-managers'),
        axios.get('/api/user-management/surveyors'),
        axios.get('/api/user-management/stats')
      ]);
      
      setCargoManagers(cargoManagersRes.data);
      setSurveyors(surveyorsRes.data);
      setUserStats(statsRes.data);
      
      console.log('Users loaded:', {
        cargoManagers: cargoManagersRes.data.length,
        surveyors: surveyorsRes.data.length,
        stats: statsRes.data
      });
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load user data');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      console.log('Loading bookings...');

      // Load surveyor and cargo manager bookings in parallel
      const [surveyorBookingsRes, cargoManagerBookingsRes] = await Promise.all([
        axios.get('/api/surveyor-bookings'),
        axios.get('/api/cargo-manager-bookings')
      ]);
      
      setSurveyorBookings(surveyorBookingsRes.data);
      setCargoManagerBookings(cargoManagerBookingsRes.data);
      
      console.log('Bookings loaded:', {
        surveyorBookings: surveyorBookingsRes.data.length,
        cargoManagerBookings: cargoManagerBookingsRes.data.length
      });
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load booking data');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleSurveyorBooking = async (bookingData) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      let response;
      if (editingSurveyorBooking) {
        console.log('Updating surveyor booking:', bookingData);
        response = await axios.put(`/api/surveyor-bookings/${editingSurveyorBooking._id}`, bookingData, config);
        console.log('Surveyor booking updated successfully:', response.data);
        setSuccessMessage('Surveyor booking updated successfully!');
      } else {
        console.log('Creating surveyor booking:', bookingData);
        response = await axios.post('/api/surveyor-bookings', bookingData, config);
        console.log('Surveyor booking created successfully:', response.data);
        setSuccessMessage('Surveyor booking created successfully!');
      }
      
      setShowSurveyorBookingModal(false);
      setEditingSurveyorBooking(null);
      setBookingFromServiceRequest(null);
      loadBookings(); // Reload bookings
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving surveyor booking:', err);
      setError(`Failed to ${editingSurveyorBooking ? 'update' : 'create'} surveyor booking`);
    }
  };

  const handleEditSurveyorBooking = (booking) => {
    setEditingSurveyorBooking(booking);
    setShowSurveyorBookingModal(true);
  };

  const handleCargoManagerBooking = async (bookingData) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      let response;
      if (editingCargoManagerBooking) {
        console.log('Updating cargo manager booking:', bookingData);
        response = await axios.put(`/api/cargo-manager-bookings/${editingCargoManagerBooking._id}`, bookingData, config);
        console.log('Cargo manager booking updated successfully:', response.data);
        setSuccessMessage('Cargo manager booking updated successfully!');
      } else {
        console.log('Creating cargo manager booking:', bookingData);
        response = await axios.post('/api/cargo-manager-bookings', bookingData, config);
        console.log('Cargo manager booking created successfully:', response.data);
        setSuccessMessage('Cargo manager booking created successfully!');
      }
      
      setShowCargoManagerBookingModal(false);
      setEditingCargoManagerBooking(null);
      setBookingFromServiceRequest(null);
      loadBookings(); // Reload bookings
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving cargo manager booking:', err);
      setError(`Failed to ${editingCargoManagerBooking ? 'update' : 'create'} cargo manager booking`);
    }
  };

  const handleEditCargoManagerBooking = (booking) => {
    setEditingCargoManagerBooking(booking);
    setShowCargoManagerBookingModal(true);
  };

  // Load surveys for managed vessels
  const loadSurveys = async () => {
    try {
      setSurveysLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log('Fetching surveys from /api/surveys/completed...');
      // Use the same endpoint as surveyor dashboard to get all completed surveys
      const response = await axios.get('/api/surveys/completed', config);
      console.log('Surveys loaded successfully:', response.data.length, 'surveys');
      console.log('Survey data:', response.data);
      
      // Store all surveys - no filtering, show everything like surveyor dashboard does
      setSurveys(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading surveys:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 403) {
        setError('Not authorized to view surveys. Please check your permissions.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.msg || err.response?.data?.error || 'Failed to load surveys');
      }
      setSurveys([]); // Clear surveys on error
    } finally {
      setSurveysLoading(false);
    }
  };

  const loadComplianceReports = async () => {
    try {
      setComplianceLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log('Fetching compliance reports from /api/surveys/completed...');
      // Use the same endpoint to get all completed surveys
      const response = await axios.get('/api/surveys/completed', config);
      
      // Filter to get only surveys that have compliance data submitted
      const complianceReports = response.data.filter(survey => {
        return survey.complianceStatus && 
               survey.complianceSubmittedAt;
      });
      
      console.log('Compliance reports loaded:', complianceReports.length, 'reports');
      setComplianceReports(complianceReports);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading compliance reports:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 403) {
        setError('Not authorized to view compliance reports. Please check your permissions.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.msg || err.response?.data?.error || 'Failed to load compliance reports');
      }
      setComplianceReports([]);
    } finally {
      setComplianceLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log('Fetching certificates from /api/certificates/owner/my-certificates...');
      // Fetch all certificates for vessels accessible to this ship management company
      const response = await axios.get('/api/certificates/owner/my-certificates', config);
      
      console.log('Certificates loaded:', response.data.length, 'certificates');
      setCertificates(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading certificates:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 403) {
        setError('Not authorized to view certificates. Please check your permissions.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.msg || err.response?.data?.error || 'Failed to load certificates');
      }
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };
  const handleAddVessel = async (vesselData) => {
    try {
      console.log('Submitting vessel data:', vesselData);
      const response = await axios.post('/api/vessels', vesselData);
      console.log('Vessel created successfully:', response.data);
      
      // Add the new vessel to the state
      setVessels(prev => {
        const newVessels = [response.data, ...prev];
        console.log('Updated vessels list:', newVessels.length, 'vessels');
        return newVessels;
      });
      
      // Also update the all accessible vessels
      setAllAccessibleVessels(prev => {
        // Check if vessel is already in the list to avoid duplicates
        if (!prev.some(v => v._id === response.data._id)) {
          return [response.data, ...prev];
        }
        return prev;
      });
      
      setShowAddModal(false);
      setError(null); // Clear any previous errors
      setSuccessMessage(`Ship "${vesselData.name}" created successfully!`);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error adding vessel:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        const errorData = err.response.data;
        let errorMessage = 'Failed to add ship: ';
        
        if (errorData.msg) {
          errorMessage += errorData.msg;
        } else if (errorData.message) {
          errorMessage += errorData.message;
        } else {
          errorMessage += 'Unknown error';
        }
        
        // Add validation errors if present
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage += '\n' + errorData.errors.join('\n');
        }        
        setError(errorMessage);
      } else {
        setError('Failed to add ship: Network error');
      }
    }
  };

  const handleUpdateVessel = async (id, vesselData) => {
    try {
      const response = await axios.put(`/vessels/${id}`, vesselData);
      setVessels(prev => prev.map(vessel => 
        vessel._id === id ? response.data : vessel
      ));
      setEditingVessel(null);
    } catch (err) {
      console.error('Error updating vessel:', err);
      setError('Failed to update ship');
    }
  };

  const handleDeleteVessel = async (id) => {
    if (window.confirm('Are you sure you want to delete this ship?')) {
      try {
        await axios.delete(`/vessels/${id}`);
        setVessels(prev => prev.filter(vessel => vessel._id !== id));
      } catch (err) {
        console.error('Error deleting vessel:', err);
        setError('Failed to delete ship');
      }
    }
  };

  // Assignment functionality removed as per requirements

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    // Handle different location formats
    if (location.port) {
      const port = location.port;
      const country = location.country;
      if (country) {
        return `${port}, ${country}`;
      }
      return port;
    }
    
    // Handle coordinates if available
    if (location.coordinates) {
      const { latitude, longitude } = location.coordinates;
      if (latitude !== undefined && longitude !== undefined) {
        return `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      }
    }
    
    return 'Location not specified';
  };


  // Navigation configuration
  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: '📊',
      description: 'Dashboard overview and statistics'
    },
    {
      id: 'fleet',
      name: 'Fleet Management',
      icon: '🚢',
      description: 'Manage vessels and fleet operations'
    },
    {
      id: 'personnel',
      name: 'Personnel',
      icon: '👥',
      description: 'Cargo managers and surveyors'
    },
    {
      id: 'service-requests',
      name: 'Service Requests',
      icon: '📋',
      description: 'Owner service requests'
    },
    {
      id: 'bookings',
      name: 'Bookings',
      icon: '📅',
      description: 'Surveyor and cargo manager bookings'
    },
    {
      id: 'maintenance',
      name: 'Predictive Maintenance',
      icon: <FaChartLine />,
      description: 'AI-powered maintenance predictions'
    },
    {
      id: 'surveys',
      name: 'Surveys',
      icon: '📋',
      description: 'View survey reports for managed vessels'
    }
  ];
  const formatLastLogin = (lastLoginAt) => {
    if (!lastLoginAt) return 'Never logged in';
    const now = new Date();
    const lastLogin = new Date(lastLoginAt);
    const diffInHours = Math.floor((now - lastLogin) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return formatDate(lastLoginAt);
  };

  const getUserStatus = (lastLoginAt) => {
    if (!lastLoginAt) return { text: 'Never logged in', color: 'text-gray-500' };
    const now = new Date();
    const lastLogin = new Date(lastLoginAt);
    const diffInHours = Math.floor((now - lastLogin) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return { text: 'Active', color: 'text-green-600' };
    if (diffInHours < 168) return { text: 'Recently active', color: 'text-yellow-600' };
    return { text: 'Inactive', color: 'text-red-600' };
  };

  return (
    <DashboardLayout
      title="Ship Management Dashboard"
      description="Fleet management, crew assignments, and maintenance schedules."
      onProfileClick={() => setShowProfile((s) => !s)}
    >
      <div className="flex h-full bg-gray-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 bg-marine-blue">
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="mt-8 px-4">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 mb-2 text-left rounded-lg transition-colors duration-200 ${
                  activeSection === item.id
                    ? 'bg-marine-blue text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs ${activeSection === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
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
          {/* Mobile header */}
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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

          {/* Content area */}
          <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            {/* Ship Finder and Details Section */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-300">
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 mr-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      <div>
                        <h3 className="text-2xl font-extrabold text-white">🚢 Ship Finder & Details</h3>
                        <p className="text-blue-100 text-sm mt-1">Complete registry of ALL ships in the system - owned by individual owners and ship companies</p>
                      </div>
                    </div>
                    {selectedShipForDetails && shipDetailsData && (
                      <button
                        onClick={downloadShipReport}
                        disabled={downloadingShipReport}
                        className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {downloadingShipReport ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Ship Report
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-b from-white to-slate-50">
                  {/* Ship Search/Select - Enhanced */}
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      Select Vessel
                    </label>
                    <div className="relative">
                      <select
                        value={selectedShipForDetails?._id || ''}
                        onChange={(e) => {
                          const vessel = vessels.find(v => v._id === e.target.value);
                          setSelectedShipForDetails(vessel);
                          if (vessel) {
                            loadShipDetails(vessel);
                          } else {
                            setShipDetailsData(null);
                          }
                        }}
                        className="w-full px-5 py-4 border-2 border-indigo-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 text-base font-medium bg-white shadow-md hover:shadow-lg transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="">🔍 -- Select a Ship to View Complete Details --</option>
                        {vessels.map((vessel) => (
                          <option key={vessel._id} value={vessel._id}>
                            🚢 {vessel.name} • {vessel.vesselType || 'Vessel'} • {vessel.vesselId || vessel.imo}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Ship Details Display */}
                  {shipDetailsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading ship details...</p>
                    </div>
                  ) : selectedShipForDetails && shipDetailsData ? (
                    <div className="space-y-6">
                      {/* Ship Basic Information */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          Ship Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Name</p>
                            <p className="text-sm text-gray-900 font-bold">{selectedShipForDetails.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">IMO Number</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.imo || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Vessel ID</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.vesselId || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Type</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.vesselType || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Flag</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.flag || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Year Built</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.yearBuilt || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Gross Tonnage</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.grossTonnage ? `${selectedShipForDetails.grossTonnage} GT` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Net Tonnage</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.netTonnage ? `${selectedShipForDetails.netTonnage} NT` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">Class Society</p>
                            <p className="text-sm text-gray-900">{selectedShipForDetails.classSociety || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Owner Information */}
                      {selectedShipForDetails.owner && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Owner Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Owner Name</p>
                              <p className="text-sm text-gray-900 font-bold">
                                {selectedShipForDetails.owner.name || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Email</p>
                              <p className="text-sm text-gray-900">{selectedShipForDetails.owner.email || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Role</p>
                              <p className="text-sm text-gray-900 capitalize">{selectedShipForDetails.owner.role?.replace('_', ' ') || 'Owner'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Surveys Summary */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          Surveys ({shipDetailsData.surveys.length})
                        </h4>
                        {shipDetailsData.surveys.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No surveys found for this vessel</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {shipDetailsData.surveys.filter(s => s.status === 'Scheduled').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Scheduled</p>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-bold text-yellow-600">
                                {shipDetailsData.surveys.filter(s => s.status === 'In Progress').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">In Progress</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {shipDetailsData.surveys.filter(s => s.status === 'Completed').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Completed</p>
                            </div>
                          </div>
                        )}
                        {shipDetailsData.surveys.length > 0 && (
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {shipDetailsData.surveys.slice(0, 10).map((survey) => (
                              <div 
                                key={survey._id} 
                                className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 flex justify-between items-center hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02] border-l-4 border-blue-500"
                                onClick={() => setSurveyReportModal({ open: true, survey })}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-bold text-gray-900">{survey.surveyType}</p>
                                  </div>
                                  <p className="text-xs text-gray-600 flex items-center gap-1 ml-6">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    {new Date(survey.scheduledDate).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                  {survey.surveyor && (
                                    <p className="text-xs text-gray-500 mt-1 ml-6">
                                      📋 Surveyor: {survey.surveyor.name || 'Assigned'}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                    survey.status === 'Completed' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                                    survey.status === 'In Progress' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                                    'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                                  }`}>
                                    {survey.status}
                                  </span>
                                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Certificates */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                          </svg>
                          Certificates ({shipDetailsData.certificates.length})
                        </h4>
                        {shipDetailsData.certificates.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No certificates issued for this vessel</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {shipDetailsData.certificates.map((cert) => {
                              const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                              const isExpired = daysRemaining < 0;
                              const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;
                              
                              return (
                                <div 
                                  key={cert._id} 
                                  className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => setCertificateDetailModal({ open: true, certificate: cert })}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{cert.certificateNumber}</p>
                                      <p className="text-xs text-gray-600">{cert.surveyType}</p>
                                      <p className={`text-xs font-semibold mt-1 ${
                                        isExpired ? 'text-red-600' :
                                        isExpiringSoon ? 'text-orange-600' :
                                        'text-green-600'
                                      }`}>
                                        {isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` :
                                         daysRemaining === 0 ? 'Expires today!' :
                                         `${daysRemaining} days remaining`}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      isExpired ? 'bg-red-100 text-red-800' :
                                      isExpiringSoon ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {cert.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Surveyors Who Inspected */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          Surveyors ({shipDetailsData.surveyors.length})
                        </h4>
                        {shipDetailsData.surveyors.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No surveyors have inspected this vessel yet</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {shipDetailsData.surveyors.map((surveyor, index) => (
                              <div key={index} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <p className="text-sm font-semibold text-gray-900">{surveyor.name}</p>
                                <p className="text-xs text-gray-600">{surveyor.email}</p>
                                {surveyor.licenseNumber && (
                                  <p className="text-xs text-gray-500 mt-1">License: {surveyor.licenseNumber}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Compliance Reports */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          Compliance Reports ({shipDetailsData.complianceReports.length})
                        </h4>
                        {shipDetailsData.complianceReports.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No compliance reports available</p>
                        ) : (
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {shipDetailsData.complianceReports.map((report) => (
                              <div 
                                key={report._id} 
                                className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02] border-l-4 border-orange-500"
                                onClick={() => setComplianceReportModalShip({ open: true, report })}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                      </svg>
                                      <p className="text-sm font-bold text-gray-900">{report.surveyType}</p>
                                    </div>
                                    <p className="text-xs text-gray-600 ml-6">
                                      📅 {report.complianceSubmittedAt ? new Date(report.complianceSubmittedAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      }) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                      report.overallCompliance === 'Compliant' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                                      report.overallCompliance === 'Non-Compliant' ? 'bg-gradient-to-r from-red-400 to-red-600 text-white' :
                                      'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                    }`}>
                                      {report.overallCompliance || 'Pending'}
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Predictive Maintenance */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.017c-.009-1.048-1.652-1.048-1.66 0l-.087 10.5a.833.833 0 101.666 0l-.087-10.5zM12 16.5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                          </svg>
                          Predictive Maintenance Insights
                        </h4>
                        {shipDetailsData.maintenancePredictions.length === 0 ? (
                          <div className="text-center py-8">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-gray-500 font-medium">No predictive maintenance data available</p>
                            <p className="text-xs text-gray-400 mt-1">Data will appear after vessel analysis</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {shipDetailsData.maintenancePredictions.map((prediction, index) => (
                              <div key={index} className={`rounded-xl p-5 border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                                prediction.risk === 'High' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300' :
                                prediction.risk === 'Medium' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' :
                                'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      prediction.risk === 'High' ? 'bg-red-200' :
                                      prediction.risk === 'Medium' ? 'bg-yellow-200' :
                                      'bg-green-200'
                                    }`}>
                                      <svg className={`w-5 h-5 ${
                                        prediction.risk === 'High' ? 'text-red-700' :
                                        prediction.risk === 'Medium' ? 'text-yellow-700' :
                                        'text-green-700'
                                      }`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.49 3.017c-.009-1.048-1.652-1.048-1.66 0l-.087 10.5a.833.833 0 101.666 0l-.087-10.5zM12 16.5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="text-base font-bold text-gray-900">{prediction.component}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">Component Analysis</p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                                    prediction.risk === 'High' ? 'bg-gradient-to-r from-red-500 to-red-700 text-white' :
                                    prediction.risk === 'Medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' :
                                    'bg-gradient-to-r from-green-500 to-green-700 text-white'
                                  }`}>
                                    {prediction.risk} Risk
                                  </span>
                                </div>
                                
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-3">
                                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Prediction</p>
                                  <p className="text-sm text-gray-800 leading-relaxed">{prediction.prediction}</p>
                                </div>
                                
                                {prediction.recommendation && (
                                  <div className={`rounded-lg p-3 border-l-4 ${
                                    prediction.risk === 'High' ? 'bg-red-100/50 border-red-500' :
                                    prediction.risk === 'Medium' ? 'bg-yellow-100/50 border-yellow-500' :
                                    'bg-green-100/50 border-green-500'
                                  }`}>
                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      Recommendation
                                    </p>
                                    <p className="text-sm text-gray-800 font-medium">{prediction.recommendation}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedShipForDetails ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-600">Failed to load ship details</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      <p className="text-gray-600 font-medium">Select a ship to view detailed information</p>
                      <p className="text-gray-400 text-sm mt-1">All ship data will be displayed here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inspection Alerts Section */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      <h3 className="text-xl font-bold text-gray-900">Inspection Alerts</h3>
                    </div>
                    <span className="text-sm text-gray-600">
                      {certificates.filter(cert => {
                        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return daysRemaining <= 30;
                      }).length} certificate(s) need attention
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {certificates.filter(cert => {
                    const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysRemaining <= 30;
                  }).length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-600 font-medium">All certificates are valid</p>
                      <p className="text-gray-400 text-sm mt-1">No upcoming renewals in the next 30 days</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Urgent Alerts (≤7 days or expired) */}
                      {certificates
                        .filter(cert => {
                          const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                          return daysRemaining <= 7;
                        })
                        .map(cert => {
                          const expiryDate = new Date(cert.expiryDate);
                          const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                          const isExpired = daysRemaining < 0;
                          
                          return (
                            <div 
                              key={cert._id}
                              className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer animate-pulse"
                              onClick={() => setCertificateDetailModal({ open: true, certificate: cert })}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                                      🔴 URGENT
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <h4 className="text-sm font-bold text-gray-900 mb-1">{cert.vessel?.name || 'Unknown Vessel'}</h4>
                              <p className="text-xs text-gray-700 mb-2">Certificate: {cert.certificateNumber}</p>
                              <p className="text-xs text-gray-600 mb-2">{cert.surveyType || 'Survey'}</p>
                              <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                <span className="text-xs text-gray-700 font-semibold">
                                  {isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` : 
                                   daysRemaining === 0 ? 'Expires today!' :
                                   daysRemaining === 1 ? '1 day remaining' :
                                   `${daysRemaining} days remaining`}
                                </span>
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          );
                        })}

                      {/* Warning Alerts (8-30 days) */}
                      {certificates
                        .filter(cert => {
                          const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                          return daysRemaining > 7 && daysRemaining <= 30;
                        })
                        .map(cert => {
                          const expiryDate = new Date(cert.expiryDate);
                          const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div 
                              key={cert._id}
                              className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                              onClick={() => setCertificateDetailModal({ open: true, certificate: cert })}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-orange-600 text-white">
                                      ⚠️ WARNING
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <h4 className="text-sm font-bold text-gray-900 mb-1">{cert.vessel?.name || 'Unknown Vessel'}</h4>
                              <p className="text-xs text-gray-700 mb-2">Certificate: {cert.certificateNumber}</p>
                              <p className="text-xs text-gray-600 mb-2">{cert.surveyType || 'Survey'}</p>
                              <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                                <span className="text-xs text-gray-700 font-semibold">
                                  {daysRemaining === 1 ? '1 day remaining' : `${daysRemaining} days remaining`}
                                </span>
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Statistics */}
            {userStats.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Statistics</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Overview of user activity by role</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {userStats
                      .filter(stat => stat._id.toLowerCase() !== 'admin' && stat._id.toLowerCase() !== 'ship_management')
                      .map((stat, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-marine-blue">{stat.count}</div>
                          <div className="text-sm text-gray-600 capitalize">{stat._id}s</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Fleet Management Section */}
        {activeSection === 'fleet' && (
          <>
            {/* Fleet Overview */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Fleet Overview</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Current status of all vessels under management</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
            >
              Add Ship
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue"></div>
              <p className="mt-2 text-gray-600">Loading ships...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={loadVessels}
                className="mt-2 text-marine-blue hover:text-marine-dark"
              >
                Retry
              </button>
            </div>
          ) : vessels.filter(vessel => 
              (vessel.shipManagement && vessel.shipManagement._id === user.id) ||
              (vessel.owner && vessel.owner._id === user.id)
            ).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No ships under your management</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-marine-blue hover:text-marine-dark"
              >
                Add your first ship
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto max-h-[600px] overflow-y-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SHIP NAME</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMO Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Built</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Tonnage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vessels
                    .filter(vessel => 
                      // In Fleet section, only show vessels managed by this ship management company
                      (vessel.shipManagement && vessel.shipManagement._id === user.id) ||
                      (vessel.owner && vessel.owner._id === user.id)
                    )
                    .map((vessel) => (
                    <tr key={vessel._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vessel.name}</div>
                        <div className="text-xs text-gray-500">ID: {vessel.vesselId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vessel.imo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vessel.vesselType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vessel.flag}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vessel.yearBuilt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vessel.grossTonnage?.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setEditingVessel(vessel)}
                          className="text-marine-blue hover:text-marine-dark mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteVessel(vessel._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        )}

        {/* Personnel Section */}
        {activeSection === 'personnel' && (
          <>
            {/* User Management Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cargo Managers */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Cargo Managers</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Active cargo management personnel</p>
            </div>
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading cargo managers...</p>
                </div>
              ) : cargoManagers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No cargo managers found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cargoManagers.map((manager) => {
                      const status = getUserStatus(manager.lastLoginAt);
                      return (
                        <tr key={manager._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-marine-blue flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {manager.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                                <div className="text-sm text-gray-500">Cargo Manager</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {manager.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLastLogin(manager.lastLoginAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <span className="text-gray-400">—</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Surveyors */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Surveyors</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Active survey personnel</p>
            </div>
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading surveyors...</p>
                </div>
              ) : surveyors.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No surveyors found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveyors.map((surveyor) => {
                      const status = getUserStatus(surveyor.lastLoginAt);
                      return (
                        <tr key={surveyor._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {surveyor.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{surveyor.name}</div>
                                <div className="text-sm text-gray-500">Surveyor</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {surveyor.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLastLogin(surveyor.lastLoginAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <span className="text-gray-400">—</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Service Requests Section */}
        {activeSection === 'service-requests' && (
          <>
            {/* Service Requests Inbox */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Service Requests</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Requests sent by owners to your company</p>
            </div>
            <button onClick={loadServiceRequests} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm">Refresh</button>
          </div>
          {srLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
            </div>
          ) : serviceRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No service requests</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SHIP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceRequests.map((r, index) => (
                    <tr key={r._id} onClick={() => handleServiceRequestClick(r)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.vessel?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.owner?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {r.status === 'pending' ? (
                          <div className="space-x-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); actOnRequest(r._id, 'accept'); }} 
                              className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); actOnRequest(r._id, 'decline'); }} 
                              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Statistics */}
        {userStats.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Statistics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Overview of user activity by role</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {userStats
                  .filter(stat => stat._id.toLowerCase() !== 'admin' && stat._id.toLowerCase() !== 'ship_management')
                  .map((stat) => (
                  <div key={stat._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          stat._id === 'cargo_manager' ? 'bg-marine-blue' :
                          stat._id === 'surveyor' ? 'bg-green-600' :
                          stat._id === 'ship_management' ? 'bg-blue-600' :
                          'bg-gray-600'
                        }`}>
                          <span className="text-sm font-medium text-white">
                            {stat._id.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {stat._id.replace('_', ' ')}s
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                        {stat.lastLogin && (
                          <p className="text-xs text-gray-500">
                            Last active: {formatLastLogin(stat.lastLogin)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Bookings Section */}
        {activeSection === 'bookings' && (
          <>
            {/* Booking Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Surveyor Bookings */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Surveyor Bookings</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage surveyor inspection bookings</p>
              </div>
              <button 
                onClick={() => setShowSurveyorBookingModal(true)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Book Surveyor
              </button>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              {bookingsLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading bookings...</p>
                </div>
              ) : surveyorBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No surveyor bookings found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveyorBookings
                      .filter(booking => ['Pending', 'Accepted', 'Declined'].includes(booking.status))
                      .map((booking) => (
                      <tr key={booking._id} onClick={() => setDetailsModal({ open: true, type: 'surveyor', booking })} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {booking.surveyor?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{booking.surveyor?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{booking.vesselName}</div>
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
                            booking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSurveyorBooking(booking);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit booking"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSurveyorBooking(booking._id, booking.status);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete booking"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {/* Assignment functionality removed as per requirements */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Cargo Manager Bookings */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Cargo Manager Bookings</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage cargo manager voyage bookings</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={loadBookings}
                  className="inline-flex justify-center py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
                >
                  Refresh Status
                </button>
                <button 
                  onClick={() => setShowCargoManagerBookingModal(true)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
                >
                  Book Cargo Manager
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              {bookingsLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading bookings...</p>
                </div>
              ) : cargoManagerBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No cargo manager bookings found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Manager</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cargoManagerBookings
                      .filter(booking => ['Pending', 'Accepted', 'Declined'].includes(booking.status))
                      .map((booking) => (
                      <tr key={booking._id} onClick={() => setDetailsModal({ open: true, type: 'cargo', booking })} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-marine-blue flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {booking.cargoManager?.name?.charAt(0)?.toUpperCase() || 'C'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{booking.cargoManager?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{booking.vesselName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{formatDate(booking.voyageDate)}</div>
                          <div className="text-gray-500">{booking.departurePort} → {booking.destinationPort}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{booking.cargoType}</div>
                          {booking.cargoWeight && (
                            <div className="text-gray-500">{booking.cargoWeight} MT</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                            {booking.status === 'Accepted' && booking.acceptedAt && (
                              <span className="text-xs text-gray-500 mt-1">
                                Accepted {new Date(booking.acceptedAt).toLocaleDateString()}
                              </span>
                            )}
                            {booking.status === 'Declined' && booking.declinedAt && (
                              <span className="text-xs text-gray-500 mt-1">
                                Declined {new Date(booking.declinedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCargoManagerBooking(booking);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit booking"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCargoManagerBooking(booking._id, booking.status);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete booking"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {/* Assignment functionality removed as per requirements */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Maintenance Section */}
        {activeSection === 'maintenance' && (
          <div className="space-y-6">
            {/* Surveyor Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Select Surveyor</h3>
              <select
                value={selectedSurveyor}
                onChange={(e) => {
                  setSelectedSurveyor(e.target.value);
                  fetchSurveyorVessels(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select a surveyor...</option>
                {surveyors.map((surveyor) => (
                  <option key={surveyor._id} value={surveyor._id}>
                    {surveyor.name} ({surveyor.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Selection - Only show if surveyor is selected */}
            {selectedSurveyor && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Select Ship</h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedVessel}
                      onChange={(e) => setSelectedVessel(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select a Ship...</option>
                      {surveyorVessels.map((vessel) => (
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
                </div>
                
                {selectedVessel && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      📊 Showing predictions for: <span className="font-semibold text-gray-900">
                        {surveyorVessels.find(v => v._id === selectedVessel)?.name || 'Unknown Vessel'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Surveyor: <span className="font-medium">
                        {surveyors.find(s => s._id === selectedSurveyor)?.name || 'Unknown'}
                      </span>
                    </p>
                  </div>
                )}

                {surveyorVessels.length === 0 && (
                  <p className="text-gray-500 text-sm mt-3">This surveyor has not completed any surveys yet.</p>
                )}
              </div>
            )}

            {/* Predictions Display - Only show if vessel is selected */}
            {selectedVessel && (
              <PredictiveMaintenanceTab 
                knnPredictions={knnPredictions}
                knnLoading={knnLoading}
                knnError={knnError}
                setKnnRefreshKey={setKnnRefreshKey}
                selectedVessel={surveyorVessels.find(v => v._id === selectedVessel)}
              />
            )}
          </div>
        )}

        {/* Surveys Section */}
        {activeSection === 'surveys' && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reports</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">View survey and compliance reports</p>
                  </div>
                  <button 
                    onClick={() => surveysTab === 'survey' ? loadSurveys() : surveysTab === 'compliance' ? loadComplianceReports() : loadCertificates()}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
                  >
                    Refresh
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSurveysTab('survey')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      surveysTab === 'survey'
                        ? 'bg-marine-blue text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Survey Reports
                  </button>
                  <button
                    onClick={() => setSurveysTab('compliance')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      surveysTab === 'compliance'
                        ? 'bg-marine-blue text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Compliance Reports
                  </button>
                  <button
                    onClick={() => setSurveysTab('certificates')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      surveysTab === 'certificates'
                        ? 'bg-marine-blue text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Certificates
                  </button>
                </div>

                {/* Filters for Survey Reports */}
                {surveysTab === 'survey' && (
                  <div className="space-y-3">
                    {/* Search Bar */}
                    <div>
                      <input
                        type="text"
                        placeholder="Search by ship name, survey type, location, or surveyor..."
                        value={surveysSearch}
                        onChange={(e) => setSurveysSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    {/* Dropdown Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Surveyor:</label>
                        <select
                          value={surveysSurveyorFilter}
                          onChange={(e) => setSurveysSurveyorFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        >
                          <option value="">All Surveyors</option>
                          {surveyors.map((surveyor) => (
                            <option key={surveyor._id} value={surveyor._id}>
                              {surveyor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Ship:</label>
                        <select
                          value={surveysShipFilter}
                          onChange={(e) => setSurveysShipFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        >
                          <option value="">All Ships</option>
                          {/* Show ALL vessels from the system (both ship company and owner vessels) */}
                          {allAccessibleVessels.map((vessel) => (
                            <option key={vessel._id} value={vessel._id}>
                              {vessel.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters for Compliance Reports */}
                {surveysTab === 'compliance' && (
                  <div className="space-y-3">
                    {/* Search Bar */}
                    <div>
                      <input
                        type="text"
                        placeholder="Search by ship name, survey type, or surveyor..."
                        value={complianceSearch}
                        onChange={(e) => setComplianceSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    {/* Dropdown Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Surveyor:</label>
                        <select
                          value={complianceSurveyorFilter}
                          onChange={(e) => setComplianceSurveyorFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        >
                          <option value="">All Surveyors</option>
                          {surveyors.map((surveyor) => (
                            <option key={surveyor._id} value={surveyor._id}>
                              {surveyor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Ship:</label>
                        <select
                          value={complianceShipFilter}
                          onChange={(e) => setComplianceShipFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        >
                          <option value="">All Ships</option>
                          {/* Show ALL vessels from the system (both ship company and owner vessels) */}
                          {allAccessibleVessels.map((vessel) => (
                            <option key={vessel._id} value={vessel._id}>
                              {vessel.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters for Certificates */}
                {surveysTab === 'certificates' && (
                  <div className="space-y-3">
                    {/* Search Bar */}
                    <div>
                      <input
                        type="text"
                        placeholder="Search by certificate number, ship name, survey type, or surveyor..."
                        value={certificatesSearch}
                        onChange={(e) => setCertificatesSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    {/* Dropdown Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Surveyor:</label>
                        <select
                          value={certificatesSurveyorFilter}
                          onChange={(e) => setCertificatesSurveyorFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        >
                          <option value="">All Surveyors</option>
                          {surveyors.map((surveyor) => (
                            <option key={surveyor._id} value={surveyor._id}>
                              {surveyor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Ship:</label>
                        <select
                          value={certificatesShipFilter}
                          onChange={(e) => setCertificatesShipFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                        >
                          <option value="">All Ships</option>
                          {/* Show ALL vessels from the system (both ship company and owner vessels) */}
                          {allAccessibleVessels.map((vessel) => (
                            <option key={vessel._id} value={vessel._id}>
                              {vessel.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Survey Reports Table */}
              {surveysTab === 'survey' && (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  {surveysLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading survey reports...</p>
                    </div>
                  ) : (() => {
                    // Filter surveys first
                    const filteredSurveys = surveys.filter(survey => {
                          // Show all surveys regardless of vessel ownership
                          if (!survey.vessel) return false;
                          
                          const vesselId = survey.vessel._id || survey.vessel;
                          
                          // Apply surveyor filter if selected
                          if (surveysSurveyorFilter) {
                            const surveyorId = survey.surveyor?._id || survey.surveyor;
                            if (surveyorId !== surveysSurveyorFilter) return false;
                          }
                          
                          // Apply ship filter if selected
                          if (surveysShipFilter) {
                            if (vesselId !== surveysShipFilter) return false;
                          }
                          
                          // Apply search filter
                          if (surveysSearch) {
                            const searchLower = surveysSearch.toLowerCase();
                            const vessel = allAccessibleVessels.find(v => v._id === vesselId) || 
                                          (typeof survey.vessel === 'object' ? survey.vessel : null);
                            const vesselName = (vessel?.name || '').toLowerCase();
                            const surveyType = (survey.surveyType || '').toLowerCase();
                            const location = (survey.location || '').toLowerCase();
                            const surveyorName = (survey.surveyor?.name || '').toLowerCase();
                            const status = (survey.status || '').toLowerCase();
                            
                            if (!vesselName.includes(searchLower) && 
                                !surveyType.includes(searchLower) && 
                                !location.includes(searchLower) && 
                                !surveyorName.includes(searchLower) && 
                                !status.includes(searchLower)) {
                              return false;
                            }
                          }
                          
                          return true;
                        });

                    // Return appropriate UI based on filtered results
                    return filteredSurveys.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <p>No survey reports found</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredSurveys.map((survey) => {
                          // Get vessel data for display from allAccessibleVessels or survey object
                          const vesselId = survey.vessel._id || survey.vessel;
                          const vessel = allAccessibleVessels.find(v => v._id === vesselId) || 
                                        (typeof survey.vessel === 'object' ? survey.vessel : null);
                          
                          return (
                            <tr key={survey._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{vessel?.name || 'Unknown Vessel'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {survey.surveyType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(survey.scheduledDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(survey.completionDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatLocation(survey.location)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  survey.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  survey.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  survey.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {survey.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {survey.surveyor?.name || 'Unknown Surveyor'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => setSurveyDetailsModal({ open: true, survey })}
                                  className="text-marine-blue hover:text-marine-dark"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
              )}

              {/* Compliance Reports Table */}
              {surveysTab === 'compliance' && (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  {complianceLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading compliance reports...</p>
                    </div>
                  ) : (() => {
                      // Filter compliance reports
                      const filteredReports = complianceReports.filter(report => {
                        if (!report.vessel) return false;
                        
                        const vesselId = report.vessel._id || report.vessel;
                        
                        // Apply surveyor filter if selected
                        if (complianceSurveyorFilter) {
                          const surveyorId = report.surveyor?._id || report.surveyor;
                          if (surveyorId !== complianceSurveyorFilter) return false;
                        }
                        
                        // Apply ship filter if selected
                        if (complianceShipFilter) {
                          if (vesselId !== complianceShipFilter) return false;
                        }
                        
                        // Apply search filter
                        if (complianceSearch) {
                          const searchLower = complianceSearch.toLowerCase();
                          const vessel = allAccessibleVessels.find(v => v._id === vesselId) || 
                                        (typeof report.vessel === 'object' ? report.vessel : null);
                          const vesselName = (vessel?.name || '').toLowerCase();
                          const surveyType = (report.surveyType || '').toLowerCase();
                          const surveyorName = (report.surveyor?.name || '').toLowerCase();
                          const complianceStatus = getOverallComplianceStatus(report.complianceStatus).toLowerCase();
                          
                          if (!vesselName.includes(searchLower) && 
                              !surveyType.includes(searchLower) && 
                              !surveyorName.includes(searchLower) && 
                              !complianceStatus.includes(searchLower)) {
                            return false;
                          }
                        }
                        
                        return true;
                      });

                      return filteredReports.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <p>No compliance reports found</p>
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReports.map((report) => {
                              const vesselId = report.vessel._id || report.vessel;
                              const vessel = allAccessibleVessels.find(v => v._id === vesselId) || 
                                            (typeof report.vessel === 'object' ? report.vessel : null);
                              
                              return (
                                <tr key={report._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{vessel?.name || 'Unknown Vessel'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {report.surveyType}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {report.complianceSubmittedAt ? new Date(report.complianceSubmittedAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      getOverallComplianceStatus(report.complianceStatus) === 'Compliant' ? 'bg-green-100 text-green-800' :
                                      getOverallComplianceStatus(report.complianceStatus) === 'Non-Compliant' ? 'bg-red-100 text-red-800' :
                                      getOverallComplianceStatus(report.complianceStatus) === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {getOverallComplianceStatus(report.complianceStatus)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {report.surveyor?.name || 'Unknown Surveyor'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => setComplianceReportModal({ open: true, survey: report })}
                                      className="text-marine-blue hover:text-marine-dark"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                </div>
              )}

              {/* Certificates Table */}
              {surveysTab === 'certificates' && (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  {certificatesLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading certificates...</p>
                    </div>
                  ) : (() => {
                      // Filter certificates
                      const filteredCertificates = certificates.filter(cert => {
                        if (!cert.vessel) return false;
                        
                        const vesselId = cert.vessel._id || cert.vessel;
                        const surveyorId = cert.issuedBy?._id || cert.issuedBy;
                        
                        // Apply surveyor filter if selected
                        if (certificatesSurveyorFilter && surveyorId !== certificatesSurveyorFilter) {
                          return false;
                        }
                        
                        // Apply ship filter if selected
                        if (certificatesShipFilter && vesselId !== certificatesShipFilter) {
                          return false;
                        }
                        
                        // Apply search filter
                        if (certificatesSearch) {
                          const searchLower = certificatesSearch.toLowerCase();
                          const vessel = allAccessibleVessels.find(v => v._id === vesselId) || 
                                        (typeof cert.vessel === 'object' ? cert.vessel : null);
                          const vesselName = (vessel?.name || '').toLowerCase();
                          const surveyType = (cert.surveyType || '').toLowerCase();
                          const surveyorName = (cert.issuedBy?.name || '').toLowerCase();
                          const certificateNumber = (cert.certificateNumber || '').toLowerCase();
                          const status = (cert.status || '').toLowerCase();
                          
                          if (!vesselName.includes(searchLower) && 
                              !surveyType.includes(searchLower) && 
                              !surveyorName.includes(searchLower) && 
                              !certificateNumber.includes(searchLower) &&
                              !status.includes(searchLower)) {
                            return false;
                          }
                        }
                        
                        return true;
                      });

                      return filteredCertificates.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <p>No certificates found</p>
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate Number</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued By</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCertificates.map((cert) => {
                              const vesselId = cert.vessel._id || cert.vessel;
                              const vessel = allAccessibleVessels.find(v => v._id === vesselId) || 
                                            (typeof cert.vessel === 'object' ? cert.vessel : null);
                              
                              // Calculate days remaining until expiry
                              const expiryDate = new Date(cert.expiryDate);
                              const today = new Date();
                              const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                              const isExpired = daysRemaining < 0;
                              const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;
                              const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
                              
                              const handleDownload = async (e) => {
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
                              };
                              
                              return (
                                <tr 
                                  key={cert._id} 
                                  onClick={() => setCertificateDetailModal({ open: true, certificate: cert })}
                                  className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{cert.certificateNumber}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{vessel?.name || 'Unknown Vessel'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cert.surveyType}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm text-gray-600">
                                        {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-GB') : 'N/A'}
                                      </div>
                                      {cert.expiryDate && (
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
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      isExpired ? 'bg-red-100 text-red-800' :
                                      isExpiringSoon ? 'bg-yellow-100 text-yellow-800' :
                                      cert.status === 'Valid' ? 'bg-green-100 text-green-800' :
                                      cert.status === 'Renewed' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : cert.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cert.issuedBy?.name || 'Unknown Surveyor'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={handleDownload}
                                      className="text-marine-blue hover:text-marine-dark font-medium flex items-center justify-end ml-auto"
                                      title="Download Certificate"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                      Download
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                </div>
              )}
            </div>
          </>
        )}
              </div>
            </div>
          </div>
        </div>

      {/* Modals */}
      {/* Vessel Modal */}
      {(showAddModal || editingVessel) && (
        <VesselModal
          vessel={editingVessel}
          onSave={editingVessel ? 
            (data) => handleUpdateVessel(editingVessel._id, data) : 
            handleAddVessel
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingVessel(null);
          }}
        />
      )}

      {/* Profile Modal */}
      <UserProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={{
          name: user?.name || 'Ship Manager',
          email: user?.email || 'manager@example.com',
          role: user?.role || 'manager',
          status: user?.status || 'active',
        }}
        variant="sidebar"
        title="My Profile"
      />

      {/* Surveyor Booking Modal */}
      <SurveyorBookingModal
        isOpen={showSurveyorBookingModal}
        onClose={() => {
          setShowSurveyorBookingModal(false);
          setEditingSurveyorBooking(null);
        }}
        onSave={handleSurveyorBooking}
        surveyors={surveyors}
        vessels={vessels}
        booking={editingSurveyorBooking}
      />

      {/* Details Modal */}
      {detailsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {detailsModal.type === 'surveyor' ? 'Surveyor Booking Details' : 'Cargo Manager Booking Details'}
              </h3>
              <button onClick={() => setDetailsModal({ open: false, type: null, booking: null })} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {detailsModal.type === 'surveyor' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Surveyor</div>
                    <div className="text-gray-900">{detailsModal.booking?.surveyor?.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Ship</div>
                    <div className="text-gray-900">{detailsModal.booking?.vesselName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Inspection Date</div>
                    <div className="text-gray-900">{formatDate(detailsModal.booking?.inspectionDate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Inspection Time</div>
                    <div className="text-gray-900">{detailsModal.booking?.inspectionTime}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Ship Type</div>
                    <div className="text-gray-900">{detailsModal.booking?.shipType}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Survey Type</div>
                    <div className="text-gray-900">{detailsModal.booking?.surveyType}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Location</div>
                    <div className="text-gray-900">{formatLocation(detailsModal.booking?.location)}</div>
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
                  
                  {/* Vessel Media Section for Surveyor Booking */}
                  {detailsModal.booking?.vessel?.media && detailsModal.booking.vessel.media.length > 0 && (
                    <div className="sm:col-span-2">
                      <div className="text-gray-500">Ship Media & Certificates</div>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {detailsModal.booking.vessel.media.map((media, index) => (
                          <div key={index} className="relative">
                            {media.type === 'photo' ? (
                              <img 
                                src={media.url} 
                                alt={`Vessel media ${index + 1}`}
                                className="w-full h-24 object-cover rounded-md border border-gray-200"
                              />
                            ) : media.type === 'certificate' ? (
                              <div className="w-full h-24 bg-red-50 rounded-md border border-red-200 flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs text-red-600 mt-1 truncate px-1">{media.fileName || 'Certificate'}</span>
                              </div>
                            ) : (
                              <div className="w-full h-24 bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-gray-600 mt-1 truncate px-1">{media.fileName || 'Video'}</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                              {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {detailsModal.booking.vessel.media.length} media file(s) uploaded for this vessel
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Cargo Manager</div>
                    <div className="text-gray-900">{detailsModal.booking?.cargoManager?.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Ship</div>
                    <div className="text-gray-900">{detailsModal.booking?.vesselName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Voyage Date</div>
                    <div className="text-gray-900">{formatDate(detailsModal.booking?.voyageDate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Voyage Time</div>
                    <div className="text-gray-900">{detailsModal.booking?.voyageTime}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Departure Port</div>
                    <div className="text-gray-900">{detailsModal.booking?.departurePort}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Destination Port</div>
                    <div className="text-gray-900">{detailsModal.booking?.destinationPort}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Cargo Type</div>
                    <div className="text-gray-900">{detailsModal.booking?.cargoType}</div>
                  </div>
                  {detailsModal.booking?.cargoWeight && (
                    <div>
                      <div className="text-gray-500">Cargo Weight</div>
                      <div className="text-gray-900">{detailsModal.booking?.cargoWeight} MT</div>
                    </div>
                  )}
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
                  
                  {/* Vessel Media Section for Cargo Manager Booking */}
                  {detailsModal.booking?.vessel?.media && detailsModal.booking.vessel.media.length > 0 && (
                    <div className="sm:col-span-2">
                      <div className="text-gray-500">Ship Media & Certificates</div>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {detailsModal.booking.vessel.media.map((media, index) => (
                          <div key={index} className="relative">
                            {media.type === 'photo' ? (
                              <img 
                                src={media.url} 
                                alt={`Vessel media ${index + 1}`}
                                className="w-full h-24 object-cover rounded-md border border-gray-200"
                              />
                            ) : media.type === 'certificate' ? (
                              <div className="w-full h-24 bg-red-50 rounded-md border border-red-200 flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs text-red-600 mt-1 truncate px-1">{media.fileName || 'Certificate'}</span>
                              </div>
                            ) : (
                              <div className="w-full h-24 bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-gray-600 mt-1 truncate px-1">{media.fileName || 'Video'}</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                              {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {detailsModal.booking.vessel.media.length} media file(s) uploaded for this vessel
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="flex space-x-2">
                {/* Assignment functionality removed as per requirements */}
              </div>
              <button
                onClick={() => setDetailsModal({ open: false, type: null, booking: null })}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Surveyor Booking Modal */}
      <SurveyorBookingModal
        isOpen={showSurveyorBookingModal}
        onClose={() => {
          setShowSurveyorBookingModal(false);
          setEditingSurveyorBooking(null);
          setBookingFromServiceRequest(null);
        }}
        onSave={(bookingData) => {
          // If booking from service request, add reference to the service request
          const finalBookingData = bookingFromServiceRequest 
            ? { ...bookingData, serviceRequestId: bookingFromServiceRequest._id }
            : bookingData;
          handleSurveyorBooking(finalBookingData);
          setBookingFromServiceRequest(null);
        }}
        surveyors={surveyors}
        vessels={allAccessibleVessels}  // Use all accessible vessels instead of filtered ones
        booking={editingSurveyorBooking}
        fromServiceRequest={!!bookingFromServiceRequest}
        serviceRequestVessel={bookingFromServiceRequest?.vessel}
      />

      {/* Cargo Manager Booking Modal */}
      <CargoManagerBookingModal
        isOpen={showCargoManagerBookingModal}
        onClose={() => {
          setShowCargoManagerBookingModal(false);
          setEditingCargoManagerBooking(null);
          setBookingFromServiceRequest(null);
        }}
        onSave={(bookingData) => {
          // If booking from service request, add reference to the service request
          const finalBookingData = bookingFromServiceRequest 
            ? { ...bookingData, serviceRequestId: bookingFromServiceRequest._id }
            : bookingData;
          handleCargoManagerBooking(finalBookingData);
          setBookingFromServiceRequest(null);
        }}
        cargoManagers={cargoManagers}
        vessels={allAccessibleVessels}  // Use all accessible vessels instead of filtered ones
        booking={editingCargoManagerBooking}
        fromServiceRequest={!!bookingFromServiceRequest}
        serviceRequestVessel={bookingFromServiceRequest?.vessel}
      />

      {/* Assignment modals removed as per requirements */}

      {/* Service Request Details Modal */}
      {serviceRequestDetailsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Service Request Details</h3>
              <button 
                onClick={() => setServiceRequestDetailsModal({ open: false, request: null })} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {serviceRequestDetailsModal.request && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{serviceRequestDetailsModal.request.title}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      serviceRequestDetailsModal.request.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      serviceRequestDetailsModal.request.status === 'declined' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {serviceRequestDetailsModal.request.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</label>
                    <p className="mt-1 text-sm text-gray-900">{serviceRequestDetailsModal.request.vessel?.name || '-'}</p>
                    {serviceRequestDetailsModal.request.vessel?.imo && (
                      <p className="text-xs text-gray-500">IMO: {serviceRequestDetailsModal.request.vessel.imo}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</label>
                    <p className="mt-1 text-sm text-gray-900">{serviceRequestDetailsModal.request.owner?.name || '-'}</p>
                    <p className="text-xs text-gray-500">{serviceRequestDetailsModal.request.owner?.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(serviceRequestDetailsModal.request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(serviceRequestDetailsModal.request.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {serviceRequestDetailsModal.request.decisionBy && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Decision By</label>
                        <p className="mt-1 text-sm text-gray-900">{serviceRequestDetailsModal.request.decisionBy?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{serviceRequestDetailsModal.request.decisionBy?.email || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Decision Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {serviceRequestDetailsModal.request.decisionAt ? 
                            new Date(serviceRequestDetailsModal.request.decisionAt).toLocaleString() : '-'}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {serviceRequestDetailsModal.request.description}
                    </p>
                  </div>
                  {serviceRequestDetailsModal.request.decisionNote && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Decision Note</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {serviceRequestDetailsModal.request.decisionNote}
                      </p>
                    </div>
                  )}
                  
                  {/* Vessel Media Section */}
                  {serviceRequestDetailsModal.request.vessel?.media && serviceRequestDetailsModal.request.vessel.media.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Media & Certificates</label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {serviceRequestDetailsModal.request.vessel.media.map((media, index) => (
                          <div key={index} className="relative">
                            {media.type === 'photo' ? (
                              <img 
                                src={media.url} 
                                alt={`Vessel media ${index + 1}`}
                                className="w-full h-24 object-cover rounded-md border border-gray-200"
                              />
                            ) : media.type === 'certificate' ? (
                              <div className="w-full h-24 bg-red-50 rounded-md border border-red-200 flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs text-red-600 mt-1 truncate px-1">{media.fileName || 'Certificate'}</span>
                              </div>
                            ) : (
                              <div className="w-full h-24 bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-gray-600 mt-1 truncate px-1">{media.fileName || 'Video'}</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                              {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {serviceRequestDetailsModal.request.vessel.media.length} media file(s) uploaded for this vessel
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="flex space-x-2">
                {serviceRequestDetailsModal.request?.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actOnRequest(serviceRequestDetailsModal.request._id, 'accept');
                        setServiceRequestDetailsModal({ open: false, request: null });
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actOnRequest(serviceRequestDetailsModal.request._id, 'decline');
                        setServiceRequestDetailsModal({ open: false, request: null });
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </>
                )}
                {serviceRequestDetailsModal.request?.status === 'accepted' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Set up surveyor booking with data from service request
                        setBookingFromServiceRequest(serviceRequestDetailsModal.request);
                        setShowSurveyorBookingModal(true);
                        setServiceRequestDetailsModal({ open: false, request: null });
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Book Surveyor
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Set up cargo manager booking with data from service request
                        setBookingFromServiceRequest(serviceRequestDetailsModal.request);
                        setShowCargoManagerBookingModal(true);
                        setServiceRequestDetailsModal({ open: false, request: null });
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Book Cargo Manager
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setServiceRequestDetailsModal({ open: false, request: null })}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                <button
                  onClick={cancelDeleteBooking}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this {deleteModal.bookingType === 'surveyor' ? 'surveyor' : 'cargo manager'} booking? 
                  This reason will be visible to the {deleteModal.bookingType === 'surveyor' ? 'surveyor' : 'cargo manager'} in their notifications.
                </p>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Reason for deletion *</label>
                  <textarea
                    value={deleteModal.reason}
                    onChange={(e) => setDeleteModal(prev => ({ ...prev, reason: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-marine-blue focus:ring-marine-blue sm:text-sm"
                    placeholder="Enter reason for deletion..."
                    required
                  />
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelDeleteBooking}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteBooking}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

      {/* Certificate PDF Viewer Modal */}
      {certificateDetailModal.open && certificateDetailModal.certificate && (
        <CertificatePdfViewer 
          certificate={certificateDetailModal.certificate}
          onClose={() => setCertificateDetailModal({ open: false, certificate: null })}
        />
      )}

      {/* Survey Report Modal for Ship Finder */}
      {surveyReportModal.open && surveyReportModal.survey && (
        <SurveyDetailsModal 
          survey={surveyReportModal.survey}
          onClose={() => setSurveyReportModal({ open: false, survey: null })}
        />
      )}

      {/* Compliance Report Modal for Ship Finder */}
      {complianceReportModalShip.open && complianceReportModalShip.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-5 border-b-2 border-orange-300 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Compliance Report Details
                  </h3>
                  <p className="text-orange-100 text-sm mt-1">Comprehensive compliance status overview</p>
                </div>
                <button
                  onClick={() => setComplianceReportModalShip({ open: false, report: null })}
                  className="text-white hover:text-orange-200 transition-colors p-2 rounded-lg hover:bg-orange-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Survey Info Banner */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Survey Type</p>
                    <p className="text-base font-bold text-gray-900">{complianceReportModalShip.report.surveyType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Overall Status</p>
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${
                      complianceReportModalShip.report.overallCompliance === 'Compliant' ? 'bg-green-100 text-green-800' :
                      complianceReportModalShip.report.overallCompliance === 'Non-Compliant' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complianceReportModalShip.report.overallCompliance || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Submission Date</p>
                    <p className="text-base font-bold text-gray-900">
                      {complianceReportModalShip.report.complianceSubmittedAt 
                        ? new Date(complianceReportModalShip.report.complianceSubmittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Compliance Sections */}
              {complianceReportModalShip.report.complianceStatus && (
                <div className="space-y-4">
                  {/* SOLAS Compliance */}
                  {complianceReportModalShip.report.complianceStatus.solas && Object.keys(complianceReportModalShip.report.complianceStatus.solas).length > 0 && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">SOLAS</span>
                        Safety of Life at Sea
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(complianceReportModalShip.report.complianceStatus.solas).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 font-semibold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className={`text-sm font-bold mt-1 ${
                              value?.status === 'Compliant' ? 'text-green-600' :
                              value?.status === 'Non-Compliant' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {value?.status || (typeof value === 'string' ? value : 'N/A')}
                            </p>
                            {value?.details && <p className="text-xs text-gray-500 mt-1">{value.details}</p>}
                            {value?.comments && <p className="text-xs text-gray-500 mt-1">{value.comments}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MARPOL Compliance */}
                  {complianceReportModalShip.report.complianceStatus.marpol && Object.keys(complianceReportModalShip.report.complianceStatus.marpol).length > 0 && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">MARPOL</span>
                        Marine Pollution Prevention
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(complianceReportModalShip.report.complianceStatus.marpol).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 font-semibold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className={`text-sm font-bold mt-1 ${
                              value?.status === 'Compliant' ? 'text-green-600' :
                              value?.status === 'Non-Compliant' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {value?.status || (typeof value === 'string' ? value : 'N/A')}
                            </p>
                            {value?.details && <p className="text-xs text-gray-500 mt-1">{value.details}</p>}
                            {value?.comments && <p className="text-xs text-gray-500 mt-1">{value.comments}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MLC Compliance */}
                  {complianceReportModalShip.report.complianceStatus.mlc && Object.keys(complianceReportModalShip.report.complianceStatus.mlc).length > 0 && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">MLC</span>
                        Maritime Labour Convention
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(complianceReportModalShip.report.complianceStatus.mlc).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 font-semibold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className={`text-sm font-bold mt-1 ${
                              value?.status === 'Compliant' ? 'text-green-600' :
                              value?.status === 'Non-Compliant' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {value?.status || (typeof value === 'string' ? value : 'N/A')}
                            </p>
                            {value?.details && <p className="text-xs text-gray-500 mt-1">{value.details}</p>}
                            {value?.comments && <p className="text-xs text-gray-500 mt-1">{value.comments}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show other compliance sections if they exist */}
                  {Object.keys(complianceReportModalShip.report.complianceStatus)
                    .filter(key => !['solas', 'marpol', 'mlc'].includes(key.toLowerCase()))
                    .map(sectionKey => {
                      const section = complianceReportModalShip.report.complianceStatus[sectionKey];
                      if (!section || (typeof section === 'object' && Object.keys(section).length === 0)) return null;
                      
                      return (
                        <div key={sectionKey} className="bg-white rounded-xl border-2 border-gray-200 p-5">
                          <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold uppercase">
                              {sectionKey}
                            </span>
                            {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {typeof section === 'object' ? (
                              Object.entries(section).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs text-gray-600 font-semibold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                  <p className={`text-sm font-bold mt-1 ${
                                    value?.status === 'Compliant' ? 'text-green-600' :
                                    value?.status === 'Non-Compliant' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {value?.status || (typeof value === 'string' ? value : JSON.stringify(value))}
                                  </p>
                                  {value?.details && <p className="text-xs text-gray-500 mt-1">{value.details}</p>}
                                  {value?.comments && <p className="text-xs text-gray-500 mt-1">{value.comments}</p>}
                                </div>
                              ))
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700">{String(section)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  }

                  {/* Show message if no sections have data */}
                  {!complianceReportModalShip.report.complianceStatus.solas && 
                   !complianceReportModalShip.report.complianceStatus.marpol && 
                   !complianceReportModalShip.report.complianceStatus.mlc &&
                   Object.keys(complianceReportModalShip.report.complianceStatus).length === 0 && (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-600 font-medium">No compliance sections found</p>
                      <p className="text-gray-400 text-sm mt-1">This compliance report may be incomplete</p>
                    </div>
                  )}
                </div>
              )}
              
              {!complianceReportModalShip.report.complianceStatus && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-600 font-medium">No detailed compliance data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
              <button
                onClick={() => setComplianceReportModalShip({ open: false, report: null })}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Vessel Modal Component
function VesselModal({ vessel, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: vessel?.name || '',
    imo: vessel?.imo || '',
    vesselType: vessel?.vesselType || 'Container Ship',
    flag: vessel?.flag || '',
    yearBuilt: vessel?.yearBuilt || '',
    grossTonnage: vessel?.grossTonnage || '',
    dimensions: {
      length: vessel?.dimensions?.length || '',
      beam: vessel?.dimensions?.beam || '',
      draft: vessel?.dimensions?.draft || ''
    }
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const vesselTypes = [
    'Bulk Carrier',
    'Container Ship', 
    'Tanker',
    'Passenger Ship',
    'Fishing Vessel',
    'Other'
  ];

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Ship name is required';
        break;
      case 'imo':
        if (!value.trim()) error = 'IMO number is required';
        else if (!/^IMO\s\d{7}$/.test(value)) error = 'Please enter a valid IMO number (format: IMO 1234567)';
        break;
      case 'vesselType':
        if (!value) error = 'Ship type is required';
        break;
      case 'flag':
        if (!value.trim()) error = 'Flag country is required';
        break;
      case 'yearBuilt':
        if (!value) error = 'Year built is required';
        else if (value < 1900 || value > new Date().getFullYear()) error = 'Please enter a valid year';
        break;
      case 'grossTonnage':
        if (!value || value <= 0) error = 'Gross tonnage must be positive';
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [name]: value }
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'dimensions') allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    const isValid = Object.keys(formData).every(key => {
      if (key === 'dimensions') return true;
      return validateField(key, formData[key]);
    });

    if (isValid) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {vessel ? 'Edit Ship' : 'Add New Ship'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ship Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.name && errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IMO Number *</label>
                <input
                  type="text"
                  name="imo"
                  value={formData.imo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="IMO 1234567"
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.imo && errors.imo 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.imo && errors.imo && (
                  <p className="mt-1 text-sm text-red-600">{errors.imo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ship Type *</label>
                <select
                  name="vesselType"
                  value={formData.vesselType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.vesselType && errors.vesselType 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                >
                  {vesselTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {touched.vesselType && errors.vesselType && (
                  <p className="mt-1 text-sm text-red-600">{errors.vesselType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Flag Country *</label>
                <input
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.flag && errors.flag 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.flag && errors.flag && (
                  <p className="mt-1 text-sm text-red-600">{errors.flag}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year Built *</label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.yearBuilt && errors.yearBuilt 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.yearBuilt && errors.yearBuilt && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearBuilt}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gross Tonnage *</label>
                <input
                  type="number"
                  name="grossTonnage"
                  value={formData.grossTonnage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="1"
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched.grossTonnage && errors.grossTonnage 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched.grossTonnage && errors.grossTonnage && (
                  <p className="mt-1 text-sm text-red-600">{errors.grossTonnage}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                <input
                  type="number"
                  name="length"
                  value={formData.dimensions.length}
                  onChange={handleDimensionChange}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Beam (m)</label>
                <input
                  type="number"
                  name="beam"
                  value={formData.dimensions.beam}
                  onChange={handleDimensionChange}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Draft (m)</label>
                <input
                  type="number"
                  name="draft"
                  value={formData.dimensions.draft}
                  onChange={handleDimensionChange}
                  className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
              >
                {vessel ? 'Update Ship' : 'Add Ship'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

