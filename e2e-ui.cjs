/**
 * E2E: 界面操作与截图测试
 *
 * 启动 Playwright + 系统 Chrome，进行 12 步核心交互并保存截图到 .screenshots/
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const PREVIEW_URL = process.env.PREVIEW_URL || "http://localhost:4174/HTML/";
const CHROME_PATH =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TIMEOUT_MS = 60_000;
const SCREENSHOT_DIR = path.join(__dirname, ".screenshots");

function log(...args) {
  console.log("[e2e-ui]", ...args);
}

function fail(msg) {
  console.error("[e2e-ui] FAIL:", msg);
  process.exitCode = 1;
}

// 确保目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  log("Launching Chrome at", CHROME_PATH);
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("pageerror", (err) => log("[page error]", err.message));

  // 1. 访问主页
  log("Step 1: Navigating to page...");
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
  await page.waitForSelector(".nw-body.workspace", { timeout: TIMEOUT_MS });
  await page.waitForTimeout(500);

  // 初始化防空状态干扰逻辑：若处于空状态，则真实上传一个 HTML 初始化工作区
  const isEmptyVisible = await page.locator('.empty-workspace').isVisible().catch(() => false);
  if (isEmptyVisible) {
    log("Empty workspace detected, importing HTML file to initialize...");
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('.empty-workspace__cta').click(),
    ]);
    await fileChooser.setFiles({
      name: 'initial.html',
      mimeType: 'text/html',
      buffer: Buffer.from('<div id="root-div" style="min-height: 600px; padding: 40px;"><h1 id="title-1">FineTune Title</h1><p id="desc-1">Original Text</p></div>'),
    });
    await page.waitForTimeout(1000);
    log("Initialization HTML imported successfully!");
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_initial_home.png") });
  log("Captured 01_initial_home.png");

  // 2. 切换到“结构树” Tab
  log("Step 2: Switching to Structure tab...");
  try {
    const tabStructure = page.locator('[data-dom-id="tab-structure"]');
    await tabStructure.waitFor({ state: "attached", timeout: 5000 });
    await tabStructure.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_dom_tree_tab.png") });
    log("Captured 02_dom_tree_tab.png");
  } catch (err) {
    log("Failed in Step 2. Diagnostic DOM print:");
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        id: b.getAttribute('id'),
        domId: b.getAttribute('data-dom-id'),
        classes: b.className
      }));
    });
    log("Available buttons:", JSON.stringify(buttons, null, 2));
    throw err;
  }

  // 3. 切换到“来源” Tab
  log("Step 3: Switching to Source editor tab...");
  const sourceTab = page.locator('[data-dom-id="tab-source"]');
  await sourceTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_source_tab.png") });
  log("Captured 03_source_tab.png");

  // 4. 输入多节点源码
  log("Step 4: Filling multi-node HTML source...");
  const textarea = page.locator('textarea.source-code-textarea');
  await textarea.fill('<div id="root-div" style="min-height: 600px; padding: 24px;"><h1 id="title-1">FineTune Title</h1><p id="desc-1" class="paragraph">Original Paragraph Text.</p></div>');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_fill_html.png") });
  log("Captured 04_fill_html.png");

  // 5. 应用源码
  log("Step 5: Applying HTML source...");
  const applySourceBtn = page.locator('.source-editor-draft-group button:has-text("应用")');
  await applySourceBtn.click();
  await page.waitForTimeout(1000); // 等待预览渲染
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_apply_html.png") });
  log("Captured 05_apply_html.png");

  // 6. 切换回“结构树” Tab 并选中第一个元素
  log("Step 6: Selecting element via DOM tree...");
  try {
    const tabStructureForSelect = page.locator('[data-dom-id="tab-structure"]');
    await tabStructureForSelect.click();
    await page.waitForTimeout(500);
    // 点击选中有 text-node 或 p 的 tree 项
    const firstTreeItem = page.locator('.tree-node').first();
    await firstTreeItem.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_select_element.png") });
    log("Captured 06_select_element.png");
  } catch (err) {
    log("Failed in Step 6. Diagnostic DOM print:");
    const treeItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).map(el => {
        const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
        return {
          tagName: el.tagName,
          id: el.getAttribute('id'),
          className: cls,
          text: el.textContent?.trim().slice(0, 50)
        };
      }).filter(x => x.className.includes('tree-item') || x.className.includes('tree-node') || x.className.includes('dom-tree') || x.className.includes('workspace'));
    });
    log("Tree related elements in DOM:", JSON.stringify(treeItems, null, 2));
    throw err;
  }

  // 7. 在右侧 Inspector 修改字体字号
  log("Step 7: Modifying Font Size in Inspector...");
  const fontSizeInput = page.locator('label:has-text("字号") input');
  await fontSizeInput.fill("28px");
  await page.waitForTimeout(300);
  const applyStyleBtn = page.locator('button:has-text("应用样式到 Canvas")');
  await applyStyleBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_change_fontsize.png") });
  log("Captured 07_change_fontsize.png");

  // 8. 修改对齐为居中
  log("Step 8: Centering text...");
  const centerAlignBtn = page.locator('button[aria-label="居中"]');
  await centerAlignBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_align_center.png") });
  log("Captured 08_align_center.png");

  // 9. 在文字内容 textarea 改文字
  log("Step 9: Updating text content...");
  const contentInput = page.locator('#contentInput');
  if (await contentInput.isVisible()) {
    await contentInput.fill("FineTune Updated Heading Text");
    await page.waitForTimeout(300);
    const applyTextBtn = page.locator('button:has-text("应用到 Canvas")');
    await applyTextBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09_change_text_content.png") });
  log("Captured 09_change_text_content.png");

  // 10. 点击导出按钮，显示统一导出弹窗 HTML Tab
  log("Step 10: Opening Export Dialog (HTML Tab)...");
  const exportBtn = page.locator('[data-dom-id="btn-export"]');
  await exportBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10_export_dialog_html.png") });
  log("Captured 10_export_dialog_html.png");

  // 11. 切换到 PDF Tab
  log("Step 11: Switching to PDF format Tab...");
  const pdfTab = page.locator('[data-dom-id="tab-format-pdf"]');
  await pdfTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11_export_dialog_pdf.png") });
  log("Captured 11_export_dialog_pdf.png");

  // 12. 切换到 PPTX Tab
  log("Step 12: Switching to PPTX format Tab...");
  const pptxTab = page.locator('[data-dom-id="tab-format-pptx"]');
  await pptxTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12_export_dialog_pptx.png") });
  log("Captured 12_export_dialog_pptx.png");

  log("All 12 screenshots taken successfully!");
  await context.close();
  await browser.close();
  log("OVERALL: PASS");
}

run().catch((err) => {
  fail(err.message);
  process.exit(1);
});
