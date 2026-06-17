import type { Options as HtmlToImageOptions } from "html-to-image/lib/types";

export type DocumentExportFormat = "pdf" | "pptx";

interface RenderedExportPage {
  dataUrl: string;
  width: number;
  height: number;
  label: string;
}

const DEFAULT_EXPORT_WIDTH = 1440;
const DEFAULT_EXPORT_HEIGHT = 812;
const EXPORT_PIXEL_RATIO = 2;
const EXPORT_TIMEOUT_MS = 15000;
const RESOURCE_WAIT_MS = 8000;
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export async function exportPdfFromHtml(html: string, filename = "edited-page.pdf"): Promise<number> {
  const pages = await renderHtmlPages(html);
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();

  for (const pageInfo of pages) {
    const pngImage = await pdf.embedPng(dataUrlToUint8Array(pageInfo.dataUrl));
    const page = pdf.addPage([pageInfo.width, pageInfo.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageInfo.width,
      height: pageInfo.height,
    });
  }

  const bytes = await pdf.save();
  const pdfBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(pdfBuffer).set(bytes);
  downloadBlob(new Blob([pdfBuffer], { type: "application/pdf" }), filename);
  return pages.length;
}

export async function exportPptxFromHtml(html: string, filename = "edited-page.pptx"): Promise<number> {
  const pages = await renderHtmlPages(html);
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  const firstPage = pages[0];
  const slideWidth = 13.333;
  const slideHeight = clamp((slideWidth * firstPage.height) / firstPage.width, 5, 9);

  pptx.author = "HTML FineTune";
  pptx.subject = "Exported from HTML FineTune";
  pptx.title = "HTML FineTune Export";
  pptx.company = "HTML FineTune";
  pptx.defineLayout({ name: "HTML_FINETUNE_EXPORT", width: slideWidth, height: slideHeight });
  pptx.layout = "HTML_FINETUNE_EXPORT";

  pages.forEach((pageInfo) => {
    const slide = pptx.addSlide();
    const imageRect = fitIntoBox(pageInfo.width, pageInfo.height, slideWidth, slideHeight);
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data: pageInfo.dataUrl,
      x: imageRect.x,
      y: imageRect.y,
      w: imageRect.w,
      h: imageRect.h,
    });
  });

  await pptx.writeFile({ fileName: filename });
  return pages.length;
}

async function renderHtmlPages(html: string): Promise<RenderedExportPage[]> {
  const iframe = await createExportFrame(html);

  try {
    const frameWindow = iframe.contentWindow;
    const documentRef = iframe.contentDocument;
    if (!frameWindow || !documentRef?.body) {
      throw new Error("导出失败：无法创建渲染窗口");
    }

    await waitForDocumentAssets(documentRef);
    const slides = Array.from(documentRef.querySelectorAll<HTMLElement>("section.slide, .slide"));
    const targets = slides.length > 0 ? slides : [findFallbackTarget(documentRef)];
    const pages: RenderedExportPage[] = [];

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      if (slides.length > 0) {
        activateSlide(slides, index, frameWindow);
      }
      await settleFrame(frameWindow);
      const dimensions = measureTarget(target, iframe);
      resizeFrame(iframe, dimensions.width, dimensions.height);
      await settleFrame(frameWindow);
      pages.push({
        dataUrl: await renderTargetToPng(target, dimensions.width, dimensions.height),
        width: dimensions.width,
        height: dimensions.height,
        label: slides.length > 0 ? `Slide ${index + 1}` : "Page",
      });
    }

    if (pages.length === 0) {
      throw new Error("导出失败：没有找到可渲染的页面内容");
    }

    return pages;
  } finally {
    iframe.remove();
  }
}

function createExportFrame(html: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      iframe.remove();
      reject(new Error("导出渲染超时，请检查页面里的远程资源或脚本"));
    }, EXPORT_TIMEOUT_MS);

    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = `${DEFAULT_EXPORT_WIDTH}px`;
    iframe.style.height = `${DEFAULT_EXPORT_HEIGHT}px`;
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(iframe);
    };
    iframe.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      iframe.remove();
      reject(new Error("导出失败：预览文档加载异常"));
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = buildExportDocument(html);
  });
}

function buildExportDocument(html: string): string {
  const source = /<html[\s>]/i.test(html) ? html : wrapFragment(html);
  if (/<base[\s>]/i.test(source)) return source;
  const baseTag = `<base href="${escapeHtmlAttribute(new URL(".", window.location.href).href)}">`;
  return insertBeforeClosingTag(source, "head", baseTag);
}

