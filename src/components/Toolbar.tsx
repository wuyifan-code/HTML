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

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasModal: boolean;
  isModalOpen: boolean;
  exportingFormat: "pdf" | "pptx" | null;
  onUndo: () => void;
  onRedo: () => void;
  onToggleHistory: () => void;
  onOpenModal: () => void;
  onCloseModal: () => void;
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
  onOpenModal,
  onCloseModal,
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
      <div className="toolbar-group" aria-label="历史操作">
        <button
          className="ghost-button toolbar-button"
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销 · Ctrl+Z / Cmd+Z"
        >
          <Undo2 size={16} strokeWidth={1.75} />
          <span className="button-label">撤销</span>
        </button>
        <button
          className="ghost-button toolbar-button"
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 · Ctrl+Y / Shift+Cmd+Z"
        >
          <Redo2 size={16} strokeWidth={1.75} />
          <span className="button-label">重做</span>
        </button>
        <button className="ghost-button toolbar-button" type="button" onClick={onToggleHistory} title="查看编辑历史">
          <History size={16} strokeWidth={1.75} />
          <span className="button-label">历史</span>
        </button>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      <div className="toolbar-group" aria-label="页面功能">
        <button
          className="ghost-button toolbar-button compact-toolbar-button toolbar-modal-button"
          type="button"
          onClick={onOpenModal}
          disabled={!hasModal || isModalOpen}
          title="打开预览中的弹窗"
        >
          <MessageSquare size={16} strokeWidth={1.75} />
          <span className="button-label">打开弹窗</span>
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button toolbar-modal-button"
          type="button"
          onClick={onCloseModal}
          disabled={!hasModal || !isModalOpen}
          title="关闭预览中的弹窗"
        >
          <X size={16} strokeWidth={1.75} />
          <span className="button-label">关闭弹窗</span>
        </button>
        <label className="ghost-button toolbar-button compact-toolbar-button file-button" title="导入 .html 文件">
          <FileUp size={16} strokeWidth={1.75} />
          <span className="button-label">导入 HTML</span>
          <input
            type="file"
            accept=".html,.htm,text/html"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button className="ghost-button toolbar-button compact-toolbar-button" type="button" onClick={onCopy}>
          <Clipboard size={16} strokeWidth={1.75} />
          <span className="button-label">复制 HTML</span>
        </button>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      <div className="toolbar-group export-toolbar-group" aria-label="导出">
        <button className="primary-button toolbar-button export-toolbar-button" type="button" onClick={onExport}>
          <Download size={17} strokeWidth={1.75} />
          <span className="button-label">导出 HTML</span>
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button export-format-button"
          type="button"
          onClick={onExportPdf}
          disabled={exportingFormat !== null}
          title="AI 预检后导出 PDF"
        >
          {isExportingPdf ? (
            <LoaderCircle className="spin-icon" size={16} strokeWidth={1.75} />
          ) : (
            <FileText size={16} strokeWidth={1.75} />
          )}
          <span className="button-label">{isExportingPdf ? "生成中" : "PDF"}</span>
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button export-format-button"
          type="button"
          onClick={onExportPptx}
          disabled={exportingFormat !== null}
          title="AI 预检后导出 PPTX"
        >
          {isExportingPptx ? (
            <LoaderCircle className="spin-icon" size={16} strokeWidth={1.75} />
          ) : (
            <Presentation size={16} strokeWidth={1.75} />
          )}
          <span className="button-label">{isExportingPptx ? "生成中" : "PPTX"}</span>
        </button>
      </div>
    </div>
  );
}
