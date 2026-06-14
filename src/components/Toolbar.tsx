import { Clipboard, Download, FileUp, Redo2, Undo2 } from "lucide-react";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: (file: File) => void;
  onCopy: () => void;
  onExport: () => void;
}

export function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onImport,
  onCopy,
  onExport,
}: ToolbarProps) {
  return (
    <div className="toolbar" aria-label="编辑器工具栏">
      <button className="ghost-button toolbar-button" type="button" onClick={onUndo} disabled={!canUndo}>
        <Undo2 size={16} strokeWidth={1.9} />
        撤销
      </button>
      <button className="ghost-button toolbar-button" type="button" onClick={onRedo} disabled={!canRedo}>
        <Redo2 size={16} strokeWidth={1.9} />
        重做
      </button>
      <label className="ghost-button toolbar-button file-button">
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
      <button className="ghost-button toolbar-button" type="button" onClick={onCopy}>
        <Clipboard size={16} strokeWidth={1.9} />
        复制 HTML
      </button>
      <button className="primary-button toolbar-button" type="button" onClick={onExport}>
        <Download size={17} strokeWidth={2} />
        导出 HTML
      </button>
    </div>
  );
}
