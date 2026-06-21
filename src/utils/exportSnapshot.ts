/**
 * 截图公共层(Snapshot)
 *
 * 给 PDF / PPTX 共用:
 *   - 创建离屏 iframe
 *   - 等待字体 + 图片
 *   - 调 html-to-image.toPng 拿到 dataURL
 *   - 切分 section.slide / .slide 多页
 *
 * 设计原则:
 *   - 通过 HtmlToImageOptions 注入 html-to-image 模块,便于 mock
 *   - 通过 createIframe / waitFor / readDimensions 钩子把 DOM 副作用集中
 *   - 错误统一抛 ExportError
 */

import { ExportError } from "./exportErrors";

export interface RenderedPage {
  dataUrl: string;
  width: number;
  height: number;
  label: string;
}

export interface HtmlToImageOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  cacheBust?: boolean;
  backgroundColor?: string;
  imagePlaceholder?: string;
}

export interface HtmlToImageLike {
  toPng: (node: Element, options?: HtmlToImageOptions) => Promise<string>;
}

export interface SnapshotInput {
  html: string;
  filename?: string;
  baseUrl?: string;
  pixelRatio?: number;
  /** 强制单页导出(忽略 .slide 切分) */
  singlePage?: boolean;
  /** 注入 html-to-image,便于测试 */
  htmlToImage?: HtmlToImageLike;
  /** 用于测试的钩子:创建 iframe */
  createIframe?: (srcdoc: string) => HTMLIFrameElement;
  /** 用于测试的钩子:等待 iframe 内资源就绪 */
  waitForAssets?: (documentRef: Document) => Promise<void>;
  /** 用于测试的钩子:等待动画 / 布局稳定 */
  settle?: (windowRef: Window) => Promise<void>;
  /** 用于测试的钩子:测量目标尺寸 */
  measureTarget?: (target: HTMLElement, iframe: HTMLIFrameElement) => { width: number; height: number };
  /** 用于测试的钩子:获取 slide 元素列表 */
  findSlides?: (documentRef: Document) => HTMLElement[];
  /** 用于测试的钩子:获取 fallback 目标 */
  findFallbackTarget?: (documentRef: Document) => HTMLElement;
  /** 用于测试的钩子:激活 slide */
  activateSlide?: (slides: HTMLElement[], activeIndex: number, frameWindow: Window) => void;
  /** iframe 加载超时(毫秒) */
  loadTimeoutMs?: number;
}

const DEFAULT_PIXEL_RATIO = 2;
const DEFAULT_LOAD_TIMEOUT = 15000;
const DEFAULT_RESOURCE_WAIT = 8000;
const DEFAULT_EXPORT_WIDTH = 1440;
const DEFAULT_EXPORT_HEIGHT = 812;

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/**
 * 主入口:输入 HTML 字符串,返回 N 张已渲染好的 PNG dataURL
 */
export async function capturePreviewAsPng(input: SnapshotInput): Promise<RenderedPage[]> {
  const iframe = input.createIframe
    ? await waitForIframeLoad(input.createIframe, input.html, input.loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT)
    : await createAndLoadIframe(input.html, input.loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT);

  try {
    const documentRef = iframe.contentDocument;
    const frameWindow = iframe.contentWindow;
    if (!documentRef?.body || !frameWindow) {
      throw new ExportError("无法创建渲染窗口", "snapshot-render-failed");
    }

    const settle = input.settle ?? settleFrame;
    const measure = input.measureTarget ?? measureTargetDefault;
    const findSlides = input.findSlides ?? findDefaultSlides;
    const findFallback = input.findFallbackTarget ?? findDefaultFallbackTarget;
    const activate = input.activateSlide ?? activateSlideDefault;
    const waitForAssets = input.waitForAssets ?? waitForDocumentAssetsDefault;
    const htmlToImage = input.htmlToImage ?? (await loadHtmlToImage());

    await waitForAssets(documentRef);

    const slides = input.singlePage ? [] : findSlides(documentRef);
    const targets: HTMLElement[] = slides.length > 0 ? slides : [findFallback(documentRef)];
    if (targets.length === 0) {
      throw new ExportError("没有找到可导出的页面内容", "snapshot-no-slide-target");
    }

    const pages: RenderedPage[] = [];
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      if (slides.length > 0) activate(slides, index, frameWindow);
      await settle(frameWindow);
      const dimensions = measure(target, iframe);
      if (dimensions.width <= 0 || dimensions.height <= 0) {
        throw new ExportError("页面尺寸为 0,无法截图", "snapshot-render-failed");
      }
      resizeIframe(iframe, dimensions.width, dimensions.height);
      await settle(frameWindow);
const dataUrl = await htmlToImage.toPng(target, {
      width: dimensions.width,
      height: dimensions.height,
      pixelRatio: input.pixelRatio ?? DEFAULT_PIXEL_RATIO,
      cacheBust: true,
      backgroundColor: "#ffffff",
      imagePlaceholder: TRANSPARENT_PIXEL,
    });
      if (!dataUrl || typeof dataUrl !== "string") {
        throw new ExportError("截图结果为空", "snapshot-empty");
      }
      if (!/^data:image\/(png|jpeg|webp);/i.test(dataUrl)) {
        throw new ExportError("截图数据格式异常", "snapshot-empty");
      }
      pages.push({
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
        label: slides.length > 0 ? `Slide ${index + 1}` : "Page",
      });
    }

    if (pages.length === 0) {
      throw new ExportError("没有可导出的页面内容", "snapshot-empty");
    }
    return pages;
  } finally {
    iframe.remove();
  }
}

