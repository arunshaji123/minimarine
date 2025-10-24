import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/roles';
import ProxyTestComponent from '../ProxyTestComponent';

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen ocean-bg">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Marine Survey</h1>
            </div>
            <div className="flex space-x-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/dashboard"
                    className="bg-yellow-400 text-marine-dark px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition duration-200 transform hover:scale-105"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-3 py-2 rounded-md font-medium transition duration-200"
                    title="Logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-3 py-2 rounded-md font-medium transition duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-yellow-400 text-marine-dark px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition duration-200"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Professional Marine
            <span className="block text-yellow-300">Survey Services</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Comprehensive marine surveying solutions for vessels, offshore structures, 
            and maritime operations. Trusted by professionals worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <Link
                  to="/register"
                  className="bg-yellow-400 text-marine-dark px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-300 transition duration-200 transform hover:scale-105 shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-white/20 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white/30 transition duration-200 backdrop-blur-sm shadow-lg"
                >
                  Sign In
                </Link>
              </>
            )}
            {user && (
              <div className="flex items-center gap-3 justify-center">
                <Link
                  to="/dashboard"
                  className="bg-yellow-400 text-marine-dark px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-300 transition duration-200 transform hover:scale-105 shadow-lg"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="bg-white/20 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white/30 transition duration-200 backdrop-blur-sm shadow-lg"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/10 backdrop-blur-md py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Our Services</h2>
            <p className="text-white/80 text-lg">Comprehensive marine survey solutions</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-marine-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vessel Inspections</h3>
              <p className="text-white/80">Comprehensive hull, machinery, and safety equipment inspections</p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-marine-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Damage Assessment</h3>
              <p className="text-white/80">Professional damage evaluation and repair recommendations</p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-marine-dark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Survey Reports</h3>
              <p className="text-white/80">Detailed documentation and certification for insurance and compliance</p>
            </div>
          </div>
        </div>
      </div>
      <ProxyTestComponent />
    </div>
  );
};

export default Home;