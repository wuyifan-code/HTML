import type { ReactNode } from "react";
import {
  IconMonitor,
  IconTablet,
  IconSmartphone,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
} from "../../Icons";

interface ViewportSize {
  width: number;
  height: number;
}

type ViewportPreset = "desktop" | "tablet" | "mobile";
type ZoomMode = "fit" | "88" | "100";

interface ViewportToolbarProps {
  viewportSize: ViewportSize;
  zoomMode: ZoomMode;
  isFocusMode: boolean;
  onViewportChange: (size: ViewportSize) => void;
  onZoomChange: (mode: ZoomMode) => void;
  onFocusToggle: () => void;
}

const PRESETS: { key: ViewportPreset; label: string; width: number; height: number }[] = [
  { key: "desktop", label: "桌面", width: 1440, height: 900 },
  { key: "tablet", label: "平板", width: 768, height: 1024 },
  { key: "mobile", label: "手机", width: 375, height: 667 },
];

const PRESET_ICONS: Record<ViewportPreset, () => ReactNode> = {
  desktop: IconMonitor,
  tablet: IconTablet,
  mobile: IconSmartphone,
};

const PRESET_DOM_IDS: Record<ViewportPreset, string> = {
  desktop: "vp-desktop",
  tablet: "vp-tablet",
  mobile: "vp-mobile",
};

const ZOOM_LABELS: Record<ZoomMode, string> = {
  fit: "适配",
  "88": "88%",
  "100": "100%",
};

function isPresetMatch(preset: typeof PRESETS[number], size: ViewportSize): boolean {
  return preset.width === size.width && preset.height === size.height;
}

function findMatchingPreset(size: ViewportSize): ViewportPreset | null {
  for (const preset of PRESETS) {
    if (isPresetMatch(preset, size)) return preset.key;
  }
  return null;
}

export function ViewportToolbar({
  viewportSize,
  zoomMode,
  isFocusMode,
  onViewportChange,
  onZoomChange,
  onFocusToggle,
}: ViewportToolbarProps) {
  const activePreset = findMatchingPreset(viewportSize);

  function handlePresetClick(preset: typeof PRESETS[number]) {
    onViewportChange({ width: preset.width, height: preset.height });
  }

  function handleWidthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const w = Number(e.target.value);
    if (Number.isFinite(w) && w > 0) {
      onViewportChange({ width: w, height: viewportSize.height });
    }
  }

  function handleHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value);
    if (Number.isFinite(h) && h > 0) {
      onViewportChange({ width: viewportSize.width, height: h });
    }
  }

  function cycleZoomForward() {
    const order: ZoomMode[] = ["88", "100", "fit"];
    const idx = order.indexOf(zoomMode);
    onZoomChange(order[(idx + 1) % order.length]);
  }

  function handleZoomOut() {
    const order: ZoomMode[] = ["88", "100", "fit"];
    const idx = order.indexOf(zoomMode);
    onZoomChange(order[((idx - 1 + order.length) % order.length)]);
  }

  function handleZoomIn() {
    cycleZoomForward();
  }

  function handleFit() {
    onZoomChange("fit");
  }

  return (
    <div className="viewport-bar">
      <div className="segmented-viewport-control" role="group" aria-label="视口预设">
        {PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.key];
          const isActive = activePreset === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              className="segmented-button"
              data-dom-id={PRESET_DOM_IDS[preset.key]}
              aria-pressed={isActive}
              onClick={() => handlePresetClick(preset)}
            >
              <Icon />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      <div className="viewport-bar__dim">
        <input
          type="number"
          value={viewportSize.width}
          onChange={handleWidthChange}
          aria-label="视口宽度"
          min={120}
          max={3840}
        />
        <span className="viewport-bar__dim-sep" aria-hidden="true">×</span>
        <input
          type="number"
          value={viewportSize.height}
          onChange={handleHeightChange}
          aria-label="视口高度"
          min={80}
          max={2160}
        />
      </div>

      <div className="viewport-bar__group">
        <button
          type="button"
          className="viewport-bar__btn"
          data-dom-id="btn-zoom-out"
          aria-label="缩小"
          onClick={handleZoomOut}
        >
          <IconZoomOut />
        </button>

        <span className="viewport-bar__zoom" aria-label="当前缩放">
          {ZOOM_LABELS[zoomMode]}
        </span>

        <button
          type="button"
          className="viewport-bar__btn"
          data-dom-id="btn-zoom-in"
          aria-label="放大"
          onClick={handleZoomIn}
        >
          <IconZoomIn />
        </button>

        <button
          type="button"
          className="viewport-bar__btn viewport-bar__btn--label"
          data-dom-id="btn-fit"
          aria-label="适配视口"
          onClick={handleFit}
        >
          <IconMaximize />
          <span>适配</span>
        </button>

        <button
          type="button"
          className="viewport-bar__btn viewport-bar__btn--label"
          aria-pressed={isFocusMode}
          aria-label={isFocusMode ? "退出专注模式" : "进入专注模式"}
          onClick={onFocusToggle}
        >
          <IconMaximize />
          <span>{isFocusMode ? "退出专注" : "专注模式"}</span>
        </button>
      </div>
    </div>
  );
}
