import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5174/';
const out = process.argv[3] || './screenshot.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

const treeItems = await page.$$('.tree-item');
console.log('tree items:', treeItems.length);
if (treeItems.length > 0) {
  await treeItems[Math.min(8, treeItems.length - 1)].click().catch(() => {});
  await page.waitForTimeout(500);
}

await page.screenshot({ path: out, fullPage: false });
console.log('saved', out);
await browser.close();
