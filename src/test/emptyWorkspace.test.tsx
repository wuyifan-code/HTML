import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyWorkspace } from "../components/workspace/EmptyWorkspace";

describe("EmptyWorkspace", () => {
  const defaultProps = {
    onImportClick: () => {},
    onPasteClick: () => {},
    onDrop: () => {},
  };

  it("renders title and description", () => {
    render(<EmptyWorkspace {...defaultProps} />);
    expect(screen.getByText("拖入 HTML 文件，或粘贴代码开始")).toBeTruthy();
    expect(screen.getByText(/支持导入 .html 文件/)).toBeTruthy();
  });

  it("renders import and paste buttons", () => {
    render(<EmptyWorkspace {...defaultProps} />);
    expect(screen.getByText("导入 HTML")).toBeTruthy();
    expect(screen.getByText("粘贴源码")).toBeTruthy();
  });

  it("calls onImportClick when import button is clicked", () => {
    let called = false;
    render(<EmptyWorkspace {...defaultProps} onImportClick={() => { called = true; }} />);
    fireEvent.click(screen.getByText("导入 HTML"));
    expect(called).toBe(true);
  });

  it("calls onPasteClick when paste link is clicked", () => {
    let called = false;
    render(<EmptyWorkspace {...defaultProps} onPasteClick={() => { called = true; }} />);
    fireEvent.click(screen.getByText("粘贴源码"));
    expect(called).toBe(true);
  });

  it("calls onDrop when a .html file is dropped", () => {
    let droppedFile: File | undefined;
    render(<EmptyWorkspace {...defaultProps} onDrop={(f) => { droppedFile = f; }} />);
    const file = new File(["test"], "test.html", { type: "text/html" });
    const section = screen.getByLabelText("空白工作区");
    fireEvent.drop(section, { dataTransfer: { files: [file] } });
    expect(droppedFile).toBe(file);
  });

  it("shows drag-over state on drag enter", () => {
    render(<EmptyWorkspace {...defaultProps} />);
    const section = screen.getByLabelText("空白工作区");
    fireEvent.dragEnter(section, { dataTransfer: { items: [{ kind: "file" }] } });
    expect(section.className).toContain("empty-workspace--drag-over");
  });

  it("removes drag-over state on drag leave", () => {
    render(<EmptyWorkspace {...defaultProps} />);
    const section = screen.getByLabelText("空白工作区");
    fireEvent.dragEnter(section, { dataTransfer: { items: [{ kind: "file" }] } });
    fireEvent.dragLeave(section, { dataTransfer: { items: [] } });
    expect(section.className).not.toContain("empty-workspace--drag-over");
  });
});
