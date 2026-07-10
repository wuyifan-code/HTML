import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const rootClassBefore = await page.evaluate(() => document.documentElement.className);
console.log("before click root className:", JSON.stringify(rootClassBefore));
const themeBefore = await page.evaluate(() => {
  const root = getComputedStyle(document.documentElement);
  return { bg: root.getPropertyValue("--bg-base-default").trim(), text: root.getPropertyValue("--text-default").trim() };
});
console.log("theme vars before:", themeBefore);

await page.locator('[data-dom-id="btn-theme"]').click();
await page.waitForTimeout(50);
const transitionClass = await page.evaluate(() => document.documentElement.className);
console.log("immediately after click:", JSON.stringify(transitionClass));

await page.waitForTimeout(300);
const after = await page.evaluate(() => document.documentElement.className);
console.log("after 300ms:", JSON.stringify(after));
const themeAfter = await page.evaluate(() => {
  const root = getComputedStyle(document.documentElement);
  return { bg: root.getPropertyValue("--bg-base-default").trim(), text: root.getPropertyValue("--text-default").trim() };
});
console.log("theme vars after:", themeAfter);

await browser.close();
