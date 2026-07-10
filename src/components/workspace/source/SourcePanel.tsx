import { useState, useRef, useMemo } from "react";
import { PanelLeftClose } from "lucide-react";
import { SourceCodeView } from "./SourceCodeView";
import { DomTreeView } from "./DomTreeView";
import { AiScanPopover } from "./AiScanPopover";
import { Tooltip } from "../../Tooltip";
import type { DomTreeNode } from "../../../types/editor";

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

export function SourcePanel({
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
}: SourcePanelProps) {
  const [activeTab, setActiveTab] = useState<"source" | "structure">(defaultTab);
  const [isAiPopoverOpen, setIsAiPopoverOpen] = useState(false);
  const [aiScanStatus, setAiScanStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [aiScanResultCount, setAiScanResultCount] = useState(0);
  const [aiScanError, setAiScanError] = useState<string | undefined>();
  const [draftHtml, setDraftHtml] = useState(html);
  const aiScanTriggerRef = useRef<HTMLButtonElement | null>(null);

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
      isOpen: true,
      diagnostics: 0,
    }));
  }, [domTree]);

  const handleAiScan = () => {
    setAiScanStatus("scanning");
    setAiScanError(undefined);
    onAiScan();
    setTimeout(() => {
      setAiScanStatus("done");
      setAiScanResultCount(diagnosticsCount);
    }, 500);
  };

  const handleApplyDraft = (newHtml: string) => {
    onHtmlChange(newHtml);
    setDraftHtml(newHtml);
  };

  const handleCancelDraft = () => {
    setDraftHtml(html);
  };

  const handleTabChange = (tab: "source" | "structure") => {
    setActiveTab(tab);
  };

  return (
    <section className="source-panel" aria-label="源代码面板">
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
      </div>

      {activeTab === "source" ? (
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
          />
          <AiScanPopover
            isOpen={isAiPopoverOpen}
            onClose={() => setIsAiPopoverOpen(false)}
            triggerRef={aiScanTriggerRef}
            onScan={handleAiScan}
            status={aiScanStatus}
            resultCount={aiScanResultCount}
            errorMessage={aiScanError}
          />
        </>
      )}
    </section>
  );
}
