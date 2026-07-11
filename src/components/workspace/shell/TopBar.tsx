import { type RefObject } from "react";
import { Tooltip } from "../../Tooltip";
import {
  IconUndo, IconRedo, IconImport, IconDownload,
  IconHistory, IconKeyboard, IconMenu,
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
  onToggleCheatsheet: () => void;
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
  zoomMode, onZoomChange,
  viewportPreset, onViewportPresetChange,
}: TopBarProps) {
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
      </div>

      <div className="app-topbar-center">
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
        <span className="topbar-separator" />

        <Tooltip content="缩小" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" type="button"
                  aria-label="缩小" data-dom-id="btn-zoom-out"
                  onClick={() => onZoomChange("88")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="100%" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm" type="button"
                  aria-label="100%" data-dom-id="btn-zoom-100"
                  onClick={() => onZoomChange("100")}>
            100%
          </button>
        </Tooltip>
        <Tooltip content="放大" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" type="button"
                  aria-label="放大" data-dom-id="btn-zoom-in"
                  onClick={() => onZoomChange("fit")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="适应" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon" type="button"
                  aria-label="适应" data-dom-id="btn-zoom-fit"
                  onClick={() => onZoomChange("fit")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </Tooltip>
        <span className="topbar-separator" />

        <Tooltip content="切换主题" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon theme-toggle-btn" type="button"
                  aria-label="切换主题" data-dom-id="btn-theme" onClick={onToggleTheme}>
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sun-icon">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="moon-icon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
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

        <Tooltip content="导出 HTML · Ctrl/⌘+S" placement="bottom">
          <button ref={exportTriggerRef}
                  className="ds-btn ds-btn--brand ds-btn--sm mobile-primary-action" type="button"
                  aria-label="导出 HTML" data-dom-id="btn-export" onClick={() => onExport("html")}>
            <IconDownload />
            <span>导出</span>
          </button>
        </Tooltip>
      </div>

      <div className="app-topbar-actions">
        <Tooltip content="导入 .html 文件" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm mobile-primary-action" type="button"
                  aria-label="导入" data-dom-id="btn-import" onClick={onImportClick}>
            <IconImport />
            <span>导入</span>
          </button>
        </Tooltip>
        <Tooltip content="复制干净 HTML · Shift+Ctrl/⌘+C" placement="bottom">
          <button className="ds-btn ds-btn--ghost ds-btn--sm topbar-copy" type="button"
                  aria-label="复制 HTML" data-dom-id="btn-copy" onClick={onCopy}>
            <IconDownload />
            <span>复制</span>
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