// ─── Iframe 生命周期 ─────────────────────────────────────────────

async function createAndLoadIframe(html: string, timeoutMs: number): Promise<HTMLIFrameElement> {
  if (typeof document === "undefined") {
    throw new ExportError("当前环境没有 DOM,无法创建截图窗口", "browser-unsupported");
  }
  return new Promise<HTMLIFrameElement>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      iframe.remove();
      reject(new ExportError("渲染窗口加载超时", "snapshot-render-failed"));
    }, timeoutMs);

    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    // 关键修复: 用 visibility:hidden + 放在视口内(top-left, 而不是 -10000px)。
    // 之前的 opacity:0 + 屏外定位会导致 Chrome 调度器延迟/跳过布局与绘制,
    // 使 html-to-image 捕获到空白 PNG。visibility:hidden 保留布局盒并强制 paint,
    // 用户仍然看不到(因为 visibility 隐藏)。
    iframe.style.left = "0";
    iframe.style.top = "0";
    iframe.style.width = `${DEFAULT_EXPORT_WIDTH}px`;
    iframe.style.height = `${DEFAULT_EXPORT_HEIGHT}px`;
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.style.pointerEvents = "none";
    iframe.style.zIndex = "-1";

    iframe.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(iframe);
    };
    iframe.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      iframe.remove();
      reject(new ExportError("预览文档加载异常", "snapshot-render-failed"));
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = wrapDocument(html);
  });
}

function waitForIframeLoad(
  createIframe: (srcdoc: string) => HTMLIFrameElement,
  html: string,
  timeoutMs: number
): Promise<HTMLIFrameElement> {
  return new Promise<HTMLIFrameElement>((resolve, reject) => {
    const iframe = createIframe(wrapDocument(html));
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new ExportError("渲染窗口加载超时", "snapshot-render-failed"));
    }, timeoutMs);
    const onLoad = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      try {
        iframe.removeEventListener?.("load", onLoad);
      } catch {
        // ignore
      }
      resolve(iframe);
    };
    try {
      iframe.addEventListener?.("load", onLoad, { once: true });
    } catch (error) {
      settled = true;
      window.clearTimeout(timer);
      reject(
        new ExportError(
          "iframe 事件监听注册失败",
          "snapshot-render-failed",
          error
        )
      );
      return;
    }
    // 用户自定义 createIframe 必须自己负责挂载到 DOM
    // 这里假定调用方已 appendChild(常见做法)
  });
}

// ─── 默认实现:可被测试 hook 替换 ──────────────────────────────

function findDefaultSlides(documentRef: Document): HTMLElement[] {
  const matches = Array.from(
    documentRef.querySelectorAll<HTMLElement>("section.slide, .slide, [data-slide]")
  );
  return matches.filter((el) => isSlideCandidate(el));
}

function findDefaultFallbackTarget(documentRef: Document): HTMLElement {
  const main = documentRef.querySelector<HTMLElement>("main");
  if (main) return main;
  return documentRef.body;
}

function isSlideCandidate(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.classList.contains("slide") ||
    el.hasAttribute("data-slide") ||
    /^slide[-_]?\d+$/i.test(el.id || "")
  );
}

