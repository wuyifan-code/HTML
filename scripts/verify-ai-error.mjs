import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('artifacts/ui-sim', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

// Inject the same error text into a fresh <p class="meta ai-error"> and verify rendering
const result = await page.evaluate(() => {
  // Find or create the error element inside AI scan card body
  const card = document.querySelector('.ai-scan-card__body');
  if (!card) return { ok: false, reason: 'no card' };
  const err = document.createElement('p');
  err.className = 'meta ai-error';
  err.tabIndex = 0;
  err.title = 'invalid api key (2049)';
  err.textContent = 'invalid api key (2049) [401] https://api.minimax.io/v1/chat/completions {"type":"error","error":{"type":"authorized_error","message":"invalid api key (2049)","http_code":"401"},"request_id":"068e8137fe24832c65f4889765139e8e"}';
  err.setAttribute('role', 'status');
  card.appendChild(err);

  const r = err.getBoundingClientRect();
  const styles = window.getComputedStyle(err);
  return {
    ok: true,
    width: r.width,
    height: r.height,
    lineHeight: styles.lineHeight,
    padding: styles.padding,
    overflow: styles.overflow,
    maxHeight: styles.maxHeight,
    whiteSpace: styles.whiteSpace,
    background: styles.backgroundColor,
    borderRadius: styles.borderRadius,
  };
});

console.log('Initial state (collapsed):');
console.log(JSON.stringify(result, null, 2));

await page.screenshot({ path: 'artifacts/ui-sim/ai-error-collapsed.png', fullPage: false });

// Hover to expand
await page.hover('.ai-error').catch(() => {});
await page.waitForTimeout(400);

const expanded = await page.evaluate(() => {
  const err = document.querySelector('.ai-error');
  if (!err) return null;
  const r = err.getBoundingClientRect();
  const styles = window.getComputedStyle(err);
  return { width: r.width, height: r.height, maxHeight: styles.maxHeight, whiteSpace: styles.whiteSpace };
});

console.log('\nHover state (expanded):');
console.log(JSON.stringify(expanded, null, 2));

await page.screenshot({ path: 'artifacts/ui-sim/ai-error-expanded.png', fullPage: false });

await browser.close();