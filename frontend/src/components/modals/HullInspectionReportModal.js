import React from 'react';
import { downloadHullInspectionPdf, getHullConditionLabel } from '../../utils/hullInspectionPdf';

const severityColor = (confidence) => {
  if (confidence >= 80) return 'bg-red-100 text-red-800 border-red-300';
  if (confidence >= 60) return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-yellow-100 text-yellow-800 border-yellow-300';
};

export default function HullInspectionReportModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null;

  const detections = Array.isArray(report.detections) ? report.detections : [];
  const totalDetections = report.totalDetections ?? report.total_detections ?? 0;
  const crackCount = report.crackCount ?? report.summary?.crack ?? 0;
  const corrosionCount = report.corrosionCount ?? report.summary?.corrosion ?? 0;
  const condition = report.overallCondition || getHullConditionLabel(report);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Ship Hull Inspection Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              {report.shipName || 'Active Survey'} • {report.timestamp ? new Date(report.timestamp).toLocaleString('en-GB') : 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadHullInspectionPdf(report)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Survey ID</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{report.surveyId || report.shipId || report.id}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total Defects</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{totalDetections}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Crack / Corrosion</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{crackCount} / {corrosionCount}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Condition</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{condition}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h4 className="text-lg font-bold text-white">Ship Hull Inspection Result</h4>
              <p className="text-blue-100 text-sm mt-1">{report.filename || 'Hull inspection image'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{totalDetections}</p>
                <p className="text-xs text-gray-500">Total Defects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{crackCount}</p>
                <p className="text-xs text-gray-500">Cracks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{corrosionCount}</p>
                <p className="text-xs text-gray-500">Corrosion</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h5 className="font-semibold text-gray-700 mb-3">Detection Result — Bounding Boxes</h5>
                {report.annotatedImage ? (
                  <img
                    src={report.annotatedImage}
                    alt="Annotated hull inspection"
                    className="w-full rounded-lg object-contain max-h-[28rem] border border-gray-200"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No annotated image saved for this report.</p>
                )}
              </div>

              <div>
                <h5 className="font-semibold text-gray-700 mb-3">Detected Defects</h5>
                {detections.length === 0 ? (
                  <p className="text-sm text-green-600 font-medium">No defects detected for this inspection.</p>
                ) : (
                  <div className="space-y-2">
                    {detections.map((det, idx) => (
                      <div
                        key={`${det.class}-${idx}`}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border ${severityColor(det.confidence)}`}
                      >
                        <div>
                          <p className="font-semibold capitalize">{det.class}</p>
                          <p className="text-xs opacity-75">
                            Box: ({Math.round(det.bbox?.x1 || 0)}, {Math.round(det.bbox?.y1 || 0)}) → ({Math.round(det.bbox?.x2 || 0)}, {Math.round(det.bbox?.y2 || 0)})
                          </p>
                        </div>
                        <div className="text-right font-bold">{det.confidence}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
