import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SourcePanel } from "../components/workspace/source/SourcePanel";
import { AI_PROVIDER_DEFINITIONS } from "../utils/aiStructure";
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

  it("restores the AI provider and model controls", () => {
    render(
      <SourcePanel
        {...defaultProps}
        activeTab="ai"
        aiProviders={AI_PROVIDER_DEFINITIONS}
        aiProvider="google"
        aiModel="gemini-2.5-flash"
        aiModels={[{ value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", source: "preset" }]}
      />,
    );
    expect(screen.getByLabelText("AI provider")).toBeTruthy();
    expect(screen.getByLabelText("Key")).toBeTruthy();
    expect(screen.getByLabelText("模型")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("AI provider"));
    expect(screen.getByRole("option", { name: /OpenAI/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /DeepSeek/ })).toBeTruthy();
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

  it("follows a parent-controlled tab so imports can force the DOM tree", () => {
    const { rerender } = render(
      <SourcePanel {...defaultProps} activeTab="source" onActiveTabChange={() => {}} />
    );
    expect(screen.getByLabelText("HTML 源码")).toBeTruthy();

    rerender(
      <SourcePanel {...defaultProps} activeTab="structure" onActiveTabChange={() => {}} />
    );
    expect(screen.queryByLabelText("HTML 源码")).toBeNull();
    expect(screen.getByLabelText("搜索 DOM 节点")).toBeTruthy();
  });

  it("shows source code view when source tab is active", () => {
    render(<SourcePanel {...defaultProps} />);
    const textarea = screen.getByLabelText("HTML 源码");
    expect(textarea).toBeTruthy();
    expect((textarea as HTMLTextAreaElement).value).toBe("<p>Hello World</p>");
  });

  it("renders a synchronized line-number gutter for source code", () => {
    const { container } = render(
      <SourcePanel
        {...defaultProps}
        sourceDraft={"<main>\n  <h1>Hello</h1>\n</main>"}
        lineCount={3}
      />,
    );
    const gutter = container.querySelector(".source-code-gutter");
    expect(gutter).not.toBeNull();
    expect(gutter?.textContent).toBe("1\n2\n3");
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
    expect(screen.queryByText("AI 扫描")).toBeNull();
    expect(screen.getByText("AI 结构扫描")).toBeTruthy();
  });

  it("keeps the DOM tree free of a duplicate AI scan entry", () => {
    render(<SourcePanel {...defaultProps} />);
    const domTab = screen.getByText("DOM 树");
    fireEvent.click(domTab);
    expect(screen.queryByLabelText("AI 扫描")).toBeNull();
    expect(screen.queryByRole("dialog", { name: "AI 扫描结果" })).toBeNull();
  });

  it("stages tree rows with a capped entrance delay", () => {
    render(<SourcePanel {...defaultProps} defaultTab="structure" />);
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-dom-id^='node-']"));
    expect(rows[0]?.dataset.animationIndex).toBe("0");
    expect(rows[1]?.dataset.animationIndex).toBe("1");
    expect(rows[1]?.style.animationDelay).toBe("14ms");
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
  it("hides collapsed descendants and shows the real direct-child count", () => {
    const domTree = [
      { hftId: "parent", tagName: "section", label: "Parent", text: "", depth: 0, className: "", id: "parent" },
      { hftId: "child-1", tagName: "p", label: "First", text: "First", depth: 1, className: "", id: "child-1" },
      { hftId: "child-2", tagName: "p", label: "Second", text: "Second", depth: 1, className: "", id: "child-2" },
    ];
    render(
      <SourcePanel
        {...defaultProps}
        domTree={domTree}
        collapsedTreeIds={new Set(["parent"])}
        defaultTab="structure"
      />
    );

    const parent = document.querySelector('[data-dom-id="node-parent"]');
    expect(parent?.querySelector(".tree-node__meta")?.textContent).toBe("2");
    expect(document.querySelector('[data-dom-id="node-child-1"]')).toBeNull();
    expect(document.querySelector('[data-dom-id="node-child-2"]')).toBeNull();
  });

  it("exposes hierarchy through treeitem aria attributes without nested buttons", () => {
    render(<SourcePanel {...defaultProps} defaultTab="structure" selectedId="2" />);

    const child = document.querySelector('[data-dom-id="node-2"]');
    expect(child?.getAttribute("role")).toBe("treeitem");
    expect(child?.getAttribute("aria-level")).toBe("2");
    expect(child?.getAttribute("aria-selected")).toBe("true");
    expect(child?.querySelector('[role="button"]')).toBeNull();
  });

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
