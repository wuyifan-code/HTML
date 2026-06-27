import { memo } from "react";
import { CheckCircle2, Clipboard, Download, FileCode, ShieldCheck, Sparkles, X } from "lucide-react";
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
  const hasInternalMarkers = internalMarkers.some((marker) => html.includes(marker));
  const hasBlockingWarnings = warnings.some((warning) =>
    ["internal-attribute", "internal-element", "empty-html"].includes(warning.type)
  );
  const blockingIssue = hasInternalMarkers || hasBlockingWarnings;
  const nodeCount = countNodes(html);
  const sizeLabel = formatBytes(html);
  const lineCount = html.split("\n").length;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
        {/* Header */}
        <header className="export-dialog-header">
          <div className="export-dialog-header__title">
            <div className="export-dialog-header__icon" aria-hidden="true">
              <FileCode size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2 id="export-preview-title">导出前预览</h2>
              <p>这是即将下载的干净 HTML，内部编辑标记会在这里被移除。</p>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭导出预览">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        {/* Status row */}
        <div className="export-dialog-stats">
          <div className={`export-status-pill${blockingIssue ? " is-warning" : " is-ok"}`}>
            {blockingIssue ? (
              <>
                <ShieldCheck size={14} strokeWidth={1.85} />
                <span>检测到导出风险，请先检查</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} strokeWidth={1.85} />
                <span>未检测到 HTML FineTune 内部标记</span>
              </>
            )}
          </div>
          <div className="export-stat-group">
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
          <div className="export-warning-list" role="status" aria-live="polite">
            <strong>导出检查 · {warnings.length} 项</strong>
            <ul>
              {warnings.map((warning, index) => (
                <li key={`${warning.type}-${index}`}>{warning.message}</li>
              ))}
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
          </div>
          <textarea className="export-preview-code" readOnly value={html} />
        </div>

        {/* Actions */}
        <footer className="export-dialog-actions">
          <button className="ghost-button export-action" type="button" onClick={onCopy}>
            <Clipboard size={16} strokeWidth={1.75} />
            复制干净 HTML
          </button>
          <button
            className="primary-button export-action"
            type="button"
            onClick={onDownload}
            disabled={blockingIssue}
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