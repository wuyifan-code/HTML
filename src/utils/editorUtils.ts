import type { SelectedSnapshot, ZoomMode } from "../types/editor";
import { HFT_ID_ATTRIBUTE, HFT_SELECTED_ATTRIBUTE, getElementClassName, getNormalizedTagName } from "./editableElement";
import { restoreEmbeddedAssetValue } from "./embeddedAssets";
import { parseHtmlDocument } from "./injectEditableIds";
import { getDomPath, queryElementByHftId, serializeDocument, getHoverBackgroundColor } from "./domPath";
import { toKindLabel } from "./domTree";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveZoomScale(
  mode: ZoomMode,
  viewportSize: { width: number; height: number },
  stageSize: { width: number; height: number }
): number {
  if (mode === "100") return 1;
  if (mode === "fit") {
    if (stageSize.width === 0 || stageSize.height === 0) return 0.72;
    // 预留 32px 边距,避免 page-preview 贴边
    const scale = Math.min(
      (stageSize.width - 32) / viewportSize.width,
      (stageSize.height - 32) / viewportSize.height,
      1
    );
    return Math.max(0.05, Number(scale.toFixed(3)));
  }
  return 0.88;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return "刚刚";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Date(timestamp).toLocaleTimeString();
}

export function formatPreviewStatusMessage(message: string): string {
  const normalized = message.trim();
  if (/预览桥接已就绪|preview bridge ready/i.test(normalized)) return "预览已同步";
  return normalized.slice(0, 180);
}

