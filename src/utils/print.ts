// Utility to print a target element styled beautifully for thermal POS paper rolls (80mm)
export function printThermalElement(elementId: string, title: string = 'Thermal Receipt') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for printing.`);
    // Fallback to legacy printing if element isn't found
    window.print();
    return;
  }

  // Create an iframe to hold the printable content
  const printIframe = document.createElement('iframe');
  
  // Hide the iframe completely from layout
  printIframe.style.position = 'absolute';
  printIframe.style.top = '-9999px';
  printIframe.style.left = '-9999px';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = 'none';
  
  document.body.appendChild(printIframe);
  
  const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
  if (!doc) {
    console.warn("Could not access iframe document, falling back to window.print()");
    window.print();
    return;
  }
  
  // Grab styles to replicate formatting inside the iframe
  let styleHtml = '';
  
  // 1. Copy over style tags
  const hostStyles = document.querySelectorAll('style');
  hostStyles.forEach(styleTag => {
    styleHtml += `<style>${styleTag.innerHTML}</style>`;
  });

  // 2. Copy over link stylesheets
  const styleSheets = document.styleSheets;
  try {
    for (let i = 0; i < styleSheets.length; i++) {
      const sheet = styleSheets[i];
      if (sheet.href) {
        styleHtml += `<link rel="stylesheet" href="${sheet.href}">`;
      } else {
        try {
          const rules = sheet.cssRules;
          let rulesText = '';
          for (let r = 0; r < rules.length; r++) {
            rulesText += rules[r].cssText;
          }
          styleHtml += `<style>${rulesText}</style>`;
        } catch (e) {
          // Standard catch for cross-origin stylesheet exceptions
        }
      }
    }
  } catch (e) {
    console.warn("Could not copy stylesheet links:", e);
  }

  // Extract the target HTML content (e.g. receipt or EOD body)
  const contentHtml = element.innerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        ${styleHtml}
        <style>
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            background-color: white !important;
            color: #000000 !important;
            font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace !important;
            margin: 0 !important;
            padding: 8px !important;
            width: 76mm !important; /* POS 80mm printable boundary width minus padding */
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Reset dark/light background states from main UI to be solid pure white for tax logs */
          .bg-slate-900, .bg-slate-950, .bg-slate-800, .bg-slate-50 {
            background-color: transparent !important;
            color: #000000 !important;
          }
          .text-white, .text-slate-300, .text-slate-400 {
            color: #000005 !important;
          }
          /* Custom overrides to make colors visible under high contrast black/white thermal style */
          .text-emerald-700, .text-emerald-800, .text-emerald-600 {
            color: #111827 !important; /* solid text black */
            font-weight: 900 !important;
          }
          .bg-emerald-50, .bg-amber-100, .bg-slate-100 {
            background-color: transparent !important;
            border: 1px dashed #cccccc !important;
          }
          svg {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
            color: #000000 !important;
          }
           /* Fallback CSS structures for high-fidelity offline thermal receipt layout formatting */
          .flex { display: flex !important; }
          .justify-between { justify-content: space-between !important; }
          .items-center { align-items: center !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .text-left { text-align: left !important; }
          .font-bold { font-weight: bold !important; }
          .font-black { font-weight: 900 !important; }
          .uppercase { text-transform: uppercase !important; }
          .inline-block { display: inline-block !important; }
          .font-mono { font-family: 'JetBrains Mono', monospace !important; }
          .space-y-1 > * + * { margin-top: 4px !important; }
          .space-y-1\.5 > * + * { margin-top: 6px !important; }
          .my-4 { margin-top: 16px !important; margin-bottom: 16px !important; }
          .mb-2 { margin-bottom: 8px !important; }
          .pb-0\.5 { padding-bottom: 2px !important; }
          .grid { display: grid !important; }
          .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
          .col-span-12 { grid-column: span 12 / span 12 !important; }
          .col-span-8 { grid-column: span 8 / span 8 !important; }
          .col-span-7 { grid-column: span 7 / span 7 !important; }
          .col-span-6 { grid-column: span 6 / span 6 !important; }
          .col-span-4 { grid-column: span 4 / span 4 !important; }
          .col-span-3 { grid-column: span 3 / span 3 !important; }
          .col-span-2 { grid-column: span 2 / span 2 !important; }
          .border-t { border-top: 1px solid #000000 !important; }
          .border-b { border-bottom: 1px solid #000000 !important; }
          .border-dashed { border-style: dashed !important; border-color: #000000 !important; }
          .w-full { width: 100% !important; }
          .max-w-\[120px\] { max-width: 120px !important; }
          .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
          
          /* Suppress extra scrolling height constraints on printable component container tags */
          .max-h-[82vh], .max-h-[75vh], .overflow-y-auto {
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
          }
        </style>
      </head>
      <body>
        <div class="font-mono text-[9px] leading-snug">
          ${contentHtml}
        </div>
        <script>
          window.onload = function() {
            // Short timeout to guarantee layout completes
            setTimeout(function() {
              window.print();
              // Self-remove the container node from parent DOM context after spooling completes
              setTimeout(function() {
                if (window.frameElement && window.frameElement.parentNode) {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }
              }, 1000);
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
}
