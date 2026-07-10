import { useCallback, useRef, useState } from "react";

interface EmptyWorkspaceProps {
  onImportClick: () => void;
  onPasteClick: () => void;
  onDrop: (file: File) => void;
}

export function EmptyWorkspace({ onImportClick, onPasteClick, onDrop }: EmptyWorkspaceProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file && /\.html?$/i.test(file.name)) {
      onDrop(file);
    }
  }, [onDrop]);

  return (
    <section
      className={`empty-workspace ${isDragOver ? "empty-workspace--drag-over" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-label="空白工作区"
    >
      <div className="empty-workspace__illustration">
        <svg width="80" height="96" viewBox="0 0 80 96" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="64" height="80" rx="4" stroke="var(--n-border-default)" strokeWidth="2" strokeDasharray="5 4"/>
          <path d="M20 30 Q26 26 32 30 T44 30 T56 30 T62 30" stroke="var(--n-border-default)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M20 42 Q26 38 32 42 T44 42 T56 42 T62 42" stroke="var(--n-border-default)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M20 54 Q26 50 32 54 T44 54 T52 54" stroke="var(--n-border-default)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M20 66 Q26 62 32 66 T44 66 T56 66 T62 66" stroke="var(--n-border-default)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M56 8 L56 24 L72 24" stroke="var(--n-border-default)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>

      <h1 className="empty-workspace__title">拖入 HTML 文件，或粘贴代码开始</h1>
      <p className="empty-workspace__description">
        支持导入 .html 文件，或从剪贴板粘贴源码。所有修改本地保存。
      </p>

      <button className="empty-workspace__cta" type="button" onClick={onImportClick}>
        导入 HTML
      </button>

      <button className="empty-workspace__link" type="button" onClick={onPasteClick}>
        粘贴源码
      </button>
    </section>
  );
}
