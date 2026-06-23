import { memo } from "react";
import { CheckCircle2, Clipboard, Download, X } from "lucide-react";
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

function ExportPreviewDialogImpl({ html, onClose, onCopy, onDownload, warnings = [] }: ExportPreviewDialogProps) {
  const hasInternalMarkers = internalMarkers.some((marker) => html.includes(marker));
  const hasBlockingWarnings = warnings.some((warning) =>
    ["internal-attribute", "internal-element", "empty-html"].includes(warning.type)
  );

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
        <div className="export-dialog-header">
          <div>
            <h2 id="export-preview-title">导出前预览</h2>
            <p>这是即将下载的干净 HTML，内部编辑标记会在这里被移除。</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭导出预览">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className={`export-check ${hasInternalMarkers ? "export-check-warning" : ""}`}>
          <CheckCircle2 size={17} strokeWidth={1.75} />
          {hasInternalMarkers || hasBlockingWarnings ? "仍检测到导出风险，请先检查 HTML" : "未检测到 HTML FineTune 内部标记"}
        </div>

        {warnings.length > 0 ? (
          <div className="export-warning-list" role="status" aria-live="polite">
            <strong>导出检查</strong>
            <ul>
              {warnings.map((warning, index) => (
                <li key={`${warning.type}-${index}`}>{warning.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <textarea className="export-preview-code" readOnly value={html} />

        <div className="export-dialog-actions">
          <button className="ghost-button" type="button" onClick={onCopy}>
            <Clipboard size={16} strokeWidth={1.75} />
            复制干净 HTML
          </button>
          <button className="primary-button" type="button" onClick={onDownload} disabled={hasInternalMarkers || hasBlockingWarnings}>
            <Download size={17} strokeWidth={1.75} />
            下载 edited-page.html
          </button>
        </div>
      </section>
    </div>
  );
}

export const ExportPreviewDialog = memo(ExportPreviewDialogImpl);
