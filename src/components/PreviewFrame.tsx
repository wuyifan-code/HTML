import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Eye, Lock, Maximize2, Minimize2, Monitor, Scan, Smartphone, Tablet, ZoomIn, ZoomOut } from "lucide-react";
import { useIframeSelection } from "../hooks/useIframeSelection";
import type {
  ElementQuickAction,
  ModalCommand,
  ModalState,
  PatchCommand,
  PreviewViewportMode,
  SelectElementCommand,
  SelectedElementSnapshot,
} from "../types/editor";
import { createEditableElementScriptConfig } from "../utils/editableElement";

interface PreviewFrameProps {
  html: string;
  selectedId: string | null;
  reloadNonce: number;
  patchCommand: PatchCommand | null;
  modalCommand: ModalCommand | null;
  selectCommand: SelectElementCommand | null;
  viewportMode: PreviewViewportMode;
  isFocusPreview: boolean;
  onViewportModeChange: (mode: PreviewViewportMode) => void;
  onToggleFocusPreview: () => void;
  onElementSelected: (element: SelectedElementSnapshot) => void;
  onModalStateChange: (state: ModalState) => void;
  onElementAction: (hftId: string, action: ElementQuickAction) => void;
  onReadyChange: (isReady: boolean) => void;
}

function PreviewFrameComponent({
  html,
  selectedId,
  reloadNonce,
  patchCommand,
  modalCommand,
  selectCommand,
  viewportMode,
  isFocusPreview,
  onViewportModeChange,
  onToggleFocusPreview,
  onElementSelected,
  onModalStateChange,
  onElementAction,
  onReadyChange,
}: PreviewFrameProps) {
  const bridgeTokenRef = useRef(createBridgeToken());
  const targetOriginRef = useRef("*");
  const { iframeRef, isReady, contentDimensions, markReady, markRendering } = useIframeSelection(
    bridgeTokenRef.current,
    onElementSelected,
    onModalStateChange,
    onElementAction
  );
  // srcDoc 仅在结构性变更(reloadNonce)时重建;文本/样式编辑通过 patchCommand 增量下发。
  const srcDoc = useMemo(
    () => buildPreviewDocument(html, bridgeTokenRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadNonce]
  );
  const viewportSize = viewportDimensions[viewportMode];
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);

  // 重置 autoFit 当 HTML 结构变更(reloadNonce)时
  useEffect(() => {
    setAutoFit(true);
    setZoom(1);
  }, [reloadNonce]);

  // 自适应 viewport 尺寸:匹配内容宽高比,不缩放 iframe 内部渲染
  const adaptiveViewport = useMemo(() => {
    if (!autoFit || !contentDimensions) return null;
    const preset = viewportDimensions[viewportMode];
    const contentRatio = contentDimensions.contentWidth / contentDimensions.contentHeight;
    const presetRatio = preset.width / preset.height;
    if (contentRatio > presetRatio) {
      // 内容比预设更宽 → 保持宽度,缩减高度
      return {
        width: preset.width,
        height: Math.round(preset.width / contentRatio),
        ratio: String(contentRatio),
      };
    }
    // 内容比预设更高 → 保持高度,缩减宽度
    return {
      width: Math.round(preset.height * contentRatio),
      height: preset.height,
      ratio: String(contentRatio),
    };
  }, [autoFit, contentDimensions, viewportMode]);

  const displayZoom = autoFit ? 1 : zoom;

  const handleZoomIn = useCallback(() => {
    setAutoFit(false);
    setZoom((z) => Math.min(2, z + 0.1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setAutoFit(false);
    setZoom((z) => Math.max(0.25, z - 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setAutoFit(false);
    setZoom(1);
  }, []);

  const handleAutoFit = useCallback(() => {
    setAutoFit((prev) => !prev);
  }, []);

  useEffect(() => {
    markRendering();
    onReadyChange(false);
  }, [markRendering, onReadyChange, srcDoc]);

  useEffect(() => {
    onReadyChange(isReady);
  }, [isReady, onReadyChange]);

  // 增量补丁:文本/样式/属性就地应用到 iframe,不触发整文档重建。
  useEffect(() => {
    if (!patchCommand || !isReady) return;
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "HTML_FINETUNE_PATCH_ELEMENT",
          hftId: patchCommand.hftId,
          patch: patchCommand.patch,
          token: bridgeTokenRef.current,
        },
        targetOriginRef.current
      );
  }, [iframeRef, isReady, patchCommand]);

  useEffect(() => {
    if (!modalCommand || !isReady) return;

      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "HTML_FINETUNE_MODAL_COMMAND",
          action: modalCommand.action,
          token: bridgeTokenRef.current,
        },
        targetOriginRef.current
      );
  }, [iframeRef, isReady, modalCommand]);

  useEffect(() => {
    const hftId = selectCommand?.hftId || selectedId;
    if (!hftId || !isReady) return;

      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "HTML_FINETUNE_SELECT_ELEMENT",
          hftId,
          token: bridgeTokenRef.current,
        },
        targetOriginRef.current
      );
  }, [iframeRef, isReady, selectCommand, selectedId]);

  return (
    <section className="panel preview-panel" aria-label="HTML 实时预览">
      <div className="panel-header">
        <div className="panel-title">
          <Eye size={18} strokeWidth={1.75} />
          <span>Canvas</span>
        </div>
        <div className="preview-header-actions">
          <div className="preview-control-cluster">
            <div className="segmented-control preview-mode-control" aria-label="预览宽度">
              <PreviewModeButton
                mode="desktop"
                activeMode={viewportMode}
                label="桌面"
                onClick={onViewportModeChange}
                icon={<Monitor size={15} strokeWidth={1.75} />}
              />
              <PreviewModeButton
                mode="tablet"
                activeMode={viewportMode}
                label="平板"
                onClick={onViewportModeChange}
                icon={<Tablet size={15} strokeWidth={1.75} />}
              />
              <PreviewModeButton
                mode="mobile"
                activeMode={viewportMode}
                label="手机"
                onClick={onViewportModeChange}
                icon={<Smartphone size={15} strokeWidth={1.75} />}
              />
            </div>
          </div>
          <div className="preview-readouts" aria-label="画布读数">
            <div className="canvas-size-control" aria-label="当前画布尺寸">
              <span>{adaptiveViewport ? adaptiveViewport.width : viewportSize.width}</span>
              <small>x</small>
              <span>{adaptiveViewport ? adaptiveViewport.height : viewportSize.height}</span>
              <Lock size={13} strokeWidth={1.75} />
            </div>
            <div className="zoom-control-cluster" aria-label="缩放控制">
              <button
                className="ghost-button compact-action zoom-btn"
                type="button"
                onClick={handleZoomOut}
                disabled={displayZoom <= 0.25}
                title="缩小"
              >
                <ZoomOut size={14} strokeWidth={1.75} />
              </button>
              <button
                className="zoom-pill-button"
                type="button"
                onClick={handleZoomReset}
                title="重置为 100%"
              >
                {autoFit ? "适应" : `${Math.round(displayZoom * 100)}%`}
              </button>
              <button
                className="ghost-button compact-action zoom-btn"
                type="button"
                onClick={handleZoomIn}
                disabled={displayZoom >= 2}
                title="放大"
              >
                <ZoomIn size={14} strokeWidth={1.75} />
              </button>
              <button
                className={`ghost-button compact-action zoom-fit-btn${autoFit ? " zoom-fit-active" : ""}`}
                type="button"
                onClick={handleAutoFit}
                title={autoFit ? "已开启自适应，点击关闭" : "自适应画布"}
              >
                <Scan size={14} strokeWidth={1.75} />
                <span>适应</span>
              </button>
            </div>
          </div>
          <button
            className="ghost-button compact-action preview-focus-button"
            type="button"
            onClick={onToggleFocusPreview}
            title={isFocusPreview ? "恢复三栏编辑器" : "隐藏编辑器，全屏预览"}
          >
            {isFocusPreview ? <Minimize2 size={15} strokeWidth={1.75} /> : <Maximize2 size={15} strokeWidth={1.75} />}
            <span>{isFocusPreview ? "恢复" : "全屏"}</span>
          </button>
        </div>
      </div>
      <div className={`iframe-shell iframe-shell-${viewportMode}`}>
        <div
          className={`preview-viewport preview-viewport-${viewportMode}`}
          style={{
            "--adaptive-width": adaptiveViewport ? `${adaptiveViewport.width}px` : undefined,
            "--adaptive-height": adaptiveViewport ? `${adaptiveViewport.height}px` : undefined,
            "--adaptive-ratio": adaptiveViewport ? adaptiveViewport.ratio : undefined,
            "--preview-zoom": displayZoom,
          } as React.CSSProperties}
        >
          <iframe
            ref={iframeRef}
            title="HTML FineTune 实时预览"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            onLoad={markReady}
          />
        </div>
      </div>
    </section>
  );
}

