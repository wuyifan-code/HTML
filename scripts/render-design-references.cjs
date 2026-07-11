/**
 * scripts/render-design-references.cjs
 *
 * Renders reference PNGs from docs/design-source/pages/*.html using Playwright.
 *
 * Dark states (D03, D12, D14) have an erroneous `class="light" data-theme="light"`
 * on the root <html>. This script corrects the class in-browser before screenshotting;
 * the original files on disk are never modified.
 *
 * Usage:
 *   node scripts/render-design-references.cjs --update   # write/update reference PNGs
 *   node scripts/render-design-references.cjs --check    # verify references exist and are renderable
 */

const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");
const url = require("url");

const { states } = require("./design-states.cjs");

const PAGES_DIR = path.resolve(__dirname, "../docs/design-source/pages");
const PROJECT_ROOT = path.resolve(__dirname, "..");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * Minimal static file server for the design-source/pages directory.
 * Serves files with proper content-type and URL-encoded paths.
 */
function createStaticServer(rootDir) {
  return http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".json": "application/json; charset=utf-8",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
}

function waitServer(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server not ready on port ${port}`));
        return;
      }
      http
        .get(`http://localhost:${port}/`, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            resolve();
          } else {
            setTimeout(check, 300);
          }
        })
        .on("error", () => setTimeout(check, 300));
    }
    check();
  });
}

async function renderState(browser, port, state, isUpdate) {
  const page = await browser.newPage({
    viewport: { width: state.viewport.width, height: state.viewport.height },
    deviceScaleFactor: 1,
  });

  const sourceUrl = `http://localhost:${port}/${encodeURIComponent(state.sourceFile)}`;
  await page.goto(sourceUrl, { waitUntil: "networkidle", timeout: 20000 });

  // Dark state correction: fix the erroneous root class/data-theme
  if (state.sourceRootCorrection && state.theme === "dark") {
    await page.evaluate(() => {
      const root = document.documentElement;
      root.classList.remove("light");
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    });
  }

  // Allow fonts and layout to settle
  await page.waitForTimeout(500);

  const referencePath = path.resolve(PROJECT_ROOT, state.reference);

  if (isUpdate) {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(referencePath), { recursive: true });
    await page.screenshot({ path: referencePath, fullPage: false });
    console.log(`  [updated] ${state.id} → ${state.reference}`);
  } else {
    // Check mode: verify the reference exists and is a valid PNG
    if (!fs.existsSync(referencePath)) {
      throw new Error(`Reference PNG missing for ${state.id}: ${state.reference}`);
    }
    const stat = fs.statSync(referencePath);
    if (stat.size < 100) {
      throw new Error(`Reference PNG too small for ${state.id}: ${state.reference} (${stat.size} bytes)`);
    }
    // Verify the source page renders without throwing
    const title = await page.title();
    console.log(`  [checked] ${state.id} — "${title}" — reference OK`);
  }

  await page.close();
}

async function main() {
  const isUpdate = process.argv.includes("--update");
  const isCheck = process.argv.includes("--check");

  if (!isUpdate && !isCheck) {
    console.error("Usage: node scripts/render-design-references.cjs --update | --check");
    process.exit(1);
  }

  const port = await getFreePort();
  const server = createStaticServer(PAGES_DIR);

  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`Static server listening on port ${port}`);
  console.log(`Serving from: ${PAGES_DIR}`);

  await waitServer(port);
  console.log(`Mode: ${isUpdate ? "UPDATE" : "CHECK"}`);
  console.log(`Rendering ${states.length} states...\n`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const state of states) {
      await renderState(browser, port, state, isUpdate);
    }
    console.log(`\nAll ${states.length} states processed successfully.`);
  } catch (err) {
    console.error(`\nERROR: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main();
