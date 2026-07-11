/**
 * E2E: AI 预检异常拦截测试
 *
 * 启动 Playwright + 系统 Chrome，拦截 Google AI 接口，注入损坏的 JSON 响应体。
 * 随后进行四大硬断言：渲染 AI_STRUCTURE_INVALID_JSON_MESSAGE；无运行时 JS 报错；.app-shell 依然存活；顶栏导出按钮可用。
 */
const { chromium } = require("playwright");

const PREVIEW_URL = process.env.PREVIEW_URL || "http://localhost:4174/HTML/";
const CHROME_PATH =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TIMEOUT_MS = 60_000;

function log(...args) {
  console.log("[e2e-ai]", ...args);
}

function fail(msg) {
  console.error("[e2e-ai] FAIL:", msg);
  process.exitCode = 1;
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

  const pageErrors = [];
  page.on("pageerror", (err) => {
    log("[page error]", err.message);
    pageErrors.push(err);
  });

  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
  await page.waitForSelector(".nw-body.workspace", { timeout: TIMEOUT_MS });
  log("Page loaded, injecting mock AI key...");

  // 注入模拟的 Google AI Key，防止未填写 Key 的拦截报错
  await page.evaluate(() => {
    window.localStorage.setItem("html-finetune.ai-provider-keys", JSON.stringify({ google: "mock-google-ai-key-for-e2e" }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".nw-body.workspace", { timeout: TIMEOUT_MS });
  const checkKey = await page.evaluate(() => window.localStorage.getItem("html-finetune.ai-provider-keys"));
  log("Verified AI Key in storage after reload:", checkKey);
  log("Page reloaded with mock AI key!");

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

  // 1. 导入多节点 Fixture HTML 进入 DOM 树
  log("Switching to source tab and filling multi-node HTML...");
  try {
    const sourceTab = page.locator('[data-dom-id="tab-source"]');
    await sourceTab.waitFor({ state: "attached", timeout: 5000 });
    await sourceTab.click();
    await page.waitForTimeout(300);
  } catch (err) {
    log("Failed in sourceTab click. Diagnostic DOM print:");
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        id: b.getAttribute('id'),
        domId: b.getAttribute('data-dom-id'),
        classes: b.className
      }));
    });
    log("Available buttons in AI E2E Step 1:", JSON.stringify(buttons, null, 2));
    throw err;
  }

  const textarea = page.locator('textarea.source-code-textarea');
  await textarea.fill('<div id="node-1"><p class="text-node">Hello Node 1</p><p class="text-node">Hello Node 2</p></div>');
  await page.waitForTimeout(200);

  const applyBtn = page.locator('.source-editor-draft-group button:has-text("应用")');
  await applyBtn.click();
  await page.waitForTimeout(500);
  log("HTML applied to editor");

  // 2. 拦截 AI 请求，返回损坏的 JSON
  log("Setting up network interception for Google API...");
  await page.route("**/generativelanguage.googleapis.com/**", async (route) => {
    log("Intercepted AI request. Fulfilling with malformed JSON...");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: "{ malformed_json_response: [" // 明显损坏的 JSON
            }]
          }
        }]
      })
    });
  });

  // 3. 展开“结构树” Tab
  log("Switching to structure tab...");
  try {
    const structureTab = page.locator('[data-dom-id="tab-structure"]');
    await structureTab.waitFor({ state: "attached", timeout: 5000 });
    await structureTab.click();
    await page.waitForTimeout(300);
  } catch (err) {
    log("Failed in structureTab click. Diagnostic DOM print:");
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        id: b.getAttribute('id'),
        domId: b.getAttribute('data-dom-id'),
        classes: b.className
      }));
    });
    log("Available buttons in AI E2E:", JSON.stringify(buttons, null, 2));
    throw err;
  }

  // 点击工具栏的 “AI 扫描” 按钮
  log("Clicking AI Scan trigger button...");
  const scanTrigger = page.locator('button:has-text("AI 扫描")');
  await scanTrigger.click();
  await page.waitForTimeout(300);

  // 点击 Popover 里的 “开始扫描”
  log("Clicking start scan button inside popover...");
  const startScanBtn = page.locator('button:has-text("开始扫描")');
  await startScanBtn.click();

  // 4. 硬断言校验
  log("Verifying page behavior...");

  // 4.1. 必须显示指定的错误提示
  const errorText = page.locator('.ai-scan-error');
  await errorText.waitFor({ state: "visible", timeout: 15_000 });
  const errorContent = await errorText.textContent();
  log("Error text displayed on UI:", errorContent);
  if (!errorContent.includes("AI 返回的结构分析结果不是合法 JSON")) {
    fail(`错误文本不匹配。期待包含: "AI 返回的结构分析结果不是合法 JSON"，但实际显示为: "${errorContent}"`);
  } else {
    log("✓ 成功断言: 页面显示了指定的 JSON 解析失败提示");
  }

  // 4.2. 整个过程中不能有任何未捕获的运行时 JS 崩溃
  if (pageErrors.length > 0) {
    fail(`页面抛出了未捕获的运行时异常: ${pageErrors[0].message}`);
  } else {
    log("✓ 成功断言: 页面无未捕获的 pageerror 异常");
  }

  // 4.3. 应用程序外壳 .app-shell 必须仍然存活
  const shellCount = await page.locator('.app-shell').count();
  if (shellCount !== 1) {
    fail(`应用程序外壳存活断言失败: 期望 1 个 .app-shell，但找到 ${shellCount} 个`);
  } else {
    log("✓ 成功断言: .app-shell 依然存活");
  }

  // 4.4. 顶栏的统一导出按钮必须正常启用
  const exportBtn = page.locator('[data-dom-id="btn-export"]');
  const isEnabled = await exportBtn.isEnabled();
  if (!isEnabled) {
    fail("顶栏导出按钮处于禁用状态，阻碍了后续正常工作流");
  } else {
    log("✓ 成功断言: 统一导出按钮依然可用");
  }

  log("AI malformed JSON E2E test completed successfully");
  await context.close();
  await browser.close();
  log("OVERALL: PASS");
}

run().catch((err) => {
  fail(err.message);
  process.exit(1);
});
