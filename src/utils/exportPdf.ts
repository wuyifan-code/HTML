/**
 * PDF 导出工具
 *
 * 调用 capturePreviewAsPng 截图,然后用 pdf-lib 把每页 PNG 嵌入 PDF。
 * 设计:动态 import pdf-lib + html-to-image,失败抛 ExportError。
 */

import { downloadBlob } from "./downloadBlob";
import { ExportError, type ExportErrorCode, formatExportError, loadBundleScript } from "./exportErrors";
import { capturePreviewAsPng, type RenderedPage, type SnapshotInput, type HtmlToImageLike } from "./exportSnapshot";

export interface ExportPdfOptions extends Omit<SnapshotInput, "html"> {
  /** 注入 pdf-lib 工厂,便于测试 */
  loadPdfLib?: () => Promise<PdfLibLike>;
  /** 自定义下载钩子,透传到 downloadBlob */
  download?: (blob: Blob, filename: string) => void;
  /** 测试注入:替换 html-to-image 模块 */
  htmlToImage?: HtmlToImageLike;
}

export interface PdfLibLike {
  PDFDocument: {
    create: () => Promise<PdfDocumentInstance>;
  };
  rgb?: (red: number, green: number, blue: number) => unknown;
}

export interface PdfDocumentInstance {
  embedPng: (data: Uint8Array) => Promise<PdfImageInstance>;
  addPage: (size: [number, number]) => PdfPageInstance;
  save: () => Promise<Uint8Array>;
}

export interface PdfPageInstance {
  drawImage: (image: PdfImageInstance, options: { x: number; y: number; width: number; height: number }) => void;
  drawRectangle: (options: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: unknown;
  }) => void;
}

export interface PdfImageInstance {
  width: number;
  height: number;
}

/** 默认 PDF 文件名 */
export const DEFAULT_PDF_FILENAME = "edited-page.pdf";

/**
 * 主入口:输入 HTML 字符串,输出 PDF Blob
 * 同时返回页面数,便于 UI 显示 "已导出 N 页 PDF"
 */
export async function buildPdfBlob(
  html: string,
  options: ExportPdfOptions = {}
): Promise<{ blob: Blob; pageCount: number }> {
  if (!html.trim()) {
    throw new ExportError("没有可导出的 HTML 内容", "pdf-empty");
  }

  let pages: RenderedPage[];
  try {
    pages = await capturePreviewAsPng({
      ...options,
      html,
    });
  } catch (error) {
    throw new ExportError(
      `PDF 导出失败:${error instanceof Error ? error.message : String(error)}`,
      "pdf-render-failed",
      error
    );
  }

  if (pages.length === 0) {
    throw new ExportError("PDF 没有任何页面", "pdf-empty");
  }

  const loadPdfLib = options.loadPdfLib ?? defaultLoadPdfLib;
  let pdfLib: PdfLibLike;
  try {
    pdfLib = await loadPdfLib();
  } catch (error) {
    throw new ExportError(
      "无法加载 pdf-lib 模块",
      "library-load-failed",
      error
    );
  }

  const pdf = await pdfLib.PDFDocument.create();
  for (const page of pages) {
    const pngBytes = dataUrlToUint8Array(page.dataUrl);
    if (pngBytes.byteLength === 0) {
      throw new ExportError("PDF 页面 PNG 数据为空", "pdf-render-failed");
    }
    const image = await pdf.embedPng(pngBytes);
    const { width, height } = computePdfPageSize(page.width, page.height, image.width, image.height);
    const pdfPage = pdf.addPage([width, height]);
    // 关键修复: pdf-lib 默认 PDF 页面透明 → 大多数 PDF viewer 把透明渲染为黑色。
    // 文字/icon 用了 currentColor / 透明背景的 SVG / icon-font 捕获出来的 PNG 在
    // 透明区域没有 alpha=255 的不透明背景，叠在黑底 PDF 上就成了"黑块"。
    // 与 exportPptx.ts:107 `slide.background = { color: "FFFFFF" }` 行为对齐:
    // 先铺一层白色背景矩形，再画图片。
    const white = pdfLib.rgb?.(1, 1, 1);
    if (white) {
      pdfPage.drawRectangle({ x: 0, y: 0, width, height, color: white });
    }
    pdfPage.drawImage(image, { x: 0, y: 0, width, height });
  }

  const bytes = await pdf.save();
  if (bytes.byteLength === 0) {
    throw new ExportError("PDF 保存结果为空", "pdf-render-failed");
  }

  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  return { blob, pageCount: pages.length };
}

export async function exportPdfFromHtml(
  html: string,
  options: ExportPdfOptions = {}
): Promise<number> {
  const { blob, pageCount } = await buildPdfBlob(html, options);
  const filename = options.filename ?? DEFAULT_PDF_FILENAME;
  const download = options.download ?? ((b: Blob, n: string) => downloadBlob(b, n));
  download(blob, filename);
  return pageCount;
}

/**
 * 计算 PDF 页面尺寸:用图片像素 + 72 DPI 换算到 PDF point
 * 1 point = 1/72 inch,图片通常按 96 DPI 浏览器渲染
 */
export function computePdfPageSize(
  cssWidth: number,
  cssHeight: number,
  imageWidth: number,
  imageHeight: number
): { width: number; height: number } {
  // 用 imageWidth/Height 优先,因为它来自真实 PNG;fallback 用 css 尺寸
  const w = imageWidth > 0 ? imageWidth : cssWidth;
  const h = imageHeight > 0 ? imageHeight : cssHeight;
  // 1 CSS pixel ≈ 0.75 point(96 DPI → 72 DPI)
  const SCALE = 72 / 96;
  return {
    width: Math.max(1, Math.round(w * SCALE)),
    height: Math.max(1, Math.round(h * SCALE)),
  };
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  if (!base64) return new Uint8Array(0);
  if (typeof atob === "undefined") return new Uint8Array(0);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
}

async function defaultLoadPdfLib(): Promise<PdfLibLike> {
  // 浏览器端固定走预打包的 IIFE bundle(public/pdf-lib.bundle.js),绕开 Vite/esbuild minify 时的
  // scope-mangle 导致 PDFDocument 引用丢失的问题。
  // 使用相对路径(./pdf-lib.bundle.js), 让 URL 按 window.location.href 解析,
  // 兼容 GitHub Pages 子路径部署(如 https://owner.github.io/HTML/)。
  if (typeof window === "undefined") {
    throw new ExportError("PDF 导出需要浏览器环境", "browser-unsupported");
  }

  const bundle = await loadBundleScript<{
    PDFDocument: PdfLibLike["PDFDocument"];
    rgb?: PdfLibLike["rgb"];
  }>(
    (import.meta.env.BASE_URL || "/") + "pdf-lib.bundle.js",
    "PdfLibBundle"
  );
  if (!bundle?.PDFDocument?.create) {
    throw new ExportError("pdf-lib 预打包模块加载失败", "library-load-failed");
  }
  return { PDFDocument: bundle.PDFDocument, rgb: bundle.rgb };
}

/**
 * 把 ExportError 翻译成 UI 友好消息
 */
export function formatPdfError(error: unknown): string {
  return formatExportError(error, "pdf-render-failed" as ExportErrorCode);
}
