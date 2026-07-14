function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function createItemRows(items) {
  return items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${escapeHtml(item.product_name)}</strong>
        <small>Product ID: ${escapeHtml(item.product_id)}</small>
      </td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${formatMoney(item.selling_price)}</td>
      <td>${formatMoney(item.discount)}</td>
      <td>${formatMoney(item.line_total)}</td>
    </tr>
  `).join("");
}

export function openInvoicePrintView(invoiceDetails, printWindow) {
  const { invoice, items } = invoiceDetails;
  const customerName = invoice.customer_name || "Passer Customer";
  const customerDetails = invoice.customer_id
    ? `Customer ID: ${escapeHtml(invoice.customer_id)}`
    : "Walk-in sale";
  const invoiceDate = new Date(invoice.created_at).toLocaleString();

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice #${escapeHtml(invoice.id)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #eef2f7;
            color: #172033;
            font-family: Arial, sans-serif;
          }
          .toolbar {
            display: flex;
            justify-content: flex-end;
            padding: 16px;
          }
          .print-button {
            padding: 10px 18px;
            border: 0;
            border-radius: 8px;
            background: #2563eb;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
          }
          .invoice {
            width: min(900px, calc(100% - 32px));
            margin: 0 auto 32px;
            padding: 42px;
            background: white;
            box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 24px;
            border-bottom: 2px solid #172033;
          }
          h1 { margin: 0 0 8px; font-size: 30px; }
          .muted { margin: 0; color: #64748b; }
          .invoice-number { text-align: right; }
          .invoice-number strong { display: block; font-size: 24px; }
          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin: 28px 0;
          }
          .detail-card {
            padding: 16px;
            border: 1px solid #dbe3ee;
            border-radius: 10px;
          }
          .detail-card span,
          td small {
            display: block;
            margin-bottom: 6px;
            color: #64748b;
            font-size: 12px;
          }
          .detail-card strong { font-size: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td {
            padding: 12px 10px;
            border-bottom: 1px solid #dbe3ee;
            text-align: left;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
          }
          td { font-size: 14px; }
          td small { margin: 4px 0 0; }
          th:nth-child(n+3), td:nth-child(n+3) { text-align: right; }
          .total {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 28px;
            margin-top: 24px;
            font-size: 18px;
          }
          .total strong { font-size: 26px; }
          .footer {
            margin-top: 42px;
            padding-top: 18px;
            border-top: 1px solid #dbe3ee;
            color: #64748b;
            text-align: center;
            font-size: 12px;
          }
          @media print {
            @page { margin: 12mm; }
            body { background: white; }
            .toolbar { display: none; }
            .invoice {
              width: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none;
            }
          }
          @media (max-width: 600px) {
            .invoice { padding: 24px; }
            .header, .details { grid-template-columns: 1fr; }
            .header { flex-direction: column; }
            .invoice-number { text-align: left; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="print-button" type="button" onclick="window.print()">
            Print / Save as PDF
          </button>
        </div>

        <main class="invoice" dir="auto">
          <header class="header">
            <div>
              <h1>Invoice</h1>
              <p class="muted">Detailed sales invoice</p>
            </div>
            <div class="invoice-number">
              <span class="muted">Invoice Number</span>
              <strong>#${escapeHtml(invoice.id)}</strong>
            </div>
          </header>

          <section class="details">
            <div class="detail-card">
              <span>Customer</span>
              <strong>${escapeHtml(customerName)}</strong>
              <p class="muted">${customerDetails}</p>
            </div>
            <div class="detail-card">
              <span>Invoice Date</span>
              <strong>${escapeHtml(invoiceDate)}</strong>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>${createItemRows(items)}</tbody>
          </table>

          <div class="total">
            <span>Total</span>
            <strong>${formatMoney(invoice.total)}</strong>
          </div>

          <footer class="footer">Generated from the Accounting App</footer>
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 300);
}
