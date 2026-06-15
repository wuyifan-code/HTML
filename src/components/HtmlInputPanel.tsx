import { useState } from "react";
import { Code2, FileUp, ListTree, PanelBottom, PanelLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { DomTreeNode, SourcePanelPlacement } from "../types/editor";

interface HtmlInputPanelProps {
  value: string;
  domTree: DomTreeNode[];
  selectedId: string | null;
  onChange: (value: string) => void;
  onImport: (file: File) => void;
  onSelectElement: (hftId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  placement: SourcePanelPlacement;
  onTogglePlacement: () => void;
  showImportDropzone: boolean;
}

export function HtmlInputPanel({
  value,
  domTree,
  selectedId,
  onChange,
  onImport,
  onSelectElement,
  isCollapsed,
  onToggleCollapse,
  placement,
  onTogglePlacement,
  showImportDropzone,
}: HtmlInputPanelProps) {
  const [activeView, setActiveView] = useSourcePanelView();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const isBottomPlacement = placement === "bottom";

  const handleImportFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) onImport(file);
  };

  if (isCollapsed) {
    return (
      <section className="panel collapsed-panel collapsed-source-panel" aria-label="HTML 源码已收起">
        <button
          className="collapse-rail-button"
          type="button"
          onClick={onToggleCollapse}
          aria-label="展开 HTML 源码"
          title="展开 HTML 源码"
        >
          <PanelLeftOpen size={18} strokeWidth={1.8} />
          <span>展开源码</span>
        </button>
      </section>
    );
  }

  return (
    <section className={`panel source-panel${isBottomPlacement ? " source-panel-bottom" : ""}`} aria-label="HTML 源码编辑器">
      <div className="panel-header">
        <div className="panel-title">
          {activeView === "source" ? <Code2 size={18} strokeWidth={1.8} /> : <ListTree size={18} strokeWidth={1.8} />}
          <span>{activeView === "source" ? "HTML 源码" : "页面结构"}</span>
        </div>
        <div className="source-header-actions">
          <div className="segmented-control compact-segmented" aria-label="左侧视图">
            <button
              className={`segmented-button${activeView === "source" ? " segmented-button-active" : ""}`}
              type="button"
              aria-pressed={activeView === "source"}
              onClick={() => setActiveView("source")}
            >
              <Code2 size={14} strokeWidth={1.8} />
              源码
            </button>
            <button
              className={`segmented-button${activeView === "tree" ? " segmented-button-active" : ""}`}
              type="button"
              aria-pressed={activeView === "tree"}
              onClick={() => setActiveView("tree")}
            >
              <ListTree size={14} strokeWidth={1.8} />
              结构
            </button>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onTogglePlacement}
            aria-label={isBottomPlacement ? "将源码区移回左侧" : "将源码区移到底部"}
            title={isBottomPlacement ? "源码区移回左侧" : "源码区移到底部"}
          >
            {isBottomPlacement ? <PanelLeft size={18} strokeWidth={1.8} /> : <PanelBottom size={18} strokeWidth={1.8} />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onToggleCollapse}
            aria-label="收起 HTML 源码"
            title="收起 HTML 源码"
          >
            <PanelLeftClose size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      {activeView === "source" ? (
        <>
          {showImportDropzone ? (
            <label
              className={`source-dropzone${isDraggingFile ? " source-dropzone-active" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingFile(false);
                handleImportFiles(event.dataTransfer.files);
              }}
            >
              <FileUp size={16} strokeWidth={1.8} />
              <span>拖拽 HTML 文件到此处</span>
              <small>或点击导入 .html</small>
              <input
                type="file"
                accept=".html,.htm,text/html"
                onChange={(event) => {
                  handleImportFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          ) : null}
          <textarea
            spellCheck={false}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label="可编辑 HTML 源码"
          />
        </>
      ) : (
        <div className="dom-tree" role="tree" aria-label="可编辑元素结构">
          {domTree.length === 0 ? (
            <div className="dom-tree-empty">没有可编辑文本元素</div>
          ) : (
            domTree.map((node) => (
              <button
                key={node.hftId}
                className={`dom-tree-node${node.hftId === selectedId ? " dom-tree-node-active" : ""}`}
                type="button"
                role="treeitem"
                aria-selected={node.hftId === selectedId}
                aria-level={node.depth + 1}
                style={{ paddingLeft: `${12 + node.depth * 14}px` }}
                title={node.label}
                onClick={() => onSelectElement(node.hftId)}
              >
                <span className="dom-tree-tag">{node.tagName}</span>
                <span className="dom-tree-label">{node.text || node.label}</span>
              </button>
            ))
          )}
        </div>
      )}
      <div className="panel-footer">
        <span>{activeView === "source" ? "srcDoc 预览" : `${domTree.length} 个可编辑元素`}</span>
        <span>{value.length.toLocaleString()} 字符</span>
      </div>
    </section>
  );
}

type SourcePanelView = "source" | "tree";

function useSourcePanelView(): [SourcePanelView, (view: SourcePanelView) => void] {
  const [activeView, setActiveView] = useState<SourcePanelView>("source");
  return [activeView, setActiveView];
}
