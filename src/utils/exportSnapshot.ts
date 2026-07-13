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
  /** PPTX uses this text-free image as the visual fidelity background. */
  visualDataUrl?: string;
  width: number;
  height: number;
  label: string;
}

export interface RenderedPageContext extends RenderedPage {
  /** 当前仍挂载在离屏 iframe 中的页面元素,可用于结构化导出。 */
  target: HTMLElement;
  documentRef: Document;
  frameWindow: Window;
  index: number;
  total: number;
}

export interface HtmlToImageOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  cacheBust?: boolean;
  backgroundColor?: string;
  skipFonts?: boolean;
  imagePlaceholder?: string;
  /**
   * 当 <img> 加载失败时(html-to-image 内部把 image 转为 dataURL)被调用。
   * 返回一个占位 dataURL 让整次 capture 继续, 避免单个坏 <img> 抛出
   * [object Event] 让 toPng 失败、整次 export 中断。
   */
  onImageErrorHandler?: () => string;
}

export interface HtmlToImageLike {
  toPng: (node: Element, options?: HtmlToImageOptions) => Promise<string>;
}

export interface SnapshotInput {
  html: string;
  filename?: string;
  baseUrl?: string;
  pixelRatio?: number;
  /** AI 结构扫描结果。用于在没有显式 slide 标记时识别语义分段。 */
  aiAnnotations?: ReadonlyArray<{ hftId: string }>;
  /** Generate a text-free background for editable PPTX overlays. */
  captureBackgroundWithoutText?: boolean;
  /** 强制单页导出(忽略 .slide 切分) */
  singlePage?: boolean;
  /** 注入 html-to-image,便于测试 */
  htmlToImage?: HtmlToImageLike;
  /** 用于测试的钩子:创建 iframe */
  createIframe?: (srcdoc: string) => HTMLIFrameElement;
  /** 用于测试的钩子:等待 iframe 内资源就绪 */
  waitForAssets?: (documentRef: Document) => Promise<void>;
  /** 用于测试的钩子:等待 srcdoc 真正被解析(contentDocument.body 出现子节点)。
   *  默认会轮询 body.children.length。jsdom 测试环境可以注入 no-op。 */
  waitForIframeContent?: (iframe: HTMLIFrameElement) => Promise<void>;
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
  /** 页面截图完成后回调,在 iframe 移除前仍可读取真实 DOM 与计算样式。 */
  onPageRendered?: (context: RenderedPageContext) => void | Promise<void>;
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

  // 关键修复: 等待 srcdoc 真正被解析/提交。
  // iframe.onload 会在 about:blank 与 srcdoc 完成时各触发一次,
  // 但有些浏览器在 onload 回调执行时 contentDocument.body 仍是空的,
  // 导致 findDefaultFallbackTarget 找不到 <main>, 退而求其次用 <body>,
  // 而此时 <body> 是空的, capture 出空白 PDF/PPTX。
  if (input.waitForIframeContent) {
    await input.waitForIframeContent(iframe);
  } else {
    await waitForIframeContent(iframe, input.loadTimeoutMs ?? DEFAULT_LOAD_TIMEOUT);
  }

