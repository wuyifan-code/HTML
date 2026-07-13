import type { RefObject, CSSProperties } from "react";
import { DeviceFrame } from "./DeviceFrame";
import { ViewportToolbar } from "./ViewportToolbar";

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
  previewError?: string | null;

  // 兼容老单测参数
  viewportPreset?: string | null;
  onViewportChange?: (size: { width: number; height: number }) => void;
  onZoomChange?: (zoom: ZoomMode) => void;
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
  onZoomModeChange,
  onFocusToggle = () => {},
  iframeRef,
  stageRef,
  onIframeLoad,
  previewShellStyle = {},
  previewFrameBounds = { x: 0, y: 0, width: 1440, height: 900 },
  previewScale = 1,
  isContentFitPreview = false,
  previewIframeStyle = {},
  previewError = null,
  viewportPreset,
  onViewportChange,
  onZoomChange,
}: CanvasPanelProps) {
  const preset = resolvePreset(matchingViewportPreset, viewportPreset);
  const useDeviceFrame = preset === "mobile" || preset === "tablet";
  const deviceOuterWidth = viewportSize.width + 24;
  const deviceOuterHeight = viewportSize.height + 24;
  const handleViewportChange = (size: { width: number; height: number }) => {
    if (size.width === 1440 && size.height === 900) {
      onViewportPresetChange("desktop");
      return;
    }
    if (size.width === 768 && size.height === 1024) {
      onViewportPresetChange("tablet");
      return;
    }
    if (size.width === 375 && size.height === 667) {
      onViewportPresetChange("mobile");
      return;
    }
    onViewportChange?.(size);
  };

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
      <ViewportToolbar
        viewportSize={viewportSize}
        zoomMode={zoomMode}
        isFocusMode={isFocusMode}
        onViewportChange={handleViewportChange}
        onZoomChange={onZoomModeChange ?? onZoomChange ?? (() => {})}
        onFocusToggle={onFocusToggle}
      />
      <div className="stage" ref={stageRef}>
        {previewError ? (
          <div className="preview-build-error" role="alert">
            <strong>预览暂时无法解析</strong>
            <span>{previewError}</span>
            <small>请检查源码标签是否闭合，修正后画布会自动恢复。</small>
          </div>
        ) : null}
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
