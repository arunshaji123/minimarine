import { jsPDF } from 'jspdf';

const asText = (value, fallback = 'N/A') => {
  if (value === 0) return '0';
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

export const downloadProfessionalPaymentReceipt = (rawData = {}) => {
  const data = {
    receiptNumber: asText(rawData.receiptNumber),
    paidAtText: asText(rawData.paidAtText || rawData.paidAt),
    amountText: rawData.amountText || `INR ${Number(rawData.amount || 0).toFixed(2)} ${rawData.currency || 'INR'}`,
    payerName: asText(rawData.payerName, 'Payer'),
    payerEmail: asText(rawData.payerEmail),
    recipientName: asText(rawData.recipientName || rawData.surveyorName || rawData.receiverName, 'Recipient'),
    recipientEmail: asText(rawData.recipientEmail || rawData.surveyorEmail || rawData.receiverEmail),
    vesselName: asText(rawData.vesselName, 'Unknown Vessel'),
    vesselCode: asText(rawData.vesselCode),
    paymentMethod: asText(rawData.paymentMethod, 'Razorpay'),
    paymentId: asText(rawData.paymentId || rawData.razorpayPaymentId),
    orderId: asText(rawData.orderId || rawData.razorpayOrderId),
    generatedOn: new Date().toLocaleString(),
    filePrefix: asText(rawData.filePrefix, 'Payment_Receipt')
  };

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  let y = 24;

  const drawFrame = () => {
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.4);
    doc.line(margin, 14, pageWidth - margin, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('Marine Survey System • Official Payment Receipt', margin, 11);

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${data.generatedOn}`, margin, pageHeight - 12);
  };

  const addSectionHeader = (title) => {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(title, margin + 2, y + 5.3);
    y += 11;
  };

  const addRow = (label, value) => {
    const labelX = margin + 2;
    const valueX = margin + 63;
    const valueWidth = contentWidth - 65;
    const wrapped = doc.splitTextToSize(asText(value), valueWidth);
    const rowHeight = Math.max(lineHeight, wrapped.length * lineHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(`${label}:`, labelX, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(wrapped, valueX, y + 4.8);
    y += rowHeight;
  };

  drawFrame();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('PAYMENT RECEIPT', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Receipt No: ${data.receiptNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setDrawColor(191, 219, 254);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text('Amount Received', margin + 3, y + 5.5);
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(data.amountText, margin + 3, y + 11.2);
  y += 18;

  addSectionHeader('Transaction Details');
  addRow('Paid At', data.paidAtText);
  addRow('Payment Method', data.paymentMethod);
  addRow('Payment ID', data.paymentId);
  addRow('Order / Reference ID', data.orderId);
  y += 2;

  addSectionHeader('Payer and Recipient');
  addRow('Paid By', `${data.payerName} (${data.payerEmail})`);
  addRow('Received By', `${data.recipientName} (${data.recipientEmail})`);
  y += 2;

  addSectionHeader('Survey Context');
  addRow('Vessel Name', data.vesselName);
  addRow('Vessel ID / IMO', data.vesselCode);
  y += 6;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Authorized By', margin, y + 4.5);
  doc.text('Recipient Signature', pageWidth - margin, y + 4.5, { align: 'right' });

  const safeReceipt = data.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${data.filePrefix}_${safeReceipt}.pdf`);
};