function activateSlideDefault(slides: HTMLElement[], activeIndex: number, frameWindow: Window): void {
  slides.forEach((slide, index) => {
    if (index === activeIndex) {
      slide.classList.add("is-active");
      const display = computeDisplayValue(slide, frameWindow);
      slide.style.setProperty("display", display, "important");
      slide.style.setProperty("visibility", "visible", "important");
      slide.style.setProperty("opacity", "1", "important");
    } else {
      slide.classList.remove("is-active");
      slide.style.setProperty("display", "none", "important");
    }
  });
}

function computeDisplayValue(slide: HTMLElement, frameWindow: Window): string {
  const previousDisplay = slide.style.getPropertyValue("display");
  const previousPriority = slide.style.getPropertyPriority("display");
  slide.style.removeProperty("display");
  const computed = frameWindow.getComputedStyle(slide).display;
  slide.style.setProperty("display", previousDisplay, previousPriority);
  return computed === "none" ? "block" : computed;
}

function measureTargetDefault(target: HTMLElement, iframe: HTMLIFrameElement): { width: number; height: number } {
  const rect = target.getBoundingClientRect();
  const width = Math.ceil(rect.width || target.scrollWidth || iframe.clientWidth || DEFAULT_EXPORT_WIDTH);
  const height = Math.ceil(rect.height || target.scrollHeight || iframe.clientHeight || DEFAULT_EXPORT_HEIGHT);
  return { width: Math.max(1, width), height: Math.max(1, height) };
}

function resizeIframe(iframe: HTMLIFrameElement, width: number, height: number): void {
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
}

function settleFrameDefault(frameWindow: Window): Promise<void> {
  return new Promise<void>((resolve) => {
    // 三重 RAF + 微任务 yield, 给 Chrome 足够时间真正完成布局/绘制。
    // 之前两重 RAF 在 hidden iframe + 大块 HTML 上不够, 会捕获到空白。
    let count = 0;
    const tick = () => {
      count += 1;
      if (count >= 3) {
        // 让 microtask 队列清空再继续
        Promise.resolve().then(() => resolve());
        return;
      }
      frameWindow.requestAnimationFrame(tick);
    };
    frameWindow.requestAnimationFrame(tick);
  });
}

// 为了让 hook 默认值引用一致,导出同名常量
const settleFrame = settleFrameDefault;

async function waitForDocumentAssetsDefault(documentRef: Document): Promise<void> {
  // fonts API 在 hidden iframe 里可能是 undefined;兜底为 resolved promise
  let fontReady: Promise<unknown> = Promise.resolve();
  try {
    const fonts = (documentRef as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts && fonts.ready && typeof fonts.ready.then === "function") {
      fontReady = fonts.ready.then(() => undefined);
    }
  } catch {
    fontReady = Promise.resolve();
  }
  await withTimeout(fontReady, DEFAULT_RESOURCE_WAIT);

  const pendingImages = Array.from(documentRef.images).filter((image) => !image.complete);
  if (pendingImages.length === 0) return;

  await withTimeout(
    Promise.all(
      pendingImages.map(
        (image) =>
          new Promise<void>((resolve) => {
            try {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            } catch {
              resolve();
            }
          })
      )
    ),
    DEFAULT_RESOURCE_WAIT
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | void> {
  return new Promise<T | void>((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve();
    }, timeoutMs);
    promise.then(
      (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      }
    );
  });
}

async function loadHtmlToImage(): Promise<HtmlToImageLike> {
  try {
    const mod = await import("html-to-image");
    if (!mod?.toPng) {
      throw new ExportError("html-to-image 模块缺少 toPng", "library-load-failed");
    }
    return mod as HtmlToImageLike;
  } catch (error) {
    throw new ExportError(
      "无法加载 html-to-image 模块。请检查网络或 vendor chunk 配置。",
      "library-load-failed",
      error
    );
  }
}

// ─── 文档包装 ─────────────────────────────────────────────────

function wrapDocument(html: string): string {
  const source = /<html[\s>]/i.test(html) ? html : wrapFragment(html);
  if (/<base[\s>]/i.test(source)) return source;
  const baseHref = (() => {
    if (typeof window === "undefined") return "/";
    try {
      return new URL(".", window.location.href).href;
    } catch {
      return "/";
    }
  })();
  const baseTag = `<base href="${escapeHtmlAttribute(baseHref)}">`;
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

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}