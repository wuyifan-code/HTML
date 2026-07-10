import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBar } from "../components/workspace/shell/TopBar";
import { StatusBar } from "../components/workspace/shell/StatusBar";

describe("TopBar", () => {
  const defaultProps = {
    canUndo: false,
    canRedo: false,
    onUndo: () => {},
    onRedo: () => {},
    theme: "light" as const,
    onToggleTheme: () => {},
    isHistoryOpen: false,
    onToggleHistory: () => {},
    onOpenExportPreview: () => {},
    onImportClick: () => {},
    onCopy: () => {},
    onExportPdf: () => {},
    onExportPptx: () => {},
    onToggleCheatsheet: () => {},
    exportingFormat: null as "pdf" | "pptx" | null,
    isMobileShell: false,
    isMobileActionsOpen: false,
    onToggleMobileActions: () => {},
    fileInputRef: { current: null },
    historyTriggerRef: { current: null },
    exportTriggerRef: { current: null },
    mobileActionsRef: { current: null },
    onFileSelected: () => {},
  };

  it("renders brand and export button", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("HTML FineTune")).toBeTruthy();
    expect(screen.getByText("导出")).toBeTruthy();
  });

  it("disables undo/redo when not available", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByLabelText("撤销")).toBeDisabled();
    expect(screen.getByLabelText("重做")).toBeDisabled();
  });

  it("enables undo/redo when available", () => {
    render(<TopBar {...defaultProps} canUndo={true} canRedo={true} />);
    expect(screen.getByLabelText("撤销")).not.toBeDisabled();
    expect(screen.getByLabelText("重做")).not.toBeDisabled();
  });

  it("shows mobile actions popover when open", () => {
    render(<TopBar {...defaultProps} isMobileActionsOpen={true} />);
    expect(screen.getByRole("menu", { name: "更多操作" })).toBeTruthy();
  });

  it("applies correct aria attributes to history button", () => {
    render(<TopBar {...defaultProps} isHistoryOpen={true} />);
    const btn = screen.getByLabelText("查看历史");
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.getAttribute("aria-controls")).toBe("history-drawer");
  });
});

describe("StatusBar", () => {
  it("displays html length and viewport", () => {
    render(
      <StatusBar
        htmlLength={1234}
        selectedLabel="未选择元素"
        statusMessage="实时预览 · 刚刚"
        statusTone="ready"
        viewportWidth={1440}
        viewportHeight={900}
      />
    );
    expect(screen.getByText(/1,234/)).toBeTruthy();
    expect(screen.getByText(/1440/)).toBeTruthy();
    expect(screen.getByText(/900/)).toBeTruthy();
  });

  it("uses status tone class", () => {
    render(
      <StatusBar
        htmlLength={0}
        selectedLabel="未选择元素"
        statusMessage="实时预览 · 刚刚"
        statusTone="ready"
        viewportWidth={1440}
        viewportHeight={900}
      />
    );
    const pill = document.querySelector(".statusbar-pill--ready");
    expect(pill).toBeTruthy();
  });
});
