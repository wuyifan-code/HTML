import { Toolbar } from "./Toolbar";

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
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          &lt;/&gt;
        </div>
        <div className="brand-copy">
          <h1>HTML FineTune</h1>
          <p className="brand-subtitle">实时页面微调工作台</p>
        </div>
      </div>
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        hasModal={hasModal}
        isModalOpen={isModalOpen}
        onUndo={onUndo}
        onRedo={onRedo}
        onToggleHistory={onToggleHistory}
        onModalToggle={onModalToggle}
        onImport={onImport}
        onCopy={onCopy}
        onExport={onExport}
        onExportPdf={onExportPdf}
        onExportPptx={onExportPptx}
        exportingFormat={exportingFormat}
      />
    </header>
  );
}