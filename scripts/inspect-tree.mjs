import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5174/';
const out = process.argv[3] || './tree-debug.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Inspect first tree-item-row
const data = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.tree-item-row'));
  return rows.slice(0, 6).map((row, i) => {
    const r = row.getBoundingClientRect();
    const item = row.querySelector('.tree-item');
    const copy = row.querySelector('.node-copy');
    const meta = row.querySelector('.meta');
    return {
      index: i,
      rowWidth: Math.round(r.width),
      rowLeft: Math.round(r.left),
      paddingLeft: getComputedStyle(row).paddingLeft,
      itemWidth: item ? Math.round(item.getBoundingClientRect().width) : null,
      itemText: item ? item.innerText : null,
      copyWidth: copy ? Math.round(copy.getBoundingClientRect().width) : null,
      copyText: copy ? copy.innerText : null,
      copyDisplay: copy ? getComputedStyle(copy).display : null,
      metaText: meta ? meta.innerText : null,
    };
  });
});
console.log(JSON.stringify(data, null, 2));

// Take focused screenshot of the left panel
const panel = await page.$('aside.panel');
if (panel) {
  await panel.screenshot({ path: out });
  console.log('saved', out);
}
await browser.close();
