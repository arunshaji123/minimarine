import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Icons
import { 
  FaShip, FaClipboardCheck, FaTools, FaUsers, FaBoxes, 
  FaCalendarAlt, FaExclamationTriangle, FaFileAlt, FaChartLine 
} from 'react-icons/fa';
import DashboardLayout from '../layouts/DashboardLayout';
import UserProfileModal from '../UserProfileModal.jsx';
import ServiceRequestModal from '../modals/ServiceRequestModal';
import SurveyDetailsModal from '../modals/SurveyDetailsModal';
import ComplianceReportModal from '../modals/ComplianceReportModal';
import VesselTab from './VesselTab';
import PredictiveMaintenanceTab from './PredictiveMaintenanceTab';

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

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const [vessels, setVessels] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [crew, setCrew] = useState([]);
  const [cargo, setCargo] = useState([]);
  const [surveyorBookings, setSurveyorBookings] = useState([]);
  const [cargoManagerBookings, setCargoManagerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [shipsSubTab, setShipsSubTab] = useState('ships'); // 'ships' or 'certificates'
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [certificateDetailModal, setCertificateDetailModal] = useState({ open: false, certificate: null });
  const [certificateSearch, setCertificateSearch] = useState('');
  const [certificateSortBy, setCertificateSortBy] = useState('expiryDate'); // 'expiryDate' or 'issueDate'
  const [certificateSortOrder, setCertificateSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [showProfile, setShowProfile] = useState(false);
  const [showVesselModal, setShowVesselModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ open: false, survey: null });
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [editingServiceRequest, setEditingServiceRequest] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalType, setBookingModalType] = useState('surveyor'); // 'surveyor' or 'cargo'

  // Ship Finder states
  const [selectedShipForDetails, setSelectedShipForDetails] = useState(null);
  const [shipDetailsLoading, setShipDetailsLoading] = useState(false);
  const [shipDetailsData, setShipDetailsData] = useState(null);
  const [surveyReportModal, setSurveyReportModal] = useState({ open: false, survey: null });
  const [complianceReportModalShip, setComplianceReportModalShip] = useState({ open: false, report: null });
  const [downloadingShipReport, setDownloadingShipReport] = useState(false);

  // File upload states for vessel modal
  const [photos, setPhotos] = useState([]); // For storing photo previews
  const [videos, setVideos] = useState([]); // For storing video previews

  // Use authenticated user info with safe fallbacks
  const profile = {
    name: user?.name || 'Owner',
    email: user?.email || 'owner@example.com',
    role: user?.role || 'owner',
    status: user?.status || 'active'
  };

  const [surveyDetailsModal, setSurveyDetailsModal] = useState({ open: false, survey: null });
  const [knnPredictions, setKnnPredictions] = useState([]);
  const [knnLoading, setKnnLoading] = useState(false);
  const [knnError, setKnnError] = useState(null);
  const [knnRefreshKey, setKnnRefreshKey] = useState(0);
  const [selectedVessel, setSelectedVessel] = useState(null);
  
  // Survey filters
  const [surveyShipFilter, setSurveyShipFilter] = useState('');
  const [surveySurveyorFilter, setSurveySurveyorFilter] = useState('');
  const [surveyDateFilter, setSurveyDateFilter] = useState('');
  const [surveySearch, setSurveySearch] = useState('');
  const [surveyors, setSurveyors] = useState([]);
  
  // Surveys tab state
  const [surveysTab, setSurveysTab] = useState('survey'); // 'survey' or 'compliance'
  
  // Compliance reports state
  const [complianceReports, setComplianceReports] = useState([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceSurveyorFilter, setComplianceSurveyorFilter] = useState('');
  const [complianceShipFilter, setComplianceShipFilter] = useState('');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [complianceReportModal, setComplianceReportModal] = useState({ open: false, survey: null });
  
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
  
  // Auto-select first vessel with completed surveys when vessels load
  useEffect(() => {
    const findVesselWithSurveys = async () => {
      if (vessels.length === 0) return;
      
      for (const vessel of vessels) {
        try {
          const token = localStorage.getItem('token');
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          const surveyResponse = await axios.get(`/api/surveys?vessel=${vessel._id}&status=Completed`, config);
          
          if (surveyResponse.data && surveyResponse.data.length > 0) {
            console.log(`Found vessel with surveys: ${vessel.name} (${surveyResponse.data.length} surveys)`);
            setSelectedVessel(vessel._id);
            return;
          }
        } catch (error) {
          console.log(`Error checking surveys for ${vessel.name}:`, error);
        }
      }
      
      // If no vessel has surveys, just select the first one
      if (vessels.length > 0 && !selectedVessel) {
        setSelectedVessel(vessels[0]._id);
      }
    };
    
    findVesselWithSurveys();
  }, [vessels]);
  
  // Fetch predictions when selected vessel changes or refresh is triggered
  useEffect(() => {
    if (activeTab === 'predictive_maintenance' && selectedVessel) {
      fetchKNNPredictions(selectedVessel);
    }
  }, [activeTab, selectedVessel, knnRefreshKey]);

  useEffect(() => {
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get owner's vessels
        const vesselsRes = await axios.get('/api/vessels');
        setVessels(vesselsRes.data);
        setLoadError(null);
        
        // Get surveys for owner's vessels
        const surveysRes = await axios.get('/api/surveys');
        setSurveys(surveysRes.data);
        
        // Get maintenance records for owner's vessels
        const maintenanceRes = await axios.get('/api/maintenance');
        setMaintenance(maintenanceRes.data);
        
        // Get crew for owner's vessels
        const crewRes = await axios.get('/api/crew');
        setCrew(crewRes.data);
        
        // Get cargo for owner's vessels
        const cargoRes = await axios.get('/api/cargo');
        setCargo(cargoRes.data);

        // Load my service requests
        const srRes = await axios.get('/api/service-requests');
        setServiceRequests(srRes.data?.requests || []);
        
        // Load surveyor bookings for owner's vessels
        const surveyorBookingsRes = await axios.get('/api/owner-bookings/surveyor');
        console.log('Surveyor bookings data:', surveyorBookingsRes.data); // Debug log
        setSurveyorBookings(surveyorBookingsRes.data);
        
        // Load cargo manager bookings for owner's vessels
        const cargoManagerBookingsRes = await axios.get('/api/owner-bookings/cargo');
        console.log('Cargo manager bookings data:', cargoManagerBookingsRes.data); // Debug log
        setCargoManagerBookings(cargoManagerBookingsRes.data);
        
        // Load surveyors for filtering
        const surveyorsRes = await axios.get('/api/users/surveyors');
        setSurveyors(surveyorsRes.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoadError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Load compliance reports
  const loadComplianceReports = async () => {
    try {
      setComplianceLoading(true);
      // Get all completed surveys for owner's vessels
      const response = await axios.get('/api/surveys?status=Completed');
      
      // Filter to get only surveys that have compliance data submitted
      const complianceReports = response.data.filter(survey => {
        return survey.complianceStatus && 
               survey.complianceSubmittedAt;
      });
      
      console.log('Compliance reports loaded:', complianceReports.length);
      setComplianceReports(complianceReports);
    } catch (err) {
      console.error('Error loading compliance reports:', err);
      setComplianceReports([]);
    } finally {
      setComplianceLoading(false);
    }
  };

  // Load certificates for owner's vessels
  const loadCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const response = await axios.get('/api/certificates/owner/my-certificates');
      console.log('Certificates loaded:', response.data.length);
      setCertificates(response.data);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };

  // Load complete ship details including surveys, certificates, surveyors, etc.
  const loadShipDetails = async (vessel) => {
    if (!vessel) return;
    
    setShipDetailsLoading(true);
    try {
      // Fetch all related data in parallel
      const [surveysRes, certificatesRes, complianceRes] = await Promise.all([
        axios.get(`/api/surveys/vessel/${vessel._id}`),
        axios.get('/api/certificates/owner/my-certificates'),
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
      error('Failed to load complete ship details');
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
      error('No ship selected to generate report');
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
      success('Ship report downloaded successfully');
    } catch (err) {
      console.error('Error downloading ship report:', err);
      error('Failed to download ship report. Please try again.');
    } finally {
      setDownloadingShipReport(false);
    }
  };

  // Load certificates when switching to certificates tab
  useEffect(() => {
    if (shipsSubTab === 'certificates') {
      loadCertificates();
    }
  }, [shipsSubTab]);

  // Check for deletion notifications
  useEffect(() => {
    // Check surveyor bookings for deletion reasons
    surveyorBookings.forEach(booking => {
      if (booking.deletionReason) {
        warning(`Surveyor booking for ${booking.vessel?.name || booking.vesselName} was deleted. Reason: ${booking.deletionReason}`);
      }
    });
    
    // Check cargo manager bookings for deletion reasons
    cargoManagerBookings.forEach(booking => {
      if (booking.deletionReason) {
        warning(`Cargo manager booking for ${booking.vessel?.name || booking.vesselName} was deleted. Reason: ${booking.deletionReason}`);
      }
    });
  }, [surveyorBookings, cargoManagerBookings, warning]);

  // Calculate statistics
  const stats = {
    totalVessels: vessels.length,
    activeSurveys: surveys.filter(s => s.status === 'In Progress').length,
    upcomingSurveys: surveys.filter(s => s.status === 'Scheduled').length,
    pendingMaintenance: maintenance.filter(m => m.status === 'Planned').length,
    criticalMaintenance: maintenance.filter(m => m.priority === 'Critical').length,
    activeCrew: crew.filter(c => c.status === 'Active').length,
    expiringCertificates: vessels.reduce((count, vessel) => {
      return count + (vessel.certificates?.filter(cert => {
        const expiryDate = new Date(cert.expiryDate);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
      })?.length || 0);
    }, 0),
    cargoInTransit: cargo.filter(c => c.status === 'In Transit').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-marine-blue"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine className="mr-2" /> },
    { id: 'vessels', label: 'Ships', icon: <FaShip className="mr-2" /> },
    { id: 'surveys', label: 'Surveys', icon: <FaClipboardCheck className="mr-2" /> },
    { id: 'surveyor_bookings', label: 'Surveyor Bookings', icon: <FaClipboardCheck className="mr-2" /> },
    { id: 'cargo_manager_bookings', label: 'Cargo Bookings', icon: <FaBoxes className="mr-2" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <FaTools className="mr-2" /> },
    { id: 'crew', label: 'Crew', icon: <FaUsers className="mr-2" /> },
    { id: 'cargo', label: 'Cargo', icon: <FaBoxes className="mr-2" /> },
    { id: 'service_requests', label: 'Service Requests', icon: <FaTools className="mr-2" /> },
    { id: 'predictive_maintenance', label: 'Predictive Maintenance', icon: <FaChartLine className="mr-2" /> }
  ];

  const handleAddVessel = async (vesselData, isMultipart = false) => {
    try {
      let res;
      if (isMultipart) {
        // Handle multipart form data with files
        res = await axios.post('/api/vessels', vesselData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Handle regular JSON data
        res = await axios.post('/api/vessels', vesselData);
      }
      
      setVessels(prev => [res.data, ...prev]);
      setShowVesselModal(false);
      setEditingVessel(null);
      setSuccessMessage(`Vessel "${res.data.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error adding vessel:', err);
      
      // Handle validation errors
      let errorMsg = 'Failed to add vessel';
      if (err.response?.data) {
        if (err.response.data.msg) {
          errorMsg = err.response.data.msg;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
        
        // Add specific validation errors if present
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMsg += ': ' + err.response.data.errors.join(', ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setLoadError(errorMsg);
      
      // Keep the modal open so user can fix errors
      // setShowVesselModal will remain true
    }
  };

  const handleUpdateVessel = async (id, vesselData, isMultipart = false) => {
    try {
      let res;
      if (isMultipart) {
        // Handle multipart form data with files
        res = await axios.put(`/api/vessels/${id}`, vesselData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Handle regular JSON data
        res = await axios.put(`/api/vessels/${id}`, vesselData);
      }
      
      setVessels(prev => prev.map(v => v._id === id ? res.data : v));
      setShowVesselModal(false);
      setEditingVessel(null);
      setSuccessMessage(`Vessel "${res.data.name}" updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error updating vessel:', err);
      setLoadError('Failed to update vessel');
    }
  };

  const handleEditServiceRequest = (request) => {
    setEditingServiceRequest(request);
    setShowServiceRequestModal(true);
  };

  const handleDeleteServiceRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this service request?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/service-requests/${requestId}`);
      setServiceRequests(prev => prev.filter(r => r._id !== requestId));
      setSuccessMessage('Service request deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting service request:', err);
      const msg = err.response?.data?.message || 'Failed to delete service request';
      setLoadError(msg);
      setTimeout(() => setLoadError(null), 5000);
    }
  };

  const handleUpdateServiceRequest = (updatedRequest) => {
    setServiceRequests(prev => prev.map(r => r._id === updatedRequest._id ? updatedRequest : r));
    setEditingServiceRequest(null);
    setSuccessMessage('Service request updated successfully. Status reset to pending for ship company review.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <DashboardLayout title="Owner Dashboard" description={`Welcome, ${user?.name || ''}`} onProfileClick={() => setShowProfile(s => !s)}>
      <ServiceRequestModal
        open={showServiceRequestModal}
        onClose={() => {
          setShowServiceRequestModal(false);
          setEditingServiceRequest(null);
        }}
        onCreated={(request) => {
          setServiceRequests(prev => [request, ...prev]);
          setSuccessMessage('Service request created');
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
        onUpdated={handleUpdateServiceRequest}
        vessels={vessels}
        editingRequest={editingServiceRequest}
      />
      {/* Enhanced Quick Stats with Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium mb-1">My Fleet</p>
              <p className="text-4xl font-bold text-white mb-2">{stats.totalVessels}</p>
              <p className="text-blue-200 text-xs">Total Vessels</p>
            </div>
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <FaShip className="text-white text-3xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-amber-100 text-sm font-medium mb-1">Active Surveys</p>
              <p className="text-4xl font-bold text-white mb-2">{stats.activeSurveys}</p>
              <p className="text-amber-200 text-xs">In Progress</p>
            </div>
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <FaClipboardCheck className="text-white text-3xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-red-100 text-sm font-medium mb-1">Alerts</p>
              <p className="text-4xl font-bold text-white mb-2">{stats.expiringCertificates}</p>
              <p className="text-red-200 text-xs">Expiring Certificates</p>
            </div>
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <FaExclamationTriangle className="text-white text-3xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-green-100 text-sm font-medium mb-1">Cargo Status</p>
              <p className="text-4xl font-bold text-white mb-2">{stats.cargoInTransit}</p>
              <p className="text-green-200 text-xs">In Transit</p>
            </div>
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <FaBoxes className="text-white text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Upcoming Surveys</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.upcomingSurveys}</p>
            </div>
            <FaCalendarAlt className="text-purple-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Maintenance Tasks</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingMaintenance}</p>
            </div>
            <FaTools className="text-indigo-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-rose-500 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Critical Items</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.criticalMaintenance}</p>
            </div>
            <FaExclamationTriangle className="text-rose-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-cyan-500 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Crew</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.activeCrew}</p>
            </div>
            <FaUsers className="text-cyan-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Reusable Profile Modal/Sidebar */}
      <UserProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={profile}
        variant="sidebar"
        title="My Profile"
      />

      {/* Enhanced Navigation Tabs with Icons */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-md p-2">
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-5 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-marine-blue to-blue-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:scale-102'}
                `}
              >
                <span className={`text-lg ${activeTab === tab.id ? 'animate-pulse' : ''}`}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setBookingModalOpen(false)}
              ></div>
            </div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {bookingModalType === 'surveyor' ? 'Surveyor Booking Details' : 'Cargo Manager Booking Details'}
                  </h3>
                  
                  {selectedBooking && (
                    <div className="mt-2 space-y-4">
                      {/* Booking Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-2">Booking Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-sm font-medium">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                selectedBooking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                selectedBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {selectedBooking.status}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Booked By</p>
                            <p className="text-sm font-medium">{selectedBooking.bookedBy?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{selectedBooking.bookedBy?.company || ''}</p>
                          </div>
                          {selectedBooking.acceptedAt && (
                            <div>
                              <p className="text-sm text-gray-500">Accepted At</p>
                              <p className="text-sm font-medium">{new Date(selectedBooking.acceptedAt).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vessel Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-2">Vessel Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="text-sm font-medium">{selectedBooking.vessel?.name || selectedBooking.vesselName}</p>
                            {selectedBooking.vessel?.vesselId && <p className="text-xs text-gray-400">ID: {selectedBooking.vessel.vesselId}</p>}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">IMO</p>
                            <p className="text-sm font-medium">{selectedBooking.vessel?.imo || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="text-sm font-medium">{selectedBooking.shipType}</p>
                          </div>
                          {selectedBooking.vessel?.yearBuilt && (
                            <div>
                              <p className="text-sm text-gray-500">Year Built</p>
                              <p className="text-sm font-medium">{selectedBooking.vessel.yearBuilt}</p>
                            </div>
                          )}
                          {selectedBooking.vessel?.flag && (
                            <div>
                              <p className="text-sm text-gray-500">Flag</p>
                              <p className="text-sm font-medium">{selectedBooking.vessel.flag}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Booking Specific Details */}
                      {bookingModalType === 'surveyor' ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-md font-medium text-gray-900 mb-2">Survey Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Surveyor</p>
                              <p className="text-sm font-medium">{selectedBooking.surveyor?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{selectedBooking.surveyor?.email || ''}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Survey Type</p>
                              <p className="text-sm font-medium">{selectedBooking.surveyType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Inspection Date</p>
                              <p className="text-sm font-medium">{new Date(selectedBooking.inspectionDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Inspection Time</p>
                              <p className="text-sm font-medium">{selectedBooking.inspectionTime}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Location</p>
                              <p className="text-sm font-medium">{selectedBooking.location}</p>
                            </div>
                            {selectedBooking.estimatedDuration && (
                              <div>
                                <p className="text-sm text-gray-500">Estimated Duration</p>
                                <p className="text-sm font-medium">{selectedBooking.estimatedDuration} hours</p>
                              </div>
                            )}
                            {selectedBooking.notes && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Notes</p>
                                <p className="text-sm font-medium">{selectedBooking.notes}</p>
                              </div>
                            )}
                            {selectedBooking.specialRequirements && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Special Requirements</p>
                                <p className="text-sm font-medium">{selectedBooking.specialRequirements}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-md font-medium text-gray-900 mb-2">Cargo Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Cargo Manager</p>
                              <p className="text-sm font-medium">{selectedBooking.cargoManager?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{selectedBooking.cargoManager?.email || ''}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Cargo Type</p>
                              <p className="text-sm font-medium">{selectedBooking.cargoType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Voyage Date</p>
                              <p className="text-sm font-medium">{new Date(selectedBooking.voyageDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Voyage Time</p>
                              <p className="text-sm font-medium">{selectedBooking.voyageTime}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Departure Port</p>
                              <p className="text-sm font-medium">{selectedBooking.departurePort}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Destination Port</p>
                              <p className="text-sm font-medium">{selectedBooking.destinationPort}</p>
                            </div>
                            {selectedBooking.estimatedDuration && (
                              <div>
                                <p className="text-sm text-gray-500">Estimated Duration</p>
                                <p className="text-sm font-medium">{selectedBooking.estimatedDuration} days</p>
                              </div>
                            )}
                            {selectedBooking.cargoWeight && (
                              <div>
                                <p className="text-sm text-gray-500">Cargo Weight</p>
                                <p className="text-sm font-medium">{selectedBooking.cargoWeight} tons</p>
                              </div>
                            )}
                            {selectedBooking.cargoUnits && (
                              <div>
                                <p className="text-sm text-gray-500">Cargo Units</p>
                                <p className="text-sm font-medium">{selectedBooking.cargoUnits}</p>
                              </div>
                            )}
                            {selectedBooking.notes && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Notes</p>
                                <p className="text-sm font-medium">{selectedBooking.notes}</p>
                              </div>
                            )}
                            {selectedBooking.specialRequirements && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Special Requirements</p>
                                <p className="text-sm font-medium">{selectedBooking.specialRequirements}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setBookingModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success Message with Animation */}
      {successMessage && (
        <div className="animate-slideInDown mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md">
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

      {/* Tab Content */}
      <div className="mb-6 custom-scrollbar">
        {/* Enhanced Service Requests Tab */}
        {activeTab === 'service_requests' && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Service Requests</h3>
                <p className="text-sm text-gray-500">Manage your vessel service requests</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowServiceRequestModal(true)} 
                  className="bg-gradient-to-r from-marine-blue to-blue-600 hover:from-marine-dark hover:to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Request
                </button>
                <button
                  onClick={async () => {
                    try {
                      const r = await axios.get('/api/service-requests');
                      setServiceRequests(r.data?.requests || []);
                    } catch (e) {
                      console.error(e);
                      setLoadError('Failed to refresh service requests');
                    }
                  }}
                  className="bg-white border-2 border-gray-300 hover:border-marine-blue hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SHIP</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ship Company</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Updated</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceRequests.map((r) => (
                      <tr key={r._id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{r.title}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="font-medium">{r.vessel?.name || '-'}</div>
                          <div className="text-xs text-gray-400">ID: {r.vessel?.vesselId || r.vessel?._id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.shipCompany?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.updatedAt).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditServiceRequest(r)}
                              className="text-marine-blue hover:text-white text-xs px-3 py-1.5 border-2 border-marine-blue rounded-lg hover:bg-marine-blue transition-all duration-200 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteServiceRequest(r._id)}
                              className="text-red-600 hover:text-white text-xs px-3 py-1.5 border-2 border-red-600 rounded-lg hover:bg-red-600 transition-all duration-200 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {serviceRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FaFileAlt className="text-gray-300 text-6xl mb-4" />
                            <p className="text-gray-500 text-sm font-medium">No service requests yet</p>
                            <p className="text-gray-400 text-xs mt-1">Create your first service request to get started</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Enhanced Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
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
                                    🟠 WARNING
                                  </span>
                                </div>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">{cert.vessel?.name || 'Unknown Vessel'}</h4>
                            <p className="text-xs text-gray-700 mb-2">Certificate: {cert.certificateNumber}</p>
                            <p className="text-xs text-gray-600 mb-2">{cert.surveyType || 'Survey'}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                              <span className="text-xs text-gray-700 font-semibold">
                                {daysRemaining} days remaining
                              </span>
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}

                    {/* Valid Alerts (>30 days but showing recent ones) */}
                    {certificates
                      .filter(cert => {
                        const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return daysRemaining > 30 && daysRemaining <= 90;
                      })
                      .slice(0, 3)
                      .map(cert => {
                        const expiryDate = new Date(cert.expiryDate);
                        const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div 
                            key={cert._id}
                            className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                            onClick={() => setCertificateDetailModal({ open: true, certificate: cert })}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
                                    🟢 VALID
                                  </span>
                                </div>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">{cert.vessel?.name || 'Unknown Vessel'}</h4>
                            <p className="text-xs text-gray-700 mb-2">Certificate: {cert.certificateNumber}</p>
                            <p className="text-xs text-gray-600 mb-2">{cert.surveyType || 'Survey'}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-green-200">
                              <span className="text-xs text-gray-700 font-semibold">
                                {daysRemaining} days remaining
                              </span>
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Empty State */}
                  {certificates.filter(cert => {
                    const daysRemaining = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysRemaining <= 90;
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-600 font-semibold">All inspections are up to date!</p>
                      <p className="text-gray-400 text-sm mt-1">No certificates require immediate attention</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ship Finder & Details Section */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 rounded-3xl shadow-2xl overflow-hidden border-2 border-indigo-300">
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 border-b-4 border-indigo-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-3">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white drop-shadow-md">Ship Finder & Comprehensive Details</h3>
                        <p className="text-sm text-indigo-100 mt-0.5">Complete vessel information and analytics at your fingertips</p>
                      </div>
                    </div>
                    {selectedShipForDetails && shipDetailsData && (
                      <button
                        onClick={downloadShipReport}
                        disabled={downloadingShipReport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        {downloadingShipReport ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Download PDF Report</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-b from-white to-slate-50"
>
                  {/* Ship Search/Select - Enhanced */}
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      Select Your Vessel
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Upcoming Surveys - Enhanced Card */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border-t-4 border-blue-500 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center">
                    <div className="rounded-full bg-blue-100 p-3 mr-3">
                      <FaCalendarAlt className="text-blue-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Upcoming Surveys</h3>
                  </div>
                  <Link to="/surveys" className="text-sm text-marine-blue hover:text-marine-dark font-semibold hover:underline">View All →</Link>
                </div>
                
                <div className="space-y-3">
                  {surveys.filter(s => s.status === 'Scheduled').slice(0, 3).map((survey, index) => (
                    <div key={survey._id || index} className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-amber-400"
                         onClick={() => setSurveyDetailsModal({ open: true, survey })}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="rounded-full bg-amber-100 p-2 mr-3">
                            <FaClipboardCheck className="text-amber-600 text-lg" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900">{survey.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-semibold">{new Date(survey.scheduledDate).toLocaleDateString()}</span> • {survey.surveyType}
                            </p>
                            {survey.vessel && (
                              <p className="text-xs text-gray-500 mt-1">
                                🚢 {survey.vessel.name} <span className="text-gray-400">(ID: {survey.vessel.vesselId})</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {surveys.filter(s => s.status === 'Scheduled').length === 0 && (
                    <div className="text-center py-8">
                      <FaCalendarAlt className="text-gray-300 text-5xl mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No upcoming surveys scheduled</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Critical Maintenance - Enhanced Card */}
              <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-xl p-6 border-t-4 border-red-500 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center">
                    <div className="rounded-full bg-red-100 p-3 mr-3">
                      <FaExclamationTriangle className="text-red-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Critical Maintenance</h3>
                  </div>
                  <Link to="/maintenance" className="text-sm text-marine-blue hover:text-marine-dark font-semibold hover:underline">View All →</Link>
                </div>
                
                <div className="space-y-3">
                  {maintenance.filter(m => m.priority === 'Critical').slice(0, 3).map((task, index) => (
                    <div key={task._id || index} className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-red-400"
                         onClick={() => setDetailsModal({ open: true, survey: task })}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="rounded-full bg-red-100 p-2 mr-3">
                            <FaTools className="text-red-600 text-lg" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-semibold">{new Date(task.dueDate).toLocaleDateString()}</span> • {task.component}
                            </p>
                            {task.vessel && (
                              <p className="text-xs text-gray-500 mt-1">
                                🚢 {task.vessel.name} <span className="text-gray-400">(ID: {task.vessel.vesselId || task.vessel._id})</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                            CRITICAL
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {maintenance.filter(m => m.priority === 'Critical').length === 0 && (
                    <div className="text-center py-8">
                      <FaTools className="text-gray-300 text-5xl mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No critical maintenance items</p>
                      <p className="text-xs text-gray-400 mt-1">All systems are running smoothly</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Enhanced Expiring Certificates */}
            <div className="mt-6 bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-6 border-t-4 border-yellow-500">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center">
                  <div className="rounded-full bg-yellow-100 p-3 mr-3">
                    <FaFileAlt className="text-yellow-600 text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Expiring Certificates</h3>
                </div>
                <Link to="/vessels" className="text-sm text-marine-blue hover:text-marine-dark font-semibold hover:underline">View All →</Link>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-yellow-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vessel</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Certificate</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Days Left</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vessels.flatMap(vessel => 
                      (vessel.certificates || []).filter(cert => {
                        const expiryDate = new Date(cert.expiryDate);
                        const today = new Date();
                        const diffTime = expiryDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 30 && diffDays > 0;
                      }).map((cert, certIndex) => {
                        const expiryDate = new Date(cert.expiryDate);
                        const today = new Date();
                        const diffTime = expiryDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        return (
                          <tr key={`${vessel._id}-${certIndex}`} className="hover:bg-yellow-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{vessel.name}</div>
                              <div className="text-xs text-gray-400">ID: {vessel.vesselId || vessel._id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{cert.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {expiryDate.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${diffDays <= 7 ? 'text-red-600' : diffDays <= 14 ? 'text-orange-600' : 'text-yellow-600'}`}>
                                {diffDays} days
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${diffDays <= 7 ? 'bg-red-100 text-red-800 animate-pulse' : diffDays <= 14 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {diffDays <= 7 ? 'URGENT' : 'Expiring Soon'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ).slice(0, 5)}
                  </tbody>
                </table>
                
                {vessels.flatMap(vessel => (vessel.certificates || []).filter(cert => {
                  const expiryDate = new Date(cert.expiryDate);
                  const today = new Date();
                  const diffTime = expiryDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 30 && diffDays > 0;
                })).length === 0 && (
                  <div className="text-center py-12">
                    <FaFileAlt className="text-gray-300 text-6xl mx-auto mb-4" />
                    <p className="text-sm text-gray-500 font-medium">No certificates expiring soon</p>
                    <p className="text-xs text-gray-400 mt-1">All certificates are up to date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Vessels Tab */}
        {activeTab === 'vessels' && (
          <div>
            {/* Sub-navigation for Ships */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setShipsSubTab('ships')}
                    className={`${
                      shipsSubTab === 'ships'
                        ? 'border-marine-blue text-marine-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    My Ships
                  </button>
                  <button
                    onClick={() => setShipsSubTab('certificates')}
                    className={`${
                      shipsSubTab === 'certificates'
                        ? 'border-marine-blue text-marine-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Certificates
                  </button>
                </nav>
              </div>
            </div>

            {/* My Ships Section */}
            {shipsSubTab === 'ships' && (
              <VesselTab 
                vessels={vessels} 
                setShowVesselModal={setShowVesselModal} 
                setEditingVessel={setEditingVessel}
                setVessels={setVessels}
                setError={setLoadError}
              />
            )}

            {/* Certificates Section */}
            {shipsSubTab === 'certificates' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                      <svg className="w-7 h-7 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      Renewed Certificates
                    </h3>
                    <p className="text-sm text-gray-600">Marine survey certificates for your vessels</p>
                  </div>
                </div>
                
                {/* Search and Sort Controls */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by vessel name, certificate number..."
                        value={certificateSearch}
                        onChange={(e) => setCertificateSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                    
                    {/* Sort Controls */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Sort by:</label>
                      <select
                        value={certificateSortBy}
                        onChange={(e) => setCertificateSortBy(e.target.value)}
                        className="block py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="expiryDate">Expiry Date</option>
                        <option value="issueDate">Last Inspected</option>
                        <option value="certificateNumber">Certificate No</option>
                        <option value="vesselName">Vessel Name</option>
                      </select>
                      
                      <button
                        onClick={() => setCertificateSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                        className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                        title={certificateSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      >
                        <svg className={`w-5 h-5 text-gray-600 transition-transform ${certificateSortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      </button>
                    </div>
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
                              <p className="text-gray-400 text-sm mt-1">Certificates will appear here after surveys are completed</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        certificates
                          .filter(cert => {
                            if (!certificateSearch) return true;
                            const searchLower = certificateSearch.toLowerCase();
                            return (
                              cert.certificateNumber?.toLowerCase().includes(searchLower) ||
                              cert.vessel?.name?.toLowerCase().includes(searchLower) ||
                              cert.vessel?.imo?.toLowerCase().includes(searchLower) ||
                              cert.surveyType?.toLowerCase().includes(searchLower)
                            );
                          })
                          .sort((a, b) => {
                            let aVal, bVal;
                            
                            switch(certificateSortBy) {
                              case 'expiryDate':
                                aVal = new Date(a.expiryDate).getTime();
                                bVal = new Date(b.expiryDate).getTime();
                                break;
                              case 'issueDate':
                                aVal = new Date(a.issueDate).getTime();
                                bVal = new Date(b.issueDate).getTime();
                                break;
                              case 'certificateNumber':
                                aVal = a.certificateNumber || '';
                                bVal = b.certificateNumber || '';
                                break;
                              case 'vesselName':
                                aVal = a.vessel?.name || '';
                                bVal = b.vessel?.name || '';
                                break;
                              default:
                                return 0;
                            }
                            
                            if (typeof aVal === 'string') {
                              return certificateSortOrder === 'asc' 
                                ? aVal.localeCompare(bVal)
                                : bVal.localeCompare(aVal);
                            } else {
                              return certificateSortOrder === 'asc' 
                                ? aVal - bVal
                                : bVal - aVal;
                            }
                          })
                          .map((cert) => {
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
            )}
          </div>
        )}
        
        {/* Surveys Tab */}
        {activeTab === 'surveys' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Surveys</h3>
              <Link to="/surveys" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
            </div>
            
            {/* Survey/Compliance Tabs */}
            <div className="mb-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setSurveysTab('survey')}
                    className={`${
                      surveysTab === 'survey'
                        ? 'border-marine-blue text-marine-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    Survey Reports
                  </button>
                  <button
                    onClick={() => {
                      setSurveysTab('compliance');
                      if (complianceReports.length === 0) {
                        loadComplianceReports();
                      }
                    }}
                    className={`${
                      surveysTab === 'compliance'
                        ? 'border-marine-blue text-marine-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    Compliance Reports
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Survey Reports Tab Content */}
            {surveysTab === 'survey' && (
              <>
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ship Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Ship</label>
                  <select
                    value={surveyShipFilter}
                    onChange={(e) => setSurveyShipFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  >
                    <option value="">All Ships</option>
                    {vessels.map(vessel => (
                      <option key={vessel._id} value={vessel._id}>
                        {vessel.name} ({vessel.vesselId || vessel.imo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Surveyor Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Surveyor</label>
                  <select
                    value={surveySurveyorFilter}
                    onChange={(e) => setSurveySurveyorFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  >
                    <option value="">All Surveyors</option>
                    {surveyors.map(surveyor => (
                      <option key={surveyor._id} value={surveyor._id}>
                        {surveyor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                  <input
                    type="date"
                    value={surveyDateFilter}
                    onChange={(e) => setSurveyDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  />
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={surveySearch}
                    onChange={(e) => setSurveySearch(e.target.value)}
                    placeholder="Search title, type..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveys.filter(survey => {
                      // Ship filter
                      if (surveyShipFilter && survey.vessel?._id !== surveyShipFilter) {
                        return false;
                      }
                      
                      // Surveyor filter
                      if (surveySurveyorFilter && survey.assignedSurveyor?._id !== surveySurveyorFilter) {
                        return false;
                      }
                      
                      // Date filter
                      if (surveyDateFilter) {
                        const surveyDate = new Date(survey.scheduledDate).toISOString().split('T')[0];
                        if (surveyDate !== surveyDateFilter) {
                          return false;
                        }
                      }
                      
                      // Search filter
                      if (surveySearch) {
                        const searchLower = surveySearch.toLowerCase();
                        const titleMatch = survey.title?.toLowerCase().includes(searchLower);
                        const typeMatch = survey.surveyType?.toLowerCase().includes(searchLower);
                        const vesselMatch = survey.vessel?.name?.toLowerCase().includes(searchLower);
                        if (!titleMatch && !typeMatch && !vesselMatch) {
                          return false;
                        }
                      }
                      
                      return true;
                    }).map((survey, index) => (
                      <tr key={survey._id || index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{survey.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                      <div>{survey.vessel?.name || '-'}</div>
                                                      <div className="text-xs text-gray-400">ID: {survey.vessel?.vesselId || survey.vessel?._id}</div>
                                                    </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{survey.surveyType}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(survey.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            survey.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                            survey.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {survey.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSurveyDetailsModal({ open: true, survey })}
                              className="text-marine-blue hover:text-marine-dark text-xs px-2 py-1 border border-marine-blue rounded hover:bg-marine-blue hover:text-white transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {surveys.filter(survey => {
                      // Ship filter
                      if (surveyShipFilter && survey.vessel?._id !== surveyShipFilter) {
                        return false;
                      }
                      
                      // Surveyor filter
                      if (surveySurveyorFilter && survey.assignedSurveyor?._id !== surveySurveyorFilter) {
                        return false;
                      }
                      
                      // Date filter
                      if (surveyDateFilter) {
                        const surveyDate = new Date(survey.scheduledDate).toISOString().split('T')[0];
                        if (surveyDate !== surveyDateFilter) {
                          return false;
                        }
                      }
                      
                      // Search filter
                      if (surveySearch) {
                        const searchLower = surveySearch.toLowerCase();
                        const titleMatch = survey.title?.toLowerCase().includes(searchLower);
                        const typeMatch = survey.surveyType?.toLowerCase().includes(searchLower);
                        const vesselMatch = survey.vessel?.name?.toLowerCase().includes(searchLower);
                        if (!titleMatch && !typeMatch && !vesselMatch) {
                          return false;
                        }
                      }
                      
                      return true;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No surveys found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}
            
            {/* Compliance Reports Tab Content */}
            {surveysTab === 'compliance' && (
              <>
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Ship Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Ship</label>
                      <select
                        value={complianceShipFilter}
                        onChange={(e) => setComplianceShipFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                      >
                        <option value="">All Ships</option>
                        {vessels.map(vessel => (
                          <option key={vessel._id} value={vessel._id}>
                            {vessel.name} ({vessel.vesselId || vessel.imo})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Surveyor Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Surveyor</label>
                      <select
                        value={complianceSurveyorFilter}
                        onChange={(e) => setComplianceSurveyorFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                      >
                        <option value="">All Surveyors</option>
                        {surveyors.map(surveyor => (
                          <option key={surveyor._id} value={surveyor._id}>
                            {surveyor.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <input
                        type="text"
                        value={complianceSearch}
                        onChange={(e) => setComplianceSearch(e.target.value)}
                        placeholder="Search vessel, surveyor..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Compliance Reports Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {complianceLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500">Loading compliance reports...</div>
                  ) : (
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {complianceReports.filter(report => {
                            // Ship filter
                            if (complianceShipFilter && report.vessel?._id !== complianceShipFilter) {
                              return false;
                            }
                            
                            // Surveyor filter
                            if (complianceSurveyorFilter && report.surveyor?._id !== complianceSurveyorFilter) {
                              return false;
                            }
                            
                            // Search filter
                            if (complianceSearch) {
                              const searchLower = complianceSearch.toLowerCase();
                              const vesselMatch = report.vessel?.name?.toLowerCase().includes(searchLower);
                              const surveyorMatch = report.surveyor?.name?.toLowerCase().includes(searchLower);
                              const typeMatch = report.surveyType?.toLowerCase().includes(searchLower);
                              if (!vesselMatch && !surveyorMatch && !typeMatch) {
                                return false;
                              }
                            }
                            
                            return true;
                          }).map((report, index) => {
                            const overallStatus = getOverallComplianceStatus(report.complianceStatus);
                            
                            return (
                              <tr key={report._id || index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  <div>{report.vessel?.name || '-'}</div>
                                  <div className="text-xs text-gray-400">ID: {report.vessel?.vesselId || report.vessel?.imo}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{report.surveyType}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{report.surveyor?.name || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {report.completionDate ? new Date(report.completionDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    overallStatus === 'Compliant' ? 'bg-green-100 text-green-800' :
                                    overallStatus === 'Non-Compliant' ? 'bg-red-100 text-red-800' :
                                    overallStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {overallStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => setComplianceReportModal({ open: true, survey: report })}
                                    className="text-marine-blue hover:text-marine-dark text-xs px-2 py-1 border border-marine-blue rounded hover:bg-marine-blue hover:text-white transition-colors"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {complianceReports.filter(report => {
                            if (complianceShipFilter && report.vessel?._id !== complianceShipFilter) return false;
                            if (complianceSurveyorFilter && report.surveyor?._id !== complianceSurveyorFilter) return false;
                            if (complianceSearch) {
                              const searchLower = complianceSearch.toLowerCase();
                              const vesselMatch = report.vessel?.name?.toLowerCase().includes(searchLower);
                              const surveyorMatch = report.surveyor?.name?.toLowerCase().includes(searchLower);
                              const typeMatch = report.surveyType?.toLowerCase().includes(searchLower);
                              if (!vesselMatch && !surveyorMatch && !typeMatch) return false;
                            }
                            return true;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                                No compliance reports found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>)}
            
            {/* Surveyor Bookings Tab */}
            {activeTab === 'surveyor_bookings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Surveyor Bookings</h3>
                </div>
                
                {/* Active Surveys Table */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Active Surveys</h4>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {surveyorBookings.filter(booking => {
                            const inspectionDate = new Date(booking.inspectionDate);
                            const now = new Date();
                            return inspectionDate <= now && booking.status === 'Accepted';
                          }).map((booking) => (
                            <tr key={booking._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{booking.vessel?.name || booking.vesselName}</div>
                                <div className="text-xs text-gray-400">ID: {booking.vessel?.vesselId || booking.vessel?._id}</div>
                                <div className="text-sm text-gray-500">{booking.shipType}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{booking.surveyor?.name || 'Unassigned'}</div>
                                <div className="text-sm text-gray-500">{booking.surveyor?.email || ''}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.surveyType}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(booking.inspectionDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.location}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              </td>
                            </tr>
                          ))}
                          {surveyorBookings.filter(booking => {
                            const inspectionDate = new Date(booking.inspectionDate);
                            const now = new Date();
                            return inspectionDate <= now && booking.status === 'Accepted';
                          }).length === 0 && (
                            <tr>
                              <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                No active surveys found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {/* Upcoming Surveys Table */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Surveys</h4>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {surveyorBookings.filter(booking => {
                            const inspectionDate = new Date(booking.inspectionDate);
                            const now = new Date();
                            return inspectionDate > now && (booking.status === 'Accepted' || booking.status === 'Pending');
                          }).map((booking) => (
                            <tr key={booking._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{booking.vessel?.name || booking.vesselName}</div>
                                <div className="text-xs text-gray-400">ID: {booking.vessel?.vesselId || booking.vessel?._id}</div>
                                <div className="text-sm text-gray-500">{booking.shipType}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{booking.surveyor?.name || 'Unassigned'}</div>
                                <div className="text-sm text-gray-500">{booking.surveyor?.email || ''}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.surveyType}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(booking.inspectionDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.location}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              </td>
                            </tr>
                          ))}
                          {surveyorBookings.filter(booking => {
                            const inspectionDate = new Date(booking.inspectionDate);
                            const now = new Date();
                            return inspectionDate > now && (booking.status === 'Accepted' || booking.status === 'Pending');
                          }).length === 0 && (
                            <tr>
                              <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                No upcoming surveys found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Maintenance Records</h3>
                  <Link to="/maintenance" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {maintenance.slice(0, 10).map((item, index) => (
                          <tr key={item._id || index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                          <div>{item.vessel?.name || '-'}</div>
                                                          <div className="text-xs text-gray-400">ID: {item.vessel?.vesselId || item.vessel?._id}</div>
                                                        </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.system}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.scheduledDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'Planned' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {maintenance.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No maintenance records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cargo Tab */}
            {activeTab === 'cargo' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Cargo Records</h3>
                  <Link to="/cargo" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cargo.slice(0, 10).map((item, index) => (
                          <tr key={item._id || index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                          <div>{item.vessel?.name || '-'}</div>
                                                          <div className="text-xs text-gray-400">ID: {item.vessel?.vesselId || item.vessel?._id}</div>
                                                        </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {cargo.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No cargo records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
        
        {/* Crew Tab */}
        {activeTab === 'crew' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Crew Members</h3>
              <Link to="/crew" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {crew.slice(0, 10).map((member, index) => (
                      <tr key={member._id || index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{member.position}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                      <div>{member.vessel?.name || '-'}</div>
                                                      <div className="text-xs text-gray-400">ID: {member.vessel?.vesselId || member.vessel?._id}</div>
                                                    </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(member.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.status === 'Active' ? 'bg-green-100 text-green-800' :
                            member.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {crew.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No crew members found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
      </div> {/* Close main tab content div */}
        

      {/* Predictive Maintenance Tab */}
      {activeTab === 'predictive_maintenance' && (
        <div className="space-y-6">
          {/* Vessel Selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                🚢 Select Vessel:
              </label>
              <select
                value={selectedVessel || ''}
                onChange={(e) => {
                  const vesselId = e.target.value;
                  console.log('User selected vessel:', vesselId);
                  setSelectedVessel(vesselId);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              >
                <option value="">-- Select a Vessel --</option>
                {vessels.map((vessel) => (
                  <option key={vessel._id} value={vessel._id}>
                    {vessel.name} ({vessel.imo || 'No IMO'}) - {vessel.vesselType}
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
      
      {/* Vessel Modal (reusing Ship Management form fields) */}
      {showVesselModal && (
        <VesselModal
          vessel={editingVessel}
          onSave={editingVessel ? 
            (data, isMultipart) => handleUpdateVessel(editingVessel._id, data, isMultipart) : 
            (data, isMultipart) => handleAddVessel(data, isMultipart)
          }
          onClose={() => { setShowVesselModal(false); setEditingVessel(null); }}
        />
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

      {/* Survey Report Modal for Ship Finder */}
      {surveyReportModal.open && surveyReportModal.survey && (
        <SurveyDetailsModal
          isOpen={surveyReportModal.open}
          onClose={() => setSurveyReportModal({ open: false, survey: null })}
          survey={surveyReportModal.survey}
        />
      )}

      {/* Compliance Report Modal for Ship Finder */}
      {complianceReportModalShip.open && complianceReportModalShip.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-600 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Compliance Report - {complianceReportModalShip.report.surveyType}
              </h3>
              <button
                onClick={() => setComplianceReportModalShip({ open: false, report: null })}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Compliance Status Overview */}
              <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">Overall Compliance Status</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {complianceReportModalShip.report.overallCompliance || 'Pending'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Submission Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {complianceReportModalShip.report.complianceSubmittedAt 
                        ? new Date(complianceReportModalShip.report.complianceSubmittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
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
          </div>
        </div>
      )}

      {/* Certificate PDF Viewer Modal */}
      {certificateDetailModal.open && certificateDetailModal.certificate && (
        <CertificatePdfViewer
          certificate={certificateDetailModal.certificate}
          onClose={() => setCertificateDetailModal({ open: false, certificate: null })}
        />
      )}
    </DashboardLayout>
  );
}

// Inline ShipModal copied to match ShipManagementDashboard fields/validation
function VesselModal({ vessel, onSave, onClose }) {
  const [formData, setFormData] = useState({
    // Ship details
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
    },
    shipManagement: vessel?.shipManagement?._id || vessel?.shipManagement || null
  });

  // File upload states
  const [photos, setPhotos] = useState([]); // For storing new photos
  const [videos, setVideos] = useState([]); // For storing new videos
  const [existingMedia, setExistingMedia] = useState([]); // For existing media from vessel
  const [mediaToDelete, setMediaToDelete] = useState([]); // Track media marked for deletion

  // Get ship companies for assignment dropdown
  const [shipCompanies, setShipCompanies] = useState([]);

  // Load existing media when editing
  useEffect(() => {
    if (vessel && vessel.media && Array.isArray(vessel.media)) {
      setExistingMedia(vessel.media);
    } else {
      setExistingMedia([]);
    }
    setMediaToDelete([]);
  }, [vessel]);

  useEffect(() => {
    const fetchShipCompanies = async () => {
      try {
        const res = await axios.get('/api/users/ship-companies');
        setShipCompanies(res.data);
      } catch (err) {
        console.error('Error fetching ship companies:', err);
      }
    };
    fetchShipCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested dimensions object
    if (name.startsWith('dimensions.')) {
      const dimensionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'photos') {
      setPhotos(prev => [...prev, ...files]);
    } else if (type === 'videos') {
      setVideos(prev => [...prev, ...files]);
    }
  };

  // Remove new photo
  const removeNewPhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Remove new video
  const removeNewVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing media
  const removeExistingMedia = (mediaId) => {
    setMediaToDelete(prev => [...prev, mediaId]);
    setExistingMedia(prev => prev.filter(m => m._id !== mediaId));
  };

  const handleModalClose = () => {
    // Reset file inputs
    setPhotos([]);
    setVideos([]);
    setExistingMedia([]);
    setMediaToDelete([]);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Prepare vessel data object excluding vesselId when creating new vessel
      const vesselData = {};
      Object.keys(formData).forEach(key => {
        if (key !== 'dimensions' && key !== 'vesselId') {
          // Don't include vesselId when creating new vessel
          vesselData[key] = formData[key];
        } else if (key === 'dimensions') {
          vesselData[key] = formData[key];
        } else if (key === 'vesselId' && vessel) {
          // Only include vesselId when editing existing vessel
          vesselData[key] = formData[key];
        }
      });
      
      // Append the vessel data as a JSON string
      formDataToSend.append('vesselData', JSON.stringify(vesselData));
      
      // Append files
      photos.forEach(photo => {
        formDataToSend.append('media', photo);
      });
      
      videos.forEach(video => {
        formDataToSend.append('media', video);
      });
      
      // Add media to delete if we're editing an existing vessel
      if (mediaToDelete.length > 0 && vessel) {
        formDataToSend.append('mediaToDelete', JSON.stringify(mediaToDelete));
      }
      
      // Call onSave with formData and isMultipart flag
      await onSave(formDataToSend, true);
      
      // Reset file inputs
      setPhotos([]);
      setVideos([]);
      setExistingMedia([]);
      setMediaToDelete([]);
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={handleModalClose}
          ></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {vessel ? 'Edit Ship' : 'Add New Ship'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Ship Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ship Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    />
                  </div>

                  {/* IMO Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IMO Number</label>
                    <input
                      type="text"
                      name="imo"
                      value={formData.imo}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    />
                  </div>

                  {/* Ship Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ship Type *</label>
                    <select
                      name="vesselType"
                      value={formData.vesselType}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    >
                      <option value="Bulk Carrier">Bulk Carrier</option>
                      <option value="Container Ship">Container Ship</option>
                      <option value="Tanker">Tanker</option>
                      <option value="Passenger Ship">Passenger Ship</option>
                      <option value="Fishing Vessel">Fishing Vessel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Flag */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Flag</label>
                    <input
                      type="text"
                      name="flag"
                      value={formData.flag}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    />
                  </div>

                  {/* Year Built */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year Built</label>
                    <input
                      type="number"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    />
                  </div>

                  {/* Gross Tonnage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gross Tonnage</label>
                    <input
                      type="number"
                      name="grossTonnage"
                      value={formData.grossTonnage}
                      onChange={handleChange}
                      min="1"
                      required
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                      <input
                        type="number"
                        name="dimensions.length"
                        value={formData.dimensions.length}
                        onChange={handleChange}
                        min="1"
                        step="0.1"
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Beam (m)</label>
                      <input
                        type="number"
                        name="dimensions.beam"
                        value={formData.dimensions.beam}
                        onChange={handleChange}
                        min="1"
                        step="0.1"
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Draft (m)</label>
                      <input
                        type="number"
                        name="dimensions.draft"
                        value={formData.dimensions.draft}
                        onChange={handleChange}
                        min="1"
                        step="0.1"
                        className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Media Uploads */}
                  <div className="space-y-4">
                    {/* Existing Media - Show when editing */}
                    {vessel && existingMedia.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Existing Media ({existingMedia.length})
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {existingMedia.map((media, index) => (
                            <div key={media._id || index} className="relative group">
                              {media.mimeType?.startsWith('image/') || media.type === 'photo' ? (
                                <img
                                  src={media.url}
                                  alt={media.fileName || `Media ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-md border border-gray-300"
                                />
                              ) : media.mimeType?.startsWith('video/') || media.type === 'video' ? (
                                <div className="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center border border-gray-300">
                                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeExistingMedia(media._id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete media"
                              >
                                ×
                              </button>
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {media.fileName || `Media ${index + 1}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Add New Photos</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'photos')}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-marine-blue file:text-white hover:file:bg-marine-dark"
                      />
                      {photos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-2">
                            Selected {photos.length} new photo(s)
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {photos.map((photo, index) => (
                              <div key={index} className="relative group">
                                <div className="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center border border-gray-300">
                                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeNewPhoto(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove photo"
                                >
                                  ×
                                </button>
                                <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* New Video Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Add New Videos</label>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'videos')}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-marine-blue file:text-white hover:file:bg-marine-dark"
                      />
                      {videos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-2">
                            Selected {videos.length} new video(s)
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {videos.map((video, index) => (
                              <div key={index} className="relative group">
                                <div className="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center border border-gray-300">
                                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeNewVideo(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove video"
                                >
                                  ×
                                </button>
                                <p className="text-xs text-gray-600 mt-1 truncate">{video.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ship Management assignment */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Ship Management Company (optional)</label>
                    <select
                      name="shipManagement"
                      value={formData.shipManagement}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300"
                    >
                      <option value="">-- None --</option>
                      {shipCompanies.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Assign a ship management company to enable service requests routing.</p>
                  </div> */}

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-300">
                    <button type="button" onClick={handleModalClose} className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue transition-colors">{vessel ? 'Update Ship' : 'Add Ship'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
