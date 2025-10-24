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
    { id: 'maintenance', label: 'Maintenance', icon: <FaTools className="mr-2" /> },
    { id: 'crew', label: 'Crew', icon: <FaUsers className="mr-2" /> },
    { id: 'cargo', label: 'Cargo', icon: <FaBoxes className="mr-2" /> },
    { id: 'service_requests', label: 'Service Requests', icon: <FaTools className="mr-2" /> }
  ];

  const handleAddVessel = async (vesselData) => {
    try {
      const res = await axios.post('/api/vessels', vesselData);
      setVessels(prev => [res.data, ...prev]);
      setShowVesselModal(false);
      setEditingVessel(null);
      setSuccessMessage(`Vessel "${vesselData.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error adding vessel:', err);
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Failed to add vessel';
      setError(msg);
    }
  };

  const handleUpdateVessel = async (id, vesselData) => {
    try {
      const res = await axios.put(`/api/vessels/${id}`, vesselData);
      setVessels(prev => prev.map(v => v._id === id ? res.data : v));
      setShowVesselModal(false);
      setEditingVessel(null);
      setSuccessMessage(`Vessel "${vesselData.name}" updated successfully!`);
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
              <h3 className="text-xl font-semibold text-gray-900">Survey Management</h3>
              <button className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Request New Survey
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveys.map((survey, index) => (
                      <tr key={survey._id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{survey.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {vessels.find(v => v._id === survey.vessel)?.name || 'Unknown Ship'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{survey.surveyType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{survey.surveyor?.name || 'Unassigned'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(survey.scheduledDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            survey.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            survey.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            survey.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => setDetailsModal({ open: true, survey })} className="text-marine-blue hover:text-marine-dark mr-3">View</button>
                          {survey.status === 'Completed' && (
                            <button className="text-green-600 hover:text-green-800">Report</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {surveys.length === 0 && (
                  <div className="text-center py-12">
                    <FaClipboardCheck className="mx-auto text-gray-400 text-4xl mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
                    <p className="text-gray-500">Request your first survey to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Maintenance Schedule</h3>
              <button className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Maintenance Task
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {maintenance.map((item, index) => (
                      <tr key={item._id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {vessels.find(v => v._id === item.vessel)?.name || 'Unknown Ship'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.system}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.maintenanceType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(item.scheduledDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            item.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Planned' ? 'bg-amber-100 text-amber-800' :
                            item.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-marine-blue hover:text-marine-dark mr-3">View</button>
                          <button className="text-marine-blue hover:text-marine-dark">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {maintenance.length === 0 && (
                  <div className="text-center py-12">
                    <FaTools className="mx-auto text-gray-400 text-4xl mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance tasks found</h3>
                    <p className="text-gray-500">Add your first maintenance task to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Crew Tab */}
        {activeTab === 'crew' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Crew Management</h3>
              <button className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Crew Member
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crew.map((member, index) => (
                <div key={member._id || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-marine-blue to-marine-light rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-semibold text-lg">
                          {member.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-500">{member.position}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Vessel:</span>
                        <span className="text-sm font-medium">
                          {vessels.find(v => v._id === member.vessel)?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Nationality:</span>
                        <span className="text-sm font-medium">{member.nationality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`text-sm font-medium ${
                          member.status === 'Active' ? 'text-green-600' :
                          member.status === 'On Leave' ? 'text-amber-600' :
                          'text-gray-600'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Contract End:</span>
                        <span className="text-sm font-medium">
                          {member.contractInformation?.endDate ? 
                            new Date(member.contractInformation.endDate).toLocaleDateString() : 
                            'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-3 flex justify-between">
                    <button className="text-marine-blue hover:text-marine-dark text-sm font-medium transition duration-200">
                      View Profile
                    </button>
                    <button className="text-marine-blue hover:text-marine-dark text-sm font-medium transition duration-200">
                      Documents
                    </button>
                  </div>
                </div>
              ))}
              
              {crew.length === 0 && (
                <div className="col-span-full bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FaUsers className="text-gray-400 text-4xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No crew members found</h3>
                  <p className="text-gray-500 mb-6">Add your first crew member to get started</p>
                  <button className="bg-marine-blue hover:bg-marine-dark text-white px-6 py-3 rounded-lg text-sm font-medium transition duration-200 shadow-md inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Crew Member
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Cargo Tab */}
        {activeTab === 'cargo' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cargo Shipments</h3>
              <button className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Cargo Shipment
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cargo.map((item, index) => (
                      <tr key={item._id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.reference}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {vessels.find(v => v._id === item.vessel)?.name || 'Unknown Ship'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.cargoType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.quantity?.value} {item.quantity?.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.voyage?.departureDate ? 
                              new Date(item.voyage.departureDate).toLocaleDateString() : 
                              'Not scheduled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.voyage?.estimatedArrivalDate ? 
                              new Date(item.voyage.estimatedArrivalDate).toLocaleDateString() : 
                              'Not scheduled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            item.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Booked' ? 'bg-amber-100 text-amber-800' :
                            item.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-marine-blue hover:text-marine-dark mr-3">View</button>
                          <button className="text-marine-blue hover:text-marine-dark">Documents</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {cargo.length === 0 && (
                  <div className="text-center py-12">
                    <FaBoxes className="mx-auto text-gray-400 text-4xl mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cargo shipments found</h3>
                    <p className="text-gray-500">Add your first cargo shipment to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vessel Modal (reusing Ship Management form fields) */}
      {showVesselModal && (
        <VesselModal
          vessel={editingVessel}
          onSave={editingVessel ? (data) => handleUpdateVessel(editingVessel._id, data) : handleAddVessel}
          onClose={() => { setShowVesselModal(false); setEditingVessel(null); }}
        />
      )}
    </DashboardLayout>
  );
}

// Inline ShipModal copied to match ShipManagementDashboard fields/validation
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
    },
    shipManagement: vessel?.shipManagement?._id || vessel?.shipManagement || ''
  });

  const [shipCompanies, setShipCompanies] = useState([]);
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await axios.get('/api/users');
        const companies = (res.data?.users || res.data || []).filter(u => u.role === 'ship_management');
        setShipCompanies(companies);
      } catch (e) {
        // ignore
      }
    };
    loadCompanies();
  }, []);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const vesselTypes = [
    'Bulk Carrier',
    'Container Ship', 
    'Tanker',
    'Passenger Ship',
    'Fishing Boat',
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
    const allTouched = {};
    Object.keys(formData).forEach(key => { if (key !== 'dimensions') allTouched[key] = true; });
    setTouched(allTouched);
    const isValid = Object.keys(formData).every(key => key === 'dimensions' || validateField(key, formData[key]));
    if (isValid) onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {vessel ? 'Edit Ship' : 'Add New Ship'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ship Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${touched.name && errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`} />
                {touched.name && errors.name && (<p className="mt-1 text-sm text-red-600">{errors.name}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IMO Number *</label>
                <input type="text" name="imo" value={formData.imo} onChange={handleChange} onBlur={handleBlur} placeholder="IMO 1234567" required className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${touched.imo && errors.imo ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`} />
                {touched.imo && errors.imo && (<p className="mt-1 text-sm text-red-600">{errors.imo}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ship Type *</label>
                <select name="vesselType" value={formData.vesselType} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${touched.vesselType && errors.vesselType ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}>
                  {vesselTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                </select>
                {touched.vesselType && errors.vesselType && (<p className="mt-1 text-sm text-red-600">{errors.vesselType}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Flag Country *</label>
                <input type="text" name="flag" value={formData.flag} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${touched.flag && errors.flag ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`} />
                {touched.flag && errors.flag && (<p className="mt-1 text-sm text-red-600">{errors.flag}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year Built *</label>
                <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} onBlur={handleBlur} min="1900" max={new Date().getFullYear()} required className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${touched.yearBuilt && errors.yearBuilt ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`} />
                {touched.yearBuilt && errors.yearBuilt && (<p className="mt-1 text-sm text-red-600">{errors.yearBuilt}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gross Tonnage *</label>
                <input type="number" name="grossTonnage" value={formData.grossTonnage} onChange={handleChange} onBlur={handleBlur} min="1" required className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${touched.grossTonnage && errors.grossTonnage ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`} />
                {touched.grossTonnage && errors.grossTonnage && (<p className="mt-1 text-sm text-red-600">{errors.grossTonnage}</p>)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                <input type="number" name="length" value={formData.dimensions.length} onChange={handleDimensionChange} className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Beam (m)</label>
                <input type="number" name="beam" value={formData.dimensions.beam} onChange={handleDimensionChange} className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Draft (m)</label>
                <input type="number" name="draft" value={formData.dimensions.draft} onChange={handleDimensionChange} className="mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue border-gray-300" />
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

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue">Cancel</button>
              <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue hover:bg-marine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue">{vessel ? 'Update Ship' : 'Add Ship'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}