import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children, title, description, onProfileClick = () => {}, fullWidth = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'urgent', message: 'Survey deadline approaching for MV Atlantic Star', time: '2 hours ago' },
    { id: 2, type: 'info', message: 'New survey request received', time: '4 hours ago' },
    { id: 3, type: 'success', message: 'Survey report approved for SS Ocean Pride', time: '1 day ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Professional Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-marine-blue to-marine-light rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">Marine Survey Pro</h1>
                  <p className="text-xs text-gray-500">Professional Dashboard</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
                >
                  <span className="sr-only">View notifications</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      </div>
                      {notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-start">
                            <div className={`w-2 h-2 mt-1 rounded-full mr-3 ${
                              notification.type === 'urgent' ? 'bg-red-500' :
                              notification.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button className="text-xs text-marine-blue hover:text-marine-dark font-medium">View all notifications</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</div>
                </div>
                <button
                  type="button"
                  onClick={onProfileClick}
                  className="w-10 h-10 bg-gradient-to-r from-marine-blue to-marine-light rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue"
                  aria-label="Open profile"
                >
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className={fullWidth ? "w-full px-4 sm:px-6 lg:px-8 py-6" : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
              <p className="text-gray-600">{description || 'Here\'s your marine survey business overview for today.'}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md">
                + New Survey
              </button>
              <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                Generate Report
              </button>
              <button 
                onClick={() => navigate('/documents')}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards with Gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Surveys Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 border border-blue-400 transform hover:scale-105 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-xs font-semibold text-white">Active</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-2">Total Surveys</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">-</span>
              <span className="ml-2 text-sm text-blue-100">surveys</span>
            </div>
            <div className="mt-4 flex items-center text-blue-100 text-xs">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>View all surveys</span>
            </div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 border border-green-400 transform hover:scale-105 transition-all duration-300 animate-fadeIn" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-xs font-semibold text-white">Growth</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-green-100 mb-2">Monthly Revenue</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">-</span>
              <span className="ml-2 text-sm text-green-100">USD</span>
            </div>
            <div className="mt-4 flex items-center text-green-100 text-xs">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>+12% from last month</span>
            </div>
          </div>

          {/* Pending Surveys Card */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl p-6 border border-orange-400 transform hover:scale-105 transition-all duration-300 animate-fadeIn" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-xs font-semibold text-white">Urgent</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-orange-100 mb-2">Pending Surveys</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">-</span>
              <span className="ml-2 text-sm text-orange-100">surveys</span>
            </div>
            <div className="mt-4 flex items-center text-orange-100 text-xs">
              <svg className="w-4 h-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Requires attention</span>
            </div>
          </div>

          {/* Client Satisfaction Card */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 border border-purple-400 transform hover:scale-105 transition-all duration-300 animate-fadeIn" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-xs font-semibold text-white">Excellent</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-2">Client Satisfaction</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">-</span>
              <span className="ml-2 text-sm text-purple-100">rating</span>
            </div>
            <div className="mt-4 flex items-center text-purple-100 text-xs">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-300 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1">Top rated surveyor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {fullWidth ? (
          <>{children}</>
        ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title || 'Dashboard'}</h2>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;