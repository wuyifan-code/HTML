import { Toolbar } from "./Toolbar";

interface HeaderProps {
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

export function Header({
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
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          HF
        </div>
        <div>
          <h1>HTML FineTune</h1>
          <p className="brand-subtitle">一个用于微调 AI 生成 HTML 的安静可视化编辑器</p>
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
        onOpenModal={onOpenModal}
        onCloseModal={onCloseModal}
        onImport={onImport}
        onCopy={onCopy}
        onExport={onExport}
      />
    </header>
  );
}
