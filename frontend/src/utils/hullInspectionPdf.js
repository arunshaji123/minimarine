import { jsPDF } from 'jspdf';

const safeText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

export const getHullConditionLabel = (report) => {
  const crackCount = report?.summary?.crack ?? report?.crackCount ?? 0;
  const corrosionCount = report?.summary?.corrosion ?? report?.corrosionCount ?? 0;
  const totalDetections = report?.total_detections ?? report?.totalDetections ?? 0;

  if (totalDetections === 0) return 'Clean';
  if (crackCount > 0 && corrosionCount > 0) return 'Crack & Corrosion';
  if (crackCount > 0) return 'Crack Detected';
  if (corrosionCount > 0) return 'Corrosion Detected';
  return 'Needs Review';
};

export const downloadHullInspectionPdf = (report) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const surveyId = safeText(report?.surveyId || report?.shipId || report?.id);
  const shipName = safeText(report?.shipName);
  const timestamp = report?.timestamp ? new Date(report.timestamp).toLocaleString('en-GB') : 'N/A';
  const filename = safeText(report?.filename);
  const totalDetections = report?.total_detections ?? report?.totalDetections ?? 0;
  const crackCount = report?.summary?.crack ?? report?.crackCount ?? 0;
  const corrosionCount = report?.summary?.corrosion ?? report?.corrosionCount ?? 0;
  const condition = report?.overallCondition || getHullConditionLabel(report);
  const detections = Array.isArray(report?.detections) ? report.detections : [];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Ship Hull Inspection Report', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, y);
  y += 8;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const rows = [
    ['Survey ID', surveyId],
    ['Ship / Vessel', shipName],
    ['Inspection Time', timestamp],
    ['Source Image', filename],
    ['Total Defects', String(totalDetections)],
    ['Cracks', String(crackCount)],
    ['Corrosion', String(corrosionCount)],
    ['Condition', condition],
    ['Model', safeText(report?.modelInfo?.model || report?.model_info?.model, 'YOLOv8')]
  ];

  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(safeText(value), pageWidth - margin - 42);
    doc.text(lines, margin + 42, y);
    y += Math.max(6, lines.length * 5);
  });

  if (report?.annotatedImage) {
    if (y > 150) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Detection Result - Bounding Boxes', margin, y);
    y += 6;

    try {
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = Math.min(100, pageHeight - y - margin);
      doc.addImage(report.annotatedImage, 'JPEG', margin, y, imgWidth, imgHeight);
      y += imgHeight + 8;
    } catch (err) {
      doc.setFont('helvetica', 'normal');
      doc.text('Annotated image could not be embedded in the PDF.', margin, y);
      y += 8;
    }
  }

  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Detected Defects', margin, y);
  y += 8;

  if (detections.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('No defects detected.', margin, y);
  } else {
    detections.forEach((detection, index) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = margin;
      }

      const bbox = detection?.bbox || {};
      const line = [
        `${index + 1}. ${safeText(detection?.class, 'defect')}`,
        `Confidence: ${safeText(detection?.confidence, 0)}%`,
        `Box: (${Math.round(bbox.x1 || 0)}, ${Math.round(bbox.y1 || 0)}) -> (${Math.round(bbox.x2 || 0)}, ${Math.round(bbox.y2 || 0)})`
      ].join(' | ');

      const lines = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    });
  }

  const sanitizedShipName = safeText(shipName, 'ship').replace(/[^a-z0-9_-]+/gi, '_');
  doc.save(`Hull_Inspection_Report_${sanitizedShipName}_${Date.now()}.pdf`);
};
