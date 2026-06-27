import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// 1. Export dropdown
console.log('\n=== 1. Export dropdown ===');
const exportBtn = page.locator('[data-dom-id="btn-export"]');
if (await exportBtn.count() > 0) {
  await exportBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/ui-sim/sec-export-dropdown.png' });
  console.log('  saved');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// 2. Export preview dialog (full screen modal)
console.log('\n=== 2. Export preview modal ===');
const html = await page.locator('button:has-text("导出 HTML")').count();
if (html > 0) {
  await page.locator('button:has-text("导出 HTML")').first().click().catch(() => {});
  await page.waitForTimeout(500);
}
// Try a different selector
const exportDialog = page.locator('[data-od-id="export-preview"], [class*="export-preview"]').first();
if (await exportDialog.count() > 0) {
  await page.screenshot({ path: 'artifacts/ui-sim/sec-export-modal.png' });
  console.log('  saved');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// 3. Cheatsheet
console.log('\n=== 3. Cheatsheet ===');
await page.click('[data-dom-id="btn-cheatsheet"]');
await page.waitForTimeout(500);
await page.screenshot({ path: 'artifacts/ui-sim/sec-cheatsheet.png' });
console.log('  saved');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// 4. History
console.log('\n=== 4. History drawer ===');
await page.click('[data-dom-id="btn-history"]');
await page.waitForTimeout(500);
await page.screenshot({ path: 'artifacts/ui-sim/sec-history.png' });
console.log('  saved');
// Close history
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

await browser.close();
console.log('\ndone');