export function cssString(value: string): string {
  // 注入到 <style> 块的 CSS attribute selector 中:转义反斜杠和双引号,
  // 防止用户 id 含特殊字符破坏 selector 解析。
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function countSourceLines(value: string): number {
  return (value.match(/\r\n|\r|\n/g)?.length ?? 0) + 1;
}

export function getElementSourceValue(element: HTMLElement | SVGElement): string {
  const tagName = getNormalizedTagName(element);
  if (tagName === "svg") return element.getAttribute("viewBox") ?? "";
  const value = tagName === "image"
    ? element.getAttribute("href") ?? element.getAttribute("xlink:href") ?? ""
    : element.getAttribute("src") ?? element.getAttribute("href") ?? "";
  return restoreEmbeddedAssetValue(element.ownerDocument, value);
}

export function getElementAltValue(element: HTMLElement | SVGElement): string {
  const tagName = getNormalizedTagName(element);
  if (tagName === "svg" || tagName === "image") return element.getAttribute("aria-label") ?? "";
  return element.getAttribute("alt") ?? element.getAttribute("aria-label") ?? "";
}

export function buildSelectedSnapshot(html: string, hftId: string): SelectedSnapshot | null {
  try {
    const documentRef = parseHtmlDocument(html);
    const element = queryElementByHftId(documentRef, hftId);
    if (!element) return null;
    const tagName = getNormalizedTagName(element);
    const text = element.textContent?.trim() ?? "";
    const label = toKindLabel(tagName);
    const style = element instanceof HTMLElement || element instanceof SVGElement ? element.style : null;

    return {
      hftId,
      tagName,
      id: element.id,
      label,
      text,
      path: getDomPath(element),
      className: getElementClassName(element),
      fontFamily: style?.getPropertyValue("font-family") || "",
      fontSize: style?.getPropertyValue("font-size") || "",
      fontStyle: style?.getPropertyValue("font-style") || "",
      fontWeight: style?.getPropertyValue("font-weight") || "",
      lineHeight: style?.getPropertyValue("line-height") || "",
      letterSpacing: style?.getPropertyValue("letter-spacing") || "",
      textAlign: style?.getPropertyValue("text-align") || "",
      marginTop: style?.getPropertyValue("margin-top") || "",
      marginBottom: style?.getPropertyValue("margin-bottom") || "",
      paddingTop: style?.getPropertyValue("padding-top") || "",
      paddingBottom: style?.getPropertyValue("padding-bottom") || "",
      paddingLeft: style?.getPropertyValue("padding-left") || "",
      paddingRight: style?.getPropertyValue("padding-right") || "",
      color: style?.getPropertyValue("color") || "",
      backgroundColor: style?.getPropertyValue("background-color") || "",
      borderColor: style?.getPropertyValue("border-color") || "",
      borderWidth: style?.getPropertyValue("border-width") || "",
      borderStyle: style?.getPropertyValue("border-style") || "",
      borderRadius: style?.getPropertyValue("border-radius") || "",
      boxShadow: style?.getPropertyValue("box-shadow") || "",
      width: style?.getPropertyValue("width") || "",
      height: style?.getPropertyValue("height") || "",
      maxWidth: style?.getPropertyValue("max-width") || "",
      objectFit: style?.getPropertyValue("object-fit") || "",
      hoverBackgroundColor: getHoverBackgroundColor(html, hftId),
      src: getElementSourceValue(element),
      alt: getElementAltValue(element),
      canEditText: element.children.length === 0 && tagName !== "img" && tagName !== "svg" && tagName !== "image",
    };
  } catch {
    return null;
  }
}

export function buildPreviewSrcDoc(html: string, _selectedId: string | null, bridgeToken?: string): string {
  let documentRef;
  try {
    documentRef = parseHtmlDocument(html);
  } catch (error) {
    // 畸形 HTML 不再让 iframe srcdoc 变空白 — 渲染一个"加载失败"的占位
    const message = error instanceof Error ? error.message : String(error);
    const safeMessage = message.replace(/[<&>]/g, "");
    return `<!doctype html><html><body style="font-family:sans-serif;padding:24px;color:#be123c"><h3 id="html-finetune-preview-error" data-preview-error="true">Preview parse failed</h3><pre>${safeMessage}</pre></body></html>`;
    return `<!doctype html><html><body style="font-family:sans-serif;padding:24px;color:#be123c"><h3>预览解析失败</h3><pre>${safeMessage}</pre></body></html>`;
  }

  // 导入的 HTML 属于不可信内容。预览仍允许展示其样式与结构，但不执行
  // 用户脚本、内联事件处理器或 javascript: URL，避免脚本读取桥接 token
  // 后伪造 postMessage 操作宿主编辑器。
  documentRef.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
  documentRef.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (/^on/i.test(attribute.name) || attribute.name.toLowerCase() === "srcdoc") {
        element.removeAttribute(attribute.name);
      }
    });
    ["href", "src", "action", "formaction"].forEach((name) => {
      const value = element.getAttribute(name);
      if (value && /^\s*javascript:/i.test(value)) element.removeAttribute(name);
    });
  });
  const styleElement = documentRef.createElement("style");
  styleElement.textContent = `
    [${HFT_ID_ATTRIBUTE}] {
      cursor: pointer;
    }
    [${HFT_ID_ATTRIBUTE}]:hover {
      outline: 1px dashed rgba(35, 131, 226, 0.55) !important;
      outline-offset: 3px !important;
    }
    [${HFT_SELECTED_ATTRIBUTE}="true"] {
      outline: 2px solid #2383e2 !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 3px rgba(35, 131, 226, 0.16) !important;
    }
    #html-finetune-quickbar {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center;
      gap: 5px;
      max-width: min(94vw, 620px);
      padding: 4px;
      border: 1px solid rgba(55, 53, 47, 0.16);
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(15, 15, 15, 0.14);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      transform: translateY(4px);
      opacity: 0;
      transform-origin: bottom left;
      transition: opacity 120ms cubic-bezier(0.2, 0, 0, 1),
                  transform 120ms cubic-bezier(0.2, 0, 0, 1);
    }
    #html-finetune-quickbar[data-open="true"] {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }
    #html-finetune-quickbar .hft-qb-meta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 30px;
      padding: 0 8px 0 6px;
      border-radius: 4px;
      color: #2383e2;
      background: rgba(35, 131, 226, 0.10);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0;
      text-transform: uppercase;
      white-space: nowrap;
    }
    #html-finetune-quickbar .hft-qb-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #2383e2;
    }
    #html-finetune-quickbar .hft-qb-divider {
      width: 1px;
      height: 22px;
      margin: 0 1px;
      background: rgba(55, 53, 47, 0.12);
    }
    #html-finetune-quickbar button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      width: 30px;
      height: 30px;
      min-height: 30px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: #334155;
      padding: 0;
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
      transition: background 120ms cubic-bezier(0.2, 0, 0, 1),
                  border-color 120ms cubic-bezier(0.2, 0, 0, 1),
                  color 120ms cubic-bezier(0.2, 0, 0, 1);
    }
    #html-finetune-quickbar button svg {
      width: 15px;
      height: 15px;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }
    #html-finetune-quickbar button span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    #html-finetune-quickbar button::after {
      content: attr(data-label);
      position: absolute;
      left: 50%;
      top: -34px;
      z-index: 2;
      padding: 5px 7px;
      border-radius: 4px;
      background: rgba(17, 24, 39, 0.92);
      color: #ffffff;
      font-size: 11px;
      font-weight: 650;
      line-height: 1;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, 2px);
      transition: opacity 120ms ease, transform 120ms ease;
    }
    #html-finetune-quickbar button:hover::after,
    #html-finetune-quickbar button:focus-visible::after {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    #html-finetune-quickbar button:hover,
    #html-finetune-quickbar button:focus-visible {
      outline: none;
      background: rgba(35, 131, 226, 0.10);
      color: #1a72cf;
      border-color: rgba(35, 131, 226, 0.20);
    }
    #html-finetune-quickbar button:active {
      background: rgba(55, 53, 47, 0.12);
    }
    #html-finetune-quickbar button[data-action="delete"] {
      color: #be123c;
    }
    #html-finetune-quickbar button[data-action="delete"]:hover,
    #html-finetune-quickbar button[data-action="delete"]:focus-visible {
      background: #e5483f;
      border-color: #e5483f;
      color: #ffffff;
      box-shadow: none;
    }
  `;
  documentRef.head.appendChild(styleElement);

  const scriptElement = documentRef.createElement("script");
  scriptElement.textContent = `
    (() => {
      const BRIDGE_TOKEN = ${JSON.stringify(bridgeToken ?? "")};
      const attr = "${HFT_ID_ATTRIBUTE}";
      const selectedAttr = "${HFT_SELECTED_ATTRIBUTE}";
      let suppressClickBridge = false;
      const modalSelectors = [
        "dialog",
        "[role='dialog']",
        "[aria-modal='true']",
        ".modal",
        ".dialog",
        ".popup",
        "[data-modal]"
      ];

      function findModal() {
        return document.querySelector(modalSelectors.join(","));
      }

      // Imported slide decks often keep inactive pages in the DOM with
      // display:none. Tree selection must ask the deck's own controller to
      // activate that page before trying to scroll or paint a selection.
      const slideSelector = [
        "section.slide",
        ".slide",
        "[data-slide]",
        "[data-page]",
        "[data-pdf-page]",
        ".page",
        "section[id^='slide-']",
        "article[id^='slide-']"
      ].join(",");
      const slideApiMethods = [
        "showSlide",
        "goToSlide",
        "gotoSlide",
        "setSlide",
        "activateSlide",
        "activatePage",
        "showPage",
        "selectSlide",
        "selectPage",
        "setCurrentSlide",
        "navigateToSlide"
      ];

      function getSlideNodes() {
        const seen = new Set();
        return Array.from(document.querySelectorAll(slideSelector)).filter((slide) => {
          if (seen.has(slide)) return false;
          seen.add(slide);
          return !slide.matches("button, a, input, [role='button']");
        });
      }

      function isShown(element) {
        if (!(element instanceof Element)) return false;
        let current = element;
        while (current && current !== document.documentElement) {
          const computed = window.getComputedStyle(current);
          if (
            computed.display === "none" ||
            computed.visibility === "hidden" ||
            computed.visibility === "collapse" ||
            computed.opacity === "0"
          ) return false;
          current = current.parentElement;
        }
        return true;
      }

      function waitForShown(element, attempts = 12) {
        return new Promise((resolve) => {
          const check = (remaining) => {
            if (isShown(element)) {
              resolve(true);
              return;
            }
            if (remaining <= 0) {
              resolve(false);
              return;
            }
            window.requestAnimationFrame(() => check(remaining - 1));
          };
          check(attempts);
        });
      }

      async function callSlideApi(owner, methodName, slideIndex, slide) {
        if (!owner || typeof owner[methodName] !== "function") return false;
        const candidates = [slideIndex, slideIndex + 1, slide.id, slide];
        for (const candidate of candidates) {
          try {
            const result = owner[methodName].call(owner, candidate);
            if (result && typeof result.then === "function") await result;
          } catch {
            continue;
          }
          if (await waitForShown(slide, 8)) return true;
        }
        return false;
      }

      function getSlideControlValues(control) {
        return [
          control.getAttribute("data-slide"),
          control.getAttribute("data-slide-index"),
          control.getAttribute("data-page"),
          control.getAttribute("data-page-index"),
          control.getAttribute("data-target"),
          control.getAttribute("data-slide-target"),
          control.getAttribute("data-page-target"),
          control.getAttribute("aria-controls"),
          control.getAttribute("href")
        ].filter(Boolean).map((value) => String(value));
      }

      function controlTargetsSlide(control, slide, slideIndex) {
        if (control === slide || slide.contains(control)) return false;
        const slideId = slide.id;
        const slideKeys = [
          slideId,
          slide.getAttribute("data-slide"),
          slide.getAttribute("data-page"),
          String(slideIndex),
          String(slideIndex + 1),
          "slide-" + String(slideIndex + 1),
          "page-" + String(slideIndex + 1),
          "#slide-" + String(slideIndex + 1),
          "#page-" + String(slideIndex + 1)
        ].filter(Boolean).map((value) => String(value));
        const values = getSlideControlValues(control);
        return values.some((value) => slideKeys.includes(value));
      }

      async function activateSlideFor(target) {
        const slide = target.closest(slideSelector);
        if (!slide || isShown(target)) return { slide: null, index: -1, activated: true };

        const slides = getSlideNodes();
        const slideIndex = slides.indexOf(slide);
        if (slideIndex < 0) return { slide, index: -1, activated: false };

        const owners = [
          window,
          window.slideDeck,
          window.slideshow,
          window.deck,
          window.presentation,
          window.app
        ].filter(Boolean);

        for (const owner of owners) {
          for (const methodName of slideApiMethods) {
            if (await callSlideApi(owner, methodName, slideIndex, slide)) {
              return { slide, index: slideIndex, activated: true };
            }
          }
        }

        const controls = Array.from(document.querySelectorAll(
          "button, a, input, [role='button'], [data-slide-target], [data-page-target]"
        ));
        for (const control of controls) {
          if (!controlTargetsSlide(control, slide, slideIndex)) continue;
          try {
            suppressClickBridge = true;
            control.click();
          } catch {
            continue;
          } finally {
            suppressClickBridge = false;
          }
          if (await waitForShown(slide, 12)) {
            return { slide, index: slideIndex, activated: true };
          }
        }

        // Give decks that listen to a custom navigation event one chance,
        // without mutating their classes/styles behind their back.
        try {
          document.dispatchEvent(new CustomEvent("html-finetune:activate-slide", {
            detail: { index: slideIndex, slide }
          }));
        } catch {
          // CustomEvent may be unavailable in very old embedded browsers.
        }
        return { slide, index: slideIndex, activated: await waitForShown(slide, 6) };
      }

      function sendStatus(message) {
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_STATUS", message: String(message || ""), token: BRIDGE_TOKEN }, "*");
      }

      function hasDirectText(element) {
        return Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && Boolean((node.textContent || "").trim()));
      }

      function measureContentBounds() {
        const documentElement = document.documentElement;
        const viewportWidth = documentElement.clientWidth || window.innerWidth;
        const viewportHeight = documentElement.clientHeight || window.innerHeight;
        const maxDocumentWidth = Math.max(viewportWidth, documentElement.scrollWidth, document.body.scrollWidth);
        const maxDocumentHeight = Math.max(viewportHeight, documentElement.scrollHeight, document.body.scrollHeight);
        const bounds = { left: Infinity, top: Infinity, right: 0, bottom: 0 };

        document.body.querySelectorAll("*").forEach((element) => {
          const tagName = element.tagName.toLowerCase();
          if (["script", "style", "link", "meta", "noscript"].includes(tagName)) return;
          if (element.id === "html-finetune-quickbar" || element.closest("#html-finetune-quickbar")) return;

          const style = window.getComputedStyle(element);
          if (!style || style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return;

          const semanticMedia = ["img", "svg", "canvas", "video", "picture", "iframe"].includes(tagName);
          const semanticControl = ["a", "button", "input", "textarea", "select"].includes(tagName);
          if (!hasDirectText(element) && !semanticMedia && !semanticControl) return;

          const rect = element.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) return;
          if (rect.width > viewportWidth * 0.92 && rect.height > viewportHeight * 0.7) return;

          bounds.left = Math.min(bounds.left, rect.left);
          bounds.top = Math.min(bounds.top, rect.top);
          bounds.right = Math.max(bounds.right, rect.right);
          bounds.bottom = Math.max(bounds.bottom, rect.bottom);
        });

        if (!Number.isFinite(bounds.left) || bounds.right <= bounds.left || bounds.bottom <= bounds.top) return null;

        const padding = 28;
        const minWidth = Math.min(viewportWidth, 360);
        const minHeight = Math.min(viewportHeight, 260);
        const x = Math.max(0, Math.min(maxDocumentWidth, Math.floor(bounds.left - padding)));
        const y = Math.max(0, Math.min(maxDocumentHeight, Math.floor(bounds.top - padding)));
        const right = Math.max(x + 1, Math.min(maxDocumentWidth, Math.ceil(bounds.right + padding)));
        const bottom = Math.max(y + 1, Math.min(maxDocumentHeight, Math.ceil(bounds.bottom + padding)));
        const width = Math.min(maxDocumentWidth - x, Math.max(minWidth, right - x));
        const height = Math.min(maxDocumentHeight - y, Math.max(minHeight, bottom - y));

        if (width > viewportWidth * 0.9 && height > viewportHeight * 0.9) return null;
        return { x, y, width: Math.round(width), height: Math.round(height) };
      }

      function sendContentBounds() {
        window.parent.postMessage({
          type: "HTML_FINETUNE_OPTIMIZED_CONTENT_BOUNDS",
          bounds: measureContentBounds(),
          token: BRIDGE_TOKEN
        }, "*");
      }

      let quickbarTarget = null;

      function sendAction(action) {
        if (!quickbarTarget) return;
        const hftId = quickbarTarget.getAttribute(attr);
        if (!hftId) return;
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_ACTION", hftId, action, token: BRIDGE_TOKEN }, "*");
      }

      function ensureQuickbar() {
        let quickbar = document.getElementById("html-finetune-quickbar");
        if (quickbar) return quickbar;
        quickbar = document.createElement("div");
        quickbar.id = "html-finetune-quickbar";
        quickbar.setAttribute("role", "toolbar");
        quickbar.setAttribute("aria-label", "HTML FineTune element actions");
        quickbar.innerHTML = [
          '<div class="hft-qb-meta" aria-hidden="true"><span class="hft-qb-dot"></span><strong data-role="tag">element</strong></div>',
          '<span class="hft-qb-divider" aria-hidden="true"></span>',
          '<button type="button" data-action="edit-text" data-label="编辑" title="编辑文字" aria-label="编辑文字"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"></path></svg><span>编辑</span></button>',
          '<button type="button" data-action="duplicate" data-label="复制" title="复制元素" aria-label="复制元素"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path></svg><span>复制</span></button>',
          '<button type="button" data-action="delete" data-label="删除" title="删除元素" aria-label="删除元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg><span>删除</span></button>',
          '<span class="hft-qb-divider" aria-hidden="true"></span>',
          '<button type="button" data-action="move-up" data-label="上移" title="上移元素" aria-label="上移元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg><span>上移</span></button>',
          '<button type="button" data-action="move-down" data-label="下移" title="下移元素" aria-label="下移元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg><span>下移</span></button>',
          '<button type="button" data-action="copy-style" data-label="复制样式" title="复制样式" aria-label="复制样式"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"></path><path d="m7 16 8.5-8.5a2.1 2.1 0 0 1 3 3L10 19l-4 1 1-4Z"></path></svg><span>复制样式</span></button>',
          '<button type="button" data-action="paste-style" data-label="粘贴样式" title="粘贴样式" aria-label="粘贴样式"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h6"></path><path d="M9 3h6v4H9z"></path><path d="M5 7h14v14H5z"></path><path d="M9 14h6"></path></svg><span>粘贴样式</span></button>'
        ].join("");
        quickbar.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const button = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
          if (!button) return;
          const action = button.getAttribute("data-action");
          if (!action) return;
          sendAction(action);
        });
        document.body.appendChild(quickbar);
        return quickbar;
      }

      function hideQuickbar() {
        const quickbar = document.getElementById("html-finetune-quickbar");
        if (quickbar) quickbar.dataset.open = "false";
        quickbarTarget = null;
      }

      function setSelection(hftId, shouldScroll) {
        const current = document.querySelector("[" + selectedAttr + "='true']");
        if (current) current.removeAttribute(selectedAttr);
        if (!hftId) {
          hideQuickbar();
          return;
        }

        const target = document.querySelector("[" + attr + "='" + CSS.escape(String(hftId)) + "']");
        if (!target) return;
        target.setAttribute(selectedAttr, "true");
        if (shouldScroll && typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }

      async function selectElementByHftId(hftId, shouldScroll) {
        const target = document.querySelector("[" + attr + "='" + CSS.escape(String(hftId)) + "']");
        if (!target) return false;
        const activation = await activateSlideFor(target);
        setSelection(hftId, shouldScroll);
        if (activation.slide && activation.activated) {
          window.parent.postMessage({
            type: "HTML_FINETUNE_OPTIMIZED_SLIDE_ACTIVATED",
            hftId,
            slideIndex: activation.index,
            token: BRIDGE_TOKEN
          }, "*");
        }
        if (activation.slide && !activation.activated) {
          sendStatus("目标元素所在页面无法自动激活");
        }
        return true;
      }

      function showQuickbarFor(element) {
        quickbarTarget = element;
        const quickbar = ensureQuickbar();
        const hftId = element.getAttribute(attr) || "";
        const tag = quickbar.querySelector("[data-role='tag']");
        if (tag) tag.textContent = element.tagName.toLowerCase();
        quickbar.dataset.hftId = hftId;
        const rect = element.getBoundingClientRect();
        quickbar.dataset.open = "true";
        const width = quickbar.offsetWidth || 360;
        const height = quickbar.offsetHeight || 40;
        const top = Math.max(8, rect.top - height - 12);
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left));
        quickbar.style.top = Math.round(top) + "px";
        quickbar.style.left = Math.round(left) + "px";
      }

      function openModal() {
        const modal = findModal();
        if (!modal) {
          window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: false, open: false, token: BRIDGE_TOKEN }, "*");
          return;
        }
        if (typeof HTMLDialogElement !== "undefined" && modal instanceof HTMLDialogElement) {
          try {
            if (!modal.open) modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.classList.add("is-open", "open", "show");
          if (modal.style.display === "none") modal.style.display = "block";
          modal.style.visibility = "visible";
          modal.style.pointerEvents = "auto";
        }
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: true, open: true, token: BRIDGE_TOKEN }, "*");
      }

      function closeModal() {
        const modal = findModal();
        if (!modal) {
          window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: false, open: false, token: BRIDGE_TOKEN }, "*");
          return;
        }
        if (typeof HTMLDialogElement !== "undefined" && modal instanceof HTMLDialogElement) {
          if (modal.open) modal.close();
          modal.removeAttribute("open");
        } else {
          modal.setAttribute("hidden", "");
          modal.setAttribute("aria-hidden", "true");
          modal.classList.remove("is-open", "open", "show");
          modal.style.display = "none";
        }
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: true, open: false, token: BRIDGE_TOKEN }, "*");
      }

      let dragState = null;

      function toPx(value) {
        const parsed = Number.parseFloat(value || "0");
        return Number.isFinite(parsed) ? parsed : 0;
      }

      document.addEventListener("pointerdown", (event) => {
        if (event.target instanceof Element && event.target.closest("#html-finetune-quickbar")) return;
        const target = event.target instanceof Element ? event.target.closest("[" + attr + "]") : null;
        if (!target || !(target instanceof HTMLElement)) return;
        const computed = window.getComputedStyle(target);
        dragState = {
          element: target,
          hftId: target.getAttribute(attr),
          startX: event.clientX,
          startY: event.clientY,
          baseLeft: toPx(target.style.left || computed.left),
          baseTop: toPx(target.style.top || computed.top),
          originalPosition: computed.position,
          dragging: false
        };
      }, true);

      document.addEventListener("pointermove", (event) => {
        if (!dragState || !dragState.element) return;
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        if (!dragState.dragging && Math.hypot(dx, dy) < 5) return;
        dragState.dragging = true;
        event.preventDefault();
        event.stopPropagation();
        const element = dragState.element;
        if (dragState.originalPosition === "static") element.style.position = "relative";
        element.style.left = Math.round(dragState.baseLeft + dx) + "px";
        element.style.top = Math.round(dragState.baseTop + dy) + "px";
        element.style.zIndex = element.style.zIndex || "2";
      }, true);

      document.addEventListener("pointerup", (event) => {
        if (!dragState) return;
        const completed = dragState;
        dragState = null;
        if (!completed.dragging || !completed.hftId || !completed.element) return;
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({
          type: "HTML_FINETUNE_OPTIMIZED_DRAG",
          hftId: completed.hftId,
          styles: {
            position: completed.element.style.position || "relative",
            left: completed.element.style.left || "0px",
            top: completed.element.style.top || "0px"
          },
          token: BRIDGE_TOKEN
        }, "*");
      }, true);

      document.addEventListener("click", (event) => {
        if (suppressClickBridge) return;
        if (event.target instanceof Element && event.target.closest("#html-finetune-quickbar")) return;
        const target = event.target instanceof Element ? event.target.closest("[" + attr + "]") : null;
        if (!target) {
          hideQuickbar();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setSelection(target.getAttribute(attr), false);
        showQuickbarFor(target);
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_SELECT", hftId: target.getAttribute(attr), token: BRIDGE_TOKEN }, "*");
      }, true);

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") hideQuickbar();
      }, true);

      window.addEventListener("message", (event) => {
        if (event.source !== window.parent) return;
        if (event.origin !== "null" && event.origin !== window.location.origin) return;
        const data = event.data || {};
        if (data.type === "HTML_FINETUNE_OPTIMIZED_SET_SELECTION") {
          if (data.token !== BRIDGE_TOKEN) return;
          if (typeof data.hftId === "string") {
            void selectElementByHftId(data.hftId, true);
          } else {
            setSelection(null, false);
          }
          return;
        }
        if (data.type === "HTML_FINETUNE_OPTIMIZED_MEASURE_CONTENT") {
          sendContentBounds();
          return;
        }
        if (data.type !== "HTML_FINETUNE_OPTIMIZED_MODAL") return;
        if (data.action === "open") openModal();
        if (data.action === "close") closeModal();
      });

      window.addEventListener("load", sendContentBounds);
      window.addEventListener("resize", sendContentBounds);
      document.querySelectorAll("img").forEach((image) => {
        if (image.complete) return;
        image.addEventListener("load", sendContentBounds, { once: true });
        image.addEventListener("error", sendContentBounds, { once: true });
      });
      requestAnimationFrame(() => {
        sendContentBounds();
        setTimeout(sendContentBounds, 120);
      });
      sendStatus("预览桥接已就绪");
    })();
  `;
  documentRef.body.appendChild(scriptElement);

  return serializeDocument(documentRef);
}

export function getPreviewBuildError(srcDoc: string): string | null {
  if (!srcDoc.includes('data-preview-error="true"')) return null;
  const match = srcDoc.match(/<pre>([\s\S]*?)<\/pre>/i);
  return match?.[1]?.replace(/<[^>]+>/g, "").trim() || "HTML 解析失败，请检查标签和属性是否完整";
}

const BLOCKING_EXPORT_WARNING_TYPES = [
  "internal-attribute",
  "internal-element",
  "empty-html",
];

export function hasBlockingExportWarnings(warnings: { type: string }[]): boolean {
  return warnings.some((warning) => BLOCKING_EXPORT_WARNING_TYPES.includes(warning.type));
}

export function formatExportWarningSummary(totalCount: number, blockingCount: number): string {
  if (blockingCount > 0) return `${blockingCount} 项阻断风险`;
  if (totalCount > 0) return `${totalCount} 项提示`;
  return "干净";
}
