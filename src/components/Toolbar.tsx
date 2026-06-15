import { Clipboard, Download, FileUp, History, MessageSquare, Redo2, Undo2, X } from "lucide-react";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasModal: boolean;
  isModalOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleHistory: () => void;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onImport: (file: File) => void;
  onCopy: () => void;
  onExport: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  hasModal,
  isModalOpen,
  onUndo,
  onRedo,
  onToggleHistory,
  onOpenModal,
  onCloseModal,
  onImport,
  onCopy,
  onExport,
}: ToolbarProps) {
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
          <Undo2 size={16} strokeWidth={1.9} />
          撤销
        </button>
        <button
          className="ghost-button toolbar-button"
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 · Ctrl+Y / Shift+Cmd+Z"
        >
          <Redo2 size={16} strokeWidth={1.9} />
          重做
        </button>
        <button className="ghost-button toolbar-button" type="button" onClick={onToggleHistory} title="查看编辑历史">
          <History size={16} strokeWidth={1.9} />
          历史
        </button>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      <div className="toolbar-group" aria-label="页面功能">
        <button
          className="ghost-button toolbar-button compact-toolbar-button"
          type="button"
          onClick={onOpenModal}
          disabled={!hasModal || isModalOpen}
          title="打开预览中的弹窗"
        >
          <MessageSquare size={16} strokeWidth={1.9} />
          打开弹窗
        </button>
        <button
          className="ghost-button toolbar-button compact-toolbar-button"
          type="button"
          onClick={onCloseModal}
          disabled={!hasModal || !isModalOpen}
          title="关闭预览中的弹窗"
        >
          <X size={16} strokeWidth={1.9} />
          关闭弹窗
        </button>
        <label className="ghost-button toolbar-button compact-toolbar-button file-button" title="导入 .html 文件">
          <FileUp size={16} strokeWidth={1.9} />
          导入 HTML
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
          <Clipboard size={16} strokeWidth={1.9} />
          复制 HTML
        </button>
      </div>

      <div className="toolbar-separator" aria-hidden="true" />

      <button className="primary-button toolbar-button export-toolbar-button" type="button" onClick={onExport}>
        <Download size={17} strokeWidth={2} />
        导出 HTML
      </button>
    </div>
  );
}
