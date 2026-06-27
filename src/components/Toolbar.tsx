import {
  Clipboard,
  Download,
  FileText,
  FileUp,
  History,
  LoaderCircle,
  MessageSquare,
  Presentation,
  Redo2,
  Undo2,
  X,
} from "lucide-react";
import { Tooltip } from "./Tooltip";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasModal: boolean;
  isModalOpen: boolean;
  exportingFormat: "pdf" | "pptx" | null;
  onUndo: () => void;
  onRedo: () => void;
  onToggleHistory: () => void;
  onModalToggle: () => void;
  onImport: (file: File) => void;
  onCopy: () => void;
  onExport: () => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  hasModal,
  isModalOpen,
  exportingFormat,
  onUndo,
  onRedo,
  onToggleHistory,
  onModalToggle,
  onImport,
  onCopy,
  onExport,
  onExportPdf,
  onExportPptx,
}: ToolbarProps) {
  const isExportingPdf = exportingFormat === "pdf";
  const isExportingPptx = exportingFormat === "pptx";

  return (
    <div className="toolbar" aria-label="编辑器工具栏">
      {/* 左侧：撤销 / 重做 */}
      <div className="toolbar-group" aria-label="历史操作">
        <Tooltip content="撤销 · Ctrl/⌘+Z" placement="bottom">
          <button
            className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="撤销"
          >
            <Undo2 size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
        <Tooltip content="重做 · Ctrl/⌘+Y 或 Shift+Ctrl/⌘+Z" placement="bottom">
          <button
            className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="重做"
          >
            <Redo2 size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      {/* 中间：导入 / 复制 */}
      <div className="toolbar-group" aria-label="页面功能">
        <Tooltip content="导入 .html 文件" placement="bottom">
          <label className="ds-btn ds-btn--ghost ds-btn--sm">
            <FileUp size={14} strokeWidth={1.75} />
            <span className="button-label">导入</span>
            <input
              type="file"
              accept=".html,.htm,text/html"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.currentTarget.value = "";
              }}
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            />
          </label>
        </Tooltip>
        <Tooltip content="复制干净 HTML · Shift+Ctrl/⌘+C" placement="bottom">
          <button
            className="ds-btn ds-btn--ghost ds-btn--sm"
            type="button"
            onClick={onCopy}
            aria-label="复制 HTML"
          >
            <Clipboard size={14} strokeWidth={1.75} />
            <span className="button-label">复制</span>
          </button>
        </Tooltip>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      {/* 主操作：导出（brand 按钮） + 格式 */}
      <div className="toolbar-group" aria-label="导出格式">
        <Tooltip content="导出 HTML · Ctrl/⌘+S" placement="bottom">
          <button
            className="ds-btn ds-btn--brand ds-btn--sm export-toolbar-button"
            type="button"
            onClick={onExport}
            aria-label="导出 HTML"
          >
            <Download size={14} strokeWidth={1.75} />
            <span className="button-label">导出</span>
          </button>
        </Tooltip>
        <Tooltip content="AI 预检后导出 PDF" placement="bottom">
          <button
            className="ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon export-format-button"
            type="button"
            onClick={onExportPdf}
            disabled={exportingFormat !== null}
            aria-label="导出 PDF"
          >
            {isExportingPdf ? (
              <LoaderCircle className="spin-icon" size={14} strokeWidth={1.75} />
            ) : (
              <FileText size={14} strokeWidth={1.75} />
            )}
          </button>
        </Tooltip>
        <Tooltip content="AI 预检后导出 PPTX" placement="bottom">
          <button
            className="ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon export-format-button"
            type="button"
            onClick={onExportPptx}
            disabled={exportingFormat !== null}
            aria-label="导出 PPTX"
          >
            {isExportingPptx ? (
              <LoaderCircle className="spin-icon" size={14} strokeWidth={1.75} />
            ) : (
              <Presentation size={14} strokeWidth={1.75} />
            )}
          </button>
        </Tooltip>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      {/* 右侧：弹窗 toggle + 历史 */}
      <div className="toolbar-group toolbar-group-tail" aria-label="弹窗与历史">
        <Tooltip content={isModalOpen ? "关闭预览中的弹窗" : "打开预览中的弹窗"} placement="bottom">
          <button
            className={
              "ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon toolbar-modal-button" +
              (hasModal && isModalOpen ? " toolbar-modal-button-active" : "")
            }
            type="button"
            onClick={onModalToggle}
            disabled={!hasModal}
            aria-pressed={hasModal && isModalOpen}
            aria-label={isModalOpen ? "关闭弹窗" : "打开弹窗"}
          >
            {isModalOpen ? <X size={14} strokeWidth={1.75} /> : <MessageSquare size={14} strokeWidth={1.75} />}
          </button>
        </Tooltip>
        <Tooltip content="查看编辑历史" placement="bottom">
          <button
            className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon toolbar-history-tail"
            type="button"
            onClick={onToggleHistory}
            aria-label="历史"
          >
            <History size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
