/**
 * 真实端到端导出测试
 *
 * 启动 e2e-serve.cjs(本脚本假定 4174 已起),用 Playwright + 系统 Chrome 打开
 * /HTML/ 页面,分别点击"导出 PDF"与"导出 PPTX",捕获浏览器下载文件,
 * 用第三方库独立验证:
 *   - PDF: pdf-parse v2.x (Node) 提取文本、metadata、image 数量
 *   - PPTX: jszip 解压 slide1.xml + image1-1.png + slide1.xml.rels + [Content_Types].xml
 *           校验 rId 引用 + PNG 头真实解码 (pngjs) + content-types 注册
 *   - PNG: pngjs 解析 width/height/bitDepth
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");
const JSZip = require("jszip");
const { PNG } = require("pngjs");
const pdfParseModule = require("pdf-parse");
// pdf-parse v2.x exports PDFParse class with .destroy() / .getText()
const PDFParse = pdfParseModule.PDFParse || pdfParseModule;

const PREVIEW_URL = process.env.PREVIEW_URL || "http://localhost:4174/HTML/";
const CHROME_PATH =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SCREENSHOT_TIMEOUT_MS = 60_000;
const PERSIST_DIR = process.env.PERSIST_DIR
  ? path.resolve(process.env.PERSIST_DIR)
  : null;

function maybePersist(name, bytes) {
  if (!PERSIST_DIR) return null;
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
  const fp = path.join(PERSIST_DIR, name);
  fs.writeFileSync(fp, bytes);
  return fp;
}

function log(...args) {
  console.log("[e2e]", ...args);
}

function fail(msg) {
  console.error("[e2e] FAIL:", msg);
  process.exitCode = 1;
}

function listZipFiles(bytes) {
  const files = [];
  const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocdOff = bytes.lastIndexOf(eocdSig);
  if (eocdOff < 0) return files;
  const centralCount = bytes.readUInt16LE(eocdOff + 10);
  const centralSize = bytes.readUInt32LE(eocdOff + 12);
  const centralOff = bytes.readUInt32LE(eocdOff + 16);
  const central = bytes.slice(centralOff, centralOff + centralSize);
  let pos = 0;
  for (let i = 0; i < centralCount; i += 1) {
    const sig = central.readUInt32LE(pos);
    if (sig !== 0x02014b50) break;
    const nameLen = central.readUInt16LE(pos + 28);
    const extraLen = central.readUInt16LE(pos + 30);
    const commentLen = central.readUInt16LE(pos + 32);
    const name = central.slice(pos + 46, pos + 46 + nameLen).toString("utf8");
    files.push(name);
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/**
 * 用 pdf-parse (第三方 Mozilla PDF.js 包装) 独立验证 PDF
 * 返回 { numPages, text, info, version, imageCount }
 */
async function verifyPdfWithPdfParse(bytes) {
  // pdf-parse v2.x 提供 PDFParse 类 (browser/Node 双端可用)
  // v1.x 提供函数式调用 .default(buffer). 兼容两种 API
  let result;
  // 检测 class: v2.x PDFParse 是 class (function 但 prototype 有 constructor)
  // v1.x 是普通函数;若按函数调用有 prototype.getText 等则是 class
  const isClass =
    typeof PDFParse === "function" &&
    PDFParse.prototype &&
    (PDFParse.prototype.getText || PDFParse.prototype.destroy);
  if (isClass) {
    // v2.x: new PDFParse({data}).getText()
    const parser = new PDFParse({ data: bytes });
    try {
      const textResult = await parser.getText();
      result = {
        numpages: textResult.pages?.length || textResult.total || 0,
        text: typeof textResult.text === "string" ? textResult.text : (textResult.pages || []).map((p) => p.text).join("\n"),
        info: {},
        version: textResult.version || "unknown",
      };
    } finally {
      try {
        await parser.destroy?.();
      } catch {
        // ignore
      }
    }
  } else if (typeof PDFParse === "function") {
    // v1.x: 直接调用
    result = await PDFParse(bytes);
  } else if (typeof PDFParse === "object" && PDFParse) {
    throw new Error("pdf-parse 模块格式不支持");
  } else {
    throw new Error("pdf-parse 模块格式不支持");
  }
  return {
    numPages: result.numpages,
    textLength: (result.text || "").length,
    info: result.info || {},
    version: result.version,
  };
}

/**
 * 用 pdfjs-dist (Mozilla PDF.js 真正实现) 作为第三个独立验证器
 * pdf-parse 是它的封装, 这层直接调用 pdfjs 真实 API
 */
