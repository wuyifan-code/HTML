import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EmptyWorkspace } from "../components/workspace/EmptyWorkspace";

const shellCss = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf-8");

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

describe("Empty workspace three-column layout", () => {
  it("illustration area is 200×160 in shell.css", () => {
    expect(shellCss).toMatch(/\.empty-workspace__illustration\s*\{[\s\S]*?width:\s*200px/);
    expect(shellCss).toMatch(/\.empty-workspace__illustration\s*\{[\s\S]*?height:\s*160px/);
  });

  it("CTA has height 36px with margin-top 28px in shell.css", () => {
    expect(shellCss).toMatch(/\.empty-workspace__cta\s*\{[\s\S]*?height:\s*36px/);
    expect(shellCss).toMatch(/\.empty-workspace__cta\s*\{[\s\S]*?margin-top:\s*28px/);
  });

  it("paste link has margin-top 14px in shell.css", () => {
    expect(shellCss).toMatch(/\.empty-workspace__link\s*\{[\s\S]*?margin-top:\s*14px/);
  });

  it("description has max-width 420px in shell.css", () => {
    expect(shellCss).toMatch(/\.empty-workspace__description\s*\{[\s\S]*?max-width:\s*420px/);
  });
});