function wrapFragment(fragment: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${fragment}</body></html>`;
}

function insertBeforeClosingTag(html: string, tag: "head" | "body", content: string): string {
  const pattern = new RegExp(`</${tag}>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `${content}</${tag}>`);
  }
  if (tag === "head" && /<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${content}</head>`);
  }
  return `${html}${content}`;
}

async function waitForDocumentAssets(documentRef: Document): Promise<void> {
  const fontReady: Promise<void> = "fonts" in documentRef
    ? documentRef.fonts.ready.then(() => undefined)
    : Promise.resolve();
  await withTimeout(fontReady, RESOURCE_WAIT_MS);

  const pendingImages = Array.from(documentRef.images).filter((image) => !image.complete);
  if (pendingImages.length === 0) return;

  await withTimeout(
    Promise.all(
      pendingImages.map(
        (image) =>
          new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          })
      )
    ),
    RESOURCE_WAIT_MS
  );
}

function findFallbackTarget(documentRef: Document): HTMLElement {
  const main = documentRef.querySelector<HTMLElement>("main");
  if (main) return main;
  return documentRef.body;
}

function activateSlide(slides: HTMLElement[], activeIndex: number, frameWindow: Window): void {
  slides.forEach((slide, index) => {
    if (index === activeIndex) {
      slide.classList.add("is-active");
      const display = getVisibleDisplayValue(slide, frameWindow);
      slide.style.setProperty("display", display, "important");
      slide.style.setProperty("visibility", "visible", "important");
      slide.style.setProperty("opacity", "1", "important");
    } else {
      slide.classList.remove("is-active");
      slide.style.setProperty("display", "none", "important");
    }
  });
}

function getVisibleDisplayValue(slide: HTMLElement, frameWindow: Window): string {
  const previousDisplay = slide.style.getPropertyValue("display");
  const previousPriority = slide.style.getPropertyPriority("display");
  slide.style.removeProperty("display");
  const computedDisplay = frameWindow.getComputedStyle(slide).display;
  slide.style.setProperty("display", previousDisplay, previousPriority);
  return computedDisplay === "none" ? "block" : computedDisplay;
}

function measureTarget(target: HTMLElement, iframe: HTMLIFrameElement): { width: number; height: number } {
  const rect = target.getBoundingClientRect();
  const width = Math.ceil(rect.width || target.scrollWidth || iframe.clientWidth || DEFAULT_EXPORT_WIDTH);
  const height = Math.ceil(rect.height || target.scrollHeight || iframe.clientHeight || DEFAULT_EXPORT_HEIGHT);
  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

function resizeFrame(iframe: HTMLIFrameElement, width: number, height: number): void {
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
}

async function renderTargetToPng(target: HTMLElement, width: number, height: number): Promise<string> {
  const htmlToImage = await import("html-to-image");
  const targetWindow = target.ownerDocument.defaultView ?? window;
  const backgroundColor = targetWindow.getComputedStyle(target).backgroundColor || "#ffffff";
  const options: HtmlToImageOptions = {
    width,
    height,
    pixelRatio: EXPORT_PIXEL_RATIO,
    cacheBust: true,
    backgroundColor: backgroundColor === "rgba(0, 0, 0, 0)" ? "#ffffff" : backgroundColor,
    imagePlaceholder: TRANSPARENT_PIXEL,
  };

  return htmlToImage.toPng(target, options);
}

async function settleFrame(frameWindow: Window): Promise<void> {
  await new Promise<void>((resolve) => frameWindow.requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => frameWindow.requestAnimationFrame(() => resolve()));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | void> {
  let timeoutId = 0;
  try {
    return await Promise.race([
      promise,
      new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(() => resolve(), timeoutMs);
      }),
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function fitIntoBox(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number
): { x: number; y: number; w: number; h: number } {
  const imageRatio = imageWidth / imageHeight;
  const boxRatio = boxWidth / boxHeight;

  if (imageRatio > boxRatio) {
    const h = boxWidth / imageRatio;
    return { x: 0, y: (boxHeight - h) / 2, w: boxWidth, h };
  }

  const w = boxHeight * imageRatio;
  return { x: (boxWidth - w) / 2, y: 0, w, h: boxHeight };
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