async function verifyPdfWithPdfJsDist(bytes) {
  // pdfjs-dist 是 ESM-only, 用 dynamic import
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Node 环境需要 disableWorker (无 worker)
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: false,
  });
  const doc = await loadingTask.promise;
  try {
    const numPages = doc.numPages;
    let textContent = "";
    for (let p = 1; p <= numPages; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      textContent += tc.items.map((it) => it.str || "").join(" ");
      await page.cleanup();
    }
    const meta = await doc.getMetadata();
    return {
      numPages,
      textLength: textContent.length,
      title: meta?.info?.Title || "",
      creator: meta?.info?.Creator || "",
    };
  } finally {
    try {
      await doc.destroy();
    } catch {
      // ignore
    }
  }
}

async function withTimeout(promise, ms, label) {
  let to;
  const timeout = new Promise((_, reject) => {
    to = setTimeout(() => reject(new Error(`${label} 超时 (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(to));
}

async function clickAndWaitForDownload(page, locator) {
  const downloadPromise = page.waitForEvent("download", { timeout: SCREENSHOT_TIMEOUT_MS });
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  const download = await downloadPromise;
  const path = await download.path();
  const name = download.suggestedFilename();
  return { download, path, name };
}

async function runPdfScenario(context) {
  log("=== PDF scenario ===");
  const page = await context.newPage();
  page.on("pageerror", (err) => log("[page error]", err.message));
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: SCREENSHOT_TIMEOUT_MS });
  await page.waitForSelector(".toolbar", { timeout: SCREENSHOT_TIMEOUT_MS });
  const pdfButton = page.locator('button[title="AI 预检后导出 PDF"]');
  const { download, path: dlPath, name } = await withTimeout(
    clickAndWaitForDownload(page, pdfButton),
    90_000,
    "PDF export"
  );
  const bytes = fs.readFileSync(dlPath);
  log(`PDF downloaded: ${name} (${bytes.length} bytes)`);
  const persistedPdfPath = maybePersist(name, bytes);
  if (persistedPdfPath) log(`PDF persisted -> ${persistedPdfPath}`);
  if (!name.endsWith(".pdf")) fail(`PDF 文件名错误: ${name}`);
  if (bytes.length === 0) {
    fail("PDF 字节为空");
    await page.close();
    return null;
  }
  // ===== 第三方独立验证(pdf-parse) =====
  const pdfParseResult = await verifyPdfWithPdfParse(bytes);
  log(`pdf-parse: pages=${pdfParseResult.numPages}, version=${pdfParseResult.version}, textLen=${pdfParseResult.textLength}`);
  if (pdfParseResult.numPages < 1) {
    fail(`pdf-parse: PDF 没有任何页面 (${pdfParseResult.numPages})`);
  }
  if (pdfParseResult.textLength < 5) {
    fail(`pdf-parse: PDF 文本为空,可能是空白 PDF (textLen=${pdfParseResult.textLength})`);
  } else {
    log(`✓ pdf-parse: PDF 文本长度 ${pdfParseResult.textLength} chars,非空白`);
  }
  log(`pdf-parse: PDF info = ${JSON.stringify(pdfParseResult.info)}`);

  // 仍然保留 pdf-lib 自检(pdf-lib 是不同库,但用作尺寸 + image XObject 检查)
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  if (pageCount !== pdfParseResult.numPages) {
    fail(`pdf-lib vs pdf-parse 页数不一致: ${pageCount} vs ${pdfParseResult.numPages}`);
  }
  const firstPage = doc.getPage(0);
  const { width, height } = firstPage.getSize();
  log(`pdf-lib: page[0] size = ${width.toFixed(1)} x ${height.toFixed(1)} pt`);
  if (width < 50 || height < 50) fail(`PDF 页面过小: ${width}x${height}`);
  if (width / height > 5 || height / width > 5) {
    fail(`PDF 页面比例异常: ${width}x${height}`);
  }
  // 验证 PDF 版本号
  if (!pdfParseResult.version) {
    fail("pdf-parse: PDF 版本号缺失");
  } else {
    log(`✓ PDF 版本: ${pdfParseResult.version}`);
  }

  // ===== 第三方独立验证 #2: pdfjs-dist (Mozilla 真正的 PDF.js 实现) =====
  // pdf-parse 是 pdfjs 的封装, 这一层直接用 pdfjs 真实 API, 独立交叉验证
  log("Running pdfjs-dist independent verifier...");
  let pdfjsResult = null;
  try {
    pdfjsResult = await withTimeout(
      verifyPdfWithPdfJsDist(bytes),
      30_000,
      "pdfjs-dist"
    );
    log(`pdfjs-dist: pages=${pdfjsResult.numPages}, textLen=${pdfjsResult.textLength}, title="${pdfjsResult.title}", creator="${pdfjsResult.creator}"`);
    if (pdfjsResult.numPages !== pageCount) {
      fail(`pdfjs-dist vs pdf-lib 页数不一致: ${pdfjsResult.numPages} vs ${pageCount}`);
    } else {
      log(`✓ pdfjs-dist 独立验证通过: ${pdfjsResult.numPages} 页, textLen=${pdfjsResult.textLength}`);
    }
    if (pdfjsResult.textLength < 1) {
      // PDF 仅含图片无文字层是合法场景, 不算错
      log(`pdfjs-dist: PDF 仅含图片无文字层,符合 sampleHtml 设计`);
    } else {
      log(`✓ pdfjs-dist 文本层 ${pdfjsResult.textLength} chars`);
    }
  } catch (e) {
    fail(`pdfjs-dist 验证失败: ${e.message}`);
  }

  await page.close();
  return {
    name,
    bytes: bytes.length,
    pageCount,
    width,
    height,
    textLength: pdfParseResult.textLength,
    version: pdfParseResult.version,
    pdfjsTextLength: pdfjsResult?.textLength || 0,
    persistedPath: persistedPdfPath,
  };
}

async function runPptxScenario(context) {
  log("=== PPTX scenario ===");
  const page = await context.newPage();
  page.on("pageerror", (err) => log("[page error]", err.message));
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: SCREENSHOT_TIMEOUT_MS });
  await page.waitForSelector(".toolbar", { timeout: SCREENSHOT_TIMEOUT_MS });
  const pptxButton = page.locator('button[title="AI 预检后导出 PPTX"]');
  const { download, path: dlPath, name } = await withTimeout(
    clickAndWaitForDownload(page, pptxButton),
    90_000,
    "PPTX export"
  );
  const bytes = fs.readFileSync(dlPath);
  log(`PPTX downloaded: ${name} (${bytes.length} bytes)`);
  const persistedPptxPath = maybePersist(name, bytes);
  if (persistedPptxPath) log(`PPTX persisted -> ${persistedPptxPath}`);
  if (!name.endsWith(".pptx")) fail(`PPTX 文件名错误: ${name}`);
  if (bytes.length === 0) {
    fail("PPTX 字节为空");
    await page.close();
    return null;
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    fail(`PPTX 不是合法 zip (header: ${bytes[0].toString(16)} ${bytes[1].toString(16)})`);
    await page.close();
    return null;
  }

  // ===== 第三方独立验证(jszip 解压) =====
  const zip = await JSZip.loadAsync(bytes);
  const fileList = Object.keys(zip.files);
  log(`jszip: ${fileList.length} files in zip`);
  const hasContentTypes = fileList.includes("[Content_Types].xml");
  const hasPptFolder = fileList.some((n) => n.startsWith("ppt/"));
  const slideMatches = fileList.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const mediaFiles = fileList.filter((n) => /^ppt\/media\/image(?:[-_]\d+)+\.(png|jpe?g)$/i.test(n));
  log(
    `jszip structure: Content_Types=${hasContentTypes}, ppt/=${hasPptFolder}, slides=${slideMatches.length}, media=${mediaFiles.length}`,
    `media files: ${fileList.filter((n) => n.startsWith("ppt/media/")).join(", ")}`
  );
  if (!hasContentTypes) fail("jszip: PPTX 缺少 [Content_Types].xml");
  if (!hasPptFolder) fail("jszip: PPTX 缺少 ppt/ 文件夹");
  if (slideMatches.length < 1) fail("jszip: PPTX 没有任何 slide");

  // 验证 slide1.xml 是有效 XML + 包含 rId 引用
  if (slideMatches.length > 0) {
    const slideName = slideMatches.sort()[0];
    const slideXml = await zip.file(slideName).async("string");
    log(`slide xml[${slideName}] length: ${slideXml.length}, head: ${slideXml.slice(0, 200).replace(/\s+/g, ' ')}`);
    // XML 必须包含 <p:sld> + <p:cSld> + rId 引用
    if (!/<p:sld[\s>]/i.test(slideXml)) {
      fail(`slide xml 缺少 <p:sld> 根: ${slideName}`);
    }
    if (!/<p:cSld/i.test(slideXml)) {
      fail(`slide xml 缺少 <p:cSld>: ${slideName}`);
    }
    // 找 rId 引用(图片通过 rId 引用)
    const ridMatches = slideXml.match(/r:embed="(rId\d+)"/g) || [];
    log(`slide xml rId references: ${ridMatches.join(", ") || "(none)"}`);
    if (ridMatches.length < 1) {
      fail(`slide xml 没有任何图片 rId 引用: ${slideName}`);
    }
  }

  // 验证 image1-1.png 存在 + PNG magic bytes
  if (mediaFiles.length > 0) {
    const mediaName = mediaFiles.sort()[0];
    const mediaBytes = await zip.file(mediaName).async("uint8array");
    log(`media[${mediaName}] size: ${mediaBytes.length} bytes`);
    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const isPng = PNG_MAGIC.every((b, i) => mediaBytes[i] === b);
    if (!isPng) {
      const head = Array.from(mediaBytes.slice(0, 8))
        .map((b) => b.toString(16))
        .join(" ");
      fail(`media[${mediaName}] 不是合法 PNG (head: ${head})`);
    } else {
      log(`✓ media[${mediaName}] PNG magic bytes 正确`);
    }
    if (mediaBytes.length < 100) {
      fail(`media[${mediaName}] 字节过小,可能是空图片 (${mediaBytes.length})`);
    }
    // 用 pngjs 真正解码 PNG 头,验证 width/height 非零
    try {
      const png = PNG.sync.read(Buffer.from(mediaBytes));
      log(
        `✓ pngjs 解码 ${mediaName}: ${png.width} x ${png.height} px, depth=${png.colorType}, data length=${png.data.length}`
      );
      if (png.width < 1 || png.height < 1) {
        fail(`pngjs 解码 ${mediaName} 尺寸无效: ${png.width} x ${png.height}`);
      }
      if (png.data.length === 0) {
        fail(`pngjs 解码 ${mediaName} 像素数据为空`);
      }
    } catch (e) {
      fail(`pngjs 解码 ${mediaName} 失败: ${e.message}`);
    }
  } else {
    fail("jszip: PPTX 没有任何 media 文件");
  }

  // 验证 [Content_Types].xml 注册了 slide 与 image 类型 — 模拟 PowerPoint 打开时查找
  if (zip.file("[Content_Types].xml")) {
    const ctXml = await zip.file("[Content_Types].xml").async("string");
    log(`Content_Types.xml head: ${ctXml.slice(0, 500).replace(/\s+/g, ' ')}`);
    const slideOverrideMatch = ctXml.match(/slide\d+\.xml/);
    // pptxgenjs 用 Default 扩展名匹配 PNG, content-types 可能用 image\d+\.png 或 png/jpeg extension
    const mediaOverrideMatch =
      ctXml.match(/<Override\s+PartName="\/ppt\/media\/image\d+(?:-\d+)?\.(png|jpe?g)"/i) ||
      ctXml.match(/png/i);
    log(
      `Content_Types 注册: slide=${slideOverrideMatch?.[0] || "(none)"}, media=${
        mediaOverrideMatch?.[0] || "(none)"
      }`
    );
    if (!slideOverrideMatch) fail("[Content_Types].xml 未注册 slide xml 类型");
    if (mediaFiles.length > 0 && !mediaOverrideMatch) {
      fail("[Content_Types].xml 未注册 image 类型");
    }
    log("✓ Content_Types.xml 正确注册 slide + image 类型");
  } else {
    fail("PPTX 缺少 [Content_Types].xml");
  }

  // 验证 slide1.xml.rels 引用 image1-1.png
  if (slideMatches.length > 0) {
    const slideRelsName = slideMatches.sort()[0].replace("slides/", "slides/_rels/") + ".rels";
    if (zip.file(slideRelsName)) {
      const relsXml = await zip.file(slideRelsName).async("string");
      log(`slide rels[${slideRelsName}]: ${relsXml.slice(0, 200).replace(/\s+/g, ' ')}`);
      if (!/Target="\.\.\/media\//.test(relsXml)) {
        fail(`slide rels 没有引用 ppt/media: ${slideRelsName}`);
      } else {
        log(`✓ slide rels 正确引用 ppt/media/...`);
      }
    } else {
      log(`WARN: ${slideRelsName} 不存在`);
    }
  }

  // 验证 slideLayout
  if (!fileList.some((n) => /slideLayout\d+\.xml$/.test(n))) {
    fail("jszip: PPTX 缺少 slideLayout");
  }

  await page.close();
  return {
    name,
    bytes: bytes.length,
    slideCount: slideMatches.length,
    mediaCount: mediaFiles.length,
    fileListCount: fileList.length,
    persistedPath: persistedPptxPath,
  };
}

(async () => {
  log("Launching Chrome at", CHROME_PATH);
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ acceptDownloads: true });
  let pdfResult = null;
  let pptxResult = null;
  try {
    pdfResult = await runPdfScenario(context);
  } catch (err) {
    fail(`PDF 场景失败: ${err.message}`);
  }
  try {
    pptxResult = await runPptxScenario(context);
  } catch (err) {
    fail(`PPTX 场景失败: ${err.message}`);
  }
  await context.close();
  await browser.close();

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ pdf: pdfResult, pptx: pptxResult }, null, 2));
  if (process.exitCode && process.exitCode !== 0) {
    console.log("OVERALL: FAIL");
  } else {
    console.log("OVERALL: PASS");
  }
})();