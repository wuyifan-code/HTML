import type { ReactNode } from "react";

type ViewportPreset = "desktop" | "tablet" | "mobile";

interface DeviceFrameProps {
  viewportWidth: number;
  viewportHeight: number;
  preset: ViewportPreset;
  children: ReactNode;
}

export function DeviceFrame({ viewportWidth, viewportHeight, preset, children }: DeviceFrameProps) {
  if (preset === "desktop") {
    return <>{children}</>;
  }

  const isMobile = preset === "mobile";
  const borderRadius = isMobile ? 36 : 24;

  return (
    <div
      className="device-frame device-handset"
      style={{
        width: `${viewportWidth}px`,
        height: `${viewportHeight}px`,
        borderRadius: `${borderRadius}px`,
      }}
    >
      <div className="device-status-bar">
        <span className="device-status-bar__time">9:41</span>
        <div className="device-status-bar__icons">
          <svg className="device-status-bar__icon" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="10" rx="2" />
            <rect x="4" y="9" width="16" height="6" rx="1" />
          </svg>
          <svg className="device-status-bar__icon" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          </svg>
        </div>
      </div>
      {children}
      {isMobile && <div className="device-notch" />}
      <div className={`device-home${preset === "mobile" ? "" : " device-home--light"}`} />
    </div>
  );
}
