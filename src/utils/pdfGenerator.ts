import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';

export interface PdfReportData {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  title: string;
  subtitle: string;
  documentRef: string;
  dateRange: string;
  generatedDate: string;
  tenantInfo: {
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
    logo?: string;
  };
  clientInfo?: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
  } | null;
  kpis: {
    totalLiters: number | string;
    totalCost: number | string;
    totalEntries: number | string;
    anomaliesCount?: number | string;
  };
  tableHeaders: string[];
  tableRows: (string | number)[][];
  preparedBy: {
    name: string;
    roleTitle: string;
    phone?: string;
    email?: string;
  };
}

export interface DomPdfOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  scale?: number;
  onProgress?: (status: string) => void;
}

/**
 * 1. DIRECT VECTOR PDF GENERATOR (ISSUE 4 Fix)
 * Generates pure vector PDF using jsPDF + autoTable with standard Hex & RGB colors.
 * Completely immune to Tailwind CSS "unsupported color function oklch" error.
 */
export async function generateCleanVectorPdf(
  data: PdfReportData,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    onProgress?.('Initializing vector PDF document...');

    const orientation = data.orientation || 'landscape';
    const isPortrait = orientation === 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = isPortrait ? 210 : 297;
    const pageHeight = isPortrait ? 297 : 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const rightX = pageWidth - margin;
    let currentY = margin + 2;

    // 1. Company Letterhead (Left) and Document Ref (Right)
    let companyNameStartX = margin;
    if (data.tenantInfo?.logo && typeof data.tenantInfo.logo === 'string' && data.tenantInfo.logo.startsWith('data:image')) {
      try {
        pdf.addImage(data.tenantInfo.logo, 'PNG', margin, currentY - 2.5, 14, 10, undefined, 'FAST');
        companyNameStartX = margin + 17;
      } catch (err) {
        // Fallback without logo
      }
    }

    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42); // #0f172a
    pdf.text((data.tenantInfo?.name || 'COMPANY').toUpperCase(), companyNameStartX, currentY + 3);

    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139); // #64748b
    pdf.text(`Ref: ${data.documentRef}`, rightX, currentY + 3, { align: 'right' });
    currentY += 8;

    // 2. Company Subtitle & Contact Info (Left column) and Date Metadata (Right column)
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);

    // Left block: Address and Contact
    const officeLine = `Office: ${data.tenantInfo.address}`;
    const contactLine = `Phone: ${data.tenantInfo.phone} | Email: ${data.tenantInfo.email}`;
    pdf.text(officeLine, margin, currentY);
    pdf.text(contactLine, margin, currentY + 3.8);

    // Right block: Date Range and Generated Date cleanly stacked
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Date Range: ${data.dateRange}`, rightX, currentY, { align: 'right' });
    pdf.text(`Generated: ${data.generatedDate}`, rightX, currentY + 3.8, { align: 'right' });
    currentY += 8.5;

    // 3. Double Divider Line (Under Letterhead)
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, rightX, currentY);
    pdf.setLineWidth(0.15);
    pdf.line(margin, currentY + 0.7, rightX, currentY + 0.7);
    currentY += 5;

    // 4. Report Title Banner & Optional Client Info
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(data.title.toUpperCase(), margin, currentY);

    if (data.clientInfo) {
      pdf.setFont('times', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(180, 83, 9); // #b45309
      pdf.text(`Client: ${data.clientInfo.name} (${data.clientInfo.code})`, rightX, currentY, { align: 'right' });
    }
    currentY += 4.5;

    // 5. KPI Summary Box
    const kpiBoxHeight = 10;
    pdf.setFillColor(248, 250, 252); // #f8fafc
    pdf.setDrawColor(203, 213, 225); // #cbd5e1
    pdf.rect(margin, currentY, contentWidth, kpiBoxHeight, 'FD');

    pdf.setFont('times', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);

    const kpiY = currentY + 6.2;
    const colWidth = contentWidth / 4;

    pdf.text(`Total Fuel: ${data.kpis.totalLiters} L`, margin + 3, kpiY);
    pdf.text(`Total Cost: BDT ${data.kpis.totalCost}`, margin + colWidth + 3, kpiY);
    pdf.text(`Total Slips: ${data.kpis.totalEntries}`, margin + colWidth * 2 + 3, kpiY);
    if (data.kpis.anomaliesCount !== undefined) {
      pdf.setTextColor(220, 38, 38); // #dc2626
      pdf.text(`Anomalies: ${data.kpis.anomaliesCount}`, margin + colWidth * 3 + 3, kpiY);
    }
    currentY += kpiBoxHeight + 4;

    onProgress?.('Formatting audit ledger table...');

    // Render Data Table using autoTable with standard Hex styling
    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 28 },
      head: [data.tableHeaders],
      body: data.tableRows,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7.5,
        textColor: [30, 41, 59], // #1e293b
        lineColor: [203, 213, 225], // #cbd5e1
        lineWidth: 0.15,
        cellPadding: 1.8,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42], // #0f172a
        textColor: [255, 255, 255], // #ffffff
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // #f8fafc
      },
      didDrawPage: (hookData) => {
        // Footer: Page Number & Audit Note
        const str = `Page ${hookData.pageNumber} of {total_pages_count_string}`;
        pdf.setFont('times', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(str, pageWidth / 2, pageHeight - 6, { align: 'center' });
        pdf.text('FuelNest Cloud Audit & Fleet Intelligence System • fuelnest.xyz', margin, pageHeight - 6);
      }
    });

    // Add Signature Footer on the last page
    const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 40;
    let sigY = finalY + 12;

    // If table ends near bottom of page, create a new page for signatures
    if (sigY > pageHeight - 24) {
      pdf.addPage();
      sigY = 30;
    }

    const sigColWidth = (pageWidth - margin * 2) / 3;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);

    // Prepared By
    const x1 = margin + 10;
    pdf.setDrawColor(148, 163, 184);
    pdf.line(x1, sigY, x1 + sigColWidth - 20, sigY);
    pdf.setFont('times', 'bold');
    pdf.text('Prepared By', x1, sigY + 4);
    pdf.setFont('times', 'normal');
    pdf.text(data.preparedBy.name, x1, sigY + 8);
    pdf.text(data.preparedBy.roleTitle, x1, sigY + 11.5);

    // Verified By
    const x2 = margin + sigColWidth + 10;
    pdf.line(x2, sigY, x2 + sigColWidth - 20, sigY);
    pdf.setFont('times', 'bold');
    pdf.text('Verified By', x2, sigY + 4);
    pdf.setFont('times', 'normal');
    pdf.text('Fleet Audit & Accounts Dept', x2, sigY + 8);
    pdf.text('Authorized Signature', x2, sigY + 11.5);

    // Approved By
    const x3 = margin + sigColWidth * 2 + 10;
    pdf.line(x3, sigY, x3 + sigColWidth - 20, sigY);
    pdf.setFont('times', 'bold');
    pdf.text('Approved By', x3, sigY + 4);
    pdf.setFont('times', 'normal');
    pdf.text('Managing Director / COO', x3, sigY + 8);
    pdf.text('Official Seal & Date', x3, sigY + 11.5);

    // Total pages count replacement
    if (typeof (pdf as any).putTotalPages === 'function') {
      (pdf as any).putTotalPages('{total_pages_count_string}');
    }

    onProgress?.('Saving PDF file...');
    pdf.save(data.filename || 'FuelNest_Audit_Report.pdf');

    return { success: true };
  } catch (err: any) {
    console.error('Vector PDF error:', err);
    return { success: false, error: err?.message || 'Failed to generate PDF' };
  }
}

export interface PumpStatementPdfData {
  filename?: string;
  statementRef: string;
  generatedDate: string;
  dateRange: string;
  tenantInfo: {
    name: string;
    code: string;
    address: string;
    phone: string;
    contactPerson: string;
  };
  pumpInfo: {
    name: string;
    location: string;
    contactPerson: string;
    phone: string;
  };
  financialSummary: {
    openingBalance: number;
    totalCharges: number;
    totalPaid: number;
    totalLiters: number;
    dueAmount: number;
    advanceAmount: number;
  };
  fuelEntries: {
    entryDate: string;
    slipNo: string;
    vehicleId: string;
    fuelLiters: number;
    unitPrice: number;
    totalAmount: number;
  }[];
  payments: {
    paymentDate: string;
    transactionRef: string;
    paymentMethod: string;
    amount: number;
    notes?: string;
  }[];
  preparedBy: {
    name: string;
    roleTitle: string;
    username: string;
    email?: string;
  };
}

/**
 * Direct Vector PDF Generator for Fuel Pump Billing & Reconciliation Statements.
 * Generates an executive A4 document in Times New Roman with letterhead,
 * financial reconciliation cards, fuel entries table, payment settlements table,
 * and official signatures.
 */
export async function generateCleanPumpStatementPdf(
  data: PumpStatementPdfData,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    onProgress?.('Initializing statement PDF document...');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const rightX = pageWidth - margin;
    let currentY = margin + 2;

    // 1. Company Letterhead (Left) and Statement Ref (Right)
    pdf.setFont('times', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(15, 23, 42);
    pdf.text(data.tenantInfo.name.toUpperCase(), margin, currentY + 3);

    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Ref: ${data.statementRef}`, rightX, currentY + 3, { align: 'right' });
    currentY += 8;

    // 2. Company Subtitle & Contact Info (Left) and Date Metadata (Right)
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Office: ${data.tenantInfo.address}`, margin, currentY);
    pdf.text(`Phone: ${data.tenantInfo.phone} | In-Charge: ${data.tenantInfo.contactPerson}`, margin, currentY + 3.8);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Period: ${data.dateRange}`, rightX, currentY, { align: 'right' });
    pdf.text(`Generated: ${data.generatedDate}`, rightX, currentY + 3.8, { align: 'right' });
    currentY += 8.5;

    // 3. Double Divider Line
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, rightX, currentY);
    pdf.setLineWidth(0.15);
    pdf.line(margin, currentY + 0.7, rightX, currentY + 0.7);
    currentY += 5;

    // 4. Statement Title Banner
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('FUEL PUMP BILLING & RECONCILIATION STATEMENT', margin, currentY);

    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text(`Station: ${data.pumpInfo.name}`, rightX, currentY, { align: 'right' });
    currentY += 4.5;

    // Station Location and Contact line
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Location: ${data.pumpInfo.location} | Contact: ${data.pumpInfo.contactPerson} (${data.pumpInfo.phone})`, margin, currentY);
    currentY += 4.5;

    // 5. Financial Reconciliation KPI Box
    const kpiBoxHeight = 12;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(margin, currentY, contentWidth, kpiBoxHeight, 'FD');

    const colW = contentWidth / 4;
    const kpiTextY = currentY + 4.5;
    const kpiValY = currentY + 9.5;

    // Col 1: Opening Due
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text('OPENING DUE', margin + 3, kpiTextY);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`BDT ${data.financialSummary.openingBalance.toLocaleString()}`, margin + 3, kpiValY);

    // Col 2: Fuel Purchased
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(180, 83, 9);
    pdf.text('(+) FUEL CHARGES', margin + colW + 3, kpiTextY);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text(`BDT ${data.financialSummary.totalCharges.toLocaleString()}`, margin + colW + 3, kpiValY);

    // Col 3: Total Paid
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(22, 101, 52);
    pdf.text('(-) SETTLEMENTS PAID', margin + colW * 2 + 3, kpiTextY);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(22, 101, 52);
    pdf.text(`BDT ${data.financialSummary.totalPaid.toLocaleString()}`, margin + colW * 2 + 3, kpiValY);

    // Col 4: Net Balance
    const hasDue = data.financialSummary.dueAmount > 0;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(hasDue ? 220 : 22, hasDue ? 38 : 101, hasDue ? 38 : 52);
    pdf.text(hasDue ? 'NET OUTSTANDING DUE' : 'NET ADVANCE BALANCE', margin + colW * 3 + 3, kpiTextY);
    pdf.setFontSize(9);
    pdf.text(`BDT ${(hasDue ? data.financialSummary.dueAmount : data.financialSummary.advanceAmount).toLocaleString()}`, margin + colW * 3 + 3, kpiValY);

    currentY += kpiBoxHeight + 5;

    // 6. Section 1: Itemized Fuel Intake Slips
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`ITEMIZED FUEL INTAKE SLIPS (${data.fuelEntries.length} slips, ${data.financialSummary.totalLiters.toLocaleString()} Liters)`, margin, currentY);
    currentY += 2.5;

    const fuelHeaders = ['Date', 'Slip No', 'Vehicle ID', 'Fuel Liters', 'Unit Price (BDT)', 'Total Amount (BDT)'];
    const fuelRows = data.fuelEntries.map(e => [
      e.entryDate,
      e.slipNo,
      e.vehicleId,
      `${e.fuelLiters} L`,
      e.unitPrice.toFixed(2),
      e.totalAmount.toLocaleString()
    ]);

    if (fuelRows.length === 0) {
      fuelRows.push(['—', '—', 'No fuel intake entries recorded for this period', '—', '—', '—']);
    }

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 26 },
      head: [fuelHeaders],
      body: fuelRows,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        cellPadding: 1.5,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left'
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (hookData) => {
        const str = `Page ${hookData.pageNumber} of {total_pages_count_string}`;
        pdf.setFont('times', 'italic');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(str, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pdf.text('FuelNest Fleet Audit & Reconciliation System • fuelnest.xyz', margin, pageHeight - 5);
      }
    });

    currentY = (pdf as any).lastAutoTable?.finalY + 5;

    // Check if we need a page break before payment table
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = margin + 5;
    }

    // 7. Section 2: Payment Settlement History
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`PAYMENT SETTLEMENT HISTORY (${data.payments.length} payments, Total Paid: BDT ${data.financialSummary.totalPaid.toLocaleString()})`, margin, currentY);
    currentY += 2.5;

    const paymentHeaders = ['Date', 'Reference / Cheque No', 'Payment Method', 'Amount Paid (BDT)', 'Remarks / Notes'];
    const paymentRows = data.payments.map(p => [
      p.paymentDate,
      p.transactionRef,
      p.paymentMethod.toUpperCase(),
      p.amount.toLocaleString(),
      p.notes || '—'
    ]);

    if (paymentRows.length === 0) {
      paymentRows.push(['—', '—', 'No payment settlements recorded for this period', '—', '—']);
    }

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 26 },
      head: [paymentHeaders],
      body: paymentRows,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        cellPadding: 1.5,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left'
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (hookData) => {
        const str = `Page ${hookData.pageNumber} of {total_pages_count_string}`;
        pdf.setFont('times', 'italic');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(str, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pdf.text('FuelNest Fleet Audit & Reconciliation System • fuelnest.xyz', margin, pageHeight - 5);
      }
    });

    // 8. Signatures Block
    const finalTableY = (pdf as any).lastAutoTable?.finalY || currentY + 30;
    let sigY = finalTableY + 10;
    if (sigY > pageHeight - 24) {
      pdf.addPage();
      sigY = 25;
    }

    const sigColWidth = contentWidth / 3;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);

    // Prepared By
    const x1 = margin + 5;
    pdf.setDrawColor(148, 163, 184);
    pdf.line(x1, sigY, x1 + sigColWidth - 10, sigY);
    pdf.setFont('times', 'bold');
    pdf.text('Prepared By', x1, sigY + 3.5);
    pdf.setFont('times', 'normal');
    pdf.text(data.preparedBy.name, x1, sigY + 7);
    pdf.text(data.preparedBy.roleTitle, x1, sigY + 10.5);

    // Verified By
    const x2 = margin + sigColWidth + 5;
    pdf.line(x2, sigY, x2 + sigColWidth - 10, sigY);
    pdf.setFont('times', 'bold');
    pdf.text('Verified By', x2, sigY + 3.5);
    pdf.setFont('times', 'normal');
    pdf.text('Fleet Audit & Accounts Dept', x2, sigY + 7);
    pdf.text('Authorized Signature', x2, sigY + 10.5);

    // Pump Authority
    const x3 = margin + sigColWidth * 2 + 5;
    pdf.line(x3, sigY, x3 + sigColWidth - 10, sigY);
    pdf.setFont('times', 'bold');
    pdf.text('Pump Station Authority', x3, sigY + 3.5);
    pdf.setFont('times', 'normal');
    pdf.text('Station Manager Seal & Signature', x3, sigY + 7);
    pdf.text(data.pumpInfo.name, x3, sigY + 10.5);

    if (typeof (pdf as any).putTotalPages === 'function') {
      (pdf as any).putTotalPages('{total_pages_count_string}');
    }

    onProgress?.('Saving PDF file...');
    pdf.save(data.filename || `Pump_Statement_${data.statementRef}.pdf`);

    return { success: true };
  } catch (err: any) {
    console.error('Vector Pump Statement PDF error:', err);
    return { success: false, error: err?.message || 'Failed to generate statement PDF' };
  }
}

/**
 * 2. DOM-BASED PDF FALLBACK (ISSUE 4 Fix for html2canvas)
 * Strips all external Tailwind stylesheets that use oklch colors before capturing.
 * Injects clean standard CSS rules with Hex colors so html2canvas never throws
 * "Attempting to parse an unsupported color function oklch".
 */
export async function downloadElementAsA4Pdf(
  element: HTMLElement,
  options: DomPdfOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      filename = `FuelNest_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation = 'landscape',
      scale = 2,
      onProgress
    } = options;

    onProgress?.('Sanitizing document styles for PDF engine...');

    const isPortrait = orientation === 'portrait';
    const a4WidthMm = isPortrait ? 210 : 297;
    const a4HeightMm = isPortrait ? 297 : 210;

    onProgress?.('Rendering document canvas...');

    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(element.scrollWidth, 1200),
      onclone: (clonedDoc) => {
        // Enforce light theme print styling on cloned document
        const printStyles = clonedDoc.createElement('style');
        printStyles.textContent = `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .dark {
            color-scheme: light !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
        `;
        clonedDoc.head.appendChild(printStyles);

        const clonedTarget = (element.id ? clonedDoc.getElementById(element.id) : null) || clonedDoc.body;
        if (clonedTarget) {
          clonedTarget.style.display = 'block';
          clonedTarget.style.visibility = 'visible';
          clonedTarget.style.backgroundColor = '#ffffff';
          clonedTarget.style.overflow = 'visible';
          clonedTarget.style.height = 'auto';
          clonedTarget.style.maxHeight = 'none';
        }
      }
    });

    onProgress?.('Generating A4 PDF pages...');
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgWidthMm = a4WidthMm;
    const imgHeightMm = (canvas.height * a4WidthMm) / canvas.width;

    let heightLeft = imgHeightMm;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm, undefined, 'FAST');
    heightLeft -= a4HeightMm;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm, undefined, 'FAST');
      heightLeft -= a4HeightMm;
    }

    onProgress?.('Downloading PDF...');
    pdf.save(filename);

    return { success: true };
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to generate PDF document.'
    };
  }
}
