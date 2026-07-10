import { IconSearch, IconSparkles } from "../../Icons";
import { TreeItemNode } from "../../TreeItem";
import { X } from "lucide-react";

interface DomTreeViewProps {
  domTree: Array<{ id: string; tagName: string; label: string; depth: number; hasChildren: boolean; isOpen: boolean; diagnostics: number }>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAiScan: () => void;
  diagnosticsCount: number;
}

export function DomTreeView({
  domTree,
  searchQuery,
  onSearchChange,
  selectedId,
  onSelect,
  onToggle,
  onAiScan,
  diagnosticsCount,
}: DomTreeViewProps) {
  const filteredNodes = searchQuery.trim()
    ? domTree.filter((node) =>
        [node.tagName, node.label, node.id].some((value) =>
          value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : domTree;

  return (
    <div className="dom-tree-view">
      <div className="dom-tree-search">
        <div className="tree-search-field">
          <IconSearch />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索节点..."
            aria-label="搜索 DOM 节点"
          />
          {searchQuery ? (
            <button
              className="source-search-clear"
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="清除搜索"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="dom-tree-toolbar-row">
        <button
          className="dom-tree-ai-scan-btn"
          type="button"
          onClick={onAiScan}
          aria-label="AI 扫描"
        >
          <IconSparkles />
          <span>AI 扫描</span>
        </button>
        {diagnosticsCount > 0 ? (
          <span className="dom-tree-diagnostics-badge" role="status">
            {diagnosticsCount} 个诊断
          </span>
        ) : null}
      </div>

      <div className="tree-node-list" role="tree" aria-label="DOM 树节点">
        {filteredNodes.length === 0 ? (
          <div className="tree-node-empty">
            {searchQuery ? "未找到匹配节点" : "暂无节点数据"}
          </div>
        ) : (
          filteredNodes.map((node) => (
            <NodeRow
              key={node.id}
              node={node}
              isSelected={selectedId === node.id}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NodeRow({
  node,
  isSelected,
  onSelect,
  onToggle,
}: {
  node: DomTreeViewProps["domTree"][0];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <TreeItemNode
      node={{
        hftId: node.id,
        tagName: node.tagName,
        label: node.label,
        text: node.label,
        depth: node.depth,
        className: "",
        id: node.id,
      }}
      isSelected={isSelected}
      childCount={node.hasChildren ? 1 : 0}
      isCollapsed={!node.isOpen}
      onSelect={(hftId) => onSelect(hftId)}
      onToggleCollapse={(hftId) => onToggle(hftId)}
    />
  );
}