  try {
    const documentRef = iframe.contentDocument;
    const frameWindow = iframe.contentWindow;
    if (!documentRef?.body || !frameWindow) {
      throw new ExportError("无法创建渲染窗口", "snapshot-render-failed");
    }

    const settle = input.settle ?? settleFrame;
    const measure = input.measureTarget ?? measureTargetDefault;
    const findSlides = input.findSlides ?? ((documentRef: Document) =>
      findDefaultSlides(documentRef, input.aiAnnotations));
    const findFallback = input.findFallbackTarget ?? findDefaultFallbackTarget;
    const activate = input.activateSlide ?? activateSlideDefault;
    const waitForAssets = input.waitForAssets ?? waitForDocumentAssetsDefault;
    const htmlToImage = input.htmlToImage ?? (await loadHtmlToImage());

    await waitForAssets(documentRef);
    // 等字体:document.fonts.ready 触发后,逐个 await 还没 loaded 的 FontFace,
    // 否则 html-to-image 会用 fallback metrics 渲染 — 关掉 skipFonts 后尤其需要。
    if (typeof documentRef.fonts?.ready?.then === "function") {
      await documentRef.fonts.ready;
    }
    if (documentRef.fonts && typeof documentRef.fonts.forEach === "function") {
      const fontPromises: Promise<FontFace>[] = [];
      documentRef.fonts.forEach((face) => {
        if (face.status !== "loaded") fontPromises.push(face.loaded);
      });
      await Promise.all(fontPromises);
    }

    const slides = input.singlePage ? [] : findSlides(documentRef);
    const targets: HTMLElement[] = slides.length > 0 ? slides : [findFallback(documentRef)];
    if (targets.length === 0) {
      throw new ExportError("没有找到可导出的页面内容", "snapshot-no-slide-target");
    }

const pages: RenderedPage[] = [];
    // 关键修复: 把"画布尺寸"冻结为第一张 slide 的测量结果。
    // 旧实现每页都按当前 slide 的尺寸缩放 iframe + 重测,
    // 但 measureTargetDefault 的 fallback 链 (rect || scrollWidth || iframe.clientWidth)
    // 会被前一次 resizeIframe 污染: 例如 slide1=1440x812, slide2=800x600
    // → 第 1 次测量得 1440x812, iframe 被缩到 1440x812
    // → 第 2 次激活 slide2 时, measure 的 rect 可能仍读出前一次的 viewport
    //   或被上一轮 resize 影响, 后续页尺寸会逐页递减。
    // 冻结到第一页尺寸后, 后续 slide 即使内部尺寸不同, 也按统一画布截图,
    // 小 slide 周围留白边(与 PowerPoint "固定 slide size" 行为一致)。
    let canvasWidth = 0;
    let canvasHeight = 0;
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      if (slides.length > 0) activate(slides, index, frameWindow);
      await settle(frameWindow);
      if (canvasWidth === 0) {
        const measured = measure(target, iframe);
        if (measured.width <= 0 || measured.height <= 0) {
          throw new ExportError("页面尺寸为 0,无法截图", "snapshot-render-failed");
        }
        canvasWidth = measured.width;
        canvasHeight = measured.height;
      }
      resizeIframe(iframe, canvasWidth, canvasHeight);
      await settle(frameWindow);
      const captureOptions: HtmlToImageOptions = {
        width: canvasWidth,
        height: canvasHeight,
        pixelRatio: input.pixelRatio ?? DEFAULT_PIXEL_RATIO,
        cacheBust: true,
        backgroundColor: "#ffffff",
        // skipFonts:false 让 html-to-image 内嵌实际 webfont,而不是用系统 fallback
        skipFonts: false,
        imagePlaceholder: TRANSPARENT_PIXEL,
        // 关键: deck 里的 <img src="..."> 用相对路径,
        // 在 srcdoc iframe 里会 404。如果让 html-to-image 走默认 reject 路径,
        // toPng 会抛出 [object Event] 把整次 export 中断。
        // 用 onImageErrorHandler 把失败转成 placeholder 占位, 保证多页 capture 继续。
        onImageErrorHandler: () => TRANSPARENT_PIXEL,
      };
      const dataUrl = await htmlToImage.toPng(target, captureOptions);
      if (!dataUrl || typeof dataUrl !== "string") {
        throw new ExportError("截图结果为空", "snapshot-empty");
      }
      if (!/^data:image\/(png|jpeg|webp);/i.test(dataUrl)) {
        throw new ExportError("截图数据格式异常", "snapshot-empty");
      }
      const visualDataUrl = input.captureBackgroundWithoutText
        ? await captureBackgroundWithoutText(target, documentRef, htmlToImage, captureOptions)
        : undefined;
      const renderedPage: RenderedPage = {
        dataUrl,
        visualDataUrl,
        width: canvasWidth,
        height: canvasHeight,
        label: slides.length > 0 ? `Slide ${index + 1}` : "Page",
      };
      pages.push(renderedPage);
      await input.onPageRendered?.({
        ...renderedPage,
        target,
        documentRef,
        frameWindow,
        index,
        total: targets.length,
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

interface HiddenTextSnapshot {
  element: HTMLElement;
  style: string | null;
  fill: string | null;
  stroke: string | null;
}

/** Capture the visual layer without text so PPTX can overlay editable text boxes. */
async function captureBackgroundWithoutText(
  target: HTMLElement,
  documentRef: Document,
  htmlToImage: HtmlToImageLike,
  options: HtmlToImageOptions,
): Promise<string | undefined> {
  if (typeof documentRef.createTreeWalker !== "function") return undefined;
  const hidden: HiddenTextSnapshot[] = [];
  const walker = documentRef.createTreeWalker(target, 1);
  let current = walker.currentNode as HTMLElement | null;
  while (current) {
    const tagName = current.tagName?.toLowerCase();
    const isSvgText = tagName === "text" || tagName === "tspan";
    if (hasDirectTextNode(current) || isSvgText) {
      hidden.push({
        element: current,
        style: current.getAttribute("style"),
        fill: current.getAttribute("fill"),
        stroke: current.getAttribute("stroke"),
      });
      current.style.setProperty("color", "transparent", "important");
      current.style.setProperty("-webkit-text-fill-color", "transparent", "important");
      current.style.setProperty("text-shadow", "none", "important");
      if (isSvgText) {
        current.setAttribute("fill", "transparent");
        current.setAttribute("stroke", "transparent");
      }
    }
    current = walker.nextNode() as HTMLElement | null;
  }

  try {
    const dataUrl = await htmlToImage.toPng(target, options);
    return /^data:image\/(png|jpeg|webp);/i.test(dataUrl) ? dataUrl : undefined;
  } catch {
    return undefined;
  } finally {
    hidden.forEach(({ element, style, fill, stroke }) => {
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
      if (fill === null) element.removeAttribute("fill");
      else element.setAttribute("fill", fill);
      if (stroke === null) element.removeAttribute("stroke");
      else element.setAttribute("stroke", stroke);
    });
  }
}

function hasDirectTextNode(element: HTMLElement): boolean {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === 3 && Boolean(node.textContent?.trim()),
  );
}

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

/**
 * 等待 iframe 的 srcdoc 真正被解析 — contentDocument.body 出现内容。
 * 修复 race condition: onload 触发时 body 可能仍是空的, 导致后续捕获到空白。
 *
 * jsdom 等无真实 layout 的环境下直接跳过(永远不会 children.length > 0)。
 */
async function waitForIframeContent(
  iframe: HTMLIFrameElement,
  timeoutMs: number
): Promise<void> {
  // jsdom 没有真实布局引擎,跳过轮询避免测试超时
  if (typeof navigator !== "undefined" && navigator.userAgent?.includes("jsdom")) {
    return;
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const doc = iframe.contentDocument;
    if (doc && doc.body && doc.body.children.length > 0) {
      return;
    }
    await new Promise<void>((r) => setTimeout(r, 16));
  }
  // 超时也不抛, 让后续 fallback 处理空 body 的情况
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

function findDefaultSlides(
  documentRef: Document,
  aiAnnotations: SnapshotInput["aiAnnotations"] = [],
): HTMLElement[] {
  const matches = Array.from(
    documentRef.querySelectorAll<HTMLElement>(
      "section.slide, .slide, [data-slide], [data-page], [data-pdf-page], .page"
    )
  );
  const explicit = matches.filter((el) => isSlideCandidate(el) || isPageCandidate(el, documentRef));
  if (explicit.length > 0) return explicit;

  // 真实的落地页通常用多个顶层 <section> 组成，而不是给每一节加 .slide。
  // 以前会把整个 <main> 当成一页，PPT 重建时所有节点都挤在同一张幻灯片上。
  // 优先使用 AI 标注命中的 section，再按文档顺序补齐未命中的 section，确保页面不丢失。
  const sections = getTopLevelSections(documentRef);
  if (sections.length > 0) {
    const annotatedSections = new Set<HTMLElement>();
    for (const annotation of aiAnnotations ?? []) {
      if (!annotation.hftId) continue;
      const element = findElementByHftId(documentRef, annotation.hftId);
      const section = element?.closest?.("section") as HTMLElement | null;
      if (section && sections.includes(section)) annotatedSections.add(section);
    }
    if (annotatedSections.size > 0) {
      // 仅用 AI 命中结果确认 section 是语义页面根，不改变原始页面顺序。
      return sections;
    }
    return sections;
  }

  return [];
}

function getTopLevelSections(documentRef: Document): HTMLElement[] {
  return Array.from(documentRef.querySelectorAll<HTMLElement>("section")).filter((section) => {
    let parent = section.parentElement;
    while (parent) {
      if (parent.tagName?.toLowerCase() === "section") return false;
      parent = parent.parentElement;
    }
    return true;
  });
}

function findElementByHftId(documentRef: Document, hftId: string): HTMLElement | null {
  return Array.from(documentRef.querySelectorAll<HTMLElement>("[data-hft-id]"))
    .find((element) => element.getAttribute("data-hft-id") === hftId) ?? null;
}

function findDefaultFallbackTarget(documentRef: Document): HTMLElement {
  const page = Array.from(
    documentRef.querySelectorAll<HTMLElement>("[data-page], [data-pdf-page], .page")
  ).find((el) => isPageCandidate(el, documentRef));
  if (page) return page;
  const main = documentRef.querySelector<HTMLElement>("main");
  if (main) return main;
  return documentRef.body;
}

function isSlideCandidate(el: Element): boolean {
  // 关键修复: 不要用 instanceof HTMLElement —— srcdoc iframe 的 contentDocument
  // 是独立 browsing context, 它的 HTMLElement constructor 与外层不同,
  // 即使同源也会导致 instanceof 失败。改用 duck typing 检查 style 属性存在即可。
  if (!el || typeof (el as HTMLElement).style === "undefined") return false;
  return (
    el.classList.contains("slide") ||
    el.hasAttribute("data-slide") ||
    /^slide[-_]?\d+$/i.test(el.id || "")
  );
}

function isPageCandidate(el: Element, documentRef: Document): boolean {
  if (!el || typeof (el as HTMLElement).style === "undefined") return false;
  if (el.hasAttribute("data-page") || el.hasAttribute("data-pdf-page")) return true;
  if (!el.classList.contains("page")) return false;

  const target = el as HTMLElement;
  const inlineWidth = target.style.getPropertyValue("width");
  const inlineHeight = target.style.getPropertyValue("height");
  if (inlineWidth || inlineHeight) return true;

  const view = documentRef.defaultView;
  if (view) {
    const computed = view.getComputedStyle(target);
    const hasExplicitPageSize =
      isExplicitCssSize(computed.width) ||
      isExplicitCssSize(computed.height) ||
      isExplicitCssSize(computed.minWidth) ||
      isExplicitCssSize(computed.minHeight);
    if (hasExplicitPageSize) return true;
  }

  const rect = target.getBoundingClientRect();
  return rect.width >= 480 && rect.height >= 640;
}

function isExplicitCssSize(value: string): boolean {
  return /^\d*\.?\d+(px|mm|cm|in|pt|pc|vh|vw|vmin|vmax|%)$/i.test(value.trim());
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
  const pendingSvgs = collectSvgImageElements(documentRef);
  const pendingBackgrounds = collectBackgroundImageUrls(documentRef);
  const allPending = pendingImages.length + pendingSvgs.length + pendingBackgrounds.length;
  if (allPending === 0) return;

  const imagePromises = pendingImages.map(
    (image) =>
      new Promise<void>((resolve) => {
        try {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        } catch {
          resolve();
        }
      })
  );
  // SVG <image> 与 CSS background-image 都用 fetch + Image.decode 试探;
  // 任一失败不抛错,留给 rasterizer 用占位像素兜底
  const resourcePromises = [...pendingSvgs, ...pendingBackgrounds].map(
    (url) =>
      new Promise<void>((resolve) => {
        const probe = new Image();
        try {
          probe.onload = () => resolve();
          probe.onerror = () => resolve();
          probe.src = url;
        } catch {
          resolve();
        }
      })
  );

  await withTimeout(Promise.all([...imagePromises, ...resourcePromises]), DEFAULT_RESOURCE_WAIT);
}

function collectSvgImageElements(documentRef: Document): string[] {
  const urls: string[] = [];
  const elements = documentRef.querySelectorAll("svg image, svg use");
  elements.forEach((el) => {
    const href = el.getAttribute("href") ?? el.getAttribute("xlink:href");
    if (href && !href.startsWith("#") && !href.startsWith("data:")) {
      urls.push(href);
    }
  });
  return urls;
}

function collectBackgroundImageUrls(documentRef: Document): string[] {
  const urls: string[] = [];
  const all = documentRef.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    const style = (el.ownerDocument?.defaultView ?? window).getComputedStyle(el);
    const bg = style.getPropertyValue("background-image");
    const matches = bg.match(/url\("?([^")]+)"?\)/g);
    if (!matches) return;
    for (const match of matches) {
      const url = match.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
      if (!url.startsWith("data:") && !url.startsWith("#")) urls.push(url);
    }
  });
  return urls;
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
