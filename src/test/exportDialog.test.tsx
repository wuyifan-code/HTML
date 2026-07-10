import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExportDialog } from "../components/ExportDialog";
import type { ExportWarning } from "../utils/exportValidation";

const baseHtml = "<!doctype html><html><head></head><body><p>hi</p></body></html>";

function renderDialog(overrides: Partial<React.ComponentProps<typeof ExportDialog>> = {}) {
  const onClose = vi.fn();
  const onCopyHtml = vi.fn();
  const onDownloadHtml = vi.fn();
  const onExportPdf = vi.fn();
  const onExportPptx = vi.fn();
  const props: React.ComponentProps<typeof ExportDialog> = {
    html: baseHtml,
    onClose,
    onCopyHtml,
    onDownloadHtml,
    onExportPdf,
    onExportPptx,
    ...overrides,
  };
  const utils = render(<ExportDialog {...props} />);
  return { ...utils, onClose, onCopyHtml, onDownloadHtml, onExportPdf, onExportPptx };
}

describe("ExportDialog", () => {
  it("默认初始为 HTML 标签页，显示代码预览", () => {
    renderDialog();
    expect(screen.getByRole("tab", { name: "HTML" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "导出的 HTML 代码预览" })).toHaveValue(baseHtml);
    expect(screen.getByRole("button", { name: /下载 edited-page\.html/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /复制干净 HTML/ })).toBeInTheDocument();
  });

  it("切换到 PDF 标签页后显示 PDF 导出按钮", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("tab", { name: "PDF" }));
    expect(screen.getByRole("tab", { name: "PDF" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "导出 PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "导出的 HTML 代码预览" })).toBeNull();
  });

  it("切换到 PPTX 标签页后显示 PPTX 导出按钮", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("tab", { name: "PPTX" }));
    expect(screen.getByRole("tab", { name: "PPTX" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "导出 PPTX" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "导出的 HTML 代码预览" })).toBeNull();
  });

  it("initialFormat 可指定初始标签页", () => {
    renderDialog({ initialFormat: "pdf" });
    expect(screen.getByRole("tab", { name: "PDF" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "导出 PDF" })).toBeInTheDocument();
  });

  it("HTML 标签页可复制和下载", () => {
    const { onCopyHtml, onDownloadHtml } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /复制干净 HTML/ }));
    expect(onCopyHtml).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /下载 edited-page\.html/ }));
    expect(onDownloadHtml).toHaveBeenCalledTimes(1);
  });

  it("PDF 标签页触发 onExportPdf", () => {
    const { onExportPdf } = renderDialog();
    fireEvent.click(screen.getByRole("tab", { name: "PDF" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 PDF" }));
    expect(onExportPdf).toHaveBeenCalledTimes(1);
  });

  it("PPTX 标签页触发 onExportPptx", () => {
    const { onExportPptx } = renderDialog();
    fireEvent.click(screen.getByRole("tab", { name: "PPTX" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 PPTX" }));
    expect(onExportPptx).toHaveBeenCalledTimes(1);
  });

  it("blocking 状态禁用导出按钮", () => {
    renderDialog({ html: '<div data-hft-id="x">x</div>' });
    expect(screen.getByRole("button", { name: /下载 edited-page\.html/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "PDF" }));
    expect(screen.getByRole("button", { name: "导出 PDF" })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "PPTX" }));
    expect(screen.getByRole("button", { name: "导出 PPTX" })).toBeDisabled();
  });

  it("展示 warning 列表", () => {
    const warnings: ExportWarning[] = [
      { type: "general", message: "提示消息" },
    ];
    renderDialog({ warnings });
    expect(document.querySelector(".export-warning-list")).not.toBeNull();
    expect(document.querySelector(".export-warning-list")?.textContent).toContain("提示消息");
  });

  it("isExportingPdf 时 PDF 按钮显示加载状态", () => {
    renderDialog({ initialFormat: "pdf", isExportingPdf: true });
    expect(screen.getByRole("button", { name: "导出 PDF 中…" })).toBeDisabled();
  });

  it("isExportingPptx 时 PPTX 按钮显示加载状态", () => {
    renderDialog({ initialFormat: "pptx", isExportingPptx: true });
    expect(screen.getByRole("button", { name: "导出 PPTX 中…" })).toBeDisabled();
  });

  it("关闭按钮触发 onClose", () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /关闭导出/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
