import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
// Uses MUI Link if installed; falls back to router Link styling otherwise.
// If you don't have MUI installed, run: npm install @mui/material @emotion/react @emotion/styled


/**
 * WeatherGlobalOverview
 * - High-level weather intelligence overview for admins
 * - Section 1: Status Panel Card (API connection + uptime)
 */
export default function WeatherGlobalOverview({
  apiConnected = true,
  lastFetchLabel = '2 mins ago', // e.g., '2 mins ago'
  uptimePercent = 99.8 // number or string
}) {
  const isOk = Boolean(apiConnected);

  return (
    <div className="space-y-6">
      {/* Status Panel Card */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Weather API Status</h3>
            {isOk ? (
              <p className="mt-1 text-sm text-green-700">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" aria-hidden />
                  API Connected - Last data fetch: {lastFetchLabel}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-red-700">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden />
                  API Error -{' '}
                  <RouterLink to="/admin/settings" className="text-red-600 hover:underline">
                    Check credentials
                  </RouterLink>
                </span>
              </p>
            )}
          </div>

          {/* Uptime pill */}
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            isOk ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
          }`}>
            Uptime: {typeof uptimePercent === 'number' ? uptimePercent.toFixed(1) : uptimePercent}% (24h)
          </div>
        </div>
      </div>
    </div>
  );
}