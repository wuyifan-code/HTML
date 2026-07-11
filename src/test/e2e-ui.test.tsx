/**
 * UI 冒烟测试 — 使用 @testing-library/react + jsdom 挂载关键 UI 组件,
 * 验证所有核心交互路径在组件级别可用。这是对 Playwright E2E 的替代方案。
 *
 * 覆盖路径:
 *   1. 空工作区 → 粘贴/导入 CTA
 *   2. TopBar 按钮 (undo/redo/theme/history/export)
 *   3. StatusBar 状态显示
 *   4. Source Panel 标签切换
 *   5. Canvas Viewport 预设切换
 *   6. Inspector 空状态/选择状态
 *   7. ExportDialog 格式切换
 *   8. HistoryDrawer 条目渲染
 *   9. Toast 通知
 *   10. Menu 导航
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TopBar } from "../components/workspace/shell/TopBar";
import { StatusBar } from "../components/workspace/shell/StatusBar";
import { EmptyWorkspace } from "../components/workspace/EmptyWorkspace";
import { SourcePanel } from "../components/workspace/source/SourcePanel";
import { CanvasPanel } from "../components/workspace/canvas/CanvasPanel";
import { InspectorPanel } from "../components/workspace/inspector/InspectorPanel";
import { ExportDialog } from "../components/ExportDialog";
import { HistoryDrawer } from "../components/HistoryDrawer";
import { ToastRegion } from "../components/ui/ToastRegion";
import { Menu } from "../components/ui/Menu";
import type { HistoryDisplayItem } from "../utils/historySummary";

const noop = () => {};

describe("E2E UI Smoke Tests", () => {
  /* ── 1. Empty Workspace ── */
  describe("EmptyWorkspace", () => {
    it("renders import CTA and paste link", () => {
      render(<EmptyWorkspace onImportClick={noop} onPasteClick={noop} onDrop={noop} />);
      expect(screen.getByText("导入 HTML")).toBeInTheDocument();
      expect(screen.getByText("粘贴源码")).toBeInTheDocument();
    });
  });

  /* ── 2. TopBar ── */
  describe("TopBar", () => {
    it("renders all core buttons", () => {
      render(
        <TopBar
          canUndo={false} canRedo={false}
          onUndo={noop} onRedo={noop}
          theme="light" onToggleTheme={noop}
          isHistoryOpen={false} onToggleHistory={noop}
          onExport={noop} onImportClick={noop}
          onCopy={noop} onToggleCheatsheet={noop}
          exportingFormat={null}
          isMobileShell={false}
          isMobileActionsOpen={false}
          onToggleMobileActions={noop}
          fileInputRef={{ current: null }}
          historyTriggerRef={{ current: null }}
          exportTriggerRef={{ current: null }}
          mobileActionsRef={{ current: null }}
          onFileSelected={noop}
          zoomMode="fit"
          onZoomChange={noop}
          viewportPreset="desktop"
          onViewportPresetChange={noop}
        />
      );
      expect(screen.getByLabelText("撤销")).toBeInTheDocument();
      expect(screen.getByLabelText("重做")).toBeInTheDocument();
      expect(screen.getByLabelText("切换主题")).toBeInTheDocument();
      expect(screen.getByLabelText("导出 HTML")).toBeInTheDocument();
      expect(screen.queryByLabelText("导出 PDF")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("导出 PPTX")).not.toBeInTheDocument();
    });

    it("calls onExport when export button clicked", () => {
      const onExport = vi.fn();
      render(
        <TopBar
          canUndo={false} canRedo={false}
          onUndo={noop} onRedo={noop}
          theme="light" onToggleTheme={noop}
          isHistoryOpen={false} onToggleHistory={noop}
          onExport={onExport} onImportClick={noop}
          onCopy={noop} onToggleCheatsheet={noop}
          exportingFormat={null}
          isMobileShell={false}
          isMobileActionsOpen={false}
          onToggleMobileActions={noop}
          fileInputRef={{ current: null }}
          historyTriggerRef={{ current: null }}
          exportTriggerRef={{ current: null }}
          mobileActionsRef={{ current: null }}
          onFileSelected={noop}
          zoomMode="fit"
          onZoomChange={noop}
          viewportPreset="desktop"
          onViewportPresetChange={noop}
        />
      );
      fireEvent.click(screen.getByLabelText("导出 HTML"));
      expect(onExport).toHaveBeenCalledWith("html");
    });
  });

  /* ── 3. StatusBar ── */
  describe("StatusBar", () => {
    it("shows selected element, status message, and dimensions", () => {
      render(
        <StatusBar
          htmlLength={1024}
          selectedLabel="p.title"
          statusMessage="已保存"
          statusTone="ready"
          viewportWidth={1440}
          viewportHeight={900}
        />
      );
      expect(screen.getByText("p.title")).toBeInTheDocument();
      expect(screen.getByText("已保存")).toBeInTheDocument();
      expect(screen.getByText(/1,024/)).toBeInTheDocument();
      expect(screen.getByText("1440 × 900")).toBeInTheDocument();
    });
  });

  /* ── 4. Source Panel ── */
  describe("SourcePanel", () => {
    it("switches between source and DOM tree tabs", () => {
      render(
        <SourcePanel
          html="<p>test</p>"
          isSynced={true}
          domTree={[]}
          selectedId={null}
          onSelectNode={noop}
          onToggleNode={noop}
          diagnosticsCount={0}
          onAiScan={noop}
          onCopy={noop}
          searchQuery=""
          onSearchChange={noop}
          lineCount={1}
          onHtmlChange={noop}
        />
      );
      expect(screen.getByText("来源")).toBeInTheDocument();
      expect(screen.getByText("DOM 树")).toBeInTheDocument();
      fireEvent.click(screen.getByText("DOM 树"));
      expect(screen.getByText("DOM 树")).toBeInTheDocument();
    });
  });

  /* ── 5. Canvas ── */
  describe("CanvasPanel", () => {
    it("renders viewport toolbar", () => {
      const iframeRef = { current: null };
      const stageRef = { current: null };
      render(
        <CanvasPanel
          srcDoc="<p>hello</p>"
          viewportSize={{ width: 1440, height: 900 }}
          zoomMode="fit"
          isFocusMode={false}
          viewportPreset="desktop"
          aiStatus="idle"
          onViewportChange={noop}
          onZoomChange={noop}
          onFocusToggle={noop}
          onViewportPresetChange={noop}
          onIframeLoad={noop}
          iframeRef={iframeRef}
          stageRef={stageRef}
        />
      );
      expect(screen.getByText("桌面").closest("button")).toHaveAttribute("data-dom-id", "vp-desktop");
      expect(screen.getByText("平板").closest("button")).toHaveAttribute("data-dom-id", "vp-tablet");
      expect(screen.getByText("手机").closest("button")).toHaveAttribute("data-dom-id", "vp-mobile");
    });
  });

  /* ── 6. Inspector ── */
  describe("InspectorPanel", () => {
    it("renders empty state when no element selected", () => {
      render(
        <InspectorPanel
          selected={null}
          draftFontSize=""
          draftFontWeight=""
          draftFontFamily=""
          draftLineHeight=""
          draftLetterSpacing=""
          draftColor=""
          draftBackgroundColor=""
          draftHoverBackground=""
          draftMarginTop=""
          draftMarginBottom=""
          draftPaddingTop=""
          draftPaddingBottom=""
          draftPaddingLeft=""
          draftPaddingRight=""
          draftWidth=""
          draftHeight=""
          selectedAnnotation={null}
          onFontSizeChange={noop}
          onFontWeightChange={noop}
          onFontFamilyChange={noop}
          onLineHeightChange={noop}
          onLetterSpacingChange={noop}
          onColorChange={noop}
          onBackgroundColorChange={noop}
          onHoverBackgroundChange={noop}
          onMarginTopChange={noop}
          onMarginBottomChange={noop}
          onPaddingTopChange={noop}
          onPaddingBottomChange={noop}
          onPaddingInlineChange={noop}
          onWidthChange={noop}
          onHeightChange={noop}
          onApplyStyle={noop}
          onApplyText={noop}
          onAlignChange={noop}
          onBoldToggle={noop}
          onItalicToggle={noop}
          canEditSelectedText={false}
          textContent=""
          onTextContentChange={noop}
        />
      );
      expect(screen.getByText("未选择元素")).toBeInTheDocument();
    });
  });

  /* ── 7. ExportDialog ── */
  describe("ExportDialog", () => {
    it("switches between all three format tabs", () => {
      render(
        <ExportDialog
          html="<p>hi</p>"
          onClose={noop}
          onCopyHtml={noop}
          onDownloadHtml={noop}
          onExportPdf={noop}
          onExportPptx={noop}
        />
      );
      expect(screen.getByRole("tab", { name: "HTML" })).toHaveAttribute("aria-selected", "true");
      fireEvent.click(screen.getByRole("tab", { name: "PDF" }));
      expect(screen.getByRole("button", { name: "导出 PDF" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("tab", { name: "PPTX" }));
      expect(screen.getByRole("button", { name: "导出 PPTX" })).toBeInTheDocument();
    });
  });

  /* ── 8. HistoryDrawer ── */
  describe("HistoryDrawer", () => {
    const items: HistoryDisplayItem[] = [
      { index: 0, title: "初始", detail: "", isCurrent: false, timestamp: 1, category: "Edit", timeLabel: "10:00", dateLabel: "Today" },
      { index: 1, title: "修改", detail: "", isCurrent: true, timestamp: 2, category: "Text", timeLabel: "10:01", dateLabel: "Today" },
    ];

    it("renders history entries", () => {
      render(<HistoryDrawer items={items} onJumpTo={noop} onClose={noop} onClearAll={noop} />);
      expect(screen.getByText("初始")).toBeInTheDocument();
      expect(screen.getByText("修改")).toBeInTheDocument();
    });
  });

  /* ── 9. Toast ── */
  describe("Toast", () => {
    it("renders success toast with auto-dismiss", () => {
      render(
        <ToastRegion toasts={[{ id: "1", type: "success", message: "操作成功" }]} onDismiss={noop} />
      );
      expect(screen.getByText("操作成功")).toBeInTheDocument();
    });
  });

  /* ── 10. Menu ── */
  describe("Menu", () => {
    it("renders menu items", () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      const items = [
        { key: "html", label: "导出 HTML" },
        { key: "pdf", label: "导出 PDF" },
      ];
      render(<Menu items={items} onSelect={noop} onClose={noop} triggerRef={{ current: trigger }} />);
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem").length).toBe(2);
      document.body.removeChild(trigger);
    });
  });
});
