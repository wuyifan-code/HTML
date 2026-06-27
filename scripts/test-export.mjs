import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Listen for console messages
page.on('console', (msg) => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => console.log('PAGE ERROR:', err));

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

// Try clicking PDF export button
console.log('\n=== 1. Click PDF button ===');
const pdfBtn = page.locator('[data-dom-id="btn-pdf"]');
const pdfBtnExists = await pdfBtn.count();
console.log(`  PDF button found: ${pdfBtnExists}`);

if (pdfBtnExists > 0) {
  const isDisabled = await pdfBtn.isDisabled();
  console.log(`  Disabled: ${isDisabled}`);
  if (isDisabled) {
    console.log('  Button disabled, checking why...');
    // Check the current exportingFormat state
    const btnClasses = await pdfBtn.getAttribute('class');
    console.log(`  Classes: ${btnClasses}`);
  } else {
    await pdfBtn.click();
    await page.waitForTimeout(3000);
    console.log('  Clicked, now checking...');
    // Check if any toast/status shows
    const toast = await page.$('.toast');
    if (toast) {
      const text = await toast.textContent();
      console.log(`  Toast: ${text}`);
    }
    const exported = (await page.$('a[download]')) !== null;
    console.log(`  download link found: ${exported}`);
  }
} else {
  console.log('  PDF button NOT FOUND by data-dom-id');
}

// Also try PPTX
console.log('\n=== 2. Click PPTX button ===');
const pptxBtn = page.locator('[data-dom-id="btn-pptx"]');
const pptxBtnExists = await pptxBtn.count();
console.log(`  PPTX button found: ${pptxBtnExists}`);

if (pptxBtnExists > 0) {
  const isDisabled = await pptxBtn.isDisabled();
  console.log(`  Disabled: ${isDisabled}`);
}

// Try clicking the normal "导出" button first to see if export preview works
console.log('\n=== 3. Click export button (preview) ===');
const exportBtn = page.locator('[data-dom-id="btn-export"]');
if (await exportBtn.count() > 0) {
  await exportBtn.click();
  await page.waitForTimeout(1000);
  // Check URL for export-preview
  const dialog = await page.$('.export-preview-dialog, [data-od-id="export-preview"]');
  if (dialog) {
    console.log('  Export preview opened successfully');
  } else {
    console.log('  No export preview dialog found');
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

await page.screenshot({ path: 'artifacts/ui-sim/export-state.png' });
console.log('\nScreenshot saved');

await browser.close();