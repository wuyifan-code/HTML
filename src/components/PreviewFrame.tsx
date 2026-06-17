import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Eye, Lock, Maximize2, Minimize2, Monitor, Scan, Shrink, Smartphone, Tablet, ZoomIn, ZoomOut } from "lucide-react";
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
import { getFontLibraryScriptConfig, buildFontLibraryLinkTags, htmlMayUseRemoteFont } from "../utils/fontLibrary";
import {
  createPatchElementMessage,
  createSelectElementMessage,
  createModalCommandMessage,
  sendMessageToIframeLax,
} from "../utils/iframeMessages";

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
  const lastSelectCommandIdRef = useRef<number | null>(null);
  const { iframeRef, isReady, contentDimensions, markReady, markRendering, hasIframeError } = useIframeSelection(
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
    if (!autoFit || !contentDimensions || viewportMode === "fit") return null;
    const preset = viewportDimensions[viewportMode];
    if (preset.width <= 0 || preset.height <= 0 || contentDimensions.contentHeight <= 0) return null;
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

  const readoutViewport = adaptiveViewport ??
    (viewportMode === "fit" && contentDimensions
      ? {
          width: Math.round(contentDimensions.contentWidth),
          height: Math.round(contentDimensions.contentHeight),
        }
      : viewportSize);

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
    sendMessageToIframeLax(
      iframeRef.current,
      createPatchElementMessage(patchCommand.hftId, patchCommand.patch as unknown as Record<string, unknown>, bridgeTokenRef.current)
    );
  }, [iframeRef, isReady, patchCommand]);

  useEffect(() => {
    if (!modalCommand || !isReady) return;
    sendMessageToIframeLax(
      iframeRef.current,
      createModalCommandMessage(modalCommand.action, bridgeTokenRef.current)
    );
  }, [iframeRef, isReady, modalCommand]);

  useEffect(() => {
    const pendingCommand =
      selectCommand && selectCommand.id !== lastSelectCommandIdRef.current ? selectCommand : null;
    const hftId = pendingCommand?.hftId || selectedId;
    if (!hftId || !isReady) return;

    if (pendingCommand) {
      lastSelectCommandIdRef.current = pendingCommand.id;
    }

    sendMessageToIframeLax(
      iframeRef.current,
      createSelectElementMessage(hftId, Boolean(pendingCommand), bridgeTokenRef.current)
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
                mode="wide"
                activeMode={viewportMode}
                label="宽屏"
                onClick={onViewportModeChange}
                icon={<Maximize2 size={15} strokeWidth={1.75} />}
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
              <PreviewModeButton
                mode="fit"
                activeMode={viewportMode}
                label="适配"
                onClick={onViewportModeChange}
                icon={<Shrink size={15} strokeWidth={1.75} />}
              />
            </div>
          </div>
          <div className="preview-readouts" aria-label="画布读数">
            <div className="canvas-size-control" aria-label="当前画布尺寸">
              <span>{readoutViewport.width}</span>
              <small>x</small>
              <span>{readoutViewport.height}</span>
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
            onError={markRendering}
            style={viewportMode === "fit" ? { width: "100%", height: "100%" } : undefined}
          />
          {hasIframeError ? (
            <div className="iframe-error-overlay">
              <span>预览加载失败，请检查 HTML 内容</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export const PreviewFrame = memo(PreviewFrameComponent);

const viewportDimensions: Record<PreviewViewportMode, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  wide: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
  fit: { width: 0, height: 0 },
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
      gap: 4px !important;
      min-height: 42px !important;
      padding: 4px !important;
      border: 1px solid rgba(148, 163, 184, 0.28) !important;
      border-radius: 10px !important;
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
      max-width: 112px !important;
      padding: 0 9px !important;
      border-radius: 7px !important;
      background: #f3fbf9 !important;
      color: #0f766e !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
    }
    #html-finetune-floating-toolbar .hft-toolbar-meta strong {
      min-width: 0 !important;
      max-width: 74px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
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
      width: 32px !important;
      min-width: 32px !important;
      height: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0 !important;
      padding: 0 !important;
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
      width: 16px !important;
      height: 16px !important;
      flex: 0 0 auto !important;
      stroke: currentColor !important;
      stroke-width: 1.75 !important;
      fill: none !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
    #html-finetune-floating-toolbar button span {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(0 0 0 0) !important;
      white-space: nowrap !important;
    }
    #html-finetune-floating-toolbar button::after {
      content: attr(data-label) !important;
      position: absolute !important;
      left: 50% !important;
      top: -34px !important;
      z-index: 2 !important;
      padding: 5px 7px !important;
      border: 1px solid rgba(15, 118, 110, 0.16) !important;
      border-radius: 6px !important;
      background: rgba(17, 24, 39, 0.92) !important;
      color: #ffffff !important;
      font-size: 11px !important;
      font-weight: 650 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transform: translate(-50%, 4px) !important;
      transition: opacity 140ms ease, transform 140ms ease !important;
    }
    #html-finetune-floating-toolbar button:hover::after,
    #html-finetune-floating-toolbar button:focus-visible::after {
      opacity: 1 !important;
      transform: translate(-50%, 0) !important;
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
    #html-finetune-floating-toolbar button[data-action="copy-style"],
    #html-finetune-floating-toolbar button[data-action="paste-style"] {
      color: #0f766e !important;
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
  const source = withRemoteFontLibraryLinks(hasHtmlShell ? html : wrapFragment(html));
  const withStyle = insertBeforeClosingTag(source, "head", style);
  return insertBeforeClosingTag(withStyle, "body", script);
}

function wrapFragment(fragment: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${fragment}</body></html>`;
}

/**
 * 字符串级字体库注入（Pretext 技术）
 *
 * 传统方式用 DOMParser 解析全文 → DOM 操作 → 序列化。
 * Pretext 方式：正则检查 + 字符串拼接，O(n) 降至常数级开销。
 */
function withRemoteFontLibraryLinks(html: string): string {
  try {
    if (!htmlMayUseRemoteFont(html)) return html;
    const links = buildFontLibraryLinkTags();
    return insertBeforeClosingTag(html, "head", links);
  } catch {
    return html;
  }
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
  const fontLibrary = getFontLibraryScriptConfig();

  return `<script>
    (() => {
      const bridgeToken = ${JSON.stringify(bridgeToken)};
      const config = ${JSON.stringify(config)};
      const fontLibrary = ${JSON.stringify(fontLibrary)};
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
      let selectionSequence = 0;
      let allowSlideNavigationEvent = false;

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
          '<button type="button" data-action="move-up" data-label="上移" title="上移一位" aria-label="上移一位"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg><span>上移</span></button>',
          '<button type="button" data-action="move-down" data-label="下移" title="下移一位" aria-label="下移一位"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M19 12l-7 7-7-7"></path></svg><span>下移</span></button>',
          '<button type="button" data-action="duplicate" data-label="克隆" title="克隆元素" aria-label="克隆元素"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path></svg><span>克隆</span></button>',
          '<button type="button" data-action="copy-style" data-label="取样式" title="复制样式" aria-label="复制样式"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19 5-2-2a2.1 2.1 0 0 0-3 0l-9.5 9.5"></path><path d="m14 8 2 2"></path><path d="M4 13h6l-5 5H4z"></path><path d="M3 21h6"></path></svg><span>复制样式</span></button>',
          '<button type="button" data-action="paste-style" data-label="套样式" title="粘贴样式" aria-label="粘贴样式"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l2 3v3H6V7z"></path><path d="M6 14h12"></path><path d="M8 18h8"></path><path d="M10 22h4"></path></svg><span>粘贴样式</span></button>',
          '<button type="button" data-action="delete" data-label="删除" title="删除元素" aria-label="删除元素"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg><span>删除</span></button>'
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

      function normalizeFontName(value) {
        return String(value || "").toLowerCase().replace(/["']/g, "").replace(/\s+/g, " ").trim();
      }

      function shouldLoadRemoteFont(fontFamily) {
        const normalized = normalizeFontName(fontFamily);
        return fontLibrary.remoteFamilies.some((familyName) => {
          return normalized.includes(normalizeFontName(familyName));
        });
      }

      function ensureRemoteFontLibrary(fontFamily) {
        if (!shouldLoadRemoteFont(fontFamily)) return;
        const existing = document.querySelector("link[" + fontLibrary.attribute + "='stylesheet']");
        if (existing) return;

        fontLibrary.preconnectOrigins.forEach((origin) => {
          const link = document.createElement("link");
          link.rel = "preconnect";
          link.href = origin;
          link.setAttribute(fontLibrary.attribute, "preconnect");
          if (origin.indexOf("gstatic") >= 0) {
            link.crossOrigin = "anonymous";
          }
          document.head.appendChild(link);
        });

        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = fontLibrary.stylesheetHref;
        stylesheet.setAttribute(fontLibrary.attribute, "stylesheet");
        document.head.appendChild(stylesheet);
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
            if (property === "fontFamily") {
              ensureRemoteFontLibrary(value);
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

      function isSlideCandidate(element) {
        if (!element || !(element instanceof HTMLElement)) return false;
        return element.classList.contains("slide") ||
          element.hasAttribute("data-slide") ||
          /^slide[-_]?\\d+$/i.test(element.id || "");
      }

      function getAllSlides() {
        return Array.from(document.querySelectorAll(".slide, [data-slide], section[id^='slide-'], article[id^='slide-']"))
          .filter(isSlideCandidate);
      }

      function getContainingSlide(element) {
        const slide = element.closest(".slide, [data-slide], section[id^='slide-'], article[id^='slide-']");
        return isSlideCandidate(slide) ? slide : null;
      }

      function getRelatedSlides(slide) {
        const siblings = slide.parentElement
          ? Array.from(slide.parentElement.children).filter(isSlideCandidate)
          : [];
        if (siblings.includes(slide) && siblings.length > 1) return siblings;

        const allSlides = getAllSlides();
        if (allSlides.includes(slide)) return allSlides;
        return [slide];
      }

      function getSlideIndex(slide, slides) {
        const dataSlide = Number(slide.getAttribute("data-slide"));
        if (Number.isFinite(dataSlide) && dataSlide > 0) return dataSlide - 1;

        const idMatch = (slide.id || "").match(/(?:^|[-_])0*(\\d+)$/);
        if (idMatch) {
          const idIndex = Number(idMatch[1]) - 1;
          if (Number.isFinite(idIndex) && idIndex >= 0) return idIndex;
        }

        return Math.max(0, slides.indexOf(slide));
      }

      function clampSlideIndex(index, slides) {
        const safeIndex = Number.isFinite(index) ? index : 0;
        return Math.max(0, Math.min(slides.length - 1, safeIndex));
      }

      function isElementVisible(element) {
        if (!element || !element.isConnected) return false;
        const computed = window.getComputedStyle(element);
        if (computed.display === "none" || computed.visibility === "hidden") return false;
        return element.getClientRects().length > 0;
      }

      function isSlideVisible(slide) {
        if (!isElementVisible(slide)) return false;
        if (slide.getAttribute("aria-hidden") === "true") return false;
        return true;
      }

      function nextPaint() {
        return new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
      }

      async function waitForVisibleElement(element, attempts) {
        for (let index = 0; index < attempts; index += 1) {
          await nextPaint();
          if (isElementVisible(element)) return true;
        }
        return isElementVisible(element);
      }

      function dispatchHashChange(oldUrl) {
        let event;
        try {
          event = new HashChangeEvent("hashchange", {
            oldURL: oldUrl,
            newURL: window.location.href
          });
        } catch {
          event = new Event("hashchange");
        }
        window.dispatchEvent(event);
      }

      function requestHashSlideNavigation(slide) {
        if (!slide.id) return false;
        const nextHash = "#" + slide.id;
        const oldUrl = window.location.href;
        if (window.location.hash !== nextHash) {
          window.location.hash = nextHash;
        }
        dispatchHashChange(oldUrl);
        return true;
      }

      function callExternalSlideApi(index) {
        const api = window.__slideDeck;
        if (!api || typeof api !== "object") return false;

        try {
          if (typeof api.show === "function") {
            api.show(index);
            return true;
          }
          if (typeof api.goTo === "function") {
            api.goTo(index);
            return true;
          }
        } catch {
          return false;
        }

        return false;
      }

      function clickSlideNavigation(index) {
        const target = String(index + 1);
        const navButtons = Array.from(document.querySelectorAll(".nav-dots button[data-target]"));
        const fallbackButtons = navButtons.length > 0 ? navButtons : Array.from(document.querySelectorAll("[data-target]"));
        const button = fallbackButtons.find((candidate) => {
          return candidate instanceof HTMLElement && candidate.getAttribute("data-target") === target;
        });
        if (!button || !(button instanceof HTMLElement)) return false;

        allowSlideNavigationEvent = true;
        try {
          button.click();
        } finally {
          window.setTimeout(() => {
            allowSlideNavigationEvent = false;
          }, 0);
        }
        return true;
      }

      function syncSlideControls(index) {
        document.querySelectorAll(".nav-dots button[data-target]").forEach((button) => {
          const isActive = Number(button.getAttribute("data-target")) === index + 1;
          button.classList.toggle("active", isActive);
          if (isActive) {
            button.setAttribute("aria-current", "step");
          } else {
            button.removeAttribute("aria-current");
          }
        });
      }

      function setActiveSlideDomOnly(slide, slides, index) {
        slides.forEach((candidate) => {
          const isActive = candidate === slide;
          candidate.classList.toggle("is-active", isActive);
          candidate.setAttribute("aria-hidden", isActive ? "false" : "true");
          if (isActive && candidate.hasAttribute("hidden")) candidate.removeAttribute("hidden");
        });
        syncSlideControls(index);
      }

      function activateSlide(slide) {
        const slides = getRelatedSlides(slide);
        const slideIndex = clampSlideIndex(getSlideIndex(slide, slides), slides);
        if (isSlideVisible(slide)) return false;

        if (callExternalSlideApi(slideIndex)) return true;
        if (requestHashSlideNavigation(slide)) return true;
        if (clickSlideNavigation(slideIndex)) return true;

        setActiveSlideDomOnly(slide, slides, slideIndex);
        return true;
      }

      async function showSlideByIndex(index) {
        const slides = getAllSlides();
        if (!slides.length) return false;
        const normalizedIndex = clampSlideIndex(Number(index), slides);
        const slide = slides[normalizedIndex];
        activateSlide(slide);
        await waitForVisibleElement(slide, 4);
        if (!isSlideVisible(slide)) {
          setActiveSlideDomOnly(slide, slides, normalizedIndex);
          await waitForVisibleElement(slide, 2);
        }
        return isSlideVisible(slide);
      }

      function exposeSlideDeckBridge() {
        if (window.__htmlFineTuneSlideDeck) return;
        window.__htmlFineTuneSlideDeck = {
          show: showSlideByIndex,
          showByNumber: (number) => showSlideByIndex(Number(number) - 1),
          currentIndex: () => {
            const slides = getAllSlides();
            return Math.max(0, slides.findIndex(isSlideVisible));
          }
        };
      }

      async function activateContainingSlide(element) {
        const slide = getContainingSlide(element);
        if (!slide) return;
        const slides = getRelatedSlides(slide);
        const slideIndex = clampSlideIndex(getSlideIndex(slide, slides), slides);

        activateSlide(slide);
        if (await waitForVisibleElement(element, 4)) return;

        setActiveSlideDomOnly(slide, slides, slideIndex);
        await waitForVisibleElement(element, 3);
      }

      function selectElementByHftId(hftId, shouldNotify = true) {
        if (!hftId) return;
        const element = queryByHftId(hftId);
        if (!element || !isEditableElement(element)) return;

        const requestId = selectionSequence + 1;
        selectionSequence = requestId;
        openContainingModal(element);
        activateContainingSlide(element).then(() => {
          if (requestId !== selectionSequence) return;
          element.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
          requestAnimationFrame(() => {
            if (requestId !== selectionSequence) return;
            selectElement(element, shouldNotify);
          });
        });
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

        if (
          target instanceof Element &&
          (target.closest(".nav-dots button[data-target]") ||
            (allowSlideNavigationEvent && target.closest("[data-target]")))
        ) {
          hideFloatingToolbar();
          return;
        }

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
          selectElementByHftId(data.hftId, data.notify !== false);
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
      exposeSlideDeckBridge();
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
