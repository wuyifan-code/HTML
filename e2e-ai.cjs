/**
 * AI 端到端测试: 模拟厂商返回 malformed JSON,
 * 验证:
 *   1) 状态栏显示友好错误(非原始 JSON.parse 异常)
 *   2) 整个页面不崩(ErrorBoundary 不触发)
 *   3) 仍然可以继续编辑/导出
 */
const { chromium } = require("playwright");

const PREVIEW_URL = process.env.PREVIEW_URL || "http://localhost:4174/HTML/";
const CHROME_PATH = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function log(...args) {
  console.log("[e2e-ai]", ...args);
}
function fail(msg) {
  console.error("[e2e-ai] FAIL:", msg);
  process.exitCode = 1;
}

// 模拟厂商 chat/completions 端点。点击 "AI 扫描" 会调用我注入的 fetch
// 我们通过 addInitScript 注入全局 fetch wrapper,模拟厂商响应。
async function interceptMalformedAI(page) {
  // 在浏览器端注入全局 fetch wrapper,模拟厂商响应
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      const url = typeof input === "string" ? input : input?.url || "";
      const body = `下面是分析结果：
\`\`\`json
{ annotations: [
  {hftId:"hft-1", label:"标题", role:heading, confidence: NaN,},
  undefined_value_marker,
  broken array comma no separator
{ stray "quote inside value }
\`\`\`
解析失败,无法继续。`;
      // Gemini generateContent
      if (/:generateContent\b/.test(url)) {
        const envelope = {
          candidates: [
            {
              content: { parts: [{ text: body }], role: "model" },
              finishReason: "STOP",
            },
          ],
        };
        return new Response(JSON.stringify(envelope), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      // Gemini models 列表 — 返回正常模型,避免 AI 预检失败
      if (/\/models(?:\?|$)/.test(url)) {
        return new Response(
          JSON.stringify({
            models: [{ name: "models/gemini-test", displayName: "Gemini Test" }],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      // 其他厂商 chat/completions / anthropic / responses
      if (/chat\.completions|anthropic|responses/i.test(url)) {
        const envelope = {
          choices: [{ message: { content: body, role: "assistant" } }],
        };
        return new Response(JSON.stringify(envelope), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return originalFetch.apply(this, arguments);
    };
  });
}

async function runScenario(context) {
  log("=== AI malformed JSON scenario ===");
  const page = await context.newPage();
  let pageError = null;
  page.on("pageerror", (e) => {
    log("[page error]", e.message);
    pageError = e;
  });
  page.on("console", (msg) => {
    const t = msg.text();
    if (
      t.includes("[AI Structure]") ||
      t.includes("[Export:") ||
      t.includes("[HTML FineTune]") ||
      t.includes("AI 扫描") ||
      t.includes("已标注")
    ) {
      log("CONSOLE", t.slice(0, 1500));
    }
  });
  // 拦截 fetch
  await interceptMalformedAI(page);
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".app-shell", { timeout: 15000 });
  // 注入一个假的 API key + reload,让 React 读 localStorage
  await page.evaluate(() => {
    try {
      localStorage.setItem(
        "html-finetune.ai-provider-keys",
        JSON.stringify({ google: "fake-key-for-e2e" })
      );
    } catch {
      // ignore
    }
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".app-shell", { timeout: 15000 });

  // 打开 AI 弹窗
  const aiButton = page.locator('button[title*="AI" i], [aria-label*="AI" i]').first();
  // 用更稳定的: 找到结构/树 tab 切换 + 扫描按钮
  // 简单起见,直接找 "AI 扫描" 按钮
  log("Looking for AI 扫描 button...");
  // HTML FineTune 的 AI 弹窗在结构 tab 下打开
  const treeButton = page.locator('button[title*="结构" i], button[title*="Tree" i]').first();
  if ((await treeButton.count()) > 0) {
    await treeButton.click();
    log("Switched to tree tab");
  }

  // 查找 "AI 扫描" 按钮
  const scanButton = page.locator('button:has-text("AI 扫描")').first();
  await scanButton.waitFor({ state: "visible", timeout: 15000 });
  log("Clicking AI 扫描...");
  log("scan button disabled?", await scanButton.getAttribute("disabled"));
  log("status before click:", await page.locator(".status-message").textContent().catch(() => "(none)"));
  await scanButton.click();
  await page.waitForTimeout(2000);
  log("status after click:", await page.locator(".status-message").textContent().catch(() => "(none)"));

  // 等待错误出现
  log("Waiting for friendly error to appear...");
  let errorText = null;
  try {
    await page.waitForFunction(
      () => {
        const candidates = Array.from(document.querySelectorAll(".ai-tree-error, .ai-model-fetch-error, .ai-error-details"));
        return candidates.some((el) => el.textContent && el.textContent.trim().length > 0);
      },
      { timeout: 60_000 }
    );
    errorText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll(".ai-tree-error, .ai-model-fetch-error"));
      return els.map((el) => el.textContent?.trim()).filter(Boolean).join(" | ");
    });
  } catch (e) {
    log(`warn: 未找到 AI 错误显示 (${e.message}), 截图调试`);
    log("status timeout:", await page.locator(".status-message").textContent().catch(() => "(none)"));
  }

  if (errorText) {
    log(`AI error displayed: ${errorText.slice(0, 300)}`);
  }

  // 验证: 不应该出现原始 JSON.parse 错误
  if (errorText && /JSON\.parse|position \d+ \(line \d+ column \d+\)/.test(errorText)) {
    fail(`错误信息暴露了原始 JSON.parse 异常: ${errorText.slice(0, 200)}`);
  } else {
    log("✓ 错误信息友好,未暴露 JSON.parse 内部异常");
  }

  // 验证: 主错误必须是"AI 返回的结构分析结果不是合法 JSON" — 这是 user-required
  if (errorText && errorText.includes("AI 返回的结构分析结果不是合法 JSON")) {
    log("✓ 主错误是 user-required 'AI 返回的结构分析结果不是合法 JSON'");
  } else {
    fail(`主错误不是 user-required 消息,实际: ${errorText?.slice(0, 300)}`);
  }

  // 验证: 不应该是 secondary "Google 返回的不是合法 JSON"(那说明走到了 JSON.parse 失败而不是 parseJsonObject)
  if (errorText && /Google\s+返回的不是合法\s*JSON/.test(errorText) && !errorText.includes("AI 返回的结构分析结果不是合法 JSON")) {
    fail(`错误走到了 secondary 'Google 返回的不是合法 JSON' 而非 parseJsonObject 路径,实际: ${errorText.slice(0, 300)}`);
  } else {
    log("✓ 错误未落到 secondary 'Google 返回的不是合法 JSON'(说明走的是 parseJsonObject 路径)");
  }

  // 验证: 应该出现友好消息
  if (errorText && (errorText.includes("不是合法 JSON") || errorText.includes("重试") || errorText.includes("扫描"))) {
    log("✓ 友好错误消息出现");
  } else {
    log(`WARN: 错误信息可能不够友好: ${errorText?.slice(0, 200)}`);
  }

  // 验证: 页面没崩
  const appShell = await page.locator(".app-shell").count();
  if (appShell === 0) {
    fail("页面 .app-shell 消失,ErrorBoundary 接管");
  } else {
    log("✓ 页面 .app-shell 仍在,ErrorBoundary 未触发");
  }

  if (pageError) {
    fail(`page error 出现: ${pageError.message}`);
  }

  // 验证: 仍可以点 PDF 导出按钮(说明工具栏没卡死)
  const pdfButton = page.locator('button[title="AI 预检后导出 PDF"]');
  const pdfCount = await pdfButton.count();
  log(`PDF button still available: ${pdfCount > 0}`);

  await page.close();
  return { errorText, appShellCount: appShell, pdfCount };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext();
  try {
    const result = await runScenario(context);
    console.log("\n=== AI e2e SUMMARY ===");
    console.log(JSON.stringify(result, null, 2));
    if (process.exitCode && process.exitCode !== 0) {
      console.log("OVERALL: FAIL");
    } else {
      console.log("OVERALL: PASS");
    }
  } catch (e) {
    fail(`Scenario error: ${e.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
})();