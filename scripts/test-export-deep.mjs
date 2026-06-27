import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('pageerror', (err) => console.log('❌ PAGE ERROR:', err.message));
page.on('console', (msg) => {
  const text = msg.text();
  if (text.includes('[Export') || text.includes('ExportError') || msg.type() === 'error') {
    console.log(`  [${msg.type()}] ${text.slice(0, 250)}`);
  }
});

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

// Observ statusbar for status updates  
const statusBarText = () => page.evaluate(() => {
  const el = document.querySelector('.statusbar');
  return el ? el.textContent : '';
});
const toastVisible = () => page.evaluate(() => {
  const el = document.querySelector('.toast');
  if (!el) return null;
  return { visible: el.classList.contains('is-visible'), text: el.textContent };
});

// Try PDF export
console.log('\n=== CLICK PDF ===');
const pdfBtn = page.locator('[data-dom-id="btn-pdf"]');
console.log('  button enabled:', await pdfBtn.isEnabled());

// Set up download promise BEFORE clicking
const pdfDownload = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
await pdfBtn.click();
await page.waitForTimeout(500);

console.log('  status:', await statusBarText());
console.log('  toast:', JSON.stringify(await toastVisible()));
console.log('  download (500ms):', await pdfDownload ? '✅' : '❌ none');

// Wait more for async PDF generation
await page.waitForTimeout(2000);
console.log('  status (2s):', await statusBarText());
console.log('  toast (2s):', JSON.stringify(await toastVisible()));
const pdfDownload2 = await pdfDownload;
console.log('  download (2s):', pdfDownload2 ? '✅ received' : '❌ none');

// Try PPTX
console.log('\n=== CLICK PPTX ===');
const pptxBtn = page.locator('[data-dom-id="btn-pptx"]');
console.log('  button enabled:', await pptxBtn.isEnabled());
// PPTX button might be disabled because exportingFormat still set
if (await pptxBtn.isEnabled()) {
  const pptxDownload = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  await pptxBtn.click();
  await page.waitForTimeout(3000);
  console.log('  status:', await statusBarText());
  console.log('  toast:', JSON.stringify(await toastVisible()));
  console.log('  download:', await pptxDownload ? '✅' : '❌ none');
} else {
  // Wait for state reset
  console.log('  button disabled, waiting 5s for state reset...');
  await page.waitForTimeout(5000);
  console.log('  button enabled:', await pptxBtn.isEnabled());
  if (await pptxBtn.isEnabled()) {
    const pptxDownload = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await pptxBtn.click();
    await page.waitForTimeout(5000);
    console.log('  status:', await statusBarText());
    console.log('  toast:', JSON.stringify(await toastVisible()));
    console.log('  download:', await pptxDownload ? '✅' : '❌ none');
  }
}

await page.screenshot({ path: 'artifacts/ui-sim/export-debug.png' });
console.log('\nsaved artifacts/ui-sim/export-debug.png');
await browser.close();