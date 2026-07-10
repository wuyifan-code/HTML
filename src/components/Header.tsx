import { Download, FileText, FileUp, HelpCircle, History, Maximize2, Presentation, Redo2, Settings, Sun, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { Tooltip } from "./Tooltip";

const APP_VERSION = "v2.4.1";

interface HeaderProps {
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

export function Header({
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
}: HeaderProps) {
  return (
    <header className="nw-topbar" role="banner">
      <div className="nw-topbar-left">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="16" height="14" rx="3" stroke="var(--n-fg-secondary)" strokeWidth="1.5"/>
          <line x1="6" y1="7" x2="14" y2="7" stroke="var(--n-fg-secondary)" strokeWidth="1.2"/>
          <line x1="6" y1="10" x2="11" y2="10" stroke="var(--n-fg-secondary)" strokeWidth="1.2"/>
          <line x1="6" y1="13" x2="13" y2="13" stroke="var(--n-fg-secondary)" strokeWidth="1.2"/>
        </svg>
        <span className="nw-topbar-title">HTML FineTune</span>
      </div>
      <div className="nw-topbar-center">
        <Tooltip content="撤销 · Ctrl/⌘+Z" placement="bottom">
          <button className="nw-tool-btn" type="button" onClick={onUndo} disabled={!canUndo} aria-label="撤销">
            <Undo2 size={14} strokeWidth={1.75} />
            <span>撤销</span>
          </button>
        </Tooltip>
        <Tooltip content="重做 · Ctrl/⌘+Y 或 Shift+Ctrl/⌘+Z" placement="bottom">
          <button className="nw-tool-btn" type="button" onClick={onRedo} disabled={!canRedo} aria-label="重做">
            <Redo2 size={14} strokeWidth={1.75} />
            <span>重做</span>
          </button>
        </Tooltip>
        <span className="nw-tool-divider" />
        <Tooltip content="缩小" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" onClick={() => {}} disabled aria-label="缩小">
            <ZoomOut size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
        <span className="nw-tool-zoom-label">100%</span>
        <Tooltip content="放大" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" onClick={() => {}} disabled aria-label="放大">
            <ZoomIn size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
        <span className="nw-tool-divider" />
        <Tooltip content="适应" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" onClick={() => {}} disabled aria-label="适应">
            <Maximize2 size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
        <Tooltip content="主题" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" onClick={() => {}} disabled aria-label="主题">
            <Sun size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
        <Tooltip content="历史记录" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" onClick={onToggleHistory} aria-label="历史记录">
            <History size={14} strokeWidth={1.75} />
          </button>
        </Tooltip>
        <Tooltip content="导出 HTML · Ctrl/⌘+S" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-brand" type="button" onClick={onExport} aria-label="导出">
            <Download size={14} strokeWidth={1.75} />
            <span>导出</span>
          </button>
        </Tooltip>
      </div>
      <div className="nw-topbar-right">
        <Tooltip content="导入 .html 文件" placement="bottom">
          <label className="nw-tool-btn">
            <FileUp size={14} strokeWidth={1.75} />
            <span>导入</span>
            <input type="file" accept=".html,.htm,text/html" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.currentTarget.value = ""; }} style={{position:'absolute',width:1,height:1,padding:0,margin:-1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0}} />
          </label>
        </Tooltip>
        <span className="nw-tool-divider" />
        <Tooltip content="导出 PDF" placement="bottom">
          <button className="nw-tool-btn" type="button" onClick={onExportPdf} disabled={exportingFormat !== null} aria-label="PDF">
            <FileText size={14} strokeWidth={1.75} />
            <span>PDF</span>
          </button>
        </Tooltip>
        <Tooltip content="导出 PPTX" placement="bottom">
          <button className="nw-tool-btn" type="button" onClick={onExportPptx} disabled={exportingFormat !== null} aria-label="PPTX">
            <Presentation size={14} strokeWidth={1.75} />
            <span>PPTX</span>
          </button>
        </Tooltip>
        <span className="nw-tool-divider" />
        <Tooltip content="设置" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" aria-label="设置">
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
        <Tooltip content="帮助 · ?" placement="bottom">
          <button className="nw-tool-btn nw-tool-btn-icon" type="button" aria-label="帮助">
            <HelpCircle size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
