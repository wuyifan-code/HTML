import { useState, useMemo, forwardRef, type PointerEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { SourceCodeView } from "./SourceCodeView";
import { DomTreeView } from "./DomTreeView";
import { AiScanPanel } from "./AiScanPanel";
import type { DomTreeNode, AiTreeAnnotation } from "../../../types/editor";
import { countTreeChildren, filterCollapsedTree } from "../../../utils/domTree";
import type {
  AiModelFetchStatus,
  AiModelOption,
  AiProviderDefinition,
  AiProviderId,
} from "../../../utils/aiStructure";

interface SourcePanelProps {
  defaultTab?: "source" | "structure";
  activeTab?: "source" | "structure" | "ai";
  onActiveTabChange?: (tab: "source" | "structure" | "ai") => void;
  html: string;
  sourceDraft: string;
  onSourceDraftChange: (draft: string) => void;
  isSynced: boolean;
  domTree: DomTreeNode[];
  collapsedTreeIds: Set<string>;
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  diagnosticsCount: number;
  nodeDiagnostics: Record<string, number>;
  onAiScan: () => void;
  onCopy: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lineCount: number;
  aiStatus?: "idle" | "running" | "ready" | "error";
  aiError?: string;
  aiProvider?: AiProviderId;
  aiProviders?: AiProviderDefinition[];
  onAiProviderChange?: (provider: AiProviderId) => void;
  aiApiKey?: string;
  aiKeyPlaceholder?: string;
  onAiApiKeyChange?: (value: string) => void;
  aiRememberKey?: boolean;
  onAiRememberKeyChange?: (value: boolean) => void;
  aiModel?: string;
  aiModels?: AiModelOption[];
  onAiModelChange?: (value: string) => void;
  aiModelFetchStatus?: AiModelFetchStatus;
  aiModelFetchError?: string;
  onRefreshAiModels?: () => void;
  aiAnnotationCount?: number;
  onClearAiAnnotations?: () => void;
  isAiCardCollapsed?: boolean;
  onToggleAiCard?: () => void;
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
  childCount: number;
  isOpen: boolean;
  diagnostics: number;
}

export const SourcePanel = forwardRef<HTMLElement, SourcePanelProps>(({
  defaultTab = "source",
  activeTab: controlledActiveTab,
  onActiveTabChange,
  html,
  sourceDraft,
  onSourceDraftChange,
  isSynced,
  domTree,
  collapsedTreeIds,
  selectedId,
  onSelectNode,
  onToggleNode,
  diagnosticsCount,
  nodeDiagnostics,
  onAiScan,
  onCopy,
  searchQuery,
  onSearchChange,
  lineCount,
  aiStatus = "idle",
  aiError = "",
  aiProvider = "google",
  aiProviders = [],
  onAiProviderChange = () => {},
  aiApiKey = "",
  aiKeyPlaceholder = "输入 API Key",
  onAiApiKeyChange = () => {},
  aiRememberKey = false,
  onAiRememberKeyChange = () => {},
  aiModel = "",
  aiModels = [],
  onAiModelChange = () => {},
  aiModelFetchStatus = "idle",
  aiModelFetchError = "",
  onRefreshAiModels = () => {},
  aiAnnotationCount = 0,
  onClearAiAnnotations = () => {},
  isAiCardCollapsed = false,
  onToggleAiCard = () => {},
  isCollapsed = false,
  onResizeStart,
  onCollapseToggle,
  onApplySource,
}, ref) => {
  const [internalActiveTab, setInternalActiveTab] = useState<"source" | "structure" | "ai">(defaultTab);
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const treeItems = useMemo<DomTreeItem[]>(() => {
    const childCounts = countTreeChildren(domTree);
    const visibleNodes = searchQuery.trim()
      ? domTree
      : filterCollapsedTree(domTree, collapsedTreeIds);

    return visibleNodes.map((node) => ({
      id: node.hftId,
      tagName: node.tagName,
      label: node.label || node.text || node.tagName,
      depth: node.depth,
      hasChildren: (childCounts[node.hftId] ?? 0) > 0,
      childCount: childCounts[node.hftId] ?? 0,
      isOpen: !collapsedTreeIds.has(node.hftId),
      diagnostics: nodeDiagnostics[node.hftId] ?? 0,
    }));
  }, [domTree, collapsedTreeIds, nodeDiagnostics, searchQuery]);

  const handleAiScan = () => {
    onAiScan();
  };

  const handleApplyDraft = (newHtml: string) => {
    onSourceDraftChange(newHtml);
    onApplySource?.(newHtml);
  };

  const handleCancelDraft = () => {
    onSourceDraftChange(html);
  };

  const handleTabChange = (tab: "source" | "structure" | "ai") => {
    if (controlledActiveTab === undefined) setInternalActiveTab(tab);
    onActiveTabChange?.(tab);
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
       aria-label={activeTab === "ai" ? "AI 结构扫描" : "结构树"}
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
          <button
            className={`nw-tab ${activeTab === "ai" ? "nw-tab-active" : ""}`}
            onClick={() => handleTabChange("ai")}
            type="button"
            role="tab"
            aria-selected={activeTab === "ai"}
            data-dom-id="tab-ai"
          >
             AI 结构扫描
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
            value={sourceDraft}
            onChange={onSourceDraftChange}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            lineCount={lineCount}
            isSynced={isSynced}
            onApplyDraft={handleApplyDraft}
            onCancelDraft={handleCancelDraft}
            onCopy={onCopy}
          />
        ) : activeTab === "ai" ? (
          <AiScanPanel
            provider={aiProvider}
            providers={aiProviders}
            onProviderChange={onAiProviderChange}
            apiKey={aiApiKey}
            keyPlaceholder={aiKeyPlaceholder}
            onApiKeyChange={onAiApiKeyChange}
            rememberKey={aiRememberKey}
            onRememberKeyChange={onAiRememberKeyChange}
            model={aiModel}
            models={aiModels}
            onModelChange={onAiModelChange}
            modelFetchStatus={aiModelFetchStatus}
            modelFetchError={aiModelFetchError}
            onRefreshModels={onRefreshAiModels}
            status={aiStatus}
            errorMessage={aiError}
            annotationCount={aiAnnotationCount}
            onScan={handleAiScan}
            onClear={onClearAiAnnotations}
            isCollapsed={isAiCardCollapsed}
            onToggleCollapsed={onToggleAiCard}
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
              diagnosticsCount={diagnosticsCount}
            />
          </>
        )
      )}
    </aside>
  );
});

SourcePanel.displayName = "SourcePanel";
