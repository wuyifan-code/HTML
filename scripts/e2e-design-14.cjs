#!/usr/bin/env node
/**
 * scripts/e2e-design-14.cjs
 *
 * Visual QA gate: renders all 14 design states via Playwright, captures
 * screenshots, runs pixel diffs against reference images, and enforces
 * strict zero console/pageerror rules.
 *
 * Usage:
 *   node scripts/e2e-design-14.cjs              # render all states
 *   node scripts/e2e-design-14.cjs --compare    # render + diff against references
 */

const { chromium } = require("playwright");
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("node:fs");
const { resolve, join, dirname } = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = resolve(__dirname, "..");
const STATES = require(resolve(ROOT, "scripts/design-states.cjs"));
const OUTPUT_DIR = resolve(ROOT, "output/design-states");
const DIFF_DIR = resolve(ROOT, "output/design-diff");

const shouldCompare = process.argv.includes("--compare");

const pageErrors = [];
const consoleErrors = [];

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  if (shouldCompare) mkdirSync(DIFF_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  let allPassed = true;
  const results = [];

  for (const state of STATES) {
    console.log(`[e2e-design-14] Rendering ${state.id} (${state.name})...`);

    const page = await context.newPage();
    pageErrors.length = 0;
    consoleErrors.length = 0;

    page.on("pageerror", (error) => pageErrors.push(error));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.setViewportSize(state.viewport);

    try {
      // Navigate to the local dev server
      const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:5173/HTML/";
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });

      // Apply driver-specific state setup
      await applyDriver(page, state);

      // Wait for render
      await page.waitForTimeout(500);

      // Capture screenshot
      const screenshotPath = join(OUTPUT_DIR, `${state.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  -> saved ${screenshotPath}`);

      // Check errors
      if (pageErrors.length > 0) {
        console.error(`  !! pageerrors: ${pageErrors.length}`);
        allPassed = false;
      }
      if (consoleErrors.length > 0) {
        console.error(`  !! console errors: ${consoleErrors.length}`);
        allPassed = false;
      }

      // Compare if requested
      if (shouldCompare && existsSync(resolve(ROOT, state.reference))) {
        const diffPath = join(DIFF_DIR, `${state.name}-diff.png`);
        const metricsPath = join(DIFF_DIR, `${state.name}-metrics.json`);

        try {
          execSync(
            `node "${resolve(ROOT, "scripts/png-diff.cjs")}" "${screenshotPath}" "${resolve(ROOT, state.reference)}" "${diffPath}" "${metricsPath}"`,
            { stdio: "pipe" }
          );
          const metrics = JSON.parse(readFileSync(metricsPath, "utf-8"));
          const passed = metrics.mismatchRatio <= (state.maxMismatchRatio || 0.015);
          console.log(`  -> mismatch: ${(metrics.mismatchRatio * 100).toFixed(2)}% ${passed ? "PASS" : "FAIL"}`);
          if (!passed) allPassed = false;
        } catch (err) {
          console.error(`  !! diff error: ${err.message}`);
          allPassed = false;
        }
      }

      results.push({
        id: state.id,
        name: state.name,
        pageErrors: pageErrors.length,
        consoleErrors: consoleErrors.length,
        screenshot: screenshotPath,
      });
    } catch (err) {
      console.error(`  !! render error for ${state.id}: ${err.message}`);
      allPassed = false;
      results.push({ id: state.id, name: state.name, error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Summary
  const summaryPath = join(OUTPUT_DIR, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n[e2e-design-14] ${allPassed ? "ALL PASSED" : "SOME FAILED"}`);
  console.log(`Summary: ${summaryPath}`);

  process.exit(allPassed ? 0 : 1);
}

async function applyDriver(page, state) {
  const driver = state.driver;

  switch (driver) {
    case "empty":
      // Clear localStorage to start fresh
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "networkidle" });
      break;

    case "workspace":
      // Import the workspace fixture
      const fixturePath = resolve(ROOT, "e2e/fixtures/design-workspace.html");
      const fixtureHtml = readFileSync(fixturePath, "utf-8");
      await page.evaluate((html) => {
        // Set the HTML into the editor
        const textarea = document.querySelector('textarea[aria-label="HTML 源码"]');
        if (textarea) {
          const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
          nativeSetter.call(textarea, html);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
        // Click apply
        const applyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent === "应用");
        applyBtn?.click();
      }, fixtureHtml);
      await page.waitForTimeout(1000);
      break;

    case "dom-tree":
      // First import workspace, then switch to DOM tree tab
      await applyDriver(page, { driver: "workspace" });
      await page.evaluate(() => {
        const domTab = document.querySelector('[data-dom-id="tab-structure"]');
        domTab?.click();
      });
      await page.waitForTimeout(500);
      break;

    case "device-mobile":
      await applyDriver(page, { driver: "workspace" });
      await page.evaluate(() => {
        const mobileBtn = document.querySelector('[data-dom-id="vp-mobile"]');
        mobileBtn?.click();
      });
      await page.waitForTimeout(500);
      break;

    case "diagnostics":
      const diagPath = resolve(ROOT, "e2e/fixtures/design-diagnostics.html");
      const diagHtml = readFileSync(diagPath, "utf-8");
      await page.evaluate((html) => {
        const textarea = document.querySelector('textarea[aria-label="HTML 源码"]');
        if (textarea) {
          const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
          nativeSetter.call(textarea, html);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const applyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent === "应用");
        applyBtn?.click();
      }, diagHtml);
      await page.waitForTimeout(1000);
      break;

    default:
      // Default: just wait for the page to render
      await page.waitForTimeout(1000);
  }

  // Apply dark theme if needed
  if (state.theme === "dark") {
    await page.evaluate(() => {
      document.documentElement.classList.add("theme-dark");
      document.documentElement.classList.remove("theme-light");
    });
    await page.waitForTimeout(300);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
