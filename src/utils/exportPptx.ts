/**
 * PPTX 导出工具
 *
 * 调用 capturePreviewAsPng 截图,然后用 pptxgenjs 把每页 PNG 嵌入 PPTX。
 * 设计:
 *   - 16:9 slide(13.333 x 7.5 inch)
 *   - 图片按 cover/contain 比例适配
 *   - 失败抛 ExportError
 */

import { downloadBlob } from "./downloadBlob";
import { ExportError, type ExportErrorCode, formatExportError, loadBundleScript } from "./exportErrors";
import { capturePreviewAsPng, type RenderedPage, type SnapshotInput, type HtmlToImageLike } from "./exportSnapshot";

export interface ExportPptxOptions extends Omit<SnapshotInput, "html"> {
  loadPptxGen?: () => Promise<PptxGenJsLike>;
  download?: (blob: Blob, filename: string) => void;
  /** 测试注入:替换 html-to-image 模块 */
  htmlToImage?: HtmlToImageLike;
}

export interface PptxGenJsLike {
  new (): PptxGenInstance;
}

export interface PptxGenInstance {
  author?: string;
  company?: string;
  subject?: string;
  title?: string;
  layout?: string;
  defineLayout?: (layout: { name: string; width: number; height: number }) => void;
  addSlide?: () => PptxSlideInstance;
  write?: (options: { outputType: "blob" | "arraybuffer" }) => Promise<ArrayBuffer>;
  writeFile?: (options: { fileName: string }) => Promise<unknown>;
}

export interface PptxSlideInstance {
  background?: { color: string };
  addImage: (options: PptxAddImageOptions) => void;
}

