/**
 * PPTX 导出工具
 *
 * 读取预览 iframe 的真实 DOM,用 pptxgenjs 重建可编辑文本/形状/图片对象;
 * 只有在页面没有可测量 DOM(例如极简测试环境)时才回退为整页 PNG。
 * 设计:
 *   - 16:9 slide(13.333 x 7.5 inch)
 *   - HTML 文本/形状/图片保持为独立 PPTX 对象
 *   - 无法测量 DOM 时图片按 contain 比例适配
 *   - 失败抛 ExportError
 */

import { downloadBlob } from "./downloadBlob";
import { ExportError, type ExportErrorCode, formatExportError, loadBundleScript } from "./exportErrors";
import {
  capturePreviewAsPng,
  type RenderedPageContext,
  type SnapshotInput,
  type HtmlToImageLike,
} from "./exportSnapshot";

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
  addShape?: (shapeType: string, options: PptxShapeOptions) => void;
  addText?: (text: string, options: PptxTextOptions) => void;
}

export interface PptxAddImageOptions {
  data: string;
  path?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PptxShapeOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: { color: string; transparency?: number; type?: "none" | "solid" };
  line?: { color?: string; width?: number; transparency?: number; type?: "none" | "solid" };
  objectName?: string;
}

export interface PptxTextOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  fontFace?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right" | "justify";
  valign?: "top" | "middle" | "bottom";
  margin?: number;
  fit?: "none" | "shrink" | "resize";
  breakLine?: boolean;
  objectName?: string;
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

  const slides: PptxSlideInstance[] = [];
  let pages: Awaited<ReturnType<typeof capturePreviewAsPng>>;
  try {
    pages = await capturePreviewAsPng({
      ...options,
      html,
      onPageRendered: (context) => {
        const slide = pptx.addSlide?.();
        if (!slide) {
          throw new ExportError("pptxgenjs 无法新增 slide", "pptx-render-failed");
        }
        slide.background = { color: "FFFFFF" };
        const editableCount = addEditablePageToSlide(slide, context, options.aiAnnotations);
        // DOM 无法测量时保留可视化回退,避免空白 PPTX;真实浏览器导出会优先生成可编辑对象。
        if (editableCount === 0) {
          const rect = fitIntoBox(context.width, context.height, PPTX_SLIDE_WIDTH_IN, PPTX_SLIDE_HEIGHT_IN);
          slide.addImage({ data: context.dataUrl, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
        }
        slides.push(slide);
      },
    });
  } catch (error) {
    throw new ExportError(
      `PPTX 导出失败:${error instanceof Error ? error.message : String(error)}`,
      "pptx-render-failed",
      error
    );
  }
  if (pages.length === 0 || slides.length === 0) {
    throw new ExportError("PPTX 没有任何页面", "pptx-empty");
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

// 复杂落地页即使被分成多页，也不应把整个 DOM 当成数百个重叠的 PPT 对象。
// AI 扫描存在时会进一步收敛到扫描命中的节点；没有 AI 时保留一个安全上限。
const MAX_EDITABLE_PPTX_ELEMENTS = 260;
const PPTX_PX_TO_PT = 0.75;

interface PptxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 把仍在离屏 iframe 中的页面 DOM 重建为 PPT 对象。
 * 文本会成为可直接编辑的文本框,背景/边框成为形状,图片保持为独立图片对象。
 */
export function addEditablePageToSlide(
  slide: PptxSlideInstance,
  context: RenderedPageContext,
  aiAnnotations: SnapshotInput["aiAnnotations"] = [],
): number {
  if (!slide.addText && !slide.addShape) return 0;
  const targetRect = context.target.getBoundingClientRect();
  const canvasWidth = context.width || targetRect.width;
  const canvasHeight = context.height || targetRect.height;
  if (canvasWidth <= 0 || canvasHeight <= 0) return 0;

  const focusIds = new Set((aiAnnotations ?? []).map((annotation) => annotation.hftId).filter(Boolean));
  const elements = collectEditableElements(context.target, context.documentRef, focusIds);
  let added = 0;
  for (const element of elements) {
    if (added >= MAX_EDITABLE_PPTX_ELEMENTS) break;
    const rect = toPptxRect(element.getBoundingClientRect(), targetRect, canvasWidth, canvasHeight);
    if (!rect) continue;
    const style = getComputedStyleSafe(context.frameWindow, element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity <= 0) continue;
    const objectName = `HTML ${element.tagName.toLowerCase()}${element.id ? ` #${element.id}` : ""}`;
    const backgroundImage = getBackgroundImageData(style.backgroundImage);
    if (backgroundImage) {
      slide.addImage({ data: backgroundImage, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
      added += 1;
    }

    if (isImageElement(element)) {
      const imageData = getImageData(element, context.frameWindow);
      if (imageData) {
        slide.addImage({ data: imageData, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
        added += 1;
        continue;
      }
    }

    if (hasVisibleBoxStyle(style) && (!backgroundImage || style.borderWidth > 0) && slide.addShape) {
      slide.addShape(style.borderRadius > 0 ? "roundRect" : "rect", {
        ...rect,
        fill: style.backgroundColor
          ? { color: style.backgroundColor, transparency: style.backgroundTransparency }
          : { color: "FFFFFF", transparency: 100, type: "none" },
        line: style.borderWidth > 0
          ? { color: style.borderColor, width: Math.max(0.5, style.borderWidth * PPTX_PX_TO_PT) }
          : { color: "FFFFFF", transparency: 100, type: "none" },
        objectName: `${objectName} background`,
      });
      added += 1;
    }

    const text = getDirectText(element);
    if (text && slide.addText) {
      slide.addText(text, {
        ...rect,
        fontFace: normalizeFontFace(style.fontFamily),
        fontSize: Math.max(5, style.fontSize * PPTX_PX_TO_PT),
        color: style.color,
        bold: style.fontWeight >= 600,
        italic: style.fontStyle === "italic",
        align: normalizeTextAlign(style.textAlign),
        valign: "middle",
        margin: 0,
        fit: "shrink",
        objectName,
      });
      added += 1;
    }
  }
  return added;
}

function collectEditableElements(
  target: HTMLElement,
  documentRef: Document,
  focusIds: Set<string> = new Set(),
): HTMLElement[] {
  const elements: HTMLElement[] = [];
  const walker = documentRef.createTreeWalker(target, 1);
  let current = walker.currentNode as HTMLElement | null;
  while (current) {
    const tagName = current.tagName?.toLowerCase();
    const hftId = current.getAttribute?.("data-hft-id") ?? "";
    if (
      tagName &&
      !SKIP_PPTX_TAGS.has(tagName) &&
      (focusIds.size === 0 || focusIds.has(hftId))
    ) {
      elements.push(current);
    }
    current = walker.nextNode() as HTMLElement | null;
  }
  return elements;
}

const SKIP_PPTX_TAGS = new Set(["script", "style", "link", "meta", "title", "noscript", "template"]);

function getComputedStyleSafe(frameWindow: Window, element: HTMLElement): PptxComputedStyle {
  const style = frameWindow.getComputedStyle(element);
  return {
    backgroundColor: parseCssColor(style.backgroundColor),
    backgroundTransparency: parseTransparency(style.backgroundColor, Number.parseFloat(style.opacity || "1")),
    borderColor: parseCssColor(style.borderTopColor) || "000000",
    borderWidth: parseCssPixels(style.borderTopWidth),
    borderRadius: parseCssPixels(style.borderTopLeftRadius),
    backgroundImage: style.backgroundImage || "",
    color: parseCssColor(style.color) || "000000",
    fontFamily: style.fontFamily || "Arial",
    fontSize: Math.max(1, parseCssPixels(style.fontSize) || 16),
    fontWeight: Number(style.fontWeight) || (style.fontWeight === "bold" ? 700 : 400),
    fontStyle: style.fontStyle || "normal",
    textAlign: style.textAlign || "left",
    display: style.display,
    visibility: style.visibility,
    opacity: Number.parseFloat(style.opacity || "1"),
  };
}

interface PptxComputedStyle {
  backgroundColor: string;
  backgroundTransparency: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backgroundImage: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  textAlign: string;
  display: string;
  visibility: string;
  opacity: number;
}

function hasVisibleBoxStyle(style: PptxComputedStyle): boolean {
  return (Boolean(style.backgroundColor) && style.backgroundTransparency < 100) || style.borderWidth > 0;
}

function isImageElement(element: HTMLElement): boolean {
  return ["img", "svg", "canvas"].includes(element.tagName.toLowerCase());
}

function getImageData(element: HTMLElement, frameWindow: Window): string | null {
  if (element.tagName.toLowerCase() === "img") {
    const source = (element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src;
    return source && (source.startsWith("data:image/") || source.startsWith("data:image/svg+xml")) ? source : null;
  }
  if (element.tagName.toLowerCase() === "svg") {
    try {
      const xml = new XMLSerializer().serializeToString(element);
      return `data:image/svg+xml;base64,${encodeBase64(xml)}`;
    } catch {
      return null;
    }
  }
  if (element.tagName.toLowerCase() === "canvas") {
    try {
      return (element as HTMLCanvasElement).toDataURL("image/png");
    } catch {
      return null;
    }
  }
  void frameWindow;
  return null;
}

function getBackgroundImageData(value: string): string | null {
  const match = value.match(/url\(\s*["']?(data:image\/[^")']+)["']?\s*\)/i);
  return match?.[1] ?? null;
}

function getDirectText(element: HTMLElement): string {
  const text = Array.from(element.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || isImageElement(element)) return "";
  return text.slice(0, 1200);
}

function toPptxRect(
  rect: DOMRect,
  targetRect: DOMRect,
  canvasWidth: number,
  canvasHeight: number,
): PptxRect | null {
  const intersectionLeft = Math.max(rect.left, targetRect.left);
  const intersectionTop = Math.max(rect.top, targetRect.top);
  const intersectionRight = Math.min(rect.right, targetRect.right);
  const intersectionBottom = Math.min(rect.bottom, targetRect.bottom);
  if (intersectionRight <= intersectionLeft || intersectionBottom <= intersectionTop) return null;
  const left = clampNumber((rect.left - targetRect.left) / canvasWidth, 0, 1);
  const top = clampNumber((rect.top - targetRect.top) / canvasHeight, 0, 1);
  const right = clampNumber((rect.right - targetRect.left) / canvasWidth, 0, 1);
  const bottom = clampNumber((rect.bottom - targetRect.top) / canvasHeight, 0, 1);
  const w = (right - left) * PPTX_SLIDE_WIDTH_IN;
  const h = (bottom - top) * PPTX_SLIDE_HEIGHT_IN;
  if (w <= 0.01 || h <= 0.01) return null;
  return {
    x: left * PPTX_SLIDE_WIDTH_IN,
    y: top * PPTX_SLIDE_HEIGHT_IN,
    w,
    h,
  };
}

function parseCssColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "transparent") return "";
  if (trimmed.startsWith("#")) return trimmed.slice(1).padEnd(6, "0").slice(0, 6).toUpperCase();
  const match = trimmed.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!match) return "";
  return [match[1], match[2], match[3]]
    .map((part) => Math.round(Number(part)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function parseTransparency(backgroundColor: string, opacity: number): number {
  const alpha = backgroundColor.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i)?.[1];
  const value = alpha === undefined ? opacity : Number(alpha) * opacity;
  return Math.max(0, Math.min(100, Math.round((1 - value) * 100)));
}

function parseCssPixels(value: string): number {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeFontFace(value: string): string {
  return value.split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Arial";
}

function normalizeTextAlign(value: string): "left" | "center" | "right" | "justify" {
  if (value === "center" || value === "right" || value === "justify") return value;
  return "left";
}

function encodeBase64(value: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(value)));
  return "";
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
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
