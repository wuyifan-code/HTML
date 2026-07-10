import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SourcePanel } from "../components/workspace/source/SourcePanel";
import "../../src/styles/source-panel.css";

const defaultProps = {
  html: "<p>Hello World</p>",
  onHtmlChange: () => {},
  isSynced: true,
  domTree: [
    { hftId: "1", tagName: "p", label: "Hello World", text: "Hello World", depth: 0, className: "", id: "1" },
    { hftId: "2", tagName: "div", label: "Container", text: "", depth: 1, className: "container", id: "2" },
  ],
  selectedId: null,
  onSelectNode: () => {},
  onToggleNode: () => {},
  diagnosticsCount: 3,
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
