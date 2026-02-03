/**
 * Download utilities for generating client-side PDF downloads.
 *
 * Uses a hidden iframe + window.print() to trigger the browser's native
 * "Save as PDF" dialog, producing a properly formatted PDF document.
 */

/** Open a print-to-PDF dialog for styled HTML content */
export function downloadAsPdf(title: string, htmlContent: string): void {
  const fullHtml = buildStyledHtml(title, htmlContent);

  // Create a hidden iframe, write the HTML, then trigger print
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    // Fallback: open in new window
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(fullHtml);
      win.document.close();
      win.focus();
      win.print();
    }
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(fullHtml);
  iframeDoc.close();

  // Wait for content to render before printing
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up after a delay to allow the print dialog to appear
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  // Fallback if onload doesn't fire (some browsers)
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // iframe may already be removed
    }
  }, 500);
}

/**
 * Backward-compatible alias — all existing call sites use this.
 * Now triggers PDF download instead of HTML file download.
 */
export function downloadAsHtml(filename: string, htmlContent: string): void {
  // Extract a readable title from the filename
  const title = filename.replace(/\.(html|pdf)$/i, '').replace(/[-_]/g, ' ');
  downloadAsPdf(title, htmlContent);
}

function buildStyledHtml(title: string, htmlContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #00184D; }
    h2 { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: #00184D; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    h3 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: #374151; }
    p, li { font-size: 13px; color: #4b5563; }
    .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    th { font-weight: 600; color: #374151; background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .badge-green { background: #ecfdf5; color: #059669; }
    .badge-amber { background: #fffbeb; color: #d97706; }
    .badge-red { background: #fef2f2; color: #dc2626; }
    .badge-blue { background: #eff6ff; color: #1e40af; }
    .section { margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
    .row-label { color: #6b7280; font-size: 13px; }
    .row-value { font-weight: 500; font-size: 13px; text-align: right; max-width: 60%; }
    .total-row { border-top: 2px solid #e5e7eb; font-weight: 600; margin-top: 8px; padding-top: 8px; }
    .header-meta { display: flex; gap: 16px; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    /* Callout boxes */
    .callout { padding: 12px 16px; border-radius: 8px; margin: 8px 0; }
    .callout p { margin: 0; font-size: 13px; line-height: 1.5; }
    .callout-purple { background: #faf5ff; border: 1px solid #e9d5ff; }
    .callout-purple p { color: #581c87; }
    .callout-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
    .callout-blue p { color: #1e40af; }
    .callout-green { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .callout-green p { color: #065f46; }
    .callout-amber { background: #fffbeb; border: 1px solid #fcd34d; }
    .callout-amber p { color: #92400e; }
    .callout-red { background: #fef2f2; border: 1px solid #fecaca; }
    .callout-red p { color: #991b1b; }
    /* Status dots for tables */
    .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: middle; }
    .status-normal { background: #22c55e; }
    .status-abnormal { background: #f59e0b; }
    .status-critical { background: #ef4444; }
    /* AI Summary styling */
    .ai-summary { margin: 16px 0 24px; }
    .ai-summary-label { display: flex; align-items: center; gap: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9333ea; margin-bottom: 8px; font-weight: 600; }
    /* Lists */
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    /* Vitals grid */
    .vitals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 8px 0; }
    .vital-item { background: #f9fafb; border-radius: 8px; padding: 12px; text-align: center; }
    .vital-label { display: block; font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .vital-value { display: block; font-size: 14px; font-weight: 600; color: #1f2937; }
    /* Small text helper */
    .small-text { font-size: 11px; color: #6b7280; margin-top: 4px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
${htmlContent}
<div class="footer">Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} &middot; HealthCare Platform</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
