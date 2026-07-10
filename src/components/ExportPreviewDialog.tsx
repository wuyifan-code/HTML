import { memo, useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, Download, FileCode, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ExportWarning } from "../utils/exportValidation";

interface ExportPreviewDialogProps {
  html: string;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
  warnings?: ExportWarning[];
}

const internalMarkers = [
  "data-hft-id",
  "data-html-finetune",
  "html-finetune-bridge-style",
  "html-finetune-floating-toolbar",
];

const blockingWarningTypes = new Set<ExportWarning["type"]>([
  "internal-attribute",
  "internal-element",
  "empty-html",
]);

function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function countNodes(html: string): number {
  const match = html.match(/<\w+[^>]*>/g);
  return match ? match.length : 0;
}

function ExportPreviewDialogImpl({ html, onClose, onCopy, onDownload, warnings = [] }: ExportPreviewDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasInternalMarkers = internalMarkers.some((marker) => html.includes(marker));
  const hasBlockingWarnings = warnings.some((warning) =>
    blockingWarningTypes.has(warning.type)
  );
  const blockingIssue = hasInternalMarkers || hasBlockingWarnings;
  const blockingWarningCount = warnings.filter((warning) => blockingWarningTypes.has(warning.type)).length;
  const advisoryWarningCount = warnings.length - blockingWarningCount;
  const nodeCount = countNodes(html);
  const sizeLabel = formatBytes(html);
  const lineCount = html.split("\n").length;
  const dialogState = blockingIssue ? "blocked" : warnings.length > 0 ? "warning" : "ready";
  const statusLabel = blockingIssue
    ? "导出已暂停，需先处理风险"
    : warnings.length > 0
      ? "可导出，但建议复核提示"
      : "可安全导出";
  const statusDetail = blockingIssue
    ? `${blockingWarningCount || 1} 项阻塞风险`
    : warnings.length > 0
      ? `${advisoryWarningCount} 项非阻塞提示`
      : "未检测到内部标记";
  const describedBy = [
    "export-preview-description",
    "export-preview-quality",
    warnings.length > 0 ? "export-preview-warnings" : "",
    "export-preview-action-hint",
  ].filter(Boolean).join(" ");
  const getFocusableElements = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return [];
    return Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
      )
    ).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
  }, []);

  useEffect(() => {
    const backgroundSelectors = [
      ".app-topbar",
      ".topbar",
      ".workspace",
      ".app-statusbar",
      ".statusbar",
      ".history-drawer",
      ".toast",
    ];
    const backgroundElements = backgroundSelectors.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector))
    );
    const previousState = backgroundElements.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    backgroundElements.forEach((element) => {
      if (dialogRef.current?.contains(element)) return;
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      previousState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, []);

  const handleDialogKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [getFocusableElements, onClose]
  );

  const handleBackdropMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={handleBackdropMouseDown}>
      <section
        ref={dialogRef}
        className="export-dialog"
        data-state={dialogState}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-preview-title"
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        {/* Header */}
        <header className="export-dialog-header">
          <div className="export-dialog-header__title">
            <div className="export-dialog-header__icon" aria-hidden="true">
              <FileCode size={18} strokeWidth={1.75} />
            </div>
            <div>
              <span className="export-dialog-header__eyebrow">Export Review</span>
              <h2 id="export-preview-title">导出前预览</h2>
              <p id="export-preview-description">这是即将下载的干净 HTML，内部编辑标记会在这里被移除。</p>
            </div>
          </div>
          <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="关闭导出预览">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        {/* Status row */}
        <div className="export-dialog-stats" id="export-preview-quality">
          <div
            className={`export-status-pill is-${dialogState}${blockingIssue || warnings.length > 0 ? " is-warning" : " is-ok"}`}
            role="status"
            aria-live="polite"
          >
            {blockingIssue ? (
              <>
                <AlertTriangle size={14} strokeWidth={1.85} />
                <span>{statusLabel}</span>
              </>
            ) : warnings.length > 0 ? (
              <>
                <ShieldCheck size={14} strokeWidth={1.85} />
                <span>{statusLabel}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} strokeWidth={1.85} />
                <span>{statusLabel}</span>
              </>
            )}
            <small>{statusDetail}</small>
          </div>
          <div className="export-stat-group" aria-label="导出摘要">
            <div className="export-stat">
              <span className="export-stat__num">{nodeCount}</span>
              <span className="export-stat__label">节点</span>
            </div>
            <div className="export-stat">
              <span className="export-stat__num">{lineCount}</span>
              <span className="export-stat__label">行</span>
            </div>
            <div className="export-stat">
              <span className="export-stat__num">{sizeLabel}</span>
              <span className="export-stat__label">大小</span>
            </div>
          </div>
        </div>

        {/* Warnings list */}
        {warnings.length > 0 ? (
          <div
            id="export-preview-warnings"
            className="export-warning-list"
            role={blockingIssue ? "alert" : "status"}
            aria-live="polite"
          >
            <strong>
              导出检查 · {warnings.length} 项
              {blockingWarningCount > 0 ? <span>{blockingWarningCount} 项需处理</span> : <span>仅提示</span>}
            </strong>
            <ul>
              {warnings.map((warning, index) => {
                const isBlocking = blockingWarningTypes.has(warning.type);
                return (
                  <li key={`${warning.type}-${index}`} data-severity={isBlocking ? "blocking" : "advisory"}>
                    <span className="export-warning-list__icon" aria-hidden="true">
                      {isBlocking ? <AlertTriangle size={13} strokeWidth={1.9} /> : <Sparkles size={13} strokeWidth={1.9} />}
                    </span>
                    <span>{warning.message}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {/* Code preview */}
        <div className="export-dialog-code">
          <div className="export-dialog-code__chrome" aria-hidden="true">
            <span className="export-dialog-code__dot" />
            <span className="export-dialog-code__dot" />
            <span className="export-dialog-code__dot" />
            <span className="export-dialog-code__file">edited-page.html</span>
            <span className="export-dialog-code__meta">{lineCount} lines · {sizeLabel}</span>
          </div>
          <textarea
            className="export-preview-code"
            aria-label="导出的 HTML 代码预览"
            readOnly
            spellCheck={false}
            value={html}
          />
        </div>

        {/* Actions */}
        <footer className="export-dialog-actions">
          <p id="export-preview-action-hint" className="export-dialog-actions__hint">
            {blockingIssue ? "下载按钮已暂停，复制前也建议先处理阻塞风险。" : "复制或下载都会使用当前清理后的 HTML。"}
          </p>
          <button className="ghost-button export-action" type="button" onClick={onCopy}>
            <Clipboard size={16} strokeWidth={1.75} />
            复制干净 HTML
          </button>
          <button
            className="primary-button export-action"
            type="button"
            onClick={onDownload}
            disabled={blockingIssue}
            aria-describedby="export-preview-action-hint"
          >
            <Download size={17} strokeWidth={1.75} />
            下载 edited-page.html
          </button>
        </footer>
      </section>
    </div>
  );
}

export const ExportPreviewDialog = memo(ExportPreviewDialogImpl);
