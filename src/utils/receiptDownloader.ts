import { SaleRecord } from '../types';
import { formatIDR } from './formatters';

/**
 * Downloads receipt as high-resolution PNG image
 */
export const downloadReceiptAsPNG = (sale: SaleRecord) => {
  const width = 460;
  
  // Calculate dynamic height based on content
  let totalSerialsCount = 0;
  sale.items.forEach((it) => {
    if (it.serialNumbers) {
      totalSerialsCount += it.serialNumbers.length;
    }
  });

  const baseHeaderHeight = 145;
  const metaHeight = sale.customerName ? 120 : 100;
  const itemsHeight = sale.items.length * 44 + totalSerialsCount * 24 + 30;
  const totalsHeight = sale.isPriceOverridden ? 130 : 95;
  const footerHeight = 130;
  const totalHeight = baseHeaderHeight + metaHeight + itemsHeight + totalsHeight + footerHeight;

  // Retina 2x scale for crystal-clear text rendering
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Outer border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, width - 16, totalHeight - 16);

  let y = 35;

  const drawDashedLine = (currY: number) => {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(24, currY);
    ctx.lineTo(width - 24, currY);
    ctx.stroke();
    ctx.restore();
  };

  // 1. Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ACE WORLD COMPUTER', width / 2, y);

  y += 20;
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('Hardware & Component Specialists', width / 2, y);

  y += 15;
  ctx.font = '9.5px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('NO 119, Jl. Ketapang Jl. Gajah Mada, Benua Melayu Darat,', width / 2, y);

  y += 13;
  ctx.fillText('Kec. Pontianak Sel., Kota Pontianak, Kalimantan Barat 78243', width / 2, y);

  y += 15;
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#334155';
  ctx.fillText('Tel: 085117001320', width / 2, y);

  y += 18;
  drawDashedLine(y);
  y += 18;

  // 2. Receipt Info
  ctx.textAlign = 'left';
  ctx.font = '11px "JetBrains Mono", monospace';

  const drawRow = (label: string, val: string, isBold = false) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(label, 24, y);
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'right';
    if (isBold) ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(val, width - 24, y);
    ctx.textAlign = 'left';
    y += 18;
  };

  drawRow('RECEIPT NO:', sale.receiptNumber, true);
  drawRow('DATE & TIME:', new Date(sale.timestamp).toLocaleString('id-ID'));
  drawRow('CASHIER:', `${sale.cashierName} (${sale.cashierRole})`);
  if (sale.customerName) {
    drawRow('CUSTOMER:', `${sale.customerName}${sale.customerPhone ? ` (${sale.customerPhone})` : ''}`);
  }
  drawRow('PAYMENT:', sale.paymentMethod, true);

  y += 4;
  drawDashedLine(y);
  y += 18;

  // 3. Item List Header
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.fillText('ITEM / DESCRIPTION', 24, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', width - 24, y);
  ctx.textAlign = 'left';
  y += 18;

  // 4. Items
  sale.items.forEach((it) => {
    // Item name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    
    // Truncate long names to fit nicely
    let itemName = it.name;
    if (itemName.length > 40) {
      itemName = itemName.slice(0, 38) + '...';
    }
    ctx.fillText(itemName, 24, y);
    y += 15;

    // Qty x price
    ctx.fillStyle = '#475569';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`${it.quantity} × ${formatIDR(it.unitPrice)} (${it.brand})`, 24, y);
    
    // Line total
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatIDR(it.lineTotal), width - 24, y);
    ctx.textAlign = 'left';
    y += 15;

    // Serials
    if (it.serialNumbers && it.serialNumbers.length > 0) {
      it.serialNumbers.forEach((sn) => {
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`  S/N: ${sn.serialNumber}`, 24, y);

        ctx.fillStyle = '#64748b';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Garansi ${sn.warrantyMonths} Bln`, width - 24, y);
        ctx.textAlign = 'left';
        y += 14;
      });
    }

    y += 4;
  });

  drawDashedLine(y);
  y += 18;

  // 5. Financial Totals
  drawRow('Catalog Subtotal:', formatIDR(sale.originalSubtotal));

  if (sale.isPriceOverridden) {
    const diffSign = sale.overrideDifference < 0 ? '-' : '+';
    drawRow(
      'Price Override:',
      `${diffSign}${formatIDR(Math.abs(sale.overrideDifference))}`,
      true
    );
    if (sale.overrideReason) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'italic 10px "JetBrains Mono", monospace';
      ctx.fillText(`* Note: ${sale.overrideReason}`, 24, y);
      y += 16;
    }
  }

  // Large Total Paid
  y += 4;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.fillText('TOTAL PAID:', 24, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText(formatIDR(sale.finalTotal), width - 24, y);
  ctx.textAlign = 'left';

  y += 18;
  drawDashedLine(y);
  y += 24;

  // 6. Barcode Graphic Representation
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('||||| | |||||||| |||| | |||||| |||||||| |||||', width / 2, y);

  y += 18;
  ctx.fillStyle = '#64748b';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('Semua komponen bergaransi resmi distributor Indonesia.', width / 2, y);

  y += 15;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText('Terima kasih telah berbelanja di Ace World Computer!', width / 2, y);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `receipt-${sale.receiptNumber}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Downloads receipt as standalone printable HTML file
 */
export const downloadReceiptAsHTML = (sale: SaleRecord) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${sale.receiptNumber} - Ace World Computer</title>
  <style>
    body {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      display: flex;
      justify-content: center;
      color: #0f172a;
    }
    .receipt {
      width: 380px;
      background: #ffffff;
      padding: 24px;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .store-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .sub {
      font-size: 11px;
      color: #475569;
      margin: 2px 0;
    }
    .section {
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 10px;
      margin-bottom: 10px;
      font-size: 11px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    .label {
      color: #64748b;
    }
    .val {
      font-weight: 600;
      color: #0f172a;
    }
    .item-desc {
      font-weight: 600;
      margin-top: 6px;
    }
    .item-sub {
      display: flex;
      justify-content: space-between;
      color: #475569;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .serial-box {
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      margin: 3px 0 6px 0;
      display: flex;
      justify-content: space-between;
      color: #1e3a8a;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 800;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      color: #1d4ed8;
      margin-top: 6px;
    }
    .barcode {
      text-align: center;
      letter-spacing: 3px;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 14px;
    }
    .footer-text {
      text-align: center;
      font-size: 10px;
      color: #64748b;
      margin-top: 8px;
    }
    .print-btn {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 10px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border: none; width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="store-name">ACE WORLD COMPUTER</div>
      <div class="sub">Hardware & Component Specialists</div>
      <div class="sub" style="line-height: 1.35; max-width: 320px; margin: 3px auto;">
        NO 119, Jl. Ketapang Jl. Gajah Mada, Benua Melayu Darat, Kec. Pontianak Sel., Kota Pontianak, Kalimantan Barat 78243
      </div>
      <div class="sub" style="font-weight: bold; margin-top: 3px;">Tel: 085117001320</div>
    </div>

    <div class="section">
      <div class="row"><span class="label">RECEIPT NO:</span><span class="val">${sale.receiptNumber}</span></div>
      <div class="row"><span class="label">DATE:</span><span class="val">${new Date(sale.timestamp).toLocaleString('id-ID')}</span></div>
      <div class="row"><span class="label">CASHIER:</span><span class="val">${sale.cashierName} (${sale.cashierRole})</span></div>
      ${sale.customerName ? `<div class="row"><span class="label">CUSTOMER:</span><span class="val">${sale.customerName}</span></div>` : ''}
      <div class="row"><span class="label">PAYMENT:</span><span class="val">${sale.paymentMethod}</span></div>
    </div>

    <div class="section">
      <div class="row" style="color: #94a3b8; font-size: 10px; font-weight: bold;">
        <span>ITEM / DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>
      ${sale.items
        .map(
          (it) => `
        <div class="item-desc">${it.name}</div>
        <div class="item-sub">
          <span>${it.quantity} × ${formatIDR(it.unitPrice)} (${it.brand})</span>
          <span style="font-weight: bold;">${formatIDR(it.lineTotal)}</span>
        </div>
        ${
          it.serialNumbers && it.serialNumbers.length > 0
            ? it.serialNumbers
                .map(
                  (sn) => `
          <div class="serial-box">
            <span>S/N: ${sn.serialNumber}</span>
            <span>Garansi: ${sn.warrantyMonths} Bln</span>
          </div>`
                )
                .join('')
            : ''
        }
      `
        )
        .join('')}
    </div>

    <div class="section">
      <div class="row"><span class="label">Subtotal:</span><span class="val">${formatIDR(sale.originalSubtotal)}</span></div>
      ${
        sale.isPriceOverridden
          ? `<div class="row" style="color: #b45309;"><span>Price Override:</span><span>${
              sale.overrideDifference < 0 ? '-' : '+'
            }${formatIDR(Math.abs(sale.overrideDifference))}</span></div>`
          : ''
      }
      <div class="total-row">
        <span>TOTAL PAID:</span>
        <span>${formatIDR(sale.finalTotal)}</span>
      </div>
    </div>

    <div class="barcode">||||| | |||||||| |||| | |||||| |||||||| |||||</div>
    <div class="footer-text">
      Semua komponen bergaransi resmi distributor Indonesia.<br>
      Terima kasih telah berbelanja di Ace World Computer!
    </div>

    <button class="print-btn" onclick="window.print()">Print Receipt</button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${sale.receiptNumber}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Downloads receipt as text (.txt) file
 */
export const downloadReceiptAsText = (sale: SaleRecord) => {
  const text = `
========================================
          ACE WORLD COMPUTER
   Hardware Inventory & System Integrators
   NO 119, Jl. Ketapang Jl. Gajah Mada, Benua Melayu Darat
   Kec. Pontianak Sel., Kota Pontianak, Kalbar 78243
   Tel: 085117001320
========================================
RECEIPT NO: ${sale.receiptNumber}
DATE & TIME: ${new Date(sale.timestamp).toLocaleString('id-ID')}
CASHIER:    ${sale.cashierName} (${sale.cashierRole})
${sale.customerName ? `CUSTOMER:   ${sale.customerName} ${sale.customerPhone ? `(${sale.customerPhone})` : ''}\n` : ''}PAYMENT:    ${sale.paymentMethod}
----------------------------------------
ITEMS:
${sale.items
  .map(
    (i) =>
      `${i.quantity}x ${i.name}\n   @ ${formatIDR(i.unitPrice)} = ${formatIDR(i.lineTotal)}${
        i.serialNumbers && i.serialNumbers.length > 0
          ? '\n   S/N: ' +
            i.serialNumbers
              .map(
                (sn) =>
                  `${sn.serialNumber} [Garansi: ${sn.warrantyMonths} Bln s/d ${new Date(
                    sn.warrantyExpiryDate
                  ).toLocaleDateString('id-ID')}]`
              )
              .join('\n   S/N: ')
          : ''
      }`
  )
  .join('\n')}
----------------------------------------
Catalog Subtotal:   ${formatIDR(sale.originalSubtotal)}
${
  sale.isPriceOverridden
    ? `Price Override:    ${sale.overrideDifference < 0 ? '-' : '+'}${formatIDR(
        Math.abs(sale.overrideDifference)
      )} (${sale.overrideReason || 'Adjustment'})\n`
    : ''
}TOTAL PAID:         ${formatIDR(sale.finalTotal)}
========================================
Semua komponen bergaransi resmi distributor Indonesia.
Simpan struk ini untuk keperluan klaim RMA / garansi.
Terima kasih telah berbelanja di Ace World Computer!
========================================
  `.trim();

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${sale.receiptNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
