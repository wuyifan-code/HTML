import { memo, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Code2, FileUp, ListTree, PanelBottom, PanelLeft, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import type { DomTreeNode, SourcePanelPlacement } from "../types/editor";

type SourcePanelView = "source" | "tree";

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
  sourceView: SourcePanelView;
  onSourceViewChange: (view: SourcePanelView) => void;
}

function HtmlInputPanelComponent({
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
  sourceView,
  onSourceViewChange,
}: HtmlInputPanelProps) {
  const activeView = sourceView;
  const setActiveView = onSourceViewChange;
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [treeQuery, setTreeQuery] = useState("");
  const isBottomPlacement = placement === "bottom";
  const filteredDomTree = useMemo(() => {
    const query = treeQuery.trim().toLowerCase();
    if (!query) return domTree;
    return domTree.filter((node) => {
      return [node.tagName, node.text, node.label].some((value) => (value || "").toLowerCase().includes(query));
    });
  }, [domTree, treeQuery]);
  const sourceLineCount = useMemo(() => (value.match(/\r\n|\r|\n/g)?.length ?? 0) + 1, [value]);

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
          <PanelLeftOpen size={18} strokeWidth={1.75} />
          <span>展开源码</span>
        </button>
      </section>
    );
  }

  return (
    <section className={`panel source-panel${isBottomPlacement ? " source-panel-bottom" : ""}`} aria-label="HTML 源码编辑器">
      <div className="panel-header">
        <div className="panel-title">
          {activeView === "source" ? <Code2 size={18} strokeWidth={1.75} /> : <ListTree size={18} strokeWidth={1.75} />}
          <span>{activeView === "source" ? "源码" : "结构导航"}</span>
        </div>
        <div className="source-header-actions">
          <div className="segmented-control compact-segmented" aria-label="左侧视图">
            <button
              className={`segmented-button${activeView === "source" ? " segmented-button-active" : ""}`}
              type="button"
              aria-pressed={activeView === "source"}
              onClick={() => setActiveView("source")}
            >
              <Code2 size={14} strokeWidth={1.75} />
              源码
            </button>
            <button
              className={`segmented-button${activeView === "tree" ? " segmented-button-active" : ""}`}
              type="button"
              aria-pressed={activeView === "tree"}
              onClick={() => setActiveView("tree")}
            >
              <ListTree size={14} strokeWidth={1.75} />
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
            {isBottomPlacement ? <PanelLeft size={18} strokeWidth={1.75} /> : <PanelBottom size={18} strokeWidth={1.75} />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onToggleCollapse}
            aria-label="收起 HTML 源码"
            title="收起 HTML 源码"
          >
            <PanelLeftClose size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="source-panel-shell">
        <div className="source-panel-main">
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
                  <FileUp size={16} strokeWidth={1.75} />
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
              <div className="source-editor-shell">
                <div className="source-editor-meta">
                  <span className="source-editor-language">
                    <Code2 size={13} strokeWidth={1.75} />
                    HTML
                  </span>
                  <span>{sourceLineCount.toLocaleString()} 行</span>
                </div>
                <textarea
                  className="source-textarea"
                  spellCheck={false}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  aria-label="可编辑 HTML 源码"
                />
              </div>
            </>
          ) : (
            <>
              {showImportDropzone ? (
                <label
                  className={`source-dropzone source-dropzone-compact${isDraggingFile ? " source-dropzone-active" : ""}`}
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
                  <FileUp size={16} strokeWidth={1.75} />
                  <span>导入 HTML</span>
                  <small>拖入文件或点击选择</small>
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
              <div className="source-outline-header">
                <span>可编辑元素</span>
                <small>{filteredDomTree.length} / {domTree.length}</small>
              </div>
              <TreeSearch value={treeQuery} onChange={setTreeQuery} />
              <DomTreeList
                nodes={filteredDomTree}
                selectedId={selectedId}
                onSelectElement={onSelectElement}
                emptyText={treeQuery ? "没有匹配的元素" : "没有可编辑文本元素"}
              />
            </>
          )}
        </div>
      </div>
      <div className="panel-footer">
        <span>{activeView === "source" ? "源码直改" : "点击元素定位到预览"}</span>
        <span>{value.length.toLocaleString()} 字符</span>
      </div>
    </section>
  );
}

export const HtmlInputPanel = memo(HtmlInputPanelComponent);

function TreeSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="tree-search">
      <Search size={14} strokeWidth={1.75} />
      <input
        type="search"
        value={value}
        placeholder="查找标签、文本或类名"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DomTreeList({
  nodes,
  selectedId,
  onSelectElement,
  emptyText,
  compact = false,
}: {
  nodes: DomTreeNode[];
  selectedId: string | null;
  onSelectElement: (hftId: string) => void;
  emptyText: string;
  compact?: boolean;
}) {
  const baseDepth = nodes[0]?.depth ?? 0;

  return (
    <div className={`dom-tree${compact ? " dom-tree-compact" : ""}`} role="tree" aria-label="可编辑元素结构">
      {nodes.length === 0 ? (
        <div className="dom-tree-empty">{emptyText}</div>
      ) : (
        nodes.map((node) => {
          const visibleDepth = Math.min(Math.max(node.depth - baseDepth, 0), compact ? 3 : 8);
          return (
            <button
              key={node.hftId}
              className={`dom-tree-node${node.hftId === selectedId ? " dom-tree-node-active" : ""}`}
              type="button"
              role="treeitem"
              aria-selected={node.hftId === selectedId}
              aria-level={visibleDepth + 1}
              data-depth={visibleDepth}
              style={{ "--tree-indent": `${visibleDepth * 12}px` } as CSSProperties}
              title={node.label}
              onClick={() => onSelectElement(node.hftId)}
            >
              <span className="dom-tree-tag">{node.tagName}</span>
              <span className="dom-tree-label">{node.text || node.label}</span>
            </button>
          );
        })
      )}
    </div>
  );
}
