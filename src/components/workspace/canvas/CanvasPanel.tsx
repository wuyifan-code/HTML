import type { RefObject, CSSProperties } from "react";
import {
  IconMonitor,
  IconTablet,
  IconSmartphone,
  IconMove,
  IconZoomOut,
  IconZoomIn,
  IconMaximize,
} from "../../Icons";
import { DeviceFrame } from "./DeviceFrame";

type ZoomMode = "fit" | "88" | "100";

type ViewportPreset = "desktop" | "tablet" | "mobile";

interface CanvasPanelProps {
  srcDoc: string;
  viewportSize: { width: number; height: number };
  zoomMode: ZoomMode;
  isFocusMode: boolean;
  matchingViewportPreset?: string | null;
  aiStatus: "idle" | "running" | "ready" | "error";
  onViewportPresetChange?: (preset: ViewportPreset) => void;
  onZoomModeChange?: (mode: ZoomMode) => void;
  onFocusToggle?: () => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  onIframeLoad: () => void;
  previewShellStyle?: CSSProperties;
  previewFrameBounds?: { x: number; y: number; width: number; height: number };
  previewScale?: number;
  isContentFitPreview?: boolean;
  previewIframeStyle?: CSSProperties | undefined;

  // 兼容老单测参数
  viewportPreset?: string | null;
  onViewportChange?: (preset: any) => void;
  onZoomChange?: (zoom: any) => void;
}

function resolvePreset(
  matchingViewportPreset: string | null | undefined,
  viewportPreset: string | null | undefined
): ViewportPreset {
  if (matchingViewportPreset === "desktop" || matchingViewportPreset === "tablet" || matchingViewportPreset === "mobile") {
    return matchingViewportPreset;
  }
  if (viewportPreset === "desktop" || viewportPreset === "tablet" || viewportPreset === "mobile") {
    return viewportPreset;
  }
  return "desktop";
}

