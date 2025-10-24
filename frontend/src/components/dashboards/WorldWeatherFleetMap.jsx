import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Utility: Create a colored circular SVG icon as a data URL
const makeCircleIcon = (color) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="8" fill="${color}" stroke="white" stroke-width="2" />
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
    className: 'leaflet-marker-icon'
  });
};

// Simple ship SVG icon (blue)
const makeShipIcon = () => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <g fill="#1d4ed8">
      <!-- Mast -->
      <rect x="15" y="6" width="2" height="10" rx="1" />
      <!-- Sail -->
      <path d="M16 7 L24 14 L16 14 Z" fill="#3b82f6" />
      <!-- Hull -->
      <path d="M6 18 L26 18 L24 22 C22 25 10 25 8 22 Z" />
      <!-- Bow wave -->
      <path d="M6 22 C8 23 10 24 12 24" fill="none" stroke="#60a5fa" stroke-width="1.5" />
    </g>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 18],
    popupAnchor: [0, -16],
    className: 'leaflet-marker-icon'
  });
};

// Map alert type to icon color
const alertIconByType = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'storm':
      return makeCircleIcon('#ef4444'); // red
    case 'high-wind':
      return makeCircleIcon('#f59e0b'); // yellow
    case 'fog':
    case 'low-visibility':
      return makeCircleIcon('#3b82f6'); // blue
    default:
      return makeCircleIcon('#6b7280'); // gray fallback
  }
};

const shipIcon = makeShipIcon();

/**
 * WorldWeatherFleetMap
 * Props:
 * - alerts: [{ type, lat, lng, location, severity }]
 * - ships: [{ id, name, imo, status, lat, lng }]
 */
export default function WorldWeatherFleetMap({ alerts = [], ships = [] }) {
  // memoize markers to avoid re-creating icons on each render
  const alertMarkers = useMemo(() => alerts.map((a, idx) => ({ ...a, key: `alert-${idx}` })), [alerts]);
  const shipMarkers = useMemo(() => ships.map((v, idx) => ({ ...v, key: `ship-${v.id || idx}` })), [ships]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Interactive World Map</h3>
          <p className="text-sm text-gray-500">Weather alerts and live fleet positions</p>
        </div>
      </div>
      <div className="w-full h-[520px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          worldCopyJump
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Weather Alerts */}
          {alertMarkers.map((a) => (
            <Marker key={a.key} position={[a.lat, a.lng]} icon={alertIconByType(a.type)}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold capitalize">{a.type || 'Alert'}</div>
                  <div className="text-sm text-gray-600">{a.location || 'Unknown location'}</div>
                  <div className="text-sm">Severity: <span className="font-medium">{a.severity || 'N/A'}</span></div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Fleet Ships */}
          {shipMarkers.map((v) => (
            <Marker key={v.key} position={[v.lat, v.lng]} icon={shipIcon}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{v.name || 'Ship'}</div>
                  {v.imo && <div className="text-sm text-gray-600">IMO: {v.imo}</div>}
                  {v.status && <div className="text-sm">Status: <span className="font-medium">{v.status}</span></div>}
                  <div className="pt-1">
                    <Link to={v.id ? `/ships/${v.id}` : '#'} className="text-marine-blue hover:underline text-sm">
                      View Ship Details
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}