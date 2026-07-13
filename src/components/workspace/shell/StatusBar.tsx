type StatusTone = "ready" | "busy" | "warning" | "error";

export interface StatusBarProps {
  htmlLength: number;
  selectedLabel: string;
  statusMessage: string;
  statusTone: StatusTone;
  viewportWidth: number;
  viewportHeight: number;
  viewportPreset?: string | null;
  hasSelection?: boolean;
  autoSaveStatus?: "idle" | "saving" | "saved" | "unavailable";
  diagnosticsErrors?: number;
  diagnosticsWarnings?: number;
  diagnosticsInfos?: number;
}

export function StatusBar({
  htmlLength,
  selectedLabel,
  statusMessage,
  statusTone,
  viewportWidth,
  viewportHeight,
  viewportPreset = null,
  hasSelection = true,
  autoSaveStatus = "idle",
  diagnosticsErrors = 0,
  diagnosticsWarnings = 0,
  diagnosticsInfos = 0,
}: StatusBarProps) {
  const totalDiagnostics = diagnosticsErrors + diagnosticsWarnings + diagnosticsInfos;
  return (
    <footer className="statusbar" data-dom-id="status-bar">
      <div className="statusbar-zone statusbar-zone--left">
        {hasSelection ? (
          <>
            <span className="statusbar-pill">
              <span className="dot" aria-hidden="true" />
              <span>{selectedLabel}</span>
            </span>
            <span className="statusbar-sep" aria-hidden="true" />
          </>
        ) : null}
        <span className="statusbar-metric">{htmlLength.toLocaleString()} 个字符</span>
        {totalDiagnostics > 0 && (
          <>
            <span className="statusbar-sep" aria-hidden="true" />
            <span className="statusbar-metric" title={`${diagnosticsErrors} 错误, ${diagnosticsWarnings} 警告, ${diagnosticsInfos} 提示`}>
              {diagnosticsErrors > 0 && `${diagnosticsErrors} 错误`}
              {diagnosticsErrors > 0 && diagnosticsWarnings > 0 && ", "}
              {diagnosticsWarnings > 0 && `${diagnosticsWarnings} 警告`}
              {diagnosticsInfos > 0 && `, ${diagnosticsInfos} 提示`}
            </span>
          </>
        )}
      </div>

      <div className="statusbar-zone statusbar-zone--center">
        <span className={`statusbar-pill statusbar-pill--live statusbar-pill--${statusTone}`}
              role="status" aria-live="polite" aria-atomic="true" title={statusMessage}>
          <span className="dot" aria-hidden="true" />
          <span key={statusMessage} className="statusbar-live-text">{statusMessage}</span>
        </span>
      </div>

      <div className="statusbar-zone statusbar-zone--right">
        {autoSaveStatus !== "idle" ? (
          <span className={`statusbar-save-pill statusbar-save-pill--${autoSaveStatus}`} role="status" aria-live="polite">
            <span className="statusbar-save-dot" aria-hidden="true" />
            {autoSaveStatus === "saving" ? "保存中" : autoSaveStatus === "saved" ? "已保存" : "请导出备份"}
          </span>
        ) : null}
        {viewportPreset ? <span className="statusbar-device-pill">{viewportPreset === "mobile" ? "手机" : viewportPreset === "tablet" ? "平板" : "桌面"}</span> : null}
        <span className="statusbar-metric">UTF-8</span>
        <span className="statusbar-sep" aria-hidden="true" />
        <span className="statusbar-metric">HTML</span>
        <span className="statusbar-sep" aria-hidden="true" />
        <span className="statusbar-metric">{viewportWidth} × {viewportHeight}</span>
      </div>
    </footer>
  );
}
