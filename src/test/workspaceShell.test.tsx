import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TopBar } from "../components/workspace/shell/TopBar";
import { StatusBar } from "../components/workspace/shell/StatusBar";

const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf-8");

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
    onExport: () => {},
    onImportClick: () => {},
    onCopy: () => {},
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
    zoomMode: "fit" as const,
    onZoomChange: () => {},
    viewportPreset: "desktop" as const,
    onViewportPresetChange: () => {},
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

  it("renders zoom controls in topbar center", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByLabelText("缩小")).toBeTruthy();
    expect(screen.getByLabelText("放大")).toBeTruthy();
    expect(screen.getByLabelText("100%")).toBeTruthy();
    expect(screen.getByLabelText("适应")).toBeTruthy();
  });
});

describe("TopBar geometry", () => {
  it("topbar height token is 56px in tokens.css", () => {
    expect(tokens).toMatch(/--topbar-height:\s*56px/);
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

  it("statusbar height token is 28px in tokens.css", () => {
    expect(tokens).toMatch(/--statusbar-height:\s*28px/);
  });
});

describe("Shell source and inspector default widths", () => {
  it("source width token is 280px in tokens.css", () => {
    expect(tokens).toMatch(/--source-col:\s*280px/);
  });

  it("inspector width token is 320px per design contract", () => {
    expect(tokens).toMatch(/--inspector-col:\s*320px/);
  });
});
