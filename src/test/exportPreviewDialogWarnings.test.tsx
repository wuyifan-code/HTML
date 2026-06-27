import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExportPreviewDialog } from "../components/ExportPreviewDialog";
import type { ExportWarning } from "../utils/exportValidation";

const baseHtml = "<!doctype html><html><head></head><body><p>hi</p></body></html>";

function renderDialog(overrides: Partial<React.ComponentProps<typeof ExportPreviewDialog>> = {}) {
  const onClose = vi.fn();
  const onCopy = vi.fn();
  const onDownload = vi.fn();
  const props: React.ComponentProps<typeof ExportPreviewDialog> = {
    html: baseHtml,
    onClose,
    onCopy,
    onDownload,
    ...overrides,
  };
  const utils = render(<ExportPreviewDialog {...props} />);
  return { ...utils, onClose, onCopy, onDownload };
}

describe("ExportPreviewDialog — warnings wiring", () => {
  it("默认无 warnings：下载按钮 enabled，警告列表不渲染", () => {
    renderDialog();
    const downloadBtn = screen.getByRole("button", { name: /下载 edited-page\.html/ });
    expect(downloadBtn).not.toBeDisabled();
    expect(document.querySelector(".export-warning-list")).toBeNull();
    expect(document.querySelector(".export-status-pill.is-warning")).toBeNull();
  });

  it("html 含 internal marker (data-hft-id)：展示 .export-status-pill.is-warning，下载按钮 disabled", () => {
    renderDialog({ html: '<div data-hft-id="x">x</div>' });
    expect(document.querySelector(".export-status-pill.is-warning")).not.toBeNull();
    const downloadBtn = screen.getByRole("button", { name: /下载 edited-page\.html/ });
    expect(downloadBtn).toBeDisabled();
  });

  it("非 blocking warning (general)：警告列表渲染，但下载按钮 enabled", () => {
    const warnings: ExportWarning[] = [
      { type: "general", message: "非阻塞提示：页面结构较复杂" },
    ];
    renderDialog({ warnings });
    const list = document.querySelector(".export-warning-list");
    expect(list).not.toBeNull();
    expect(list?.textContent).toContain("非阻塞提示：页面结构较复杂");
    const downloadBtn = screen.getByRole("button", { name: /下载 edited-page\.html/ });
    expect(downloadBtn).not.toBeDisabled();
  });

  it("blocking warning (internal-attribute)：下载按钮 disabled，警告列表渲染", () => {
    const warnings: ExportWarning[] = [
      { type: "internal-attribute", message: "仍包含 data-hft-id" },
    ];
    renderDialog({ warnings });
    expect(document.querySelector(".export-warning-list")?.textContent).toContain("仍包含 data-hft-id");
    const downloadBtn = screen.getByRole("button", { name: /下载 edited-page\.html/ });
    expect(downloadBtn).toBeDisabled();
  });

  it.each([
    ["internal-attribute", "data-hft-id 残留"],
    ["internal-element", "bridge style 残留"],
    ["empty-html", "HTML 为空"],
  ] as const)("blocking 类型 %s：下载按钮必为 disabled", (type, message) => {
    renderDialog({ warnings: [{ type, message }] });
    expect(screen.getByRole("button", { name: /下载 edited-page\.html/ })).toBeDisabled();
  });

  it("复制 / 关闭 / 下载三个回调正常触发", () => {
    const { onClose, onCopy, onDownload } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /复制干净 HTML/ }));
    fireEvent.click(screen.getByRole("button", { name: /关闭导出预览/ }));
    fireEvent.click(screen.getByRole("button", { name: /下载 edited-page\.html/ }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});