export interface PptxAddImageOptions {
  data: string;
  path?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 16:9 标准幻灯片尺寸(英寸) */
export const PPTX_SLIDE_WIDTH_IN = 13.333;
export const PPTX_SLIDE_HEIGHT_IN = 7.5;

/** 默认 PPTX 文件名 */
export const DEFAULT_PPTX_FILENAME = "edited-page.pptx";

export async function buildPptxBlob(
  html: string,
  options: ExportPptxOptions = {}
): Promise<{ blob: Blob; pageCount: number }> {
  if (!html.trim()) {
    throw new ExportError("没有可导出的 HTML 内容", "pptx-empty");
  }

  let pages: RenderedPage[];
  try {
    pages = await capturePreviewAsPng({
      ...options,
      html,
    });
  } catch (error) {
    throw new ExportError(
      `PPTX 导出失败:${error instanceof Error ? error.message : String(error)}`,
      "pptx-render-failed",
      error
    );
  }
  if (pages.length === 0) {
    throw new ExportError("PPTX 没有任何页面", "pptx-empty");
  }

  const loadPptx = options.loadPptxGen ?? defaultLoadPptx;
  let PptxGenCtor: PptxGenJsLike;
  try {
    PptxGenCtor = await loadPptx();
  } catch (error) {
    throw new ExportError("无法加载 pptxgenjs 模块", "library-load-failed", error);
  }

  const pptx = new PptxGenCtor();
  // LAYOUT_WIDE 是 pptxgenjs 内置 16:9 layout (13.33" x 7.5")
  // 自定义 defineLayout 在某些 pptxgenjs 版本上会触发 UNKNOWN-LAYOUT
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "HTML FineTune";
  pptx.company = "HTML FineTune";
  pptx.subject = "Exported from HTML FineTune";
  pptx.title = "HTML FineTune Export";

  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    const slide = pptx.addSlide?.();
    if (!slide) {
      throw new ExportError("pptxgenjs 无法新增 slide", "pptx-render-failed");
    }
    slide.background = { color: "FFFFFF" };
    const rect = fitIntoBox(page.width, page.height, PPTX_SLIDE_WIDTH_IN, PPTX_SLIDE_HEIGHT_IN);
    slide.addImage({ data: page.dataUrl, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  }

  // pptxgenjs 浏览器环境:writeFile 会触发下载;write({outputType:'blob'}) 返回 Blob
  // 注意: Vite/esbuild 编译后, pptx.write 内部的 __awaiter(this, void 0, void 0, function*() {...})
  // 会因为 generator 的 this-binding 语义在 Chrome 严格模式下解析为 undefined,
  // 触发 "Cannot read properties of undefined (reading 'exportPresentation')" 错误。
  // 直接调 exportPresentation 绕过这个 esbuild 已知问题。
  let blob: Blob;
  const presenter = pptx as unknown as {
    exportPresentation?: (opts: { outputType: string; compression?: boolean }) => Promise<ArrayBuffer>;
  };
  if (typeof presenter.exportPresentation === "function") {
    try {
      const arrayBuffer = await presenter.exportPresentation({ outputType: "arraybuffer" });
      blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
    } catch (error) {
      throw new ExportError("PPTX 文件生成失败", "pptx-write-failed", error);
    }
  } else if (typeof pptx.write === "function") {
    // 兼容旧版或没有 exportPresentation 的 pptxgenjs: 调 write({outputType:'arraybuffer'})
    // 内部仍会经过 esbuild __awaiter 的 generator this-binding bug,
    // 失败时由 catch 统一包装为 pptx-write-failed。
    try {
      const arrayBuffer = await pptx.write({ outputType: "arraybuffer" });
      blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
    } catch (error) {
      throw new ExportError("PPTX 文件生成失败", "pptx-write-failed", error);
    }
  } else if (pptx.writeFile) {
    throw new ExportError(
      "当前 pptxgenjs 只提供 writeFile,无法返回 Blob。请升级 pptxgenjs 或打开浏览器下载弹窗。",
      "pptx-write-failed"
    );
  } else {
    throw new ExportError("pptxgenjs 缺少 write/writeFile", "library-load-failed");
  }

  if (blob.size === 0) {
    throw new ExportError("PPTX 输出为空", "pptx-empty");
  }
  return { blob, pageCount: pages.length };
}

export async function exportPptxFromHtml(
  html: string,
  options: ExportPptxOptions = {}
): Promise<number> {
  const { blob, pageCount } = await buildPptxBlob(html, options);
  const filename = options.filename ?? DEFAULT_PPTX_FILENAME;
  const download = options.download ?? ((b: Blob, n: string) => downloadBlob(b, n));
  download(blob, filename);
  return pageCount;
}

/**
 * 把图片尺寸适配到 16:9 slide,留白居中
 */
export function fitIntoBox(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number
): { x: number; y: number; w: number; h: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, w: boxWidth, h: boxHeight };
  }
  const imageRatio = imageWidth / imageHeight;
  const boxRatio = boxWidth / boxHeight;
  if (imageRatio > boxRatio) {
    const h = boxWidth / imageRatio;
    return { x: 0, y: (boxHeight - h) / 2, w: boxWidth, h };
  }
  const w = boxHeight * imageRatio;
  return { x: (boxWidth - w) / 2, y: 0, w, h: boxHeight };
}

async function defaultLoadPptx(): Promise<PptxGenJsLike> {
  // 浏览器端固定走预打包的 IIFE bundle(public/pptxgen.bundle.js),绕开 Vite/esbuild minify 时的
  // scope-mangle 导致 JSZip.default 引用丢失的问题。
  // 使用相对路径(./pptxgen.bundle.js), 让 URL 按 window.location.href 解析,
  // 兼容 GitHub Pages 子路径部署。
  if (typeof window === "undefined") {
    throw new ExportError("PPTX 导出需要浏览器环境", "browser-unsupported");
  }

  const Ctor = await loadBundleScript<PptxGenJsLike>(
    (import.meta.env.BASE_URL || "/") + "pptxgen.bundle.js",
    "PptxGenBundle"
  );
  if (typeof Ctor !== "function") {
    throw new ExportError("pptxgenjs 预打包模块加载失败", "library-load-failed");
  }
  return Ctor;
}

export function formatPptxError(error: unknown): string {
  return formatExportError(error, "pptx-render-failed" as ExportErrorCode);
}
