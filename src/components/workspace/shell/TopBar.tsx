import { type MouseEvent, type RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Tooltip } from "../../Tooltip";
import {
  IconUndo, IconRedo, IconImport, IconCopy, IconDownload,
  IconHistory, IconKeyboard, IconMenu,
  IconSun, IconMoon,
} from "../../Icons";

type ThemeMode = "dark" | "light";

export type ExportFormat = "html" | "pdf" | "pptx";

export interface TopBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onExport: (format: ExportFormat) => void;
  onImportClick: () => void;
  onCopy: () => void;
  onToggleCheatsheet: (event?: MouseEvent<HTMLElement>) => void;
  exportingFormat: "pdf" | "pptx" | null;
  isMobileShell: boolean;
  isMobileActionsOpen: boolean;
  onToggleMobileActions: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  historyTriggerRef: RefObject<HTMLButtonElement | null>;
  exportTriggerRef: RefObject<HTMLButtonElement | null>;
  mobileActionsRef: RefObject<HTMLDivElement | null>;
  onFileSelected: (file: File | undefined) => void;
  zoomMode: "fit" | "88" | "100";
  onZoomChange: (mode: "fit" | "88" | "100") => void;
  viewportPreset: string;
  onViewportPresetChange: (preset: string) => void;
  documentName?: string;
}

export function TopBar({
  canUndo, canRedo, onUndo, onRedo,
  theme, onToggleTheme,
  isHistoryOpen, onToggleHistory,
  onExport,
  onImportClick, onCopy,
  onToggleCheatsheet,
  exportingFormat,
  isMobileShell, isMobileActionsOpen, onToggleMobileActions,
  fileInputRef, historyTriggerRef, exportTriggerRef, mobileActionsRef,
  onFileSelected,
  documentName = "Untitled",
}: TopBarProps) {
  const isExporting = exportingFormat !== null;
  return (
    <header className="app-topbar" role="banner">
      <div className="app-topbar-brand">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="16" height="14" rx="3" stroke="var(--n-fg-secondary)" strokeWidth="1.5"/>
          <line x1="6" y1="7" x2="14" y2="7" stroke="var(--n-fg-secondary)" strokeWidth="1.2"/>
          <line x1="6" y1="10" x2="11" y2="10" stroke="var(--n-fg-secondary)" strokeWidth="1.2"/>
          <line x1="6" y1="13" x2="13" y2="13" stroke="var(--n-fg-secondary)" strokeWidth="1.2"/>
        </svg>
        <span className="app-topbar-title">HTML FineTune</span>
        <span className="app-topbar-path" aria-label="当前文档">
          <span className="app-topbar-path__separator" aria-hidden="true">/</span>
          <span>{documentName}</span>
        </span>
      </div>

      <div className="app-topbar-center" aria-hidden="true" />

      <div className="app-topbar-actions">
        <div className="topbar-history-actions" role="group" aria-label="编辑历史操作">
          <Tooltip content="撤销 · Ctrl/⌘+Z" placement="bottom">
            <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" type="button"
                    aria-label="撤销" data-dom-id="btn-undo" onClick={onUndo} disabled={!canUndo}>
              <IconUndo />
            </button>
          </Tooltip>
          <Tooltip content="重做 · Ctrl/⌘+Y 或 Shift+Ctrl/⌘+Z" placement="bottom">
            <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" type="button"
                    aria-label="重做" data-dom-id="btn-redo" onClick={onRedo} disabled={!canRedo}>
              <IconRedo />
            </button>
          </Tooltip>
          <Tooltip content="查看历史" placement="bottom">
            <button ref={historyTriggerRef}
                    className={`ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon topbar-history${isHistoryOpen ? " is-on" : ""}`}
                    type="button" aria-label="查看历史" aria-haspopup="dialog" aria-expanded={isHistoryOpen}
                    aria-controls="history-drawer" data-dom-id="btn-history" onClick={onToggleHistory}>
              <IconHistory />
            </button>
          </Tooltip>
        </div>
        <span className="topbar-separator" aria-hidden="true" />
        <div className="topbar-file-actions" role="group" aria-label="文件操作">
          <Tooltip content="导入 .html 文件" placement="bottom">
            <button className="ds-btn ds-btn--ghost ds-btn--sm mobile-primary-action topbar-file-action" type="button"
                    aria-label="导入" data-dom-id="btn-import" onClick={onImportClick}>
              <IconImport />
              <span>导入</span>
            </button>
          </Tooltip>
          <Tooltip content="复制干净 HTML · Shift+Ctrl/⌘+C" placement="bottom">
            <button className="ds-btn ds-btn--ghost ds-btn--sm topbar-copy topbar-file-action" type="button"
                    aria-label="复制 HTML" data-dom-id="btn-copy" onClick={onCopy}>
              <IconCopy />
              <span>复制</span>
            </button>
          </Tooltip>
          <Tooltip content="导出 HTML · Ctrl/⌘+S" placement="bottom">
            <button ref={exportTriggerRef}
                    className="ds-btn ds-btn--brand ds-btn--sm mobile-primary-action topbar-file-action topbar-export-action" type="button"
                    data-exporting={isExporting ? "true" : "false"}
                    aria-label={isExporting ? "正在导出" : "导出 HTML"} data-dom-id="btn-export" onClick={() => onExport("html")} disabled={isExporting}>
              {isExporting ? <Loader2 className="spin-icon" size={14} aria-hidden="true" /> : <IconDownload />}
              <span>{isExporting ? "导出中" : "导出"}</span>
            </button>
          </Tooltip>
        </div>
        <Tooltip content="切换主题" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon theme-toggle-btn" type="button"
                  aria-label="切换主题" data-dom-id="btn-theme" onClick={onToggleTheme}>
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
        </Tooltip>
        <Tooltip content="快捷键 (?)" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon topbar-cheatsheet" type="button"
                  aria-label="快捷键" data-dom-id="btn-cheatsheet" onClick={onToggleCheatsheet}>
            <IconKeyboard />
          </button>
        </Tooltip>

        <div className="mobile-actions-wrap" ref={mobileActionsRef}>
          <Tooltip content="更多操作" placement="bottom">
            <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon mobile-actions-trigger"
                    type="button" aria-label="更多操作" aria-haspopup="menu"
                    aria-expanded={isMobileActionsOpen}
                    data-dom-id="btn-more-actions" onClick={onToggleMobileActions}>
              <IconMenu />
            </button>
          </Tooltip>
          {isMobileActionsOpen && (
            <div className="mobile-actions-popover" id="mobile-actions-menu" role="menu" aria-label="更多操作">
              <button type="button" role="menuitem" onClick={onCopy}>复制 HTML</button>
              <button type="button" role="menuitem" onClick={() => onExport("html")}>导出文件</button>
              <button type="button" role="menuitem" onClick={onToggleHistory}>历史记录</button>
              <button type="button" role="menuitem" onClick={onToggleCheatsheet}>快捷键</button>
              <button type="button" role="menuitem" onClick={onToggleTheme}>切换主题</button>
            </div>
          )}
        </div>

        <input ref={fileInputRef} hidden type="file" tabIndex={-1} accept=".html,.htm,text/html"
               onChange={(e) => { onFileSelected(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} />
      </div>
    </header>
  );
}