export function CanvasPanel({
  srcDoc,
  viewportSize,
  zoomMode,
  isFocusMode,
  matchingViewportPreset = null,
  aiStatus,
  onViewportPresetChange = () => {},
  onZoomModeChange = () => {},
  onFocusToggle = () => {},
  iframeRef,
  stageRef,
  onIframeLoad,
  previewShellStyle = {},
  previewFrameBounds = { x: 0, y: 0, width: 1440, height: 900 },
  previewScale = 1,
  isContentFitPreview = false,
  previewIframeStyle = {},
  viewportPreset,
  onViewportChange,
  onZoomChange,
}: CanvasPanelProps) {
  const preset = resolvePreset(matchingViewportPreset, viewportPreset);
  const useDeviceFrame = preset === "mobile" || preset === "tablet";
  const deviceOuterWidth = viewportSize.width + 24;
  const deviceOuterHeight = viewportSize.height + 24;

  const previewContent = (
    <iframe
      ref={iframeRef}
      className="live-preview-frame"
      title="实时 HTML 预览"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-forms allow-popups"
      style={previewIframeStyle}
      onLoad={onIframeLoad}
    />
  );

  return (
    <section className="nw-canvas panel stage-panel" aria-label="画布" data-od-id="canvas" tabIndex={-1}>
      <div className="viewport-bar" aria-label="画布工具栏">
        <div className="segmented-viewport-control" aria-label="视口预设切换">
          <span className="segmented-active-slide-bg" />
          <button
            type="button"
            className={"segmented-button" + (preset === "desktop" ? " is-on" : "")}
            data-dom-id="vp-desktop"
            title="桌面端"
            aria-label="桌面端"
            aria-pressed={preset === "desktop"}
            onClick={() => onViewportPresetChange("desktop")}
          >
            <IconMonitor />
            <span style={{ display: "none" }}>桌面</span>
          </button>
          <button
            type="button"
            className={"segmented-button" + (preset === "tablet" ? " is-on" : "")}
            data-dom-id="vp-tablet"
            title="平板端"
            aria-label="平板端"
            aria-pressed={preset === "tablet"}
            onClick={() => onViewportPresetChange("tablet")}
          >
            <IconTablet />
            <span style={{ display: "none" }}>平板</span>
          </button>
          <button
            type="button"
            className={"segmented-button" + (preset === "mobile" ? " is-on" : "")}
            data-dom-id="vp-mobile"
            title="移动端"
            aria-label="移动端"
            aria-pressed={preset === "mobile"}
            onClick={() => onViewportPresetChange("mobile")}
          >
            <IconSmartphone />
            <span style={{ display: "none" }}>手机</span>
          </button>
        </div>
        <span className="app-toolbar-sep" aria-hidden="true"></span>
        <span className="viewport-bar__dim">
          <IconMove />
          <span>{viewportSize.width} × {viewportSize.height}</span>
        </span>
        <div className="viewport-bar__group">
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
            data-dom-id="btn-zoom-out"
            title="缩小"
            aria-label="缩小"
            onClick={() => onZoomModeChange(zoomMode === "100" ? "88" : "fit")}
          >
            <IconZoomOut />
          </button>
          <span className="viewport-bar__zoom">{zoomMode === "fit" ? "适配" : (zoomMode === "88" ? "88%" : "100%")}</span>
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
            data-dom-id="btn-zoom-in"
            title="放大"
            aria-label="放大"
            onClick={() => onZoomModeChange(zoomMode === "fit" ? "88" : "100")}
          >
            <IconZoomIn />
          </button>
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
            data-dom-id="btn-fit"
            title="适应窗口"
            aria-label="适应窗口"
            onClick={() => onZoomModeChange("fit")}
          >
            <IconMaximize />
          </button>
          <span className="app-toolbar-sep" aria-hidden="true"></span>
          <button
            className={"ds-btn ds-btn--ghost ds-btn--sm" + (isFocusMode ? " is-on" : "")}
            type="button"
            aria-pressed={isFocusMode}
            onClick={onFocusToggle}
          >
            {isFocusMode ? "退出专注" : "专注"}
          </button>
        </div>
      </div>
      <div className="stage" ref={stageRef}>
        {aiStatus === "running" ? (
          <div className="canvas-scan-overlay">
            <div className="canvas-scan-line" />
          </div>
        ) : null}
        <section className="nw-canvas" aria-label="预览画布">
          {useDeviceFrame ? (
            <DeviceFrame
              viewportWidth={deviceOuterWidth}
              viewportHeight={deviceOuterHeight}
              preset={preset}
            >
              <div className="nw-preview-card">
                <div className="nw-preview-urlbar">
                  <span className="nw-preview-urlbar-dot" />
                  <span className="nw-preview-urlbar-dot" />
                  <span className="nw-preview-urlbar-dot" />
                  <div className="nw-preview-urlbar-input">localhost:5173</div>
                </div>
                <div className="page-preview-shell" style={previewShellStyle}>
                  <article
                    className={"page-preview" + (isContentFitPreview ? " page-preview--content-fit" : "")}
                    aria-label="页面预览"
                    style={{
                      width: viewportSize.width,
                      height: viewportSize.height,
                      transform: `scale(${previewScale})`,
                    }}
                  >
                    {previewContent}
                  </article>
                </div>
              </div>
            </DeviceFrame>
          ) : (
            <div className="nw-preview-card">
              <div className="nw-preview-urlbar">
                <span className="nw-preview-urlbar-dot" />
                <span className="nw-preview-urlbar-dot" />
                <span className="nw-preview-urlbar-dot" />
                <div className="nw-preview-urlbar-input">localhost:5173</div>
              </div>
              <div className="page-preview-shell" style={previewShellStyle}>
                <article
                  className={"page-preview" + (isContentFitPreview ? " page-preview--content-fit" : "")}
                  aria-label="页面预览"
                  style={{
                    width: previewFrameBounds.width,
                    height: previewFrameBounds.height,
                    transform: `scale(${previewScale})`,
                  }}
                >
                  {previewContent}
                </article>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
