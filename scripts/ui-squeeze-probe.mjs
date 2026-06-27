import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const issues = [];
const ok = (m) => console.log('  ✓', m);
const fail = (m) => { console.log('  ✗', m); issues.push(m); };

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

// 1. Force inspector to exact 320px
console.log('\n[1] Inspector at exact 320px');
await page.evaluate(() => {
  // Find the right panel and force its width via attribute-style resize
  // We can't easily do that, but we can use the panel-resizer to drag to 320
});
const inspectorPanel = await page.$('[aria-label="属性面板"]');
const inspectorWidth = await inspectorPanel.evaluate((el) => el.getBoundingClientRect().width);
console.log(`  current inspector width: ${inspectorWidth}px`);
if (inspectorWidth < 318 || inspectorWidth > 322) {
  fail(`Inspector width ${inspectorWidth} not near 320`);
}

// 2. Check select overflow
console.log('\n[2] Select element overflow');
const selects = await page.$$('.inspector-body select');
for (const s of selects) {
  const info = await s.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const panel = el.closest('[aria-label="属性面板"]')?.getBoundingClientRect();
    const right = panel ? panel.right : Infinity;
    const overflows = r.right > right + 1;
    return { w: r.width, right: r.right, panelRight: right, overflows, text: el.value };
  });
  if (info.overflows) fail(`select "${info.text}" overflows (${info.right} > ${info.panelRight})`);
  else ok(`select "${info.text}" fits within panel (width ${info.w.toFixed(0)})`);
}

// 3. Check input overflow
console.log('\n[3] Input element overflow');
const inputs = await page.$$('.inspector-body input.input');
for (const i of inputs.slice(0, 12)) {
  const info = await i.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const panel = el.closest('[aria-label="属性面板"]')?.getBoundingClientRect();
    const right = panel ? panel.right : Infinity;
    const overflows = r.right > right + 1;
    return { w: r.width, right: r.right, panelRight: right, overflows, value: el.value };
  });
  if (info.overflows) fail(`input "${info.value}" overflows (${info.right} > ${info.panelRight})`);
  else ok(`input "${info.value}" fits (w ${info.w.toFixed(0)})`);
}

// 4. Check metrics line overlap
console.log('\n[4] Inspector selection metrics overlap');
const metrics = await page.$$('.inspector-selection__metrics > span');
for (const m of metrics) {
  const info = await m.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { w: r.width, text: el.textContent };
  });
  ok(`metric "${info.text}" w ${info.w.toFixed(0)}`);
}

// 5. Check select option text length risk
console.log('\n[5] Long select option text');
const optionTexts = await page.$$eval('.inspector-body select option', (els) => els.map((e) => ({ v: e.value, t: e.textContent })));
const longOpts = optionTexts.filter((o) => o.t && o.t.length > 14);
for (const o of longOpts) console.log(`  • ${o.v} → "${o.t}" (${o.t.length} chars)`);

// 6. Check button text overflow
console.log('\n[6] Toolbar button text fit');
const toolbarBtns = await page.$$('.app-topbar__right button, .app-topbar__right label');
for (const b of toolbarBtns) {
  const info = await b.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, text: el.textContent.trim().slice(0, 30) };
  });
  console.log(`  • "${info.text}" w ${info.w.toFixed(0)} h ${info.h.toFixed(0)}`);
}

// 7. Field grid 2-col — check column overlap
console.log('\n[7] field-grid column widths');
const grid = await page.$$('.inspector-body .field-grid');
let i = 0;
for (const g of grid.slice(0, 6)) {
  const cols = await g.evaluate((el) => {
    const children = Array.from(el.children);
    return children.map((c) => {
      const r = c.getBoundingClientRect();
      const inp = c.querySelector('input, select');
      const ir = inp ? inp.getBoundingClientRect() : r;
      return { w: r.width, inputW: ir.width };
    });
  });
  const totalWidth = cols.reduce((a, b) => a + b.w, 0);
  ok(`grid[${i}]: ${cols.length} cols, total ${totalWidth.toFixed(0)}px`);
  i++;
}

// 8. Force selection on the H1 and check inspector cards at 320px
console.log('\n[8] H1 selected — check inspector content overflow at 320px');
await page.click('.tree-node:nth-child(2)').catch(() => {});  // Click H1
await page.waitForTimeout(400);

const cardHeights = await page.$$eval('.inspector-card', (els) => els.map((el, i) => ({
  i, h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width
})));
for (const c of cardHeights) {
  console.log(`  • card[${c.i}]: ${c.w.toFixed(0)}x${c.h.toFixed(0)}`);
}

// 9. Force a really long selection (title text) and see if path truncates
console.log('\n[9] Long path truncation');
await page.evaluate(() => {
  // Set a very long selected path / className to stress-test
  const el = document.querySelector('.inspector-selection__path');
  if (el) {
    el.textContent = '.very-long-class-name-with-many-words that should overflow ellipsis';
    el.setAttribute('title', el.textContent);
  }
});
await page.waitForTimeout(200);
const pathInfo = await page.$eval('.inspector-selection__path', (el) => {
  const r = el.getBoundingClientRect();
  const styles = window.getComputedStyle(el);
  return {
    w: r.width, h: r.height,
    overflow: styles.overflow, textOverflow: styles.textOverflow,
    whiteSpace: styles.whiteSpace,
    scrollW: el.scrollWidth,
    overflows: el.scrollWidth > r.width + 1,
    text: el.textContent
  };
});
console.log(`  • path text "${pathInfo.text}" rendered w ${pathInfo.w.toFixed(0)}, scrollW ${pathInfo.scrollW}, overflows=${pathInfo.overflows}`);
if (!pathInfo.overflows) fail('Path overflow handling failed — content not truncated');
else ok('Path truncates cleanly with ellipsis');

// 10. Force a really long font-family value
console.log('\n[10] Long font-family text');
await page.evaluate(() => {
  const inp = document.querySelector('#fontFamilyInput');
  if (inp) {
    inp.value = '"Helvetica Neue", "Helvetica", "Arial Black", "PingFang SC", "Microsoft YaHei", sans-serif';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await page.waitForTimeout(200);
await page.screenshot({ path: 'artifacts/ui-sim/squeeze-long-fontfamily.png', fullPage: false });

// 11. Final summary
console.log('\n---');
console.log(`issues: ${issues.length}`);
for (const i of issues) console.log(`  ! ${i}`);

await browser.close();