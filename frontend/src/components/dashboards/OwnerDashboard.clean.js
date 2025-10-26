import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [vessels, setVessels] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [crew, setCrew] = useState([]);
  const [cargo, setCargo] = useState([]);
  const [surveyorBookings, setSurveyorBookings] = useState([]);
  const [cargoManagerBookings, setCargoManagerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get owner's vessels
        const vesselsRes = await axios.get('/api/vessels');
        setVessels(vesselsRes.data);
        setError(null);
        
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
        setSurveyorBookings(surveyorBookingsRes.data);
        
        // Load cargo manager bookings for owner's vessels
        const cargoManagerBookingsRes = await axios.get('/api/owner-bookings/cargo');
        setCargoManagerBookings(cargoManagerBookingsRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
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
    { id: 'service_requests', label: 'Service Requests', icon: <FaTools className="mr-2" /> }
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
      
      setError(errorMsg);
      
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
      setError('Failed to update vessel');
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
      setError(msg);
      setTimeout(() => setError(null), 5000);
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
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaShip className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">My Ships</p>
            <p className="text-xl font-bold">{stats.totalVessels}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <FaClipboardCheck className="text-amber-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Surveys</p>
            <p className="text-xl font-bold">{stats.activeSurveys}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FaExclamationTriangle className="text-red-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Expiring Certs</p>
            <p className="text-xl font-bold">{stats.expiringCertificates}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaBoxes className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cargo In Transit</p>
            <p className="text-xl font-bold">{stats.cargoInTransit}</p>
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

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${activeTab === tab.id
                  ? 'border-marine-blue text-marine-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
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

      {/* Tab Content */}
      <div className="mb-6">
        {/* Service Requests Tab */}
        {activeTab === 'service_requests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Service Requests</h3>
              <div className="flex items-center space-x-2">
                <button onClick={() => setShowServiceRequestModal(true)} className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Service Request
                </button>
                <button
                  onClick={async () => {
                    try {
                      const r = await axios.get('/api/service-requests');
                      setServiceRequests(r.data?.requests || []);
                    } catch (e) {
                      console.error(e);
                      setError('Failed to refresh service requests');
                    }
                  }}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SHIP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.vessel?.name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.shipCompany?.name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(r.updatedAt).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditServiceRequest(r)}
                              className="text-marine-blue hover:text-marine-dark text-xs px-2 py-1 border border-marine-blue rounded hover:bg-marine-blue hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteServiceRequest(r._id)}
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {serviceRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No service requests yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Surveys */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Surveys</h3>
                  <Link to="/surveys" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
                </div>
                
                {surveys.filter(s => s.status === 'Scheduled').slice(0, 3).map((survey, index) => (
                  <div key={survey._id || index} className="mb-4 last:mb-0 cursor-pointer hover:bg-gray-50 rounded-md p-2"
                       onClick={() => setDetailsModal({ open: true, survey })}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="rounded-full bg-amber-100 p-2 mr-3">
                          <FaCalendarAlt className="text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{survey.title}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(survey.scheduledDate).toLocaleDateString()} • {survey.surveyType}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {survey.status}
                      </span>
                    </div>
                  </div>
                ))}
                
                {surveys.filter(s => s.status === 'Scheduled').length === 0 && (
                  <p className="text-sm text-gray-500 italic">No upcoming surveys scheduled</p>
                )}
              </div>
              
              {/* Critical Maintenance */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Critical Maintenance</h3>
                  <Link to="/maintenance" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
                </div>
                
                {maintenance.filter(m => m.priority === 'Critical').slice(0, 3).map((item, index) => (
                  <div key={item._id || index} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="rounded-full bg-red-100 p-2 mr-3">
                          <FaTools className="text-red-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(item.scheduledDate).toLocaleDateString()} • {item.system}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
                
                {maintenance.filter(m => m.priority === 'Critical').length === 0 && (
                  <p className="text-sm text-gray-500 italic">No critical maintenance items</p>
                )}
              </div>
            </div>
            
            {/* Expiring Certificates */}
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Expiring Certificates</h3>
                <Link to="/vessels" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                          <tr key={`${vessel._id}-${certIndex}`}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{vessel.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{cert.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {expiryDate.toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{diffDays}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Expiring Soon
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
                  <p className="text-sm text-gray-500 italic py-4">No certificates expiring soon</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Vessels Tab */}
        {activeTab === 'vessels' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">My Ships</h3>
              <button onClick={() => { setEditingVessel(null); setShowVesselModal(true); }} className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add New Ship
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vessels.map((vessel, index) => (
                <div key={vessel._id || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{vessel.name}</h4>
                        <p className="text-sm text-gray-500">{vessel.imo}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {vessel.vesselType}
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Flag:</span>
                        <span className="text-sm font-medium">{vessel.flag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Year Built:</span>
                        <span className="text-sm font-medium">{vessel.yearBuilt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Gross Tonnage:</span>
                        <span className="text-sm font-medium">{vessel.grossTonnage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Next Drydock:</span>
                        <span className="text-sm font-medium">
                          {vessel.nextDrydock ? new Date(vessel.nextDrydock).toLocaleDateString() : 'Not scheduled'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Media Preview Section */}
                    {vessel.media && vessel.media.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Media ({vessel.media.length})</h5>
                        <div className="grid grid-cols-3 gap-1">
                          {vessel.media.slice(0, 3).map((media, mediaIndex) => (
                            <div key={mediaIndex} className="relative">
                              {media.type === 'photo' ? (
                                <img 
                                  src={media.url} 
                                  alt={`Vessel media ${mediaIndex + 1}`}
                                  className="w-full h-16 object-cover rounded"
                                />
                              ) : media.type === 'certificate' ? (
                                <div className="w-full h-16 bg-red-100 rounded flex items-center justify-center">
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          ))}
                          {vessel.media.length > 3 && (
                            <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-500">+{vessel.media.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-3 flex justify-between">
                    <button 
                      onClick={() => { setEditingVessel(vessel); setShowVesselModal(true); }}
                      className="text-marine-blue hover:text-marine-dark text-sm font-medium transition duration-200"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this vessel?')) {
                          try {
                            await axios.delete(`/api/vessels/${vessel._id}`);
                            setVessels(prev => prev.filter(v => v._id !== vessel._id));
                          } catch (err) {
                            console.error('Error deleting vessel:', err);
                            setError('Failed to delete vessel');
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {vessels.length === 0 && (
                <div className="col-span-full bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FaShip className="text-gray-400 text-4xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ships found</h3>
                  <p className="text-gray-500 mb-6">Get started by adding your first ship</p>
                  <button onClick={() => { setEditingVessel(null); setShowVesselModal(true); }} className="bg-marine-blue hover:bg-marine-dark text-white px-6 py-3 rounded-lg text-sm font-medium transition duration-200 shadow-md inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add New Ship
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Surveys Tab */}
        {activeTab === 'surveys' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Surveys</h3>
              <Link to="/surveys" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
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
                    {surveys.map((survey, index) => (
                      <tr key={survey._id || index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{survey.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{survey.vessel?.name || '-'}</td>
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
                              onClick={() => setDetailsModal({ open: true, survey })}
                              className="text-marine-blue hover:text-marine-dark text-xs px-2 py-1 border border-marine-blue rounded hover:bg-marine-blue hover:text-white transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {surveys.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No surveys found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
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
                <div className="overflow-x-auto">
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
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingModalType('surveyor');
                                setBookingModalOpen(true);
                              }}
                              className="text-marine-blue hover:text-marine-dark"
                            >
                              View Details
                            </button>
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
                <div className="overflow-x-auto">
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
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingModalType('surveyor');
                                setBookingModalOpen(true);
                              }}
                              className="text-marine-blue hover:text-marine-dark"
                            >
                              View Details
                            </button>
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
        
        {/* Cargo Manager Bookings Tab */}
        {activeTab === 'cargo_manager_bookings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cargo Manager Bookings</h3>
            </div>
            
            {/* Active Cargo Shipments Table */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Active Cargo Shipments</h4>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Manager</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ports</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cargoManagerBookings.filter(booking => {
                        const voyageDate = new Date(booking.voyageDate);
                        const now = new Date();
                        return voyageDate <= now && booking.status === 'Accepted';
                      }).map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.vessel?.name || booking.vesselName}</div>
                            <div className="text-sm text-gray-500">{booking.shipType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.cargoManager?.name || 'Unassigned'}</div>
                            <div className="text-sm text-gray-500">{booking.cargoManager?.email || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.cargoType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.voyageDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.departurePort} → {booking.destinationPort}
                          </td>
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
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingModalType('cargo');
                                setBookingModalOpen(true);
                              }}
                              className="text-marine-blue hover:text-marine-dark"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {cargoManagerBookings.filter(booking => {
                        const voyageDate = new Date(booking.voyageDate);
                        const now = new Date();
                        return voyageDate <= now && booking.status === 'Accepted';
                      }).length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                            No active cargo shipments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Upcoming Cargo Shipments Table */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Cargo Shipments</h4>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Manager</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ports</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cargoManagerBookings.filter(booking => {
                        const voyageDate = new Date(booking.voyageDate);
                        const now = new Date();
                        return voyageDate > now && (booking.status === 'Accepted' || booking.status === 'Pending');
                      }).map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.vessel?.name || booking.vesselName}</div>
                            <div className="text-sm text-gray-500">{booking.shipType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.cargoManager?.name || 'Unassigned'}</div>
                            <div className="text-sm text-gray-500">{booking.cargoManager?.email || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.cargoType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.voyageDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.departurePort} → {booking.destinationPort}
                          </td>
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
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingModalType('cargo');
                                setBookingModalOpen(true);
                              }}
                              className="text-marine-blue hover:text-marine-dark"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {cargoManagerBookings.filter(booking => {
                        const voyageDate = new Date(booking.voyageDate);
                        const now = new Date();
                        return voyageDate > now && (booking.status === 'Accepted' || booking.status === 'Pending');
                      }).length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                            No upcoming cargo shipments found
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
              <div className="overflow-x-auto">
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.vessel?.name || '-'}</td>
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{member.vessel?.name || '-'}</td>
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
        
        {/* Cargo Tab */}
        {activeTab === 'cargo' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cargo Records</h3>
              <Link to="/cargo" className="text-sm text-marine-blue hover:text-marine-dark font-medium">View All</Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.vessel?.name || '-'}</td>
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
      </div>
      
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
  const [photos, setPhotos] = useState([]); // For storing photo previews
  const [videos, setVideos] = useState([]); // For storing video previews

  // Get ship companies for assignment dropdown
  const [shipCompanies, setShipCompanies] = useState([]);

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
      setPhotos(files);
    } else if (type === 'videos') {
      setVideos(files);
    }
  };

  const handleModalClose = () => {
    // Reset file inputs
    setPhotos([]);
    setVideos([]);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'dimensions') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append dimensions as JSON string
      formDataToSend.append('dimensions', JSON.stringify(formData.dimensions));
      
      // Append files
      photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });
      
      videos.forEach(video => {
        formDataToSend.append('videos', video);
      });
      
      // Call onSave with formData and isMultipart flag
      await onSave(formDataToSend, true);
      
      // Reset file inputs
      setPhotos([]);
      setVideos([]);
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Photos</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'photos')}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-marine-blue file:text-white hover:file:bg-marine-dark"
                      />
                      {photos.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          Selected {photos.length} photo(s)
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Videos</label>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'videos')}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-marine-blue file:text-white hover:file:bg-marine-dark"
                      />
                      {videos.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          Selected {videos.length} video(s)
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