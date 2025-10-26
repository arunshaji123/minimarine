import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import UserProfileModal from '../UserProfileModal.jsx';
import CargoFormModal from '../modals/CargoFormModal';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';

export default function CargoManagerDashboard() {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [activeCargo, setActiveCargo] = useState([]);
  const [cargoDocuments, setCargoDocuments] = useState([]);
  const [cargoAlerts, setCargoAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  const [vessels, setVessels] = useState([]);
  const [vesselsLoading, setVesselsLoading] = useState(false);
  
  // Booking state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ open: false, booking: null });
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const { counts } = useUnreadCounts();
  const [shipMgmtUserId, setShipMgmtUserId] = useState(null);
  const [shipMgmtUsers, setShipMgmtUsers] = useState([]);
  
  // Cargo form modal state
  const [cargoFormModal, setCargoFormModal] = useState({ open: false, cargo: null });
  
  const handleStartCargo = (cargo) => {
    setCargoFormModal({ open: true, cargo });
  };
  
  // Navigation state
  const [activeSection, setActiveSection] = useState('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/messages/users', { params: { role: 'ship_management' } });
        const users = res.data.users || [];
        setShipMgmtUsers(users);
      } catch (e) {}
    })();
  }, []);

  // Choose target ship user: prefer last partner for this user, then unread sender, else first ship user
  useEffect(() => {
    const currentUserId = (user && (user.id || user._id)) ? String(user.id || user._id) : null;
    let lastPartner = null;
    if (currentUserId) {
      try {
        lastPartner = localStorage.getItem(`lastChatPartner:${currentUserId}`);
      } catch (_) {}
    }
    if (lastPartner) {
      setShipMgmtUserId(lastPartner);
      return;
    }
    const unreadSenderIds = Object.keys(counts || {});
    if (unreadSenderIds.length > 0) {
      setShipMgmtUserId(unreadSenderIds[0]);
      return;
    }
    if (shipMgmtUsers.length > 0) {
      setShipMgmtUserId(shipMgmtUsers[0]._id);
    }
  }, [counts, shipMgmtUsers, user]);

  // Load data on component mount
  useEffect(() => {
    loadCargoData();
    loadVessels();
    loadBookings();
  }, []);

  // Reload vessels when modal opens
  useEffect(() => {
    if (showAddModal || editingCargo) {
      loadVessels();
    }
  }, [showAddModal, editingCargo]);

  const loadCargoData = async () => {
    try {
      setLoading(true);
      console.log('Loading cargo shipments from cargooshipment collection...');
      const response = await axios.get('/api/cargo');
      console.log('Cargo shipments loaded:', response.data.length, 'shipments');
      console.log('Cargo shipments data:', JSON.stringify(response.data, null, 2));
      setActiveCargo(response.data);
      
      // Extract documents from cargo data
      const allDocuments = [];
      response.data.forEach(cargo => {
        if (cargo.documents && cargo.documents.length > 0) {
          cargo.documents.forEach(doc => {
            allDocuments.push({
              ...doc,
              cargoRef: cargo.reference,
              id: doc._id || Math.random().toString(36).substr(2, 9)
            });
          });
        }
      });
      setCargoDocuments(allDocuments);
      
      // Generate alerts based on cargo status
      const alerts = [];
      response.data.forEach(cargo => {
        if (cargo.status === 'Delayed') {
          alerts.push({
            id: `alert-${cargo._id}`,
            cargoRef: cargo.reference,
            alertType: 'Delay',
            severity: 'High',
            message: `Cargo ${cargo.reference} is experiencing delays`,
            date: new Date().toISOString().split('T')[0]
          });
        }
        if (cargo.voyage?.estimatedArrivalDate && new Date(cargo.voyage.estimatedArrivalDate) < new Date()) {
          alerts.push({
            id: `alert-eta-${cargo._id}`,
            cargoRef: cargo.reference,
            alertType: 'Overdue',
            severity: 'Medium',
            message: `Cargo ${cargo.reference} is overdue for arrival`,
            date: new Date().toISOString().split('T')[0]
          });
        }
      });
      setCargoAlerts(alerts);
      
    } catch (err) {
      console.error('Error loading cargo data:', err);
      setError('Failed to load cargo data');
    } finally {
      setLoading(false);
    }
  };

  const loadVessels = async () => {
    try {
      setVesselsLoading(true);
      console.log('Loading vessels...');
      const response = await axios.get('/api/vessels');
      console.log('Vessels loaded:', response.data);
      setVessels(response.data);
    } catch (err) {
      console.error('Error loading vessels:', err);
      setError('Failed to load vessels');
    } finally {
      setVesselsLoading(false);
    }
  };

  const handleAddCargo = async (cargoData) => {
    try {
      console.log('handleAddCargo called with data:', cargoData);
      console.log('Data structure check:');
      console.log('- reference:', cargoData.reference);
      console.log('- description:', cargoData.description);
      console.log('- cargoType:', cargoData.cargoType);
      console.log('- vessel:', cargoData.vessel);
      console.log('- voyage:', cargoData.voyage);
      console.log('- shipper:', cargoData.shipper);
      console.log('- consignee:', cargoData.consignee);
      console.log('Submitting cargo shipment data to /api/shipments...');
      
      // Add authentication headers if needed
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post('/api/cargo', cargoData, config);

      console.log('Cargo shipment created successfully:', response.data);
      
      // Add the new shipment to the state
      setActiveCargo(prev => {
        const newShipments = [response.data, ...prev];
        console.log('Updated cargo shipments list:', newShipments.length, 'shipments');
        return newShipments;
      });
      
      setShowAddModal(false);
      setError(null); // Clear any previous errors
      
      // Show success message
      const successMessage = `Cargo shipment "${cargoData.reference}" created successfully and added to cargooshipment collection!`;
      alert(successMessage); // You can replace this with a proper notification component
      
    } catch (err) {
      console.error('Error adding shipment:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        const errorData = err.response.data;
        let errorMessage = 'Failed to add cargo shipment: ';
        
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
        setError('Failed to add cargo shipment: Network error');
      }
    }
  };

  const handleUpdateCargo = async (id, cargoData) => {
    try {
      // Add authentication headers if needed
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.put(`/cargo/${id}`, cargoData, config);
      setActiveCargo(prev => prev.map(cargo => 
        cargo._id === id ? response.data : cargo
      ));
      setEditingCargo(null);
    } catch (err) {
      console.error('Error updating shipment:', err);
      setError('Failed to update shipment');
    }
  };

  const handleDeleteCargo = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        // Add authentication headers if needed
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        await axios.delete(`/cargo/${id}`, config);
        setActiveCargo(prev => prev.filter(cargo => cargo._id !== id));
      } catch (err) {
        console.error('Error deleting shipment:', err);
        setError('Failed to delete shipment');
      }
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      console.log('Loading cargo manager bookings...');
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('/api/cargo-manager-bookings', config);
      setBookings(response.data);
      
      console.log('Cargo manager bookings loaded:', response.data.length, 'bookings');
      console.log('Bookings data:', JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('Error loading bookings:', err);
      setBookingError('Failed to load booking data');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.put(`/cargo-manager-bookings/${bookingId}/accept`, {}, config);
      setBookingSuccessMessage('Booking accepted successfully!');
      loadBookings(); // Reload bookings
      
      // Clear success message after 3 seconds
      setTimeout(() => setBookingSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error accepting booking:', err);
      setBookingError('Failed to accept booking');
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.put(`/cargo-manager-bookings/${bookingId}/decline`, {}, config);
      setBookingSuccessMessage('Booking declined successfully!');
      loadBookings(); // Reload bookings
      
      // Clear success message after 3 seconds
      setTimeout(() => setBookingSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error declining booking:', err);
      setBookingError('Failed to decline booking');
    }
  };

  const handleShowBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Countdown Timer Component
  const CountdownTimer = ({ voyageDate, voyageTime }) => {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
      const calculateTimeRemaining = () => {
        if (!voyageDate) {
          setTimeRemaining('No date set');
          return;
        }

        try {
          // Parse the date - handle both ISO format and other formats
          let voyageDateTime;
          
          if (voyageTime) {
            // Combine date and time
            const dateStr = new Date(voyageDate).toISOString().split('T')[0]; // Get YYYY-MM-DD
            const timeStr = voyageTime.trim();
            
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
            
            voyageDateTime = new Date(dateStr);
            voyageDateTime.setHours(hours, minutes, 0, 0);
          } else {
            // No time specified, use start of day
            voyageDateTime = new Date(voyageDate);
            voyageDateTime.setHours(0, 0, 0, 0);
          }

          const now = new Date();
          const diff = voyageDateTime - now;

          if (diff <= 0) {
            setTimeRemaining('Voyage started');
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
    }, [voyageDate, voyageTime]);

    // Color coding based on time remaining
    const getColorClass = () => {
      if (!voyageDate || timeRemaining === 'Voyage started' || timeRemaining === 'Invalid date/time' || timeRemaining === 'No date set') {
        return 'text-gray-500';
      }
      
      try {
        let voyageDateTime;
        
        if (voyageTime) {
          const dateStr = new Date(voyageDate).toISOString().split('T')[0];
          const timeStr = voyageTime.trim();
          
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
          
          voyageDateTime = new Date(dateStr);
          voyageDateTime.setHours(hours, minutes, 0, 0);
        } else {
          voyageDateTime = new Date(voyageDate);
          voyageDateTime.setHours(0, 0, 0, 0);
        }

        const now = new Date();
        const diff = voyageDateTime - now;
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
      icon: '📋',
      description: 'Manage cargo bookings'
    },
    {
      id: 'cargo',
      name: 'Cargos',
      icon: '📦',
      description: 'Current shipments'
    },
    {
      id: 'documents',
      name: 'Documentation',
      icon: '📄',
      description: 'Shipping documents'
    },
    {
      id: 'alerts',
      name: 'Cargo Alerts',
      icon: '🔔',
      description: 'Notifications and warnings'
    }
  ];

  return (
    <DashboardLayout title="Cargo Manager Dashboard" description="Cargo tracking, scheduling, and documentation." onProfileClick={() => setShowProfile(s => !s)} fullWidth={true}>
      <div className="flex h-[calc(100vh-80px)] bg-gray-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-start h-16 px-6 bg-marine-blue">
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200 ml-auto"
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
          <div className="flex-1 overflow-auto p-4">
            {/* Welcome Section */}
            <div className="mb-6 px-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
              <p className="text-gray-600">Cargo tracking, scheduling, and documentation.</p>
            </div>

            {/* Professional Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 px-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Surveys</h3>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">-</span>
                  <span className="ml-2 text-sm text-gray-600">surveys</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">-</span>
                  <span className="ml-2 text-sm text-gray-600">USD</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Surveys</h3>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">-</span>
                  <span className="ml-2 text-sm text-gray-600">surveys</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Client Satisfaction</h3>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">-</span>
                  <span className="ml-2 text-sm text-gray-600">rating</span>
                </div>
              </div>
            </div>

            {/* Dashboard Title */}
            <div className="bg-white rounded-t-xl shadow-lg border border-gray-100 px-6 py-4 mx-2 mb-0">
              <h2 className="text-lg font-semibold text-gray-900">Cargo Manager Dashboard</h2>
            </div>

            {/* Booking Notifications Section */}
            {activeSection === 'bookings' && (
      <div className="space-y-6 mx-2">
        {/* Success/Error Messages */}
        {bookingSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{bookingSuccessMessage}</p>
              </div>
            </div>
          </div>
        )}

        {bookingError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{bookingError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Notifications */}
        <div className="bg-white rounded-lg shadow overflow-hidden" id="booking-notifications-section">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Notifications</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your cargo management bookings and requests</p>
            </div>
            {/* Messages link removed since chat system is disabled */}
          </div>
          <div className="overflow-x-auto">
            {bookingsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marine-blue mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No booking requests found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SHIPS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr 
                      key={booking._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleShowBookingDetails(booking)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-marine-blue flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {booking.vesselName?.charAt(0)?.toUpperCase() || 'V'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{booking.vesselName}</div>
                            <div className="text-sm text-gray-500">{booking.departurePort} → {booking.destinationPort}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(booking.voyageDate)}</div>
                        <div className="text-gray-500">{booking.voyageTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{booking.cargoType}</div>
                        {booking.cargoWeight && (
                          <div className="text-gray-500">{booking.cargoWeight} MT</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.status !== 'Completed' && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                            booking.status === 'Declined' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptBooking(booking._id);
                              }}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md text-xs font-medium"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineBooking(booking._id);
                              }}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-xs font-medium"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
            )}

            {/* Active Cargo Section */}
            {activeSection === 'cargo' && (
              <div className="space-y-6 mx-2">
        {/* Active Cargo Shipments */}
        <div className="bg-white rounded-lg shadow overflow-hidden" id="active-cargo-section">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Active Cargo Shipments</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Currently active and in-progress cargo shipments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (MT)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-marine-blue"></div>
                        <span className="ml-2">Loading active cargos...</span>
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const now = new Date();
                  const activeCargos = bookings.filter(booking => {
                    if (booking.status !== 'Accepted') return false;
                    
                    // Parse voyage date and time
                    const voyageDateTime = new Date(booking.voyageDate);
                    if (booking.voyageTime) {
                      const [time, period] = booking.voyageTime.split(' ');
                      const [hours, minutes] = time.split(':');
                      let hour = parseInt(hours);
                      if (period === 'PM' && hour !== 12) hour += 12;
                      if (period === 'AM' && hour === 12) hour = 0;
                      voyageDateTime.setHours(hour, parseInt(minutes) || 0, 0, 0);
                    }
                    
                    // Active: voyage date/time is today or in the past
                    return voyageDateTime <= now;
                  });
                  
                  return activeCargos.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                        No active cargo shipments found.
                      </td>
                    </tr>
                  ) : (
                    activeCargos.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleShowBookingDetails(booking)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.vesselName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.cargoType || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.departurePort || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.destinationPort || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.voyageDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.voyageTime || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.cargoWeight || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-400 text-sm">No photos</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCargo(booking);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-marine-blue text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Start Cargo
                        </button>
                      </td>
                    </tr>
                  ))
                  );
                })()}
              </tbody>
            </table>
          </div>

        </div>

        {/* Upcoming Cargo Shipments */}
        <div className="bg-white rounded-lg shadow overflow-hidden" id="upcoming-cargo-section">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Cargo Shipments</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Scheduled future cargo shipments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyage Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Until Departure</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (MT)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-marine-blue"></div>
                        <span className="ml-2">Loading upcoming cargos...</span>
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const now = new Date();
                  const upcomingCargos = bookings.filter(booking => {
                    if (booking.status !== 'Accepted') return false;
                    
                    // Parse voyage date and time
                    const voyageDateTime = new Date(booking.voyageDate);
                    if (booking.voyageTime) {
                      const [time, period] = booking.voyageTime.split(' ');
                      const [hours, minutes] = time.split(':');
                      let hour = parseInt(hours);
                      if (period === 'PM' && hour !== 12) hour += 12;
                      if (period === 'AM' && hour === 12) hour = 0;
                      voyageDateTime.setHours(hour, parseInt(minutes) || 0, 0, 0);
                    }
                    
                    // Upcoming: voyage date/time is in the future
                    return voyageDateTime > now;
                  });
                  
                  return upcomingCargos.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                        No upcoming cargo shipments found.
                      </td>
                    </tr>
                  ) : (
                    upcomingCargos.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleShowBookingDetails(booking)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.vesselName || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.cargoType || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.departurePort || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.destinationPort || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(booking.voyageDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.voyageTime || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CountdownTimer voyageDate={booking.voyageDate} voyageTime={booking.voyageTime} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.cargoWeight || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-400 text-sm">No photos</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Upcoming
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

              </div>
            )}

            {/* Documentation Section */}
            {activeSection === 'documents' && (
              <div className="space-y-6 mx-2">
        {/* Cargo Documents */}
        <div className="bg-white rounded-lg shadow overflow-hidden" id="cargo-documents-section">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Cargo Documentation</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Shipping documents and certificates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Reference</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargoDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.cargoRef}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.documentType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(doc.issueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.issuedBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-marine-blue hover:text-marine-dark mr-3">View</button>
                      <button className="text-marine-blue hover:text-marine-dark">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

              </div>
            )}

            {/* Alerts Section */}
            {activeSection === 'alerts' && (
              <div className="space-y-6 mx-2">
        {/* Cargo Alerts */}
        <div className="bg-white rounded-lg shadow overflow-hidden" id="cargo-alerts-section">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Cargo Alerts</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Notifications and warnings for active shipments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Reference</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargoAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{alert.cargoRef}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{alert.alertType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.severity === 'High' ? 'bg-red-100 text-red-800' : alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{alert.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(alert.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-marine-blue hover:text-marine-dark mr-3">Acknowledge</button>
                      <button className="text-marine-blue hover:text-marine-dark">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Cargo Modal */}


      {/* Profile Modal */}
      <UserProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={{
          name: user?.name || 'Cargo Manager',
          email: user?.email || 'manager@example.com',
          role: user?.role || 'cargo_manager',
          status: user?.status || 'active',
        }}
        variant="sidebar"
        title="My Profile"
      />

      {/* Cargo Form Modal */}
      <CargoFormModal
        isOpen={cargoFormModal.open}
        onClose={() => setCargoFormModal({ open: false, cargo: null })}
        cargo={cargoFormModal.cargo}
      />

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Booking Details</h3>
              <button 
                onClick={() => setShowBookingDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ship Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBooking.vesselName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Type</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBooking.cargoType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Port</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBooking.departurePort || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Port</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBooking.destinationPort || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voyage Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate(selectedBooking.voyageDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voyage Time</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBooking.voyageTime || 'N/A'}</p>
                </div>
                {selectedBooking.cargoWeight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Weight</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedBooking.cargoWeight} MT</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedBooking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'Declined' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                </div>
              )}
              
              {selectedBooking.specialRequirements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedBooking.specialRequirements}</p>
                </div>
              )}
              {/* Vessel Media Section */}
              {selectedBooking.vessel?.media && selectedBooking.vessel?.media.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Media Files</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {selectedBooking.vessel.media.map((media, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {media.type === 'photo' ? (
                              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            ) : media.type === 'video' ? (
                              <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBookingDetails(false)}
                className="px-4 py-2 bg-marine-blue text-white rounded-lg hover:bg-marine-dark transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal - Removed as per requirements */}
    </DashboardLayout>
  );
}

// Vessel Selector Component with search functionality
function VesselSelector({ vessels, value, onChange, required, error, touched, loading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredVessels, setFilteredVessels] = useState(vessels);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter vessels based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = vessels.filter(vessel => 
        vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.imo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.vesselType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVessels(filtered);
    } else {
      setFilteredVessels(vessels);
    }
  }, [searchTerm, vessels]);

  const selectedVessel = vessels.find(v => v._id === value);

  const handleSelect = (vessel) => {
    onChange(vessel._id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">Ship *</label>
      
      {loading ? (
        <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-marine-blue mr-2"></div>
          <p className="text-sm text-gray-500">Loading vessels...</p>
          </div>
        </div>
      ) : vessels.length === 0 ? (
        <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">No ships available</p>
          <button
            type="button"
            onClick={() => {
              // This will be handled by the parent component
              if (window.confirm('No ships found. Would you like to add a new ship?')) {
                // For now, just show an alert - in a real app, this would open a ship creation modal
                alert('Please go to Ship Management Dashboard to add ships first.');
              }
            }}
            className="text-sm text-marine-blue hover:text-marine-dark underline"
          >
            Add New Ship
          </button>
        </div>
      ) : (
        <div className="mt-1 relative">
          <div className="relative">
            <input
              type="text"
              value={isOpen ? searchTerm : (selectedVessel ? `${selectedVessel.name} (${selectedVessel.imo || 'No IMO'})` : '')}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search ships..."
              required={required}
              className={`w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue pr-10 ${
                touched && error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
              {filteredVessels.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No ships found' : 'No ships available'}
                  {vessels.length === 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('No ships found. Would you like to add a new ship?')) {
                            alert('Please go to Ship Management Dashboard to add ships first.');
                          }
                        }}
                        className="text-xs text-marine-blue hover:text-marine-dark underline"
                      >
                        Add New Ship
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredVessels.map((vessel) => (
                  <button
                    key={vessel._id}
                    type="button"
                    onClick={() => handleSelect(vessel)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">{vessel.name}</div>
                    <div className="text-gray-500 text-xs">
                      IMO: {vessel.imo || 'No IMO'} | Type: {vessel.vesselType || 'Unknown'}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {vessels.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {vessels.length} ship(s) available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Cargo Modal Component
function CargoModal({ cargo, vessels = [], vesselsLoading = false, onSave, onClose }) {
  console.log('CargoModal vessels:', vessels);
  console.log('CargoModal vesselsLoading:', vesselsLoading);
  
  const [formData, setFormData] = useState({
    reference: cargo?.reference || '',
    description: cargo?.description || '',
    cargoType: cargo?.cargoType || 'Container',
    quantity: {
      value: cargo?.quantity?.value || '',
      unit: cargo?.quantity?.unit || 'TEU'
    },
    weight: {
      value: cargo?.weight?.value || '',
      unit: cargo?.weight?.unit || 'MT'
    },
    vessel: cargo?.vessel?._id || '',
    voyage: {
      number: cargo?.voyage?.number || '',
      departurePort: cargo?.voyage?.departurePort || '',
      departureDate: cargo?.voyage?.departureDate ? new Date(cargo.voyage.departureDate).toISOString().split('T')[0] : '',
      arrivalPort: cargo?.voyage?.arrivalPort || '',
      estimatedArrivalDate: cargo?.voyage?.estimatedArrivalDate ? new Date(cargo.voyage.estimatedArrivalDate).toISOString().split('T')[0] : ''
    },
    shipper: {
      name: cargo?.shipper?.name || '',
      contact: cargo?.shipper?.contact || '',
      email: cargo?.shipper?.email || '',
      phone: cargo?.shipper?.phone || ''
    },
    consignee: {
      name: cargo?.consignee?.name || '',
      contact: cargo?.consignee?.contact || '',
      email: cargo?.consignee?.email || '',
      phone: cargo?.consignee?.phone || ''
    },
    status: cargo?.status || 'Booked',
    specialRequirements: cargo?.specialRequirements || '',
    notes: cargo?.notes || ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'reference':
        if (!value.trim()) {
          newErrors.reference = 'Reference is required';
        } else if (value.trim().length < 3) {
          newErrors.reference = 'Reference must be at least 3 characters';
        } else {
          delete newErrors.reference;
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'quantity.value':
        if (!value.trim()) {
          newErrors['quantity.value'] = 'Quantity is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          newErrors['quantity.value'] = 'Quantity must be a positive number';
        } else {
          delete newErrors['quantity.value'];
        }
        break;
        
      case 'weight.value':
        if (!value.trim()) {
          newErrors['weight.value'] = 'Weight is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          newErrors['weight.value'] = 'Weight must be a positive number';
        } else {
          delete newErrors['weight.value'];
        }
        break;
        
      case 'vessel':
        if (!value) {
          newErrors.vessel = 'Vessel selection is required';
        } else {
          delete newErrors.vessel;
        }
        break;
        
      case 'voyage.number':
        if (!value.trim()) {
          newErrors['voyage.number'] = 'Voyage number is required';
        } else {
          delete newErrors['voyage.number'];
        }
        break;
        
      case 'voyage.departurePort':
        if (!value.trim()) {
          newErrors['voyage.departurePort'] = 'Departure port is required';
        } else {
          delete newErrors['voyage.departurePort'];
        }
        break;
        
      case 'voyage.arrivalPort':
        if (!value.trim()) {
          newErrors['voyage.arrivalPort'] = 'Arrival port is required';
        } else {
          delete newErrors['voyage.arrivalPort'];
        }
        break;
        
      case 'voyage.departureDate':
        if (!value) {
          newErrors['voyage.departureDate'] = 'Departure date is required';
        } else {
          const departureDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (departureDate < today) {
            newErrors['voyage.departureDate'] = 'Departure date cannot be in the past';
          } else {
            delete newErrors['voyage.departureDate'];
          }
        }
        break;
        
      case 'voyage.estimatedArrivalDate':
        if (!value) {
          newErrors['voyage.estimatedArrivalDate'] = 'Arrival date is required';
        } else {
          const arrivalDate = new Date(value);
          const departureDate = new Date(formData.voyage.departureDate);
          
          if (formData.voyage.departureDate && arrivalDate <= departureDate) {
            newErrors['voyage.estimatedArrivalDate'] = 'Arrival date must be after departure date';
          } else {
            delete newErrors['voyage.estimatedArrivalDate'];
          }
        }
        break;
        
      case 'shipper.name':
        if (!value.trim()) {
          newErrors['shipper.name'] = 'Shipper name is required';
        } else {
          delete newErrors['shipper.name'];
        }
        break;
        
      case 'shipper.email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors['shipper.email'] = 'Please enter a valid email address';
        } else {
          delete newErrors['shipper.email'];
        }
        break;
        
      case 'consignee.name':
        if (!value.trim()) {
          newErrors['consignee.name'] = 'Consignee name is required';
        } else {
          delete newErrors['consignee.name'];
        }
        break;
        
      case 'consignee.email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors['consignee.email'] = 'Please enter a valid email address';
        } else {
          delete newErrors['consignee.email'];
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Validate the field
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Cargo form submitted with data:', formData);
    
    // Mark all fields as touched to trigger validation
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'object' && formData[key] !== null) {
        Object.keys(formData[key]).forEach(subKey => {
          allTouched[`${key}.${subKey}`] = true;
        });
      } else {
        allTouched[key] = true;
      }
    });
    setTouched(allTouched);
    
    // Validate all required fields
    const requiredFields = [
      'reference', 'description', 'cargoType', 'vessel',
      'voyage.number', 'voyage.departurePort', 'voyage.arrivalPort', 'voyage.departureDate', 'voyage.estimatedArrivalDate',
      'shipper.name', 'shipper.contact', 'shipper.email', 'shipper.phone',
      'consignee.name', 'consignee.contact', 'consignee.email', 'consignee.phone'
    ];
    
    // Check required fields
    const missingFields = requiredFields.filter(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const value = formData[parent]?.[child];
        return !value || (typeof value === 'string' && !value.trim());
      }
      const value = formData[field];
      return !value || (typeof value === 'string' && !value.trim());
    });
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    console.log('Form validation passed, calling onSave...');
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {cargo ? 'Edit Cargo Shipment' : 'Add New Cargo Shipment'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference *</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                  touched.reference && errors.reference 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
              />
              {touched.reference && errors.reference && (
                <p className="mt-1 text-sm text-red-600">{errors.reference}</p>
              )}
            </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Type *</label>
                <select
                  name="cargoType"
                  value={formData.cargoType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue"
                >
                  <option value="Container">Container</option>
                  <option value="Bulk">Bulk</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Break Bulk">Break Bulk</option>
                  <option value="RoRo">RoRo</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
                rows={3}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                  touched.description && errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
              />
              {touched.description && errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                <div className="flex">
                  <input
                    type="number"
                    name="quantity.value"
                    value={formData.quantity.value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-3/4 rounded-l-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['quantity.value'] && errors['quantity.value'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  <select
                    name="quantity.unit"
                    value={formData.quantity.unit}
                    onChange={handleChange}
                    className="mt-1 block w-1/4 border-gray-300 rounded-r-md shadow-sm focus:ring-marine-blue focus:border-marine-blue"
                  >
                    <option value="TEU">TEU</option>
                    <option value="MT">MT</option>
                    <option value="CBM">CBM</option>
                    <option value="Units">Units</option>
                    <option value="Pallets">Pallets</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {touched['quantity.value'] && errors['quantity.value'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['quantity.value']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Weight *</label>
                <div className="flex">
                  <input
                    type="number"
                    name="weight.value"
                    value={formData.weight.value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-3/4 rounded-l-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['weight.value'] && errors['weight.value'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  <select
                    name="weight.unit"
                    value={formData.weight.unit}
                    onChange={handleChange}
                    className="mt-1 block w-1/4 border-gray-300 rounded-r-md shadow-sm focus:ring-marine-blue focus:border-marine-blue"
                  >
                    <option value="MT">MT</option>
                    <option value="KG">KG</option>
                    <option value="LB">LB</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {touched['weight.value'] && errors['weight.value'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['weight.value']}</p>
                )}
              </div>
            </div>

            <div>
              <VesselSelector
                vessels={vessels}
                value={formData.vessel}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, vessel: value }));
                  validateField('vessel', value);
                }}
                required
                error={errors.vessel}
                touched={touched.vessel}
                loading={vesselsLoading}
              />
              {touched.vessel && errors.vessel && (
                <p className="mt-1 text-sm text-red-600">{errors.vessel}</p>
              )}
            </div>

            {/* Voyage Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Voyage Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Voyage Number *</label>
                  <input
                    type="text"
                    name="voyage.number"
                    value={formData.voyage.number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['voyage.number'] && errors['voyage.number'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['voyage.number'] && errors['voyage.number'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['voyage.number']}</p>
                  )}
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Port *</label>
                <input
                  type="text"
                  name="voyage.departurePort"
                  value={formData.voyage.departurePort}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched['voyage.departurePort'] && errors['voyage.departurePort'] 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched['voyage.departurePort'] && errors['voyage.departurePort'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['voyage.departurePort']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Arrival Port *</label>
                <input
                  type="text"
                  name="voyage.arrivalPort"
                  value={formData.voyage.arrivalPort}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched['voyage.arrivalPort'] && errors['voyage.arrivalPort'] 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched['voyage.arrivalPort'] && errors['voyage.arrivalPort'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['voyage.arrivalPort']}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Date *</label>
                <input
                  type="date"
                  name="voyage.departureDate"
                  value={formData.voyage.departureDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched['voyage.departureDate'] && errors['voyage.departureDate'] 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched['voyage.departureDate'] && errors['voyage.departureDate'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['voyage.departureDate']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Arrival Date *</label>
                <input
                  type="date"
                  name="voyage.estimatedArrivalDate"
                  value={formData.voyage.estimatedArrivalDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                    touched['voyage.estimatedArrivalDate'] && errors['voyage.estimatedArrivalDate'] 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {touched['voyage.estimatedArrivalDate'] && errors['voyage.estimatedArrivalDate'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['voyage.estimatedArrivalDate']}</p>
                )}
              </div>
            </div>
            </div>

            {/* Shipper Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Shipper Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipper Name *</label>
                  <input
                    type="text"
                    name="shipper.name"
                    value={formData.shipper.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['shipper.name'] && errors['shipper.name'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['shipper.name'] && errors['shipper.name'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['shipper.name']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
                  <input
                    type="text"
                    name="shipper.contact"
                    value={formData.shipper.contact}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['shipper.contact'] && errors['shipper.contact'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['shipper.contact'] && errors['shipper.contact'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['shipper.contact']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="shipper.email"
                    value={formData.shipper.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['shipper.email'] && errors['shipper.email'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['shipper.email'] && errors['shipper.email'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['shipper.email']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    name="shipper.phone"
                    value={formData.shipper.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['shipper.phone'] && errors['shipper.phone'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['shipper.phone'] && errors['shipper.phone'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['shipper.phone']}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Consignee Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Consignee Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Consignee Name *</label>
                  <input
                    type="text"
                    name="consignee.name"
                    value={formData.consignee.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['consignee.name'] && errors['consignee.name'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['consignee.name'] && errors['consignee.name'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['consignee.name']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
                  <input
                    type="text"
                    name="consignee.contact"
                    value={formData.consignee.contact}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['consignee.contact'] && errors['consignee.contact'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['consignee.contact'] && errors['consignee.contact'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['consignee.contact']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="consignee.email"
                    value={formData.consignee.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['consignee.email'] && errors['consignee.email'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['consignee.email'] && errors['consignee.email'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['consignee.email']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    name="consignee.phone"
                    value={formData.consignee.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue ${
                      touched['consignee.phone'] && errors['consignee.phone'] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {touched['consignee.phone'] && errors['consignee.phone'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['consignee.phone']}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-marine-blue focus:border-marine-blue"
              >
                <option value="Booked">Booked</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
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
                {cargo ? 'Update' : 'Create'} Cargo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}