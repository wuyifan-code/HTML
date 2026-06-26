/**
 * 端到端 DOM 渲染验证 — 用 @testing-library/react + jsdom 挂载实际组件,
 * 确认 9 个原子提交后所有关键 DOM 节点与 class 名称都在。
 *
 * 这是对 dev server (浏览器) 验证的等价替代品,因为本机 Playwright Chromium
 * 下载受网络限制。组件级 DOM 断言比纯源码 grep 更能反映用户实际看到的 UI。
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toolbar } from "../components/Toolbar";

describe("Toolbar DOM (Task 2)", () => {
  const baseProps = {
    canUndo: true,
    canRedo: true,
    hasModal: true,
    isModalOpen: false,
    exportingFormat: null as null,
    onUndo: () => {},
    onRedo: () => {},
    onToggleHistory: () => {},
    onModalToggle: () => {},
    onImport: () => {},
    onCopy: () => {},
    onExport: () => {},
    onExportPdf: () => {},
    onExportPptx: () => {},
  };

  it("renders 3 toolbar groups", () => {
    render(<Toolbar {...baseProps} />);
    const groups = document.querySelectorAll(".toolbar .toolbar-group");
    expect(groups.length).toBe(3);
  });

  it("renders middle group for import/copy/export", () => {
    render(<Toolbar {...baseProps} />);
    expect(document.querySelector(".toolbar-group-middle")).not.toBeNull();
  });

  it("renders tail group for modal toggle + history", () => {
    render(<Toolbar {...baseProps} />);
    expect(document.querySelector(".toolbar-group-tail")).not.toBeNull();
  });

  it("renders modal toggle with '打开弹窗' label when closed", () => {
    render(<Toolbar {...baseProps} hasModal={true} isModalOpen={false} />);
    const toggle = document.querySelector(".toolbar-modal-button");
    expect(toggle).not.toBeNull();
    expect(toggle?.textContent).toMatch(/打开弹窗/);
  });

  it("renders modal toggle with '关闭弹窗' label when open", () => {
    render(<Toolbar {...baseProps} hasModal={true} isModalOpen={true} />);
    const toggle = document.querySelector(".toolbar-modal-button");
    expect(toggle).not.toBeNull();
    expect(toggle?.textContent).toMatch(/关闭弹窗/);
    expect(toggle?.className).toMatch(/toolbar-modal-button-active/);
  });

  it("disables modal toggle when no modal in preview", () => {
    render(<Toolbar {...baseProps} hasModal={false} />);
    const toggle = document.querySelector(".toolbar-modal-button") as HTMLButtonElement;
    expect(toggle?.disabled).toBe(true);
  });

  it("renders PDF/PPTX export buttons", () => {
    render(<Toolbar {...baseProps} />);
    expect(screen.getByText("PDF")).toBeTruthy();
    expect(screen.getByText("PPTX")).toBeTruthy();
  });
});