import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import axios from 'axios';

const PremiumInspection = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [showValidationError, setShowValidationError] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    // Swimming Pool & Deck Facilities
    poolStructure: '',
    waterQuality: '',
    filtrationSystem: '',
    poolSafetySigns: '',
    lifeguardEquipment: '',
    antiSlipFlooring: '',
    
    // Helipad Facilities
    helideckStructure: '',
    surfaceFriction: '',
    helideckFirefighting: '',
    helideckLighting: '',
    windIndicator: '',
    emergencyAccess: '',
    
    // Dining & Restaurant Areas
    kitchenHygiene: '',
    foodStorage: '',
    galleyFireSafety: '',
    ventilation: '',
    seatingComfort: '',
    wasteDisposal: '',
    
    // Bar & Lounge Facilities
    beverageStorage: '',
    alcoholHandling: '',
    barCleanliness: '',
    glasswareSafety: '',
    barFireSuppression: '',
    serviceCounter: '',
    
    // Guest Cabin Quality
    cabinComfort: '',
    interiorDesign: '',
    climateControl: '',
    noiseVibration: '',
    accessibility: '',
    housekeeping: '',
    
    // Recreation & Wellness Facilities
    gymEquipment: '',
    spaFacilities: '',
    entertainmentSystems: '',
    loungeReadiness: '',
    childSafety: '',
    
    // Passenger Safety & Comfort
    crowdManagement: '',
    evacuationSignage: '',
    musterStation: '',
    publicFireSafety: '',
    cctvSecurity: '',
    medicalFacility: '',
    
    // Environmental Standards
    wasteSegregation: '',
    noisePollution: '',
    energyLighting: '',
    waterSaving: '',
    ecoPractices: '',
    
    // Overall Assessment
    vipQualityLevel: '',
    passengerReadiness: '',
    charterReadiness: '',
    insuranceRecommendation: '',
    vipGrade: ''
  });

  // Fetch survey data when component mounts
  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!surveyId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        // Fetch from surveyor-bookings endpoint (where active surveys come from)
        const response = await axios.get('/api/surveyor-bookings', config);
        const booking = response.data.find(b => b._id === surveyId || b.id === surveyId);
        
        if (booking) {
          console.log('Found booking data:', booking);
          setSurveyData({
            _id: booking._id,
            vessel: booking.vessel || {
              name: booking.vesselName,
              _id: booking.vesselId,
              vesselId: booking.vessel?.vesselId || booking.vesselId
            },
            vesselName: booking.vesselName,
            vesselId: booking.vesselId || booking.vessel?._id
          });
        } else {
          console.log('No booking found with ID:', surveyId);
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [surveyId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one status field is selected in each row
    const allFields = Object.keys(formData);
    const emptyFields = allFields.filter(field => !formData[field]);
    
    if (emptyFields.length > 0) {
      setShowValidationError(true);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setShowValidationError(false);
    
    // Get vessel information from survey data
    console.log('Survey data at submission:', surveyData);
    const vesselInfo = surveyData ? {
      name: surveyData.vessel?.name || surveyData.vesselName || 'Unknown Ship',
      _id: surveyData.vessel?._id || surveyData.vesselId || surveyData.vessel?.vesselId || 'unknown-id',
      vesselId: surveyData.vessel?.vesselId || surveyData.vesselId || 'Unknown ID'
    } : {
      name: 'VIP Ship',
      _id: 'vip-ship-id',
      vesselId: 'N/A'
    };
    
    console.log('Extracted vessel info:', vesselInfo);
    
    // Create a report object
    const report = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      surveyId: surveyId || `SURVEY-${Date.now()}`,
      surveyType: 'Premium Quality',
      vessel: vesselInfo,
      shipName: vesselInfo.name,
      shipId: vesselInfo.vesselId,
      ...formData
    };
    
    // Persist to backend for hosted consistency; keep localStorage fallback
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/custom-reports',
        {
          type: 'premium',
          payload: report
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      const persistedReport = response.data;
      const existingReports = JSON.parse(localStorage.getItem('premiumReports') || '[]');
      existingReports.unshift(persistedReport);
      localStorage.setItem('premiumReports', JSON.stringify(existingReports));
      localStorage.setItem('premiumReportsBackup', JSON.stringify(existingReports));
    } catch (apiError) {
      console.error('Failed to save premium report to backend, using local fallback:', apiError);
      const existingReports = JSON.parse(localStorage.getItem('premiumReports') || '[]');
      existingReports.unshift(report);
      localStorage.setItem('premiumReports', JSON.stringify(existingReports));
      localStorage.setItem('premiumReportsBackup', JSON.stringify(existingReports));
    }
    
    console.log('Premium Inspection Data:', formData);
    // TODO: Submit to backend
    
    // Show success message
    setShowSuccessMessage(true);
    
    // Reset form
    setFormData({
      poolStructure: '', waterQuality: '', filtrationSystem: '', poolSafetySigns: '',
      lifeguardEquipment: '', antiSlipFlooring: '', helideckStructure: '', surfaceFriction: '',
      helideckFirefighting: '', helideckLighting: '', windIndicator: '', emergencyAccess: '',
      kitchenHygiene: '', foodStorage: '', galleyFireSafety: '', ventilation: '',
      seatingComfort: '', wasteDisposal: '', beverageStorage: '', alcoholHandling: '',
      barCleanliness: '', glasswareSafety: '', barFireSuppression: '', serviceCounter: '',
      cabinComfort: '', interiorDesign: '', climateControl: '', noiseVibration: '',
      accessibility: '', housekeeping: '', gymEquipment: '', spaFacilities: '',
      entertainmentSystems: '', loungeReadiness: '', childSafety: '', crowdManagement: '',
      evacuationSignage: '', musterStation: '', publicFireSafety: '', cctvSecurity: '',
      medicalFacility: '', wasteSegregation: '', noisePollution: '', energyLighting: '',
      waterSaving: '', ecoPractices: '', vipQualityLevel: '', passengerReadiness: '',
      charterReadiness: '', insuranceRecommendation: '', vipGrade: ''
    });
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Hide success message after 15 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 15000);
  };

  const renderCheckboxGroup = (name, options) => (
    <div className="flex gap-4">
      {options.map(option => (
        <label key={option} className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option}
            checked={formData[name] === option}
            onChange={(e) => handleChange(name, e.target.value)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">{option}</span>
        </label>
      ))}
    </div>
  );

  const standardOptions = ['Good', 'Needs Attention', 'Unsatisfactory', 'N/A'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading survey data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/surveyor', { state: { activeSection: 'surveys' } })}
          className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Surveys
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center mb-4">
            <svg className="h-12 w-12 mr-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Premium / VIP Ship Quality Inspection</h1>
              {surveyData && (
                <div className="mt-2 bg-purple-700 bg-opacity-50 rounded-lg px-4 py-2 inline-block">
                  <p className="text-sm font-medium">
                    Inspecting: <span className="font-bold">{surveyData.vessel?.name || surveyData.vesselName || 'Unknown Ship'}</span>
                  </p>
                  <p className="text-xs text-purple-200">
                    Vessel ID: {surveyData.vessel?.vesselId || surveyData.vesselId || 'N/A'}
                  </p>
                </div>
              )}
              <p className="mt-2 text-purple-100">
                A specialized inspection designed to assess luxury amenities, passenger comfort, and premium service 
                standards on VIP vessels, including leisure, hospitality, and safety facilities.
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Success!</span> Premium Inspection submitted successfully! Your report has been added to the Recent Reports section in the Surveys dashboard.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="inline-flex text-green-400 hover:text-green-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {showValidationError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Validation Error!</span> Please select at least one status option for each row before submitting the inspection.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Swimming Pool & Deck Facilities */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🏊</span>
                Swimming Pool & Deck Facilities
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Pool structural condition</td><td className="px-6 py-4">{renderCheckboxGroup('poolStructure', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Water quality & hygiene</td><td className="px-6 py-4">{renderCheckboxGroup('waterQuality', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Filtration & circulation system</td><td className="px-6 py-4">{renderCheckboxGroup('filtrationSystem', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Pool safety signage</td><td className="px-6 py-4">{renderCheckboxGroup('poolSafetySigns', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Lifeguard equipment availability</td><td className="px-6 py-4">{renderCheckboxGroup('lifeguardEquipment', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Anti-slip flooring condition</td><td className="px-6 py-4">{renderCheckboxGroup('antiSlipFlooring', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Helipad Facilities */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🚁</span>
                Helipad Facilities
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Helideck structural condition</td><td className="px-6 py-4">{renderCheckboxGroup('helideckStructure', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Surface friction & markings</td><td className="px-6 py-4">{renderCheckboxGroup('surfaceFriction', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Helideck firefighting system</td><td className="px-6 py-4">{renderCheckboxGroup('helideckFirefighting', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Lighting & night operation readiness</td><td className="px-6 py-4">{renderCheckboxGroup('helideckLighting', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Wind direction indicator</td><td className="px-6 py-4">{renderCheckboxGroup('windIndicator', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Emergency access routes</td><td className="px-6 py-4">{renderCheckboxGroup('emergencyAccess', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dining & Restaurant Areas */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🍽️</span>
                Dining & Restaurant Areas
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Kitchen hygiene standards</td><td className="px-6 py-4">{renderCheckboxGroup('kitchenHygiene', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Food storage & refrigeration</td><td className="px-6 py-4">{renderCheckboxGroup('foodStorage', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Galley fire safety systems</td><td className="px-6 py-4">{renderCheckboxGroup('galleyFireSafety', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Ventilation & exhaust systems</td><td className="px-6 py-4">{renderCheckboxGroup('ventilation', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Seating comfort & layout</td><td className="px-6 py-4">{renderCheckboxGroup('seatingComfort', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Waste disposal practices</td><td className="px-6 py-4">{renderCheckboxGroup('wasteDisposal', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bar & Lounge Facilities */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🍹</span>
                Bar & Lounge Facilities
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Beverage storage condition</td><td className="px-6 py-4">{renderCheckboxGroup('beverageStorage', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Alcohol handling safety</td><td className="px-6 py-4">{renderCheckboxGroup('alcoholHandling', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Bar area cleanliness</td><td className="px-6 py-4">{renderCheckboxGroup('barCleanliness', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Glassware handling safety</td><td className="px-6 py-4">{renderCheckboxGroup('glasswareSafety', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Fire suppression in bar area</td><td className="px-6 py-4">{renderCheckboxGroup('barFireSuppression', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Service counter ergonomics</td><td className="px-6 py-4">{renderCheckboxGroup('serviceCounter', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Guest Cabin Quality */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🛎️</span>
                Guest Cabin Quality
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Cabin comfort level</td><td className="px-6 py-4">{renderCheckboxGroup('cabinComfort', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Interior design & finish quality</td><td className="px-6 py-4">{renderCheckboxGroup('interiorDesign', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Climate control effectiveness</td><td className="px-6 py-4">{renderCheckboxGroup('climateControl', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Noise & vibration comfort</td><td className="px-6 py-4">{renderCheckboxGroup('noiseVibration', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Accessibility for elderly / disabled</td><td className="px-6 py-4">{renderCheckboxGroup('accessibility', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Housekeeping quality</td><td className="px-6 py-4">{renderCheckboxGroup('housekeeping', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recreation & Wellness Facilities */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🧘</span>
                Recreation & Wellness Facilities
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Gym equipment condition</td><td className="px-6 py-4">{renderCheckboxGroup('gymEquipment', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Spa & wellness facilities</td><td className="px-6 py-4">{renderCheckboxGroup('spaFacilities', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Entertainment systems</td><td className="px-6 py-4">{renderCheckboxGroup('entertainmentSystems', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Lounge / cinema readiness</td><td className="px-6 py-4">{renderCheckboxGroup('loungeReadiness', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Child safety in play areas</td><td className="px-6 py-4">{renderCheckboxGroup('childSafety', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Passenger Safety & Comfort */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🚨</span>
                Passenger Safety & Comfort
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Crowd management readiness</td><td className="px-6 py-4">{renderCheckboxGroup('crowdManagement', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Emergency evacuation signage</td><td className="px-6 py-4">{renderCheckboxGroup('evacuationSignage', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Muster station comfort</td><td className="px-6 py-4">{renderCheckboxGroup('musterStation', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Public area fire safety</td><td className="px-6 py-4">{renderCheckboxGroup('publicFireSafety', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">CCTV & security monitoring</td><td className="px-6 py-4">{renderCheckboxGroup('cctvSecurity', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Medical facility readiness</td><td className="px-6 py-4">{renderCheckboxGroup('medicalFacility', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Environmental Standards */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-lime-50 to-green-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🌍</span>
                Environmental Standards
              </h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Waste segregation in public areas</td><td className="px-6 py-4">{renderCheckboxGroup('wasteSegregation', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Noise pollution control</td><td className="px-6 py-4">{renderCheckboxGroup('noisePollution', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Energy-efficient lighting</td><td className="px-6 py-4">{renderCheckboxGroup('energyLighting', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Water-saving systems</td><td className="px-6 py-4">{renderCheckboxGroup('waterSaving', standardOptions)}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-medium text-gray-900">Eco-friendly practices</td><td className="px-6 py-4">{renderCheckboxGroup('ecoPractices', standardOptions)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Overall VIP Quality Assessment */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-6 py-4 border-b border-purple-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🏆</span>
                Overall VIP Quality Assessment
              </h2>
            </div>
            <div className="p-6 bg-purple-50">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-200">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider w-1/3">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-purple-100">
                    <tr><td className="px-6 py-4 text-sm font-bold text-gray-900">Overall VIP Quality Level</td><td className="px-6 py-4">{renderCheckboxGroup('vipQualityLevel', ['Excellent', 'Good', 'Fair', 'Poor'])}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-bold text-gray-900">Passenger Experience Readiness</td><td className="px-6 py-4">{renderCheckboxGroup('passengerReadiness', ['Ready', 'Conditional', 'Not Ready'])}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-bold text-gray-900">Charter / Cruise Readiness</td><td className="px-6 py-4">{renderCheckboxGroup('charterReadiness', ['Yes', 'Conditional', 'No'])}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-bold text-gray-900">Insurance Recommendation</td><td className="px-6 py-4">{renderCheckboxGroup('insuranceRecommendation', ['Recommended', 'Conditional', 'Not Recommended'])}</td></tr>
                    <tr><td className="px-6 py-4 text-sm font-bold text-gray-900">VIP Grade</td><td className="px-6 py-4">{renderCheckboxGroup('vipGrade', ['Platinum', 'Gold', 'Silver'])}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/surveyor', { state: { activeSection: 'surveys' } })}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Submit Premium Inspection
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PremiumInspection;
