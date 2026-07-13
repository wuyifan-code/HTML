import type { DomTreeNode, AiTreeAnnotation } from "../types/editor";
import { toNodeIcon, toKindLabel } from "../utils/domTree";

function toTreeTagLabel(tagName: string): string {
  const tag = tagName.toLowerCase();
  if (tag === "button") return "BTN";
  if (tag === "section") return "SEC";
  if (tag === "img") return "IMG";
  if (tag === "nav") return "NAV";
  if (tag === "footer") return "FTR";
  if (tag === "header") return "HDR";
  if (tag === "div") return "DIV";
  if (tag === "span") return "SPN";
  if (tag === "p") return "P";
  return tag.toUpperCase().slice(0, 3);
}

function toTreeTagModifier(tagName: string): string {
  const tag = tagName.toLowerCase();
  if (tag === "h1" || tag === "h2" || tag === "h3") return "h1";
  if (tag === "section") return "section";
  if (tag === "img") return "img";
  if (tag === "div") return "div";
  if (tag === "nav") return "nav";
  if (tag === "button") return "btn";
  if (tag === "footer" || tag === "header") return "footer";
  return tag;
}

export function TreeItemNode({
  node,
  isSelected,
  annotation,
  childCount,
  isCollapsed,
  animationIndex = 0,
  diagnosticsCount,
  onSelect,
  onToggleCollapse,
}: {
  node: DomTreeNode;
  isSelected: boolean;
  annotation?: AiTreeAnnotation;
  childCount: number;
  isCollapsed: boolean;
  animationIndex?: number;
  diagnosticsCount?: number;
  onSelect: (hftId: string) => void;
  onToggleCollapse: (hftId: string) => void;
}) {
  const hasChildren = childCount > 0;
  const tagClass = `tree-tag tree-tag--${toTreeTagModifier(node.tagName)}`;
  return (
    <button
      className={`tree-node${isSelected ? " is-selected" : ""}${isCollapsed ? " is-collapsed" : ""}`}
      type="button"
      role="treeitem"
      aria-selected={isSelected}
      aria-level={node.depth + 1}
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      onClick={() => onSelect(node.hftId)}
      style={{
        paddingLeft: `calc(var(--spacer-8) + ${node.depth * 12}px)`,
        animationDelay: `${Math.min(animationIndex * 14, 180)}ms`,
      }}
      data-depth={node.depth}
      data-animation-index={animationIndex}
      data-dom-id={`node-${node.hftId}`}
    >
      {hasChildren ? (
        <span
          className="tree-node__chev"
          aria-hidden="true"
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse(node.hftId);
          }}
        >
          ›
        </span>
      ) : (
        <span className="tree-node__chev" aria-hidden="true"></span>
      )}
      <span className={tagClass}>{toTreeTagLabel(node.tagName)}</span>
      <span className="tree-node__label" title={`${node.tagName}${node.className ? ' .' + node.className : ''}${node.text ? ' - ' + node.text : ''}`}>
        {node.label || node.text || node.tagName}
        {node.className ? (
          <span className="tree-node__class">.{(node.className.split(/\s+/).filter(Boolean)[0] ?? "")}</span>
        ) : null}
      </span>
      {hasChildren && isCollapsed ? (
        <span className="tree-node__meta" title={`${childCount} 个直接子节点`}>{childCount}</span>
      ) : null}
      {diagnosticsCount ? (
        <span className="tree-node__diag" role="status" aria-label={`${diagnosticsCount} 个诊断`}>
          {diagnosticsCount}
        </span>
      ) : null}
    </button>
  );
}

export function TreeItem({
  node,
  isSelected,
  annotation,
  onSelect,
}: {
  node: DomTreeNode;
  isSelected: boolean;
  annotation?: AiTreeAnnotation;
  onSelect: (hftId: string) => void;
}) {
  return (
    <button
      className={`tree-item${isSelected ? " is-selected" : ""}`}
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(node.hftId)}
    >
      <span className="node-icon">{toNodeIcon(node.tagName)}</span>
      <span className="node-copy" title={`${annotation?.label ?? toKindLabel(node.tagName)} (${node.tagName}) - ${node.text || node.label}`}>
        <strong>{annotation?.label ?? toKindLabel(node.tagName)}</strong>
        <span>{node.tagName} · {node.text || node.label}</span>
        {annotation ? (
          <span className="ai-node-hint">
            {annotation.role}
            {annotation.issues.length ? " · " + annotation.issues.join(" / ") : ""}
          </span>
        ) : null}
      </span>
      <span className="meta">{node.depth === 0 ? "主" : "子"}</span>
    </button>
  );
}
