import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import UserProfileModal from '../UserProfileModal.jsx';
import DocumentList from '../DocumentList';
import SurveyFormModal from '../modals/SurveyFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';

export default function SurveyorDashboard() {
  const { user } = useAuth();
  const { warning } = useToast();
  const [showProfile, setShowProfile] = useState(false);
  // Derived from accepted bookings
  const [upcomingSurveys, setUpcomingSurveys] = useState([]);

  const [recentReports, setRecentReports] = useState([]);

  const [complianceIssues, setComplianceIssues] = useState([]);

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

  const handleStartSurvey = (survey) => {
    setSurveyFormModal({ open: true, survey });
  };

  // Add this function to handle survey submission completion
  const handleSurveySubmitted = () => {
    // Reload completed surveys to show the newly submitted report
    loadCompletedSurveys();
  };

  // Navigation state
  const [activeSection, setActiveSection] = useState('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    loadCompletedSurveys(); // Add this line to load completed surveys
  }, []);

  // Add this new function to load completed surveys
  const loadCompletedSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('/api/surveys/completed', config);
      
      // Transform the data to match what the Recent Reports table expects
      const reports = response.data.map(survey => ({
        id: survey._id,
        vessel: survey.vessel?.name || 'Unknown Vessel',
        type: survey.surveyType || 'Unknown Type',
        completed: survey.completionDate,
        status: survey.status === 'Completed' ? 'Passed' : survey.status,
        findings: survey.findings?.length > 0 ? survey.findings[0].description : 'No findings',
        recommendations: survey.recommendations || 'No recommendations'
      }));
      
      setRecentReports(reports);
    } catch (err) {
      console.error('Error loading completed surveys:', err);
      // Don't set error state here as it's not critical
    }
  };

  // Derive "Upcoming Surveys" from accepted bookings
  useEffect(() => {
    const items = (bookings || [])
      .filter(b => b.status === 'Accepted')
      .map(b => ({
        id: b._id,
        vessel: b.vessel?.name || b.vesselName,
        type: b.surveyType,
        scheduled: b.inspectionDate,
        time: b.inspectionTime,
        location: b.location,
        client: b.bookedBy?.name || 'Ship Management',
        status: 'Accepted',
        shipPhotos: b.shipPhotos || [],
        flightTicket: b.flightTicket,
        assignedAt: b.assignedAt
      }));
    setUpcomingSurveys(items);
  }, [bookings]);

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
      icon: '📋',
      description: 'Manage inspection bookings'
    },
    {
      id: 'surveys',
      name: 'Surveys',
      icon: '📅',
      description: 'Active and upcoming inspections'
    },
    {
      id: 'reports',
      name: 'Recent Reports',
      icon: '📄',
      description: 'Completed survey reports'
    },
    {
      id: 'compliance',
      name: 'Compliance Tracking',
      icon: '✅',
      description: 'Outstanding compliance issues'
    },
    {
      id: 'documents',
      name: 'Documents',
      icon: '📁',
      description: 'Survey documents and files'
    }
  ];

  return (
    <DashboardLayout title="Surveyor Dashboard" description="Inspection schedules, reports, and compliance tracking." onProfileClick={() => setShowProfile(s => !s)}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 bg-green-600">
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
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
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
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Notifications */}
        {activeSection === 'bookings' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Notifications</h3>
              {shipMgmtUserId && (
                <Link to={`/chat/${shipMgmtUserId}`} className="text-marine-blue hover:text-marine-dark relative">
                  Messages
                  {counts[String(shipMgmtUserId)] > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {counts[String(shipMgmtUserId)]}
                    </span>
                  )}
                </Link>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your inspection bookings and requests</p>
          </div>
          <div className="overflow-x-auto">
            {bookingsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} onClick={() => openSurveyDetails(booking._id)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {booking.vesselName?.charAt(0)?.toUpperCase() || 'V'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{booking.vesselName}</div>
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
                          booking.status === 'Accepted' ? 'bg-green-100 text-green-800' :
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
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md text-xs font-medium"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeclineBooking(booking._id); }}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-xs font-medium"
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
            {/* Active Surveys */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Active Surveys</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Current and ongoing inspections</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight Ticket</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const now = new Date();
                      const activeSurveys = upcomingSurveys.filter(survey => {
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

                      return activeSurveys.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No active surveys found.
                          </td>
                        </tr>
                      ) : (
                        activeSurveys.map((survey) => (
                          <tr key={survey.id} onClick={() => openSurveyDetails(survey.id)} className="cursor-pointer hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{survey.vessel}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{survey.type}</div>
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
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartSurvey(survey);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium shadow-sm"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Survey
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

            {/* Upcoming Surveys */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Surveys</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Scheduled future inspections and assessments</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Remaining</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight Ticket</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const now = new Date();
                      const futureSurveys = upcomingSurveys.filter(survey => {
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

                      return futureSurveys.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                            No upcoming surveys found.
                          </td>
                        </tr>
                      ) : (
                        futureSurveys.map((survey) => (
                          <tr key={survey.id} onClick={() => openSurveyDetails(survey.id)} className="cursor-pointer hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{survey.vessel}</div>
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
          </>
        )}

        {/* Recent Reports */}
        {activeSection === 'reports' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Reports</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Your recently completed survey reports</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Findings</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendations</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.vessel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(report.completed)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.status === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.findings}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.recommendations}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-marine-blue hover:text-marine-dark mr-3">View Report</button>
                      <button className="text-marine-blue hover:text-marine-dark">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Compliance Issues */}
        {activeSection === 'compliance' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Compliance Tracking</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Outstanding compliance issues requiring attention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{issue.vessel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issue.issue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${issue.severity === 'High' ? 'bg-red-100 text-red-800' : issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(issue.deadline)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${issue.status === 'Not Started' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-marine-blue hover:text-marine-dark mr-3">Update Status</button>
                      <button className="text-marine-blue hover:text-marine-dark">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Recent Documents */}
        {activeSection === 'documents' && (
          <div className="mt-8">
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
              <button onClick={() => setDetailsModal({ open: false, booking: null })} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Ship</div>
                <div className="text-gray-900">{detailsModal.booking?.vessel?.name || detailsModal.booking?.vesselName || '-'}</div>
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
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button onClick={() => setDetailsModal({ open: false, booking: null })} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">Close</button>
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
    </DashboardLayout>
  );
}
