// 视觉证据 V2 — 起点：点击一次主题按钮(项目默认 dark → light 触发);
// 在两端各截一组(就绪 + cheatsheet + export 对话框 + history 抽屉)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const URL = "http://localhost:5173/";
const OUT = resolve(process.cwd(), "artifacts/ui-polish-after");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function capture(label, themeButtonClicks) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // 主题切换到目标态
  for (let i = 0; i < themeButtonClicks; i++) {
    await page.locator('[data-dom-id="btn-theme"]').click();
    await page.waitForTimeout(450);
  }

  // 1) ready
  await page.screenshot({ path: resolve(OUT, `${label}-1-ready.png`) });

  // 2) cheatsheet
  await page.keyboard.press("?");
  await page.waitForTimeout(550);
  await page.screenshot({ path: resolve(OUT, `${label}-2-cheatsheet.png`) });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(450);

  // 3) export dialog
  await page.locator('[data-dom-id="btn-export"]').click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(OUT, `${label}-3-export-dialog.png`) });
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);

  // 4) history drawer
  const histBtn = page.locator('[data-dom-id="btn-history"]');
  if (await histBtn.count() && await histBtn.isVisible().catch(() => false)) {
    await histBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(OUT, `${label}-4-history-drawer.png`) });
    await page.keyboard.press("Escape");
  }

  await ctx.close();
}

// 项目初始化为 dark → 0 次点击 = dark, 1 次 = light
await capture("dark", 0);
await capture("light", 1);

// Mobile 验证 backdrop-filter fallback
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(OUT, "mobile-1-ready.png") });
  await ctx.close();
}

await browser.close();
console.log("✓ done");
