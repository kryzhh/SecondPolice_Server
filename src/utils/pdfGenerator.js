const PDFDocument = require('pdfkit');

function generateInvoicePDF(invoice, companyName) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── Palette ───────────────────────────────────────────────────────────────
    const NAVY    = '#0F172A';   // header background
    const ROSE    = '#E11D48';   // accent (status, total bar)
    const SLATE   = '#1E293B';   // body text
    const MUTED   = '#64748B';   // secondary text
    const BORDER  = '#E2E8F0';   // table lines
    const LIGHT   = '#F8FAFC';   // alt row bg
    const WHITE   = '#FFFFFF';

    const PW  = doc.page.width;   // 595
    const PH  = doc.page.height;  // 842
    const PAD = 52;               // outer padding
    const CW  = PW - PAD * 2;    // content width

    // ─────────────────────────────────────────────────────────────────────────
    // 1. HEADER BLOCK (dark navy)
    // ─────────────────────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 130).fill(NAVY);

    // Rose left accent bar
    doc.rect(0, 0, 5, 130).fill(ROSE);

    // Company name
    doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold')
       .text(companyName, PAD, 36, { width: CW * 0.5 });

    // "INVOICE" label under company
    doc.fontSize(10).fillColor('rgba(255,255,255,0.45)').font('Helvetica')
       .text('INVOICE', PAD, 65);

    // Right side: invoice number + dates
    const dateISO = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    doc.fontSize(18).fillColor(WHITE).font('Helvetica-Bold')
       .text(invoice.invoiceNo, PAD + CW * 0.5, 33, { width: CW * 0.5, align: 'right' });

    doc.fontSize(9).fillColor('rgba(255,255,255,0.55)').font('Helvetica')
       .text(`Issue Date    ${dateISO(invoice.createdAt)}`, PAD + CW * 0.5, 62, { width: CW * 0.5, align: 'right' })
       .text(`Due Date      ${dateISO(invoice.dueDate)}`,   PAD + CW * 0.5, 78, { width: CW * 0.5, align: 'right' });

    // Status pill (top-right corner)
    const statusColors = { DRAFT:'#64748B', SENT:'#3B82F6', PAID:'#10B981', OVERDUE:'#EF4444', CANCELLED:'#94A3B8' };
    const sc = statusColors[invoice.status] || '#64748B';
    const pillW = 64, pillH = 22, pillX = PW - PAD - pillW, pillY = 96;
    doc.roundedRect(pillX, pillY, pillW, pillH, 11).fill(sc);
    doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold')
       .text(invoice.status, pillX, pillY + 7, { width: pillW, align: 'center' });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FROM / BILL TO  (two columns)
    // ─────────────────────────────────────────────────────────────────────────
    let y = 158;

    doc.fontSize(7.5).fillColor(MUTED).font('Helvetica-Bold')
       .text('FROM',    PAD,          y, { width: CW * 0.45 })
       .text('BILL TO', PAD + CW * 0.5, y, { width: CW * 0.5 });

    y += 14;

    doc.fontSize(11).fillColor(SLATE).font('Helvetica-Bold')
       .text(companyName,       PAD,            y, { width: CW * 0.45 })
       .text(invoice.clientName, PAD + CW * 0.5, y, { width: CW * 0.5 });

    y += 16;

    if (invoice.clientEmail) {
      doc.fontSize(9).fillColor(MUTED).font('Helvetica')
         .text('',                PAD,            y, { width: CW * 0.45 })
         .text(invoice.clientEmail, PAD + CW * 0.5, y, { width: CW * 0.5 });
      y += 14;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. TABLE HEADER
    // ─────────────────────────────────────────────────────────────────────────
    y += 20;

    // Full-width table header background
    doc.rect(PAD, y, CW, 26).fill(LIGHT);

    // Subtle left rose rule on header
    doc.rect(PAD, y, 3, 26).fill(ROSE);

    // Column positions
    const C1 = PAD + 14;          // description
    const C2 = PAD + CW * 0.54;   // qty
    const C3 = PAD + CW * 0.68;   // unit price
    const C4 = PAD + CW * 0.83;   // total

    doc.fontSize(7.5).fillColor(MUTED).font('Helvetica-Bold')
       .text('DESCRIPTION', C1,          y + 9, { width: CW * 0.5 })
       .text('QTY',         C2,          y + 9, { width: 50, align: 'center' })
       .text('UNIT PRICE',  C3,          y + 9, { width: 70, align: 'right' })
       .text('TOTAL',       C4,          y + 9, { width: PW - PAD - C4, align: 'right' });

    y += 26;

    // ─────────────────────────────────────────────────────────────────────────
    // 4. LINE ITEM ROW
    // ─────────────────────────────────────────────────────────────────────────
    const rowH = 38;
    doc.rect(PAD, y, CW, rowH).fill(WHITE);

    // subtle bottom border
    doc.moveTo(PAD, y + rowH).lineTo(PAD + CW, y + rowH).strokeColor(BORDER).lineWidth(0.75).stroke();

    doc.fontSize(10).fillColor(SLATE).font('Helvetica-Bold')
       .text(invoice.deal?.title || 'Service', C1, y + 12, { width: CW * 0.48 });

    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
       .text('1',                          C2, y + 12, { width: 50, align: 'center' })
       .text(fmt(invoice.amount, invoice.currency), C3, y + 12, { width: 70, align: 'right' });

    doc.fontSize(10).fillColor(SLATE).font('Helvetica-Bold')
       .text(fmt(invoice.amount, invoice.currency), C4, y + 12, { width: PW - PAD - C4, align: 'right' });

    y += rowH;

    // ─────────────────────────────────────────────────────────────────────────
    // 5. TOTALS BOX (right-aligned)
    // ─────────────────────────────────────────────────────────────────────────
    y += 24;

    const TB_W = CW * 0.42;   // totals box width
    const TB_X = PAD + CW - TB_W;

    // Helper: draw one totals row
    const totRow = (label, value, color, bold) => {
      doc.fontSize(9)
         .fillColor(color || MUTED).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(label, TB_X,          y, { width: TB_W * 0.52 });
      doc.fontSize(9)
         .fillColor(color || SLATE).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(value, TB_X + TB_W * 0.52, y, { width: TB_W * 0.48, align: 'right' });
      y += 18;
    };

    if (invoice.taxRate > 0) {
      totRow('Subtotal', fmt(invoice.amount,    invoice.currency));
      totRow(`Tax (${invoice.taxRate}%)`, fmt(invoice.taxAmount, invoice.currency));
      // thin divider
      doc.moveTo(TB_X, y - 4).lineTo(TB_X + TB_W, y - 4).strokeColor(BORDER).lineWidth(0.5).stroke();
      y += 4;
    }

    // Total due — filled accent row
    doc.rect(TB_X - 10, y - 4, TB_W + 10, 32).fill(ROSE);
    doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold')
       .text('TOTAL DUE',                              TB_X,          y + 6, { width: TB_W * 0.5 })
       .text(fmt(invoice.totalAmount, invoice.currency), TB_X + TB_W * 0.5, y + 6, { width: TB_W * 0.5, align: 'right' });

    y += 42;

    // ─────────────────────────────────────────────────────────────────────────
    // 6. NOTES (if any)
    // ─────────────────────────────────────────────────────────────────────────
    if (invoice.notes) {
      y += 24;
      doc.rect(PAD, y, CW, 1).fill(BORDER);
      y += 14;
      doc.fontSize(7.5).fillColor(MUTED).font('Helvetica-Bold').text('NOTES', PAD, y);
      y += 12;
      doc.fontSize(9).fillColor(SLATE).font('Helvetica').text(invoice.notes, PAD, y, { width: CW });
      y += doc.heightOfString(invoice.notes, { width: CW });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. FOOTER (pinned near bottom)
    // ─────────────────────────────────────────────────────────────────────────
    const FY = PH - 54;
    doc.rect(0, FY - 12, PW, 66).fill(LIGHT);
    doc.rect(0, FY - 12, 5, 66).fill(NAVY);

    doc.fontSize(8).fillColor(MUTED).font('Helvetica')
       .text(`Thank you for your business, ${invoice.clientName}.`, PAD, FY, { width: CW * 0.55 });

    doc.fontSize(8).fillColor(MUTED).font('Helvetica')
       .text(`Generated by ${companyName} · Powered by Pryvo CRM`, PAD, FY + 14, { width: CW * 0.55 });

    // Right side of footer: total amount large
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text('Amount Due', PAD + CW * 0.6, FY, { width: CW * 0.4, align: 'right' });
    doc.fontSize(16).fillColor(SLATE).font('Helvetica-Bold')
       .text(fmt(invoice.totalAmount, invoice.currency), PAD + CW * 0.6, FY + 12, { width: CW * 0.4, align: 'right' });

    doc.end();
  });
}

function fmt(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

module.exports = { generateInvoicePDF };
