import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, Download, FileCode, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ExportWarning } from "../utils/exportValidation";

export type ExportFormat = "html" | "pdf" | "pptx";

export interface ExportDialogProps {
  html: string;
  onClose: () => void;
  onCopyHtml: () => void;
  onDownloadHtml: () => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
  warnings?: ExportWarning[];
  initialFormat?: ExportFormat;
  isExportingPdf?: boolean;
  isExportingPptx?: boolean;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  html: "HTML",
  pdf: "PDF",
  pptx: "PPTX",
};

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

function ExportDialogImpl({
  html,
  onClose,
  onCopyHtml,
  onDownloadHtml,
  onExportPdf,
  onExportPptx,
  warnings = [],
  initialFormat = "html",
  isExportingPdf = false,
  isExportingPptx = false,
}: ExportDialogProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>(initialFormat);
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

  const isExporting = isExportingPdf || isExportingPptx;
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

  const handleFormatChange = useCallback((format: ExportFormat) => {
    setActiveFormat(format);
  }, []);

  const describedBy = [
    "export-dialog-description",
    "export-dialog-quality",
    warnings.length > 0 ? "export-dialog-warnings" : "",
    "export-dialog-action-hint",
  ].filter(Boolean).join(" ");

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={handleBackdropMouseDown}>
      <section
        ref={dialogRef}
        className="export-dialog"
        data-state={dialogState}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <header className="export-dialog-header">
          <div className="export-dialog-header__title">
            <div className="export-dialog-header__icon" aria-hidden="true">
              <FileCode size={18} strokeWidth={1.75} />
            </div>
            <div>
              <span className="export-dialog-header__eyebrow">Export</span>
              <h2 id="export-dialog-title">导出文件</h2>
              <p id="export-dialog-description">选择格式并导出当前文档。</p>
            </div>
          </div>
          <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="关闭导出">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <div className="export-format-tabs" role="tablist" aria-label="导出格式">
          {(["html", "pdf", "pptx"] as const).map((format) => (
            <button
              key={format}
              type="button"
              role="tab"
              className={`export-format-tab${activeFormat === format ? " is-active" : ""}`}
              aria-selected={activeFormat === format}
              data-dom-id={`tab-format-${format}`}
              onClick={() => handleFormatChange(format)}
            >
              {FORMAT_LABELS[format]}
            </button>
          ))}
        </div>

        <div className="export-dialog-stats" id="export-dialog-quality">
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

        {warnings.length > 0 ? (
          <div
            id="export-dialog-warnings"
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

        <div role="tabpanel" aria-labelledby={`tab-format-${activeFormat}`}>
          {activeFormat === "html" && (
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
          )}
          {activeFormat === "pdf" && (
            <div className="export-format-prompt">
              <p>导出当前文档为 PDF 文件。</p>
            </div>
          )}
          {activeFormat === "pptx" && (
            <div className="export-format-prompt">
              <p>导出当前文档为 PPTX 演示文稿。</p>
            </div>
          )}
        </div>

        <footer className="export-dialog-actions">
          <p id="export-dialog-action-hint" className="export-dialog-actions__hint">
            {blockingIssue ? "下载按钮已暂停，需先处理阻塞风险。" : "选择格式后点击对应按钮开始导出。"}
          </p>

          {activeFormat === "html" && (
            <>
              <button className="ghost-button export-action" type="button" onClick={onCopyHtml}>
                <Clipboard size={16} strokeWidth={1.75} />
                复制干净 HTML
              </button>
              <button
                className="primary-button export-action"
                type="button"
                onClick={onDownloadHtml}
                disabled={blockingIssue}
                aria-describedby="export-dialog-action-hint"
              >
                <Download size={17} strokeWidth={1.75} />
                下载 edited-page.html
              </button>
            </>
          )}

          {activeFormat === "pdf" && (
            <button
              className="primary-button export-action"
              type="button"
              onClick={onExportPdf}
              disabled={blockingIssue || isExporting}
              aria-describedby="export-dialog-action-hint"
            >
              {isExportingPdf ? <Loader2 size={17} strokeWidth={1.75} className="spin-icon" /> : <Download size={17} strokeWidth={1.75} />}
              {isExportingPdf ? "导出 PDF 中…" : "导出 PDF"}
            </button>
          )}

          {activeFormat === "pptx" && (
            <button
              className="primary-button export-action"
              type="button"
              onClick={onExportPptx}
              disabled={blockingIssue || isExporting}
              aria-describedby="export-dialog-action-hint"
            >
              {isExportingPptx ? <Loader2 size={17} strokeWidth={1.75} className="spin-icon" /> : <Download size={17} strokeWidth={1.75} />}
              {isExportingPptx ? "导出 PPTX 中…" : "导出 PPTX"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export const ExportDialog = memo(ExportDialogImpl);
