import type { RefObject } from "react";
import { ViewportToolbar } from "./ViewportToolbar";
import { DeviceFrame } from "./DeviceFrame";

interface ViewportSize {
  width: number;
  height: number;
}

type ViewportPreset = "desktop" | "tablet" | "mobile";
type ZoomMode = "fit" | "88" | "100";

interface CanvasPanelProps {
  srcDoc: string;
  viewportSize: ViewportSize;
  zoomMode: ZoomMode;
  isFocusMode: boolean;
  viewportPreset: ViewportPreset;
  aiStatus: "idle" | "running";
  onViewportChange: (size: ViewportSize) => void;
  onZoomChange: (mode: ZoomMode) => void;
  onFocusToggle: () => void;
  onViewportPresetChange: (preset: ViewportPreset) => void;
  onIframeLoad: () => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
}

export function CanvasPanel({
  srcDoc,
  viewportSize,
  zoomMode,
  isFocusMode,
  viewportPreset,
  aiStatus,
  onViewportChange,
  onZoomChange,
  onFocusToggle,
  onIframeLoad,
  iframeRef,
  stageRef,
}: CanvasPanelProps) {
  return (
    <section className="nw-canvas panel stage-panel" aria-label="画布">
      <ViewportToolbar
        viewportSize={viewportSize}
        zoomMode={zoomMode}
        isFocusMode={isFocusMode}
        onViewportChange={onViewportChange}
        onZoomChange={onZoomChange}
        onFocusToggle={onFocusToggle}
      />
      <div className="stage" ref={stageRef}>
        <DeviceFrame
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
          preset={viewportPreset}
        >
          <div className="nw-preview-card" style={{ width: `${viewportSize.width}px`, height: `${viewportSize.height}px` }}>
            <div className="nw-preview-card__url-bar">
              <span className="nw-preview-card__url-dot" />
              <span className="nw-preview-card__url-dot" />
              <span className="nw-preview-card__url-dot" />
              <span className="nw-preview-card__url-field">localhost</span>
            </div>
            <iframe
              ref={iframeRef}
              className="live-preview-frame"
              title="实时预览"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              onLoad={onIframeLoad}
            />
          </div>
        </DeviceFrame>
        {aiStatus === "running" && (
          <div className="canvas-scan-overlay">
            <div className="canvas-scan-overlay__spinner" />
          </div>
        )}
      </div>
    </section>
  );
}
