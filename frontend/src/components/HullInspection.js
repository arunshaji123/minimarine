import React, { useState, useRef } from 'react';
import axios from 'axios';
import { downloadHullInspectionPdf, getHullConditionLabel } from '../utils/hullInspectionPdf';

export default function HullInspection({ survey, onClose, onSaveReport }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [aiServiceOnline, setAiServiceOnline] = useState(null);
  const fileInputRef = useRef();

  const compressImageDataUrl = (dataUrl, maxWidth = 1000, quality = 0.6) => {
    return new Promise((resolve) => {
      if (!dataUrl) {
        resolve(dataUrl);
        return;
      }

      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  };

  const buildReportPayload = () => {
    if (!results) return null;

    const timestamp = new Date().toISOString();
    const surveyId = survey?._id || survey?.surveyId || survey?.id || `HULL-${Date.now()}`;
    const readableVesselId =
      survey?.vessel?.vesselId ||
      survey?.vesselId ||
      survey?.vessel?.id ||
      survey?.vessel?.identifier ||
      null;
    const shipName = survey?.vessel?.name || survey?.vesselName || survey?.shipName || survey?.title || 'Active Survey';

    return {
      id: `hull-${Date.now()}`,
      type: 'hull-inspection',
      reportType: 'Hull Inspection',
      surveyId,
      shipId: readableVesselId || surveyId,
      displayId: readableVesselId || surveyId,
      shipName,
      timestamp,
      filename: results.filename,
      totalDetections: results.total_detections || 0,
      crackCount: results.summary?.crack || 0,
      corrosionCount: results.summary?.corrosion || 0,
      overallCondition: getHullConditionLabel(results),
      summary: results.summary || { crack: 0, corrosion: 0, other: 0 },
      detections: results.detections || [],
      annotatedImage: results.annotated_image,
      modelInfo: results.model_info || {},
      inference: results.inference || {},
      surveyMeta: {
        vesselName: shipName,
        originalSurvey: survey || null
      }
    };
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    setResults(null);
    setError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRunDetection = async () => {
    if (!selectedImage) {
      setError('Please select an image first.');
      return;
    }

    setIsDetecting(true);
    setError(null);
    setResults(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await axios.post('/api/hull-inspection/detect', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 40000
      });

      setResults(response.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Detection failed';
      setError(msg);
    } finally {
      setIsDetecting(false);
    }
  };

  const getSeverityColor = (confidence) => {
    if (confidence >= 80) return 'bg-red-100 text-red-800 border-red-300';
    if (confidence >= 60) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getSeverityLabel = (confidence) => {
    if (confidence >= 80) return 'Critical';
    if (confidence >= 60) return 'High';
    return 'Medium';
  };

  const getDefectIcon = (className) => {
    if (className.toLowerCase().includes('crack')) {
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  };

  const handleDownloadPdf = () => {
    const reportPayload = buildReportPayload();
    if (!reportPayload) {
      setError('Run AI detection before downloading the report.');
      return;
    }

    downloadHullInspectionPdf(reportPayload);
    setSuccessMessage('PDF report download started. Browser download location depends on your browser settings.');
  };

  const handleSaveToSurveyReports = async () => {
    const reportPayload = buildReportPayload();
    if (!reportPayload) {
      setError('Run AI detection before saving the report.');
      return;
    }

    try {
      const compressedAnnotatedImage = await compressImageDataUrl(reportPayload.annotatedImage, 1000, 0.55);
      const compressedPayload = {
        ...reportPayload,
        annotatedImage: compressedAnnotatedImage
      };

      let payloadToSave = compressedPayload;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          '/api/custom-reports',
          {
            type: 'hull-inspection',
            payload: compressedPayload
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        payloadToSave = response.data;
      } catch (apiError) {
        console.error('Failed to save hull report to backend, using local fallback:', apiError);
      }

      const existingReports = JSON.parse(localStorage.getItem('hullInspectionReports') || '[]');
      const updatedReports = [payloadToSave, ...existingReports].slice(0, 10);
      localStorage.setItem('hullInspectionReports', JSON.stringify(updatedReports));

      const savedReports = JSON.parse(localStorage.getItem('hullInspectionReports') || '[]');
      const savedReport = savedReports.find((item) => item.id === payloadToSave.id || item._id === payloadToSave._id);

      if (!savedReport) {
        throw new Error('Saved report could not be verified after storage.');
      }

      if (onSaveReport) {
        onSaveReport(payloadToSave);
      }

      setSuccessMessage('Hull inspection report saved to Recent Reports successfully.');
      setError(null);
    } catch (saveError) {
      console.error('Failed to save hull inspection report:', saveError);
      setError('Failed to save hull inspection report.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ship Hull Inspection</h2>
              {survey && (
                <p className="text-sm text-gray-500">
                  {survey.vesselName || survey.title || 'Active Survey'} — YOLOv8 Defect Detection
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Ship Hull Image
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Selected hull"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-gray-500">{selectedImage?.name}</p>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Choose a different image
                </button>
              </div>
            ) : (
              <div
                className="cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 font-medium">Click to choose image</p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG, JPEG supported</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Run Detection Button */}
          <button
            onClick={handleRunDetection}
            disabled={!selectedImage || isDetecting}
            className={`mt-4 w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              !selectedImage || isDetecting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
            }`}
          >
            {isDetecting ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Analyzing with YOLOv8...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Run AI Detection</span>
              </span>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {results && results.success && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Ship Hull Inspection Result</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {results.total_detections > 0
                    ? `${results.total_detections} defect${results.total_detections !== 1 ? 's' : ''} detected`
                    : 'No defects detected — Hull appears clean'}
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{results.total_detections}</p>
                  <p className="text-xs text-gray-500">Total Defects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{results.summary?.crack || 0}</p>
                  <p className="text-xs text-gray-500">Cracks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{results.summary?.corrosion || 0}</p>
                  <p className="text-xs text-gray-500">Corrosion</p>
                </div>
              </div>

              {/* Defect List */}
              {results.detections && results.detections.length > 0 && (
                <div className="p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                    Defects Detected:
                  </h4>
                  <div className="space-y-2">
                    {results.detections.map((det, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border ${getSeverityColor(det.confidence)}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={det.confidence >= 80 ? 'text-red-600' : 'text-orange-600'}>
                            {getDefectIcon(det.class)}
                          </span>
                          <div>
                            <p className="font-semibold capitalize">{det.class}</p>
                            <p className="text-xs opacity-75">
                              Box: ({Math.round(det.bbox.x1)}, {Math.round(det.bbox.y1)}) → ({Math.round(det.bbox.x2)}, {Math.round(det.bbox.y2)})
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{det.confidence}%</p>
                          <p className="text-xs">{getSeverityLabel(det.confidence)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.total_detections === 0 && (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-600 font-semibold">No defects detected</p>
                  <p className="text-gray-500 text-sm">Hull appears to be in good condition</p>
                </div>
              )}
            </div>

            {/* Annotated Image with Bounding Boxes */}
            {results.annotated_image && (
              <>
                {successMessage && (
                  <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-2 flex items-start space-x-2">
                    <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 flex items-center space-x-2">
                  <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="font-semibold text-gray-700">Detection Result — Bounding Boxes</h4>
                </div>
                <div className="p-4">
                  <img
                    src={results.annotated_image}
                    alt="Annotated hull with detections"
                    className="w-full rounded-lg object-contain max-h-96"
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Model: {results.model_info?.model || 'YOLOv8'} • {results.filename}
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleDownloadPdf}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto"
                    >
                      Download PDF Report
                    </button>
                    <button
                      onClick={handleSaveToSurveyReports}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
                    >
                      Save to Survey Reports
                    </button>
                  </div>
                </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
