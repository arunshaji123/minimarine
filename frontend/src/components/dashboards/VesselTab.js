import React from 'react';
import { Link } from 'react-router-dom';
import { FaShip } from 'react-icons/fa';

const VesselTab = ({ vessels, setShowVesselModal, setEditingVessel }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">My Ships</h3>
        <button 
          onClick={() => { setEditingVessel(null); setShowVesselModal(true); }} 
          className="bg-marine-blue hover:bg-marine-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md flex items-center"
        >
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
                  <p className="text-xs text-gray-400 mt-1">ID: {vessel.vesselId}</p>
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
                      // Assuming there's a way to delete vessels
                      // await axios.delete(`/api/vessels/${vessel._id}`);
                    } catch (err) {
                      console.error('Error deleting vessel:', err);
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
            <button 
              onClick={() => { setEditingVessel(null); setShowVesselModal(true); }} 
              className="bg-marine-blue hover:bg-marine-dark text-white px-6 py-3 rounded-lg text-sm font-medium transition duration-200 shadow-md inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add New Ship
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VesselTab;