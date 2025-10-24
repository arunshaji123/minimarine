import React, { useState } from 'react';
import axios from 'axios';

const DocumentUpload = ({ 
  relatedEntityType, 
  relatedEntityId, 
  onUploadSuccess, 
  onUploadError,
  className = "",
  buttonText = "Upload Document",
  showForm = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(showForm);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    documentType: '',
    category: '',
    tags: '',
    expiryDate: '',
    issuedBy: '',
    issuedDate: '',
    documentNumber: '',
    visibility: 'Restricted',
    file: null
  });

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append file and form data
      formData.append('file', uploadForm.file);
      formData.append('relatedEntityType', relatedEntityType);
      formData.append('relatedEntityId', relatedEntityId);
      
      Object.keys(uploadForm).forEach(key => {
        if (key !== 'file' && uploadForm[key]) {
          formData.append(key, uploadForm[key]);
        }
      });

      const response = await axios.post('/api/documents', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowModal(false);
      setUploadForm({
        title: '',
        description: '',
        documentType: '',
        category: '',
        tags: '',
        expiryDate: '',
        issuedBy: '',
        issuedDate: '',
        documentNumber: '',
        visibility: 'Restricted',
        file: null
      });

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      if (onUploadError) {
        onUploadError(error);
      } else {
        alert('Error uploading document. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {buttonText}
      </button>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                    <select
                      required
                      value={uploadForm.documentType}
                      onChange={(e) => setUploadForm({...uploadForm, documentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Survey Report">Survey Report</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Inspection Report">Inspection Report</option>
                      <option value="Maintenance Record">Maintenance Record</option>
                      <option value="Crew Document">Crew Document</option>
                      <option value="Vessel Document">Vessel Document</option>
                      <option value="Insurance Document">Insurance Document</option>
                      <option value="Classification Document">Classification Document</option>
                      <option value="Port Document">Port Document</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Safety">Safety</option>
                      <option value="Environmental">Environmental</option>
                      <option value="Technical">Technical</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Legal">Legal</option>
                      <option value="Financial">Financial</option>
                      <option value="Operational">Operational</option>
                      <option value="Certification">Certification</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                      placeholder="e.g., urgent, safety, inspection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                    <input
                      type="text"
                      value={uploadForm.documentNumber}
                      onChange={(e) => setUploadForm({...uploadForm, documentNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                    <input
                      type="text"
                      value={uploadForm.issuedBy}
                      onChange={(e) => setUploadForm({...uploadForm, issuedBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date</label>
                    <input
                      type="date"
                      value={uploadForm.issuedDate}
                      onChange={(e) => setUploadForm({...uploadForm, issuedDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({...uploadForm, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isUploading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading && (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentUpload;



