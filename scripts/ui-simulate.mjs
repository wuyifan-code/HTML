import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('artifacts/ui-sim', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const issues = [];
const log = (m) => console.log('  ', m);

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

async function snap(name) {
  await page.screenshot({ path: `artifacts/ui-sim/${name}.png`, fullPage: false });
}

// ---- Flow 1: select different elements ----
log('Flow 1: select various tree nodes');
const treeItems = await page.$$('.tree-node');
log(`  tree items: ${treeItems.length}`);
await treeItems[5]?.click().catch((e) => issues.push('tree[5]: ' + e.message));
await page.waitForTimeout(300);
await snap('flow1-select-5');

// ---- Flow 2: collapse left & right panels ----
log('Flow 2: collapse left panel');
const collapseLeft = await page.$('[aria-label="折叠结构面板"]');
await collapseLeft?.click().catch(() => {});
await page.waitForTimeout(400);
await snap('flow2-left-collapsed');
const expandLeft = await page.$('[aria-label="折叠结构面板"]');
await expandLeft?.click().catch(() => {});
await page.waitForTimeout(400);

log('Flow 2b: collapse right panel');
const collapseRight = await page.$('[aria-label="折叠属性面板"]');
await collapseRight?.click().catch(() => {});
await page.waitForTimeout(400);
await snap('flow2-right-collapsed');
await collapseRight?.click().catch(() => {});
await page.waitForTimeout(400);

// ---- Flow 3: switch tabs ----
log('Flow 3: switch to source tab');
await page.click('[data-dom-id="tab-source"]').catch(() => {});
await page.waitForTimeout(300);
await snap('flow3-source-tab');
await page.click('[data-dom-id="tab-structure"]').catch(() => {});
await page.waitForTimeout(300);

log('Flow 3b: search filter');
await page.fill('input[placeholder="搜索元素..."]', 'h1').catch(() => {});
await page.waitForTimeout(300);
await snap('flow3-search-h1');
await page.fill('input[placeholder="搜索元素..."]', '').catch(() => {});
await page.waitForTimeout(200);

// ---- Flow 4: viewport switch ----
log('Flow 4: switch viewport to tablet');
await page.click('[data-dom-id="vp-tablet"]').catch(() => {});
await page.waitForTimeout(300);
await snap('flow4-tablet');
await page.click('[data-dom-id="vp-mobile"]').catch(() => {});
await page.waitForTimeout(300);
await snap('flow4-mobile');
await page.click('[data-dom-id="vp-desktop"]').catch(() => {});
await page.waitForTimeout(300);

// ---- Flow 5: zoom ----
log('Flow 5: zoom in');
await page.click('[data-dom-id="btn-zoom-in"]').catch(() => {});
await page.waitForTimeout(300);
await snap('flow5-zoom-in');
await page.click('[data-dom-id="btn-fit"]').catch(() => {});
await page.waitForTimeout(300);

// ---- Flow 6: edit property ----
log('Flow 6: edit color in inspector');
await page.click('[data-dom-id="tab-structure"]').catch(() => {});
await page.waitForTimeout(200);
// Re-select first node
await page.click('.tree-node').catch(() => {});
await page.waitForTimeout(200);
const fontSizeInput = await page.$('#fontSize');
await fontSizeInput?.fill('88px').catch(() => {});
await page.waitForTimeout(200);
await snap('flow6-edit-fontsize');

// ---- Flow 7: undo ----
log('Flow 7: undo');
await page.keyboard.press('Control+z').catch(() => {});
await page.waitForTimeout(400);
await snap('flow7-after-undo');

// ---- Flow 8: cheatsheet ----
log('Flow 8: open cheatsheet');
await page.click('[data-dom-id="btn-cheatsheet"]').catch(() => {});
await page.waitForTimeout(400);
await snap('flow8-cheatsheet');
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(300);

// ---- Flow 9: export preview dialog ----
log('Flow 9: open export preview');
await page.click('[data-dom-id="btn-export"]').catch(() => {});
await page.waitForTimeout(500);
await snap('flow9-export-preview');
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(300);

// ---- Flow 10: viewport sizes ----
log('Flow 10: 1280px viewport');
await page.setViewportSize({ width: 1280, height: 800 });
await page.waitForTimeout(400);
await snap('flow10-1280');

log('Flow 10b: 1920px viewport');
await page.setViewportSize({ width: 1920, height: 1080 });
await page.waitForTimeout(400);
await snap('flow10-1920');

log('Flow 10c: 1600x900 — wide-screen');
await page.setViewportSize({ width: 1600, height: 900 });
await page.waitForTimeout(400);
await snap('flow10-1600');

// ---- Done ----
log('---');
log(`issues: ${issues.length}`);
for (const i of issues) log(`  ! ${i}`);
log('saved artifacts/ui-sim/*.png');

await browser.close();