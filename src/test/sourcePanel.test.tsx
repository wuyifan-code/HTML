import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SourcePanel } from "../components/workspace/source/SourcePanel";
import "../../src/styles/source-panel.css";

const defaultProps = {
  html: "<p>Hello World</p>",
  sourceDraft: "<p>Hello World</p>",
  onSourceDraftChange: () => {},
  onApplySource: () => {},
  isSynced: true,
  domTree: [
    { hftId: "1", tagName: "p", label: "Hello World", text: "Hello World", depth: 0, className: "", id: "1" },
    { hftId: "2", tagName: "div", label: "Container", text: "", depth: 1, className: "container", id: "2" },
  ],
  collapsedTreeIds: new Set<string>(),
  selectedId: null,
  onSelectNode: () => {},
  onToggleNode: () => {},
  diagnosticsCount: 3,
  nodeDiagnostics: {} as Record<string, number>,
  onAiScan: () => {},
  onCopy: () => {},
  searchQuery: "",
  onSearchChange: () => {},
  lineCount: 1,
};

describe("SourcePanel", () => {
  it("renders tab bar with source and structure tabs", () => {
    render(<SourcePanel {...defaultProps} />);
    const sourceTab = screen.getByText("来源");
    const domTab = screen.getByText("DOM 树");
    expect(sourceTab).toBeTruthy();
    expect(domTab).toBeTruthy();
    expect(sourceTab.getAttribute("data-dom-id")).toBe("tab-source");
    expect(domTab.getAttribute("data-dom-id")).toBe("tab-structure");
  });

  it("switches between source and DOM tree tabs", () => {
    render(<SourcePanel {...defaultProps} />);
    const domTab = screen.getByText("DOM 树");
    fireEvent.click(domTab);
    expect(domTab.className).toContain("nw-tab-active");
    const sourceTab = screen.getByText("来源");
    expect(sourceTab.className).not.toContain("nw-tab-active");
    fireEvent.click(sourceTab);
    expect(sourceTab.className).toContain("nw-tab-active");
  });

  it("shows source code view when source tab is active", () => {
    render(<SourcePanel {...defaultProps} />);
    const textarea = screen.getByLabelText("HTML 源码");
    expect(textarea).toBeTruthy();
    expect((textarea as HTMLTextAreaElement).value).toBe("<p>Hello World</p>");
  });

  it("hides source code view when DOM tree tab is active", () => {
    render(<SourcePanel {...defaultProps} />);
    const domTab = screen.getByText("DOM 树");
    fireEvent.click(domTab);
    expect(screen.queryByLabelText("HTML 源码")).toBeNull();
  });

  it("shows DOM tree view when structure tab is active", () => {
    render(<SourcePanel {...defaultProps} />);
    const domTab = screen.getByText("DOM 树");
    fireEvent.click(domTab);
    expect(screen.getByLabelText("搜索 DOM 节点")).toBeTruthy();
    expect(screen.getByText("AI 扫描")).toBeTruthy();
  });

  it("shows AI scan popover when AI scan button is clicked", () => {
    render(<SourcePanel {...defaultProps} />);
    const domTab = screen.getByText("DOM 树");
    fireEvent.click(domTab);
    const aiScanBtn = screen.getByLabelText("AI 扫描");
    fireEvent.click(aiScanBtn);
    expect(screen.getByRole("dialog", { name: "AI 扫描结果" })).toBeTruthy();
  });

  it("shows diagnostics badge when diagnosticsCount > 0", () => {
    render(<SourcePanel {...defaultProps} diagnosticsCount={3} />);
    const domTab = screen.getByText("DOM 树");
    fireEvent.click(domTab);
    expect(screen.getByText("3 个诊断")).toBeTruthy();
  });

  it("renders search query in source view", () => {
    render(<SourcePanel {...defaultProps} searchQuery="Hello" />);
    const searchInput = screen.getByLabelText("搜索源码");
    expect((searchInput as HTMLInputElement).value).toBe("Hello");
  });
});

describe("SourcePanel stale draft regression", () => {
  it("textarea displays sourceDraft value (not stale local state)", () => {
    const { rerender } = render(
      <SourcePanel {...defaultProps} sourceDraft="<p>v1</p>" html="<p>v1</p>" />
    );
    let textarea = screen.getByLabelText("HTML 源码");
    expect((textarea as HTMLTextAreaElement).value).toBe("<p>v1</p>");

    // Simulate import/undo changing the html and sourceDraft from above
    rerender(
      <SourcePanel {...defaultProps} sourceDraft="<p>v2</p>" html="<p>v2</p>" />
    );
    textarea = screen.getByLabelText("HTML 源码");
    expect((textarea as HTMLTextAreaElement).value).toBe("<p>v2</p>");
  });

  it("\"应用\" submits current textarea value (not stale local state)", () => {
    let applied = "";
    const { rerender } = render(
      <SourcePanel
        {...defaultProps}
        sourceDraft="<div>x</div>"
        onSourceDraftChange={() => {}}
        onApplySource={(html) => { applied = html; }}
      />
    );
    // Simulate user typing: re-render with new controlled value
    rerender(
      <SourcePanel
        {...defaultProps}
        sourceDraft="<div>y</div>"
        onSourceDraftChange={() => {}}
        onApplySource={(html) => { applied = html; }}
      />
    );
    fireEvent.click(screen.getByText("应用"));
    expect(applied).toBe("<div>y</div>");
  });
});

describe("SourcePanel DOM Tree collapse and diagnostics", () => {
  it("collapsed node shows hasChildren but isOpen=false", () => {
    const domTree = [
      { hftId: "1", tagName: "div", label: "Parent", text: "", depth: 0, className: "", id: "1" },
    ];
    render(
      <SourcePanel
        {...defaultProps}
        domTree={domTree}
        collapsedTreeIds={new Set(["1"])}
        defaultTab="structure"
      />
    );
    // The tree should be visible (structure tab active)
    const treeNode = document.querySelector('[data-dom-id="node-1"]');
    expect(treeNode).toBeTruthy();
    // Collapsed node should have is-collapsed class
    expect(treeNode?.className).toContain("is-collapsed");
  });

  it("expanded node shows isOpen=true (not collapsed)", () => {
    const domTree = [
      { hftId: "1", tagName: "div", label: "Parent", text: "", depth: 0, className: "", id: "1" },
    ];
    render(
      <SourcePanel
        {...defaultProps}
        domTree={domTree}
        collapsedTreeIds={new Set()}
        defaultTab="structure"
      />
    );
    const treeNode = document.querySelector('[data-dom-id="node-1"]');
    expect(treeNode).toBeTruthy();
    expect(treeNode?.className).not.toContain("is-collapsed");
  });

  it("node diagnostics count maps from nodeDiagnostics prop (not hardcoded 0)", () => {
    const domTree = [
      { hftId: "1", tagName: "div", label: "A", text: "", depth: 0, className: "", id: "1" },
      { hftId: "2", tagName: "div", label: "B", text: "", depth: 0, className: "", id: "2" },
    ];
    render(
      <SourcePanel
        {...defaultProps}
        domTree={domTree}
        nodeDiagnostics={{ "1": 2, "2": 0 }}
        defaultTab="structure"
      />
    );
    // Both nodes should render; node "1" should show diagnostics badge
    const node1 = document.querySelector('[data-dom-id="node-1"]');
    expect(node1).toBeTruthy();
    // The diagnostics badge should appear for node 1
    const badges = node1?.querySelectorAll(".tree-node__diag");
    expect(badges?.length).toBeGreaterThanOrEqual(1);
  });
});
