import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:5180/';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

// 1. Hover 撤销按钮 - 期待 .ds-tooltip 显示
console.log('--- Test 1: topbar undo button ---');
const undo = page.locator('[data-dom-id="btn-undo"]');
await undo.hover();
await page.waitForTimeout(400);
const tip1 = await page.locator('.ds-tooltip').count();
console.log('tooltip count after hover:', tip1);
const tipText1 = await page.locator('.ds-tooltip').first().textContent().catch(() => null);
console.log('tooltip text:', tipText1);
const placement1 = await page.locator('.ds-tooltip').first().getAttribute('data-placement').catch(() => null);
console.log('placement:', placement1);
await page.screenshot({ path: './artifacts/screenshots/tooltip-undo.png' });
await page.mouse.move(0, 0);
await page.waitForTimeout(300);

// 2. Hover 导出按钮
console.log('--- Test 2: export button ---');
const exportBtn = page.locator('[data-dom-id="btn-export"]');
await exportBtn.hover();
await page.waitForTimeout(400);
const tipText2 = await page.locator('.ds-tooltip').first().textContent().catch(() => null);
console.log('export tooltip text:', tipText2);
await page.screenshot({ path: './artifacts/screenshots/tooltip-export.png' });
await page.mouse.move(0, 0);
await page.waitForTimeout(300);

// 3. Hover 查看历史按钮
console.log('--- Test 3: history button ---');
const histBtn = page.locator('[data-dom-id="btn-history"]');
await histBtn.hover();
await page.waitForTimeout(400);
const tipText3 = await page.locator('.ds-tooltip').first().textContent().catch(() => null);
console.log('history tooltip text:', tipText3);
await page.screenshot({ path: './artifacts/screenshots/tooltip-history.png' });
await page.mouse.move(0, 0);
await page.waitForTimeout(300);

// 4. Hover 视口缩放 - 期待在画布工具栏显示 tooltip
console.log('--- Test 4: canvas zoom out button ---');
const zoomOut = page.locator('.zoom-btn').first();
await zoomOut.hover();
await page.waitForTimeout(400);
const tipText4 = await page.locator('.ds-tooltip').first().textContent().catch(() => null);
console.log('zoom tooltip text:', tipText4);
await page.screenshot({ path: './artifacts/screenshots/tooltip-zoom.png' });
await page.mouse.move(0, 0);
await page.waitForTimeout(300);

// 5. Hover PDF 按钮
console.log('--- Test 5: PDF button ---');
const pdfBtn = page.locator('[data-dom-id="btn-pdf"]');
await pdfBtn.hover();
await page.waitForTimeout(400);
const tipText5 = await page.locator('.ds-tooltip').first().textContent().catch(() => null);
console.log('PDF tooltip text:', tipText5);
await page.screenshot({ path: './artifacts/screenshots/tooltip-pdf.png' });

await browser.close();
console.log('--- DONE ---');
