import { useState, useRef, useMemo, forwardRef, type PointerEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { SourceCodeView } from "./SourceCodeView";
import { DomTreeView } from "./DomTreeView";
import { AiScanPopover } from "./AiScanPopover";
import type { DomTreeNode, AiTreeAnnotation } from "../../../types/editor";

interface SourcePanelProps {
  defaultTab?: "source" | "structure";
  html: string;
  onHtmlChange: (html: string) => void;
  isSynced: boolean;
  domTree: DomTreeNode[];
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  diagnosticsCount: number;
  onAiScan: () => void;
  onCopy: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lineCount: number;
  aiStatus?: "idle" | "running" | "ready" | "error";
  aiError?: string;
  isCollapsed?: boolean;
  onResizeStart?: (event: PointerEvent<HTMLButtonElement>) => void;
  onCollapseToggle?: () => void;
  onApplySource?: (newHtml: string) => void;
}

interface DomTreeItem {
  id: string;
  tagName: string;
  label: string;
  depth: number;
  hasChildren: boolean;
  isOpen: boolean;
  diagnostics: number;
}

export const SourcePanel = forwardRef<HTMLElement, SourcePanelProps>(({
  defaultTab = "source",
  html,
  onHtmlChange,
  isSynced,
  domTree,
  selectedId,
  onSelectNode,
  onToggleNode,
  diagnosticsCount,
  onAiScan,
  onCopy,
  searchQuery,
  onSearchChange,
  lineCount,
  aiStatus = "idle",
  aiError = "",
  isCollapsed = false,
  onResizeStart,
  onCollapseToggle,
  onApplySource,
}, ref) => {
  const [activeTab, setActiveTab] = useState<"source" | "structure">(defaultTab);
  const [isAiPopoverOpen, setIsAiPopoverOpen] = useState(false);
  const [draftHtml, setDraftHtml] = useState(html);
  const aiScanTriggerRef = useRef<HTMLButtonElement | null>(null);

  const popoverStatus = useMemo(() => {
    if (aiStatus === "running") return "scanning";
    if (aiStatus === "ready") return "done";
    if (aiStatus === "error") return "error";
    return "idle";
  }, [aiStatus]);

  const treeItems = useMemo<DomTreeItem[]>(() => {
    const depthCount = new Map<string, number>();
    domTree.forEach((node) => {
      depthCount.set(node.hftId, 0);
    });
    domTree.forEach((node, index) => {
      for (let i = index + 1; i < domTree.length; i++) {
        if (domTree[i].depth <= node.depth) break;
        if (domTree[i].depth === node.depth + 1) {
          depthCount.set(node.hftId, (depthCount.get(node.hftId) ?? 0) + 1);
        }
      }
    });

    return domTree.map((node) => ({
      id: node.hftId,
      tagName: node.tagName,
      label: node.label || node.text || node.tagName,
      depth: node.depth,
      hasChildren: (depthCount.get(node.hftId) ?? 0) > 0,
      isOpen: !(node as any).isCollapsed,
      diagnostics: 0,
    }));
  }, [domTree]);

  const handleAiScan = () => {
    onAiScan();
  };

  const handleApplyDraft = (newHtml: string) => {
    onHtmlChange(newHtml);
    setDraftHtml(newHtml);
    onApplySource?.(newHtml);
  };

  const handleCancelDraft = () => {
    setDraftHtml(html);
  };

  const handleTabChange = (tab: "source" | "structure") => {
    setActiveTab(tab);
  };

  return (
    <aside
      id="source-panel"
      ref={ref}
      className={[
        "nw-left-panel",
        "panel",
        isCollapsed ? "is-collapsed" : "",
      ].filter(Boolean).join(" ")}
      aria-label="结构树"
      data-dom-id="panel-source-tree"
    >
      {!isCollapsed && (
        <button
          className="panel-resizer panel-resizer-source"
          type="button"
          aria-label="拖拽调整结构面板宽度"
          onPointerDown={onResizeStart}
        />
      )}
      <div
        className="nw-panel-tabs-row"
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--n-border-default)",
        }}
      >
        <div
          className="nw-tabs"
          role="tablist"
          style={{ flex: 1, borderBottom: "none" }}
        >
          <button
            className={`nw-tab ${activeTab === "source" ? "nw-tab-active" : ""}`}
            onClick={() => handleTabChange("source")}
            type="button"
            role="tab"
            aria-selected={activeTab === "source"}
            data-dom-id="tab-source"
          >
            来源
          </button>
          <button
            className={`nw-tab ${activeTab === "structure" ? "nw-tab-active" : ""}`}
            onClick={() => handleTabChange("structure")}
            type="button"
            role="tab"
            aria-selected={activeTab === "structure"}
            data-dom-id="tab-structure"
          >
            DOM 树
          </button>
        </div>
        {!isCollapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px" }}>
            <button
              className="panel-collapse-btn nw-tool-btn nw-tool-btn-icon"
              type="button"
              aria-label="收起结构树"
              aria-controls="source-panel"
              aria-expanded="true"
              title="收起侧边栏"
              onClick={onCollapseToggle}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        activeTab === "source" ? (
          <SourceCodeView
            html={draftHtml}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            lineCount={lineCount}
            isSynced={isSynced}
            onApplyDraft={handleApplyDraft}
            onCancelDraft={handleCancelDraft}
            onCopy={onCopy}
          />
        ) : (
          <>
            <DomTreeView
              domTree={treeItems}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedId={selectedId}
              onSelect={onSelectNode}
              onToggle={onToggleNode}
              onAiScan={() => setIsAiPopoverOpen(true)}
              diagnosticsCount={diagnosticsCount}
              triggerRef={aiScanTriggerRef}
            />
            <AiScanPopover
              isOpen={isAiPopoverOpen}
              onClose={() => setIsAiPopoverOpen(false)}
              triggerRef={aiScanTriggerRef}
              onScan={handleAiScan}
              status={popoverStatus}
              resultCount={diagnosticsCount}
              errorMessage={aiError}
            />
          </>
        )
      )}
    </aside>
  );
});

SourcePanel.displayName = "SourcePanel";
