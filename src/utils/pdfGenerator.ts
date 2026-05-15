import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '../types';

export const generatePDF = (project: Project, options: { branding?: any } = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryColor: [number, number, number] = [6, 182, 212]; // Cyan #06B6D4
  const secondaryColor: [number, number, number] = [139, 92, 246]; // Violet #8B5CF6
  const darkColor: [number, number, number] = [10, 10, 10];
  const grayColor: [number, number, number] = [100, 100, 100];

  const pageWidth = doc.internal.pageSize.getWidth();
  let startY = 20;

  // --- Header ---
  doc.setFontSize(24);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  
  // Title depends on phase
  let title = 'DOCUMENTO TÉCNICO';
  let filePrefix = 'Documento';
  
  switch(project.status) {
    case 'survey':
      title = 'LEVANTAMIENTO TÉCNICO';
      filePrefix = 'Levantamiento';
      break;
    case 'quoted':
      title = 'COTIZACIÓN FORMAL';
      filePrefix = 'Cotizacion';
      break;
    case 'in_progress':
      title = 'REPORTE DE ACTIVIDADES';
      filePrefix = 'Reporte_Actividades';
      break;
    case 'completed':
      title = 'CUENTA DE COBRO';
      filePrefix = 'Cuenta_Cobro';
      break;
  }

  doc.text(title, 14, startY);

  // Subtitle / Reference
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.text(`REF: ${project.reference}`, 14, startY + 6);
  if (project.status === 'completed' && project.dianInvoiceNumber) {
    doc.text(`Factura DIAN: ${project.dianInvoiceNumber}`, 14, startY + 11);
  }

  // Company Brand Placeholder (Top Right)
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Master FixPC', pageWidth - 14, startY, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Ingeniería & Seguridad', pageWidth - 14, startY + 5, { align: 'right' });
  
  startY += 25;

  // --- Client Info Section ---
  doc.setFillColor(245, 245, 245);
  doc.rect(14, startY, pageWidth - 28, 30, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', 18, startY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente/Empresa: ${project.client.name}`, 18, startY + 12);
  doc.text(`Contacto: ${project.client.contact || 'N/A'}`, 18, startY + 17);
  doc.text(`Teléfono: ${project.client.phone || 'N/A'}`, 18, startY + 22);
  doc.text(`Dirección: ${project.client.address || 'N/A'}`, 18, startY + 27);

  // Date/Time Box
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DEL PROYECTO', pageWidth / 2 + 10, startY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${project.date}`, pageWidth / 2 + 10, startY + 12);
  doc.text(`Hora: ${project.time}`, pageWidth / 2 + 10, startY + 17);
  doc.text(`Estado: ${project.status.toUpperCase()}`, pageWidth / 2 + 10, startY + 22);

  startY += 40;

  // --- Main Services Table ---
  if (project.items && project.items.length > 0) {
    autoTable(doc, {
      startY,
      head: [['Descripción del Servicio', 'Cant', 'Valor Unit', 'Subtotal']],
      body: project.items.map(item => [
        item.description,
        item.quantity.toString(),
        `$${item.unitPrice.toLocaleString()}`,
        `$${item.total.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Resources / Materials Table ---
  if (project.resources && project.resources.length > 0) {
    autoTable(doc, {
      startY,
      head: [['Materiales e Infraestructura', 'Cant', 'Días', 'Valor Unit', 'Subtotal']],
      body: project.resources.map(res => [
        res.name,
        res.quantity.toString(),
        res.days?.toString() || '1',
        `$${res.unitPrice.toLocaleString()}`,
        `$${res.total.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Activities Log (Bitácora) ---
  if (project.activities && project.activities.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BITÁCORA DE ACTIVIDADES', 14, startY);
    startY += 5;

    autoTable(doc, {
      startY,
      head: [['Fecha', 'Descripción Técnica', 'Horas', 'Aprobado Por']],
      body: project.activities.map(act => [
        `${act.date} ${act.time}`,
        act.description,
        act.estimatedHours.toString(),
        act.authorizedBy || 'N/A'
      ]),
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: darkColor, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
    });
    startY = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- Totals Section ---
  const finalY = startY;
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  
  const totalItems = project.items?.reduce((acc, i) => acc + i.total, 0) || 0;
  const totalResources = project.resources?.reduce((acc, i) => acc + i.total, 0) || 0;
  const totalActivities = project.activities?.reduce((acc, i) => acc + (i.price || 0), 0) || 0;
  const grandTotal = project.total || (totalItems + totalResources + totalActivities);

  doc.text('RESUMEN DE INVERSIÓN', pageWidth - 80, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal Servicios:', pageWidth - 80, finalY + 6);
  doc.text(`$${totalItems.toLocaleString()}`, pageWidth - 14, finalY + 6, { align: 'right' });
  
  doc.text('Subtotal Materiales:', pageWidth - 80, finalY + 12);
  doc.text(`$${totalResources.toLocaleString()}`, pageWidth - 14, finalY + 12, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL GENERAL:', pageWidth - 80, finalY + 20);
  doc.text(`$${grandTotal.toLocaleString()} COP`, pageWidth - 14, finalY + 20, { align: 'right' });

  startY = finalY + 40;

  // --- Signatures ---
  if (startY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    startY = 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');

  // Customer Signature
  if (project.signature) {
    doc.addImage(project.signature, 'PNG', 14, startY, 50, 25);
    doc.line(14, startY + 25, 64, startY + 25);
  } else {
    doc.line(14, startY + 25, 64, startY + 25);
  }
  doc.text('Firma del Cliente', 14, startY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(project.client.name, 14, startY + 34);

  // Provider Signature (Placeholder)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.line(80, startY + 25, 130, startY + 25);
  doc.text('Master FixPC', 80, startY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Ingeniería & Seguridad', 80, startY + 34);

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generado por Cotizador Pro - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Generate filename
  const filename = `${filePrefix}_${project.reference}.pdf`;
  
  // Download
  doc.save(filename);
};
