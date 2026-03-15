import React from 'react';

const PredictiveMaintenanceTab = ({ knnPredictions, knnLoading, knnError, setKnnRefreshKey, selectedVessel }) => {
  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="space-y-6">
      {/* Elegant Header */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Predictive Maintenance
              </h2>
            </div>
            {selectedVessel && (
              <div className="ml-13 mt-1 inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">{selectedVessel.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">IMO: {selectedVessel.imo || 'N/A'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setKnnRefreshKey(prev => prev + 1)}
            disabled={knnLoading}
            className="group px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${knnLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {knnLoading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Elegant Error Message */}
      {knnError && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-amber-800">{knnError}</p>
          </div>
        </div>
      )}

      {/* Beautiful Loading State */}
      {knnLoading ? (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-gray-100 p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full bg-blue-50 animate-pulse"></div>
            </div>
            <p className="text-gray-700 font-medium mt-6">Analyzing vessel data...</p>
            <p className="text-sm text-gray-500 mt-1">Processing AI predictions</p>
          </div>
        </div>
      ) : (
        <>
          {/* Elegant Predictions List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Component Analysis</h3>
              </div>
            </div>
            
            {knnPredictions.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No prediction data available</p>
                <p className="text-sm text-gray-400 mt-2">Complete surveys to generate AI predictions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {knnPredictions
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((prediction, index) => (
                    <div key={index} className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group">
                      <div className="flex items-start justify-between gap-8">
                        {/* Component Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-1.5 h-10 rounded-full flex-shrink-0 shadow-sm" 
                              style={{ backgroundColor: getUrgencyColor(prediction.urgency) }}
                            ></div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {prediction.component}
                              </h4>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 ml-5 leading-relaxed">{prediction.recommendation}</p>
                        </div>

                        {/* Elegant Stats */}
                        <div className="flex items-center gap-10 flex-shrink-0">
                          {/* Rating */}
                          <div className="text-center">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating</div>
                            <div className="flex items-center gap-0.5 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xl transition-all ${star <= Math.round(prediction.currentRating) ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="text-xs font-bold text-gray-700">{prediction.currentRating.toFixed(1)}<span className="text-gray-400 font-normal">/5</span></div>
                          </div>

                          {/* Risk Score */}
                          <div className="text-center min-w-[90px]">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Score</div>
                            <div 
                              className="text-3xl font-black mb-1"
                              style={{ color: getUrgencyColor(prediction.urgency) }}
                            >
                              {prediction.riskScore.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">out of 10</div>
                          </div>

                          {/* Status Badge */}
                          <div className="text-center min-w-[110px]">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priority</div>
                            <span 
                              className="inline-block px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transform group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: getUrgencyColor(prediction.urgency) }}
                            >
                              {prediction.urgency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Elegant Info Footer */}
          {knnPredictions.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  AI-powered predictions based on historical survey data and machine learning analysis
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PredictiveMaintenanceTab;
