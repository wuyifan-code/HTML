import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:5180/';
const out = process.argv[3] || './artifacts/screenshots/current.png';
const scrollPx = Number(process.argv[4] || 0);
const tall = process.argv[5] === 'tall';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: tall ? 1800 : 900 },
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);

if (scrollPx > 0) {
  // Scroll every scrollable container so the user can see lower sections
  await page.evaluate((px) => {
    document.querySelectorAll('.inspector-body, .inspector-scroll, .structure-tree').forEach((el) => {
      el.scrollTop = px;
    });
  }, scrollPx);
  await page.waitForTimeout(300);
}

await page.screenshot({ path: out, fullPage: !tall });
console.log('saved', out);
await browser.close();