export const PreviewFrame = memo(PreviewFrameComponent);

const viewportDimensions: Record<PreviewViewportMode, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};

interface PreviewModeButtonProps {
  mode: PreviewViewportMode;
  activeMode: PreviewViewportMode;
  label: string;
  icon: ReactNode;
  onClick: (mode: PreviewViewportMode) => void;
}

function PreviewModeButton({ mode, activeMode, label, icon, onClick }: PreviewModeButtonProps) {
  const isActive = mode === activeMode;

  return (
    <button
      className={`segmented-button${isActive ? " segmented-button-active" : ""}`}
      type="button"
      aria-pressed={isActive}
      title={`${label}预览`}
      onClick={() => onClick(mode)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function buildPreviewDocument(html: string, bridgeToken: string): string {
  const script = createBridgeScript(bridgeToken);
  const style = `<style id="html-finetune-bridge-style">
    [data-html-finetune-editable="true"] {
      cursor: text !important;
    }
    [data-html-finetune-hovered="true"]:not([data-html-finetune-selected="true"]) {
      outline: 1.5px dashed #19a997 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 5px rgba(25, 169, 151, 0.11) !important;
      border-radius: 6px !important;
    }
    [data-html-finetune-selected="true"] {
      outline: 2px solid #19a997 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(25, 169, 151, 0.14) !important;
      border-radius: 6px !important;
    }
    #html-finetune-floating-toolbar {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center !important;
      gap: 6px !important;
      min-height: 44px !important;
      padding: 5px !important;
      border: 1px solid rgba(148, 163, 184, 0.28) !important;
      border-radius: 11px !important;
      background: rgba(255, 255, 255, 0.96) !important;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.8) inset,
        0 2px 4px rgba(15, 23, 42, 0.04),
        0 8px 18px rgba(15, 23, 42, 0.10),
        0 28px 56px rgba(15, 23, 42, 0.18) !important;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      backdrop-filter: blur(18px) !important;
      -webkit-backdrop-filter: blur(18px) !important;
      transform-origin: center bottom !important;
      isolation: isolate !important;
      animation: hft-toolbar-enter 220ms cubic-bezier(0.16, 1, 0.3, 1) both !important;
    }

    @keyframes hft-toolbar-enter {
      0% {
        opacity: 0 !important;
        transform: translateY(8px) scale(0.94) !important;
      }
      100% {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
    }
    #html-finetune-floating-toolbar::after {
      content: "" !important;
      position: absolute !important;
      left: 50% !important;
      bottom: -6px !important;
      width: 10px !important;
      height: 10px !important;
      transform: translateX(-50%) rotate(45deg) !important;
      border-right: 1px solid rgba(148, 163, 184, 0.34) !important;
      border-bottom: 1px solid rgba(148, 163, 184, 0.34) !important;
      background: rgba(255, 255, 255, 0.98) !important;
    }
    #html-finetune-floating-toolbar[data-placement="below"] {
      transform-origin: center top !important;
    }
    #html-finetune-floating-toolbar[data-placement="below"]::after {
      top: -6px !important;
      bottom: auto !important;
      border: 0 !important;
      border-left: 1px solid rgba(148, 163, 184, 0.34) !important;
      border-top: 1px solid rgba(148, 163, 184, 0.34) !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-meta {
      height: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      padding: 0 10px !important;
      border-radius: 7px !important;
      background: #f3fbf9 !important;
      color: #0f766e !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-dot {
      width: 7px !important;
      height: 7px !important;
      border-radius: 999px !important;
      background: #19a997 !important;
      box-shadow: 0 0 0 3px rgba(25, 169, 151, 0.16) !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-divider {
      width: 1px !important;
      height: 24px !important;
      border-radius: 999px !important;
      background: linear-gradient(180deg, transparent 0%, #cfdad7 40%, #cfdad7 60%, transparent 100%) !important;
    }
    #html-finetune-floating-toolbar button {
      position: relative !important;
      min-width: 38px !important;
      height: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 7px !important;
      padding: 0 10px !important;
      border: 1px solid transparent !important;
      border-radius: 7px !important;
      background: transparent !important;
      color: #334155 !important;
      font: inherit !important;
      font-size: 12px !important;
      font-weight: 650 !important;
      cursor: pointer !important;
      transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease !important;
    }
    #html-finetune-floating-toolbar button svg {
      width: 15px !important;
      height: 15px !important;
      flex: 0 0 auto !important;
      stroke: currentColor !important;
      stroke-width: 1.75 !important;
      fill: none !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
    #html-finetune-floating-toolbar button:hover {
      color: #0f766e !important;
      background: rgba(25, 169, 151, 0.1) !important;
      border-color: rgba(25, 169, 151, 0.18) !important;
      box-shadow: 0 6px 14px rgba(15, 118, 110, 0.12) !important;
      transform: translateY(-1px) scale(1.04) !important;
    }
    #html-finetune-floating-toolbar button:active {
      transform: translateY(1px) scale(0.97) !important;
      transition-duration: 60ms !important;
    }
    #html-finetune-floating-toolbar button[data-action="delete"] {
      color: #b42318 !important;
    }
    #html-finetune-floating-toolbar button[data-action="delete"]:hover {
      color: #ffffff !important;
      background: #e5483f !important;
      border-color: #e5483f !important;
      box-shadow: 0 6px 18px rgba(229, 72, 63, 0.28) !important;
      transform: translateY(-1px) scale(1.04) !important;
    }
  </style>`;

  const hasHtmlShell = /<html[\s>]/i.test(html);
  const withStyle = insertBeforeClosingTag(hasHtmlShell ? html : wrapFragment(html), "head", style);
  return insertBeforeClosingTag(withStyle, "body", script);
}

function wrapFragment(fragment: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${fragment}</body></html>`;
}

function insertBeforeClosingTag(html: string, tag: "head" | "body", content: string): string {
  const pattern = new RegExp(`</${tag}>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `${content}</${tag}>`);
  }

  return `${html}${content}`;
}

function createBridgeScript(bridgeToken: string): string {
  const config = createEditableElementScriptConfig();

  return `<script>
    (() => {
      const bridgeToken = ${JSON.stringify(bridgeToken)};
      const config = ${JSON.stringify(config)};
      const editableTags = new Set(config.editableTags.map((tag) => tag.toUpperCase()));
      const editableBlockTags = new Set(config.editableBlockTags.map((tag) => tag.toUpperCase()));
      const editableMediaTags = new Set(config.editableMediaTags.map((tag) => tag.toUpperCase()));
      const nonEditableTags = new Set(config.nonEditableTags.map((tag) => tag.toUpperCase()));
      const modalSelectors = [
        "dialog",
        "[role='dialog']",
        "[aria-modal='true']",
        "[data-hft-modal]",
        "[data-modal]",
        ".modal",
        ".dialog",
        ".popup"
      ];

      function hasDirectText(element) {
        return Array.from(element.childNodes).some((node) => {
          return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim().length > 0;
        });
      }

      function isEditableElement(element) {
        if (!element || !(element instanceof HTMLElement)) return false;
        if (element.closest("[data-html-finetune-ui='true']")) return false;
        if (nonEditableTags.has(element.tagName)) return false;
        if (editableMediaTags.has(element.tagName)) return true;
        const text = (element.textContent || "").trim();
        if (!text) return false;
        if (editableTags.has(element.tagName)) return true;
        if (editableBlockTags.has(element.tagName)) return hasDirectText(element);
        return false;
      }

      function findEditableElement(start) {
        let current = start;
        while (current && current !== document.body) {
          if (isEditableElement(current)) return current;
          current = current.parentElement;
        }
        return null;
      }

      function getElementIndex(element) {
        let index = 1;
        let sibling = element.previousElementSibling;
        while (sibling) {
          if (sibling.tagName === element.tagName) index += 1;
          sibling = sibling.previousElementSibling;
        }
        return index;
      }

      function getDomPath(element) {
        const segments = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          const tag = current.tagName.toLowerCase();
          if (tag === "html") {
            segments.unshift("html");
            break;
          }
          segments.unshift(tag + ":nth-of-type(" + getElementIndex(current) + ")");
          current = current.parentElement;
        }
        return segments.join(" > ");
      }

      function colorToHex(color) {
        const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
        if (match) {
          return "#" + [match[1], match[2], match[3]]
            .map((part) => Number(part).toString(16).padStart(2, "0"))
            .join("");
        }
        if (/^#[0-9a-f]{6}$/i.test(color)) return color;
        return "#141413";
      }

      function describeLocation(element) {
        const classes = element.className && typeof element.className === "string"
          ? "." + element.className.trim().split(/\\s+/).filter(Boolean).join(".")
          : "";
        const id = element.id ? "#" + element.id : "";
        return element.tagName.toLowerCase() + id + classes;
      }

      function clearSelection() {
        document.querySelectorAll("[" + config.selectedAttribute + "='true']").forEach((element) => {
          element.removeAttribute(config.selectedAttribute);
        });
      }

      function clearHover() {
        document.querySelectorAll("[" + config.hoverAttribute + "='true']").forEach((element) => {
          element.removeAttribute(config.hoverAttribute);
        });
      }

      function markEditableElements() {
        document.querySelectorAll("body *").forEach((element) => {
          if (isEditableElement(element)) {
            element.setAttribute(config.editableAttribute, "true");
          }
        });
      }

      function makePayload(element) {
        const computed = window.getComputedStyle(element);
        return {
          hftId: element.getAttribute(config.hftIdAttribute) || "",
          path: getDomPath(element),
          tagName: element.tagName.toLowerCase(),
          id: element.id || "",
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent || "",
          styles: {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            color: colorToHex(computed.color),
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing === "normal" ? "0px" : computed.letterSpacing,
            textAlign: computed.textAlign,
            backgroundColor: colorToHex(computed.backgroundColor),
            borderColor: colorToHex(computed.borderColor),
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow === "none" ? "" : computed.boxShadow,
            width: computed.width,
            height: computed.height,
            maxWidth: computed.maxWidth === "none" ? "" : computed.maxWidth,
            objectFit: computed.objectFit,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom,
            paddingTop: computed.paddingTop,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight
          },
          effects: {
            hoverBackgroundColor: ""
          },
          attributes: {
            src: element instanceof HTMLImageElement ? element.getAttribute("src") || "" : "",
            alt: element instanceof HTMLImageElement ? element.getAttribute("alt") || "" : ""
          },
          location: describeLocation(element),
          hasInlineStyle: Boolean(element.getAttribute("style")),
          canEditText: !(element instanceof HTMLImageElement) && !element.querySelector("*")
        };
      }

      function selectElement(element, shouldNotify = true) {
        clearSelection();
        clearHover();
        element.setAttribute(config.selectedAttribute, "true");
        positionFloatingToolbar(element);
        if (shouldNotify) {
          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_SELECTED",
            token: bridgeToken,
            payload: makePayload(element)
          }, "*");
        }
      }

      function ensureFloatingToolbar() {
        const existing = document.getElementById("html-finetune-floating-toolbar");
        if (existing) return existing;

        const toolbar = document.createElement("div");
        toolbar.id = "html-finetune-floating-toolbar";
        toolbar.setAttribute("data-html-finetune-ui", "true");
        toolbar.setAttribute("role", "toolbar");
        toolbar.setAttribute("aria-label", "HTML FineTune 快捷工具");
        toolbar.innerHTML = [
          '<div class="hft-toolbar-meta" aria-hidden="true"><span class="hft-toolbar-dot"></span><strong data-role="tag">element</strong></div>',
          '<span class="hft-toolbar-divider" aria-hidden="true"></span>',
          '<button type="button" data-action="duplicate" title="复制元素" aria-label="复制元素"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path></svg><span>复制</span></button>',
          '<button type="button" data-action="delete" title="删除元素" aria-label="删除元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg><span>删除</span></button>'
        ].join("");

        toolbar.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        }, true);

        toolbar.addEventListener("click", (event) => {
          const button = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
          if (!button) return;
          event.preventDefault();
          event.stopPropagation();
          const hftId = toolbar.getAttribute("data-hft-id") || "";
          const action = button.getAttribute("data-action") || "";
          if (!hftId || !action) return;

          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_ACTION",
            token: bridgeToken,
            payload: { hftId, action }
          }, "*");
        }, true);

        document.body.appendChild(toolbar);
        return toolbar;
      }

      function hideFloatingToolbar() {
        const toolbar = document.getElementById("html-finetune-floating-toolbar");
        if (!toolbar) return;
        toolbar.style.display = "none";
        toolbar.removeAttribute("data-hft-id");
      }

      function positionFloatingToolbar(element) {
        const toolbar = ensureFloatingToolbar();
        const rect = element.getBoundingClientRect();
        const tagLabel = toolbar.querySelector("[data-role='tag']");
        if (tagLabel) tagLabel.textContent = element.tagName.toLowerCase();
        toolbar.setAttribute("data-hft-id", element.getAttribute(config.hftIdAttribute) || "");
        toolbar.style.display = "flex";

        const toolbarWidth = toolbar.offsetWidth || 188;
        const toolbarHeight = toolbar.offsetHeight || 42;
        const visibleBounds = getVisibleFrameBounds();
        const hasRoomAbove = rect.top >= toolbarHeight + 12;
        toolbar.setAttribute("data-placement", hasRoomAbove ? "above" : "below");
        const preferredTop = hasRoomAbove ? rect.top - toolbarHeight - 12 : rect.bottom + 12;
        const maxTop = Math.max(8, visibleBounds.height - toolbarHeight - 8);
        const top = Math.max(8, Math.min(preferredTop, maxTop));
        const maxLeft = Math.max(8, visibleBounds.width - toolbarWidth - 8);
        const preferredLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
        const left = Math.max(8, Math.min(preferredLeft, maxLeft));

        toolbar.style.top = top + "px";
        toolbar.style.left = left + "px";
      }

      let cachedFrameBounds = null;
      let pendingReposition = false;
      function invalidateFrameBounds() {
        cachedFrameBounds = null;
      }

      function getVisibleFrameBounds() {
        if (cachedFrameBounds) return cachedFrameBounds;
        const fallback = { width: window.innerWidth, height: window.innerHeight };
        try {
          if (!window.frameElement || !window.parent) return fallback;
          const frameRect = window.frameElement.getBoundingClientRect();
          const parentWidth = window.parent.innerWidth || fallback.width;
          const parentHeight = window.parent.innerHeight || fallback.height;
          const bounds = {
            width: Math.max(120, Math.min(fallback.width, parentWidth - frameRect.left - 8)),
            height: Math.max(80, Math.min(fallback.height, parentHeight - frameRect.top - 8))
          };
          cachedFrameBounds = bounds;
          return bounds;
        } catch {
          return fallback;
        }
      }

      function repositionFloatingToolbar() {
        const selected = document.querySelector("[" + config.selectedAttribute + "='true']");
        if (selected && selected instanceof HTMLElement) {
          positionFloatingToolbar(selected);
        } else {
          hideFloatingToolbar();
        }
      }

      function queryByHftId(hftId) {
        if (!hftId) return null;
        return Array.from(document.querySelectorAll("[" + config.hftIdAttribute + "]")).find((element) => {
          return element.getAttribute(config.hftIdAttribute) === hftId;
        }) || null;
      }

      function getModalElements() {
        return Array.from(document.querySelectorAll(modalSelectors.join(","))).filter((element) => {
          return element instanceof HTMLElement;
        });
      }

      // 增量补丁:文本/样式/属性就地应用,避免整文档重建。
      function patchElement(hftId, patch) {
        const element = queryByHftId(hftId);
        if (!element || !(element instanceof HTMLElement)) return;

        if (typeof patch.text === "string" && element.children.length === 0) {
          element.textContent = patch.text;
        }

        if (patch.attributes) {
          Object.keys(patch.attributes).forEach((attribute) => {
            const value = patch.attributes[attribute];
            if (typeof value !== "string") return;
            if (attribute === "alt") {
              element.setAttribute(attribute, value);
              return;
            }
            if (value.trim()) {
              element.setAttribute(attribute, value);
            } else {
              element.removeAttribute(attribute);
            }
          });
        }

        if (patch.styles) {
          Object.keys(patch.styles).forEach((property) => {
            const value = patch.styles[property];
            if (typeof value !== "string") return;
            const kebab = property.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
            if (value.trim()) {
              element.style.setProperty(kebab, value);
            } else {
              element.style.removeProperty(kebab);
            }
          });
        }

        if (patch.effects && typeof patch.effects.hoverBackgroundColor !== "undefined") {
          updateHoverBackgroundRule(element, patch.effects.hoverBackgroundColor);
        }

        if (element.getAttribute(config.selectedAttribute) === "true") {
          positionFloatingToolbar(element);
        }
      }

      function updateHoverBackgroundRule(element, color) {
        const styleId = "html-finetune-hover-rules";
        let styleElement = document.getElementById(styleId);
        const rules = [];
        if (styleElement && styleElement.textContent) {
          const pattern = new RegExp(
            "\\[" + config.hftIdAttribute + "=\\\"([^\\\"]+)\\\"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}",
            "gi"
          );
          for (const match of styleElement.textContent.matchAll(pattern)) {
            rules.push({ hftId: match[1], color: match[2].trim() });
          }
        }

        const hftId = element.getAttribute(config.hftIdAttribute) || "";
        const filtered = rules.filter((rule) => rule.hftId !== hftId);
        if (color.trim()) {
          filtered.push({ hftId, color: color.trim() });
        }

        if (filtered.length === 0) {
          if (styleElement) styleElement.remove();
          return;
        }

        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = "\\n" + filtered
          .map((rule) => "[" + config.hftIdAttribute + "=\\\"" + rule.hftId + "\\\"]:hover { background-color: " + rule.color + "; }")
          .join("\\n") + "\\n";
      }

      function isNativeDialog(element) {
        return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement;
      }

      function isModalOpen(element) {
        if (isNativeDialog(element)) return element.open;
        if (element.hasAttribute("hidden")) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;
        if (element.getAttribute("data-html-finetune-modal-open") === "true") return true;

        const computed = window.getComputedStyle(element);
        if (computed.display === "none" || computed.visibility === "hidden") return false;

        return element.classList.contains("open") ||
          element.classList.contains("is-open") ||
          element.classList.contains("active") ||
          element.classList.contains("show") ||
          element.hasAttribute("open");
      }

      function getModalLabel(element) {
        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel;

        const labelledBy = element.getAttribute("aria-labelledby");
        if (labelledBy) {
          const labelElement = document.getElementById(labelledBy);
          if (labelElement?.textContent?.trim()) return labelElement.textContent.trim();
        }

        if (element.id) return "#" + element.id;
        if (typeof element.className === "string" && element.className.trim()) {
          return "." + element.className.trim().split(/\\s+/).join(".");
        }

        return element.tagName.toLowerCase();
      }

      function findPrimaryModal() {
        const modals = getModalElements();
        return modals.find(isModalOpen) || modals[0] || null;
      }

      function postModalState() {
        const modal = findPrimaryModal();
        window.parent.postMessage({
          type: "HTML_FINETUNE_MODAL_STATE",
          token: bridgeToken,
          payload: {
            found: Boolean(modal),
            open: modal ? isModalOpen(modal) : false,
            label: modal ? getModalLabel(modal) : ""
          }
        }, "*");
      }

      function postPreviewReady() {
        // 用 bounding rect 测量实际内容区域，而不是 body 的 scroll 尺寸
        var bodyChildren = Array.from(document.body.children);
        var maxArea = 0;
        var contentWidth = window.innerWidth;
        var contentHeight = window.innerHeight;
        for (var i = 0; i < bodyChildren.length; i++) {
          var rect = bodyChildren[i].getBoundingClientRect();
          if (rect.width < 24 || rect.height < 24) continue;
          var area = rect.width * rect.height;
          if (area > maxArea) {
            maxArea = area;
            contentWidth = Math.round(rect.width);
            contentHeight = Math.round(rect.height);
          }
        }
        window.parent.postMessage({
          type: "HTML_FINETUNE_PREVIEW_READY",
          token: bridgeToken,
          payload: {
            contentWidth: contentWidth,
            contentHeight: contentHeight
          }
        }, "*");
      }

      function openModal() {
        const modal = findPrimaryModal();
        if (!modal) {
          postModalState();
          return;
        }

        if (isNativeDialog(modal)) {
          try {
            if (!modal.open) modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.setAttribute("data-html-finetune-modal-open", "true");
          const computed = window.getComputedStyle(modal);
          if (computed.display === "none") modal.style.display = "block";
          if (computed.visibility === "hidden") modal.style.visibility = "visible";
          modal.style.pointerEvents = "auto";
        }

        postModalState();
      }

      function closeModal() {
        const modal = getModalElements().find(isModalOpen) || findPrimaryModal();
        if (!modal) {
          postModalState();
          return;
        }

        if (isNativeDialog(modal)) {
          if (modal.open) modal.close();
          modal.removeAttribute("open");
        } else {
          modal.setAttribute("hidden", "");
          modal.setAttribute("aria-hidden", "true");
          modal.setAttribute("data-html-finetune-modal-open", "false");
          modal.style.display = "none";
        }

        postModalState();
      }

      function openContainingModal(element) {
        const modal = element.closest(modalSelectors.join(","));
        if (!modal || isModalOpen(modal)) return;

        if (isNativeDialog(modal)) {
          try {
            modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.setAttribute("data-html-finetune-modal-open", "true");
          if (window.getComputedStyle(modal).display === "none") modal.style.display = "block";
          modal.style.pointerEvents = "auto";
        }

        postModalState();
      }

      function selectElementByHftId(hftId) {
        if (!hftId) return;
        const element = queryByHftId(hftId);
        if (!element || !isEditableElement(element)) return;

        openContainingModal(element);
        element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        selectElement(element, true);
      }

      document.addEventListener("mouseover", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        clearHover();
        if (element && element.getAttribute(config.selectedAttribute) !== "true") {
          element.setAttribute(config.hoverAttribute, "true");
        }
      }, true);

      document.addEventListener("mouseout", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        if (element) {
          element.removeAttribute(config.hoverAttribute);
        }
      }, true);

      document.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("[data-html-finetune-ui='true']")) {
          return;
        }

        const element = target instanceof Element ? findEditableElement(target) : null;

        if (element) {
          event.preventDefault();
          event.stopPropagation();
          selectElement(element, true);
          return;
        }

        const actionElement = target instanceof Element
          ? target.closest("[data-hft-open-modal], [data-open-modal], [data-modal-open], [data-hft-close-modal], [data-close-modal], [data-modal-close], .modal-close")
          : null;

        if (actionElement) {
          event.preventDefault();
          event.stopPropagation();
          if (
            actionElement.matches("[data-hft-close-modal], [data-close-modal], [data-modal-close], .modal-close")
          ) {
            closeModal();
          } else {
            openModal();
          }
          return;
        }
      }, true);

      document.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      window.addEventListener("message", (event) => {
        const data = event.data || {};
        if (data.token !== bridgeToken) return;
        if (data.type === "HTML_FINETUNE_SELECT_ELEMENT") {
          selectElementByHftId(data.hftId);
          return;
        }

        if (data.type === "HTML_FINETUNE_PATCH_ELEMENT") {
          patchElement(data.hftId, data.patch || {});
          return;
        }

        if (data.type !== "HTML_FINETUNE_MODAL_COMMAND") return;

        if (data.action === "open") openModal();
        if (data.action === "close") closeModal();
      });

      window.addEventListener("scroll", () => {
        invalidateFrameBounds();
        if (!pendingReposition) {
          pendingReposition = true;
          requestAnimationFrame(() => {
            pendingReposition = false;
            repositionFloatingToolbar();
          });
        }
      }, true);
      window.addEventListener("resize", () => {
        invalidateFrameBounds();
        if (!pendingReposition) {
          pendingReposition = true;
          requestAnimationFrame(() => {
            pendingReposition = false;
            repositionFloatingToolbar();
          });
        }
      });

      markEditableElements();
      postModalState();
      postPreviewReady();
      window.setTimeout(() => {
        postModalState();
        postPreviewReady();
      }, 50);
      window.setTimeout(() => {
        postModalState();
        postPreviewReady();
      }, 250);
    })();
  </script>`;
}

function createBridgeToken(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `hft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
