import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (msg) => console.log(`  [${msg.type()}] ${msg.text()}`));

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

// Check if pdfLib bundle loads correctly
const result = await page.evaluate(async () => {
  // Manually trigger the loadBundleScript path
  const url = window.location.origin + '/pdf-lib.bundle.js';
  // Check if bundle is already loaded
  const w = window as any;
  if (w.PdfLibBundle) {
    return {
      hasPdfLibBundle: true,
      hasRGB: typeof w.PdfLibBundle.rgb === 'function',
      hasPDFDocument: typeof w.PdfLibBundle.PDFDocument === 'object',
      sampleColor: w.PdfLibBundle.rgb ? w.PdfLibBundle.rgb(1, 1, 1) : null
    };
  }
  // Not loaded yet - load it
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      resolve({
        hasPdfLibBundle: !!w.PdfLibBundle,
        hasRGB: typeof w.PdfLibBundle?.rgb === 'function',
        hasPDFDocument: typeof w.PdfLibBundle?.PDFDocument === 'object',
        sampleColor: w.PdfLibBundle?.rgb ? w.PdfLibBundle.rgb(1, 1, 1) : null
      });
    };
    script.onerror = () => resolve({ error: 'script load failed', url });
    document.head.appendChild(script);
  });
});

console.log('Result:', JSON.stringify(result, null, 2));
await browser.close();