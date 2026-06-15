import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { ExportPreviewDialog } from "./components/ExportPreviewDialog";
import { Header } from "./components/Header";
import { HistoryPanel } from "./components/HistoryPanel";
import { HtmlInputPanel } from "./components/HtmlInputPanel";
import { PreviewFrame } from "./components/PreviewFrame";
import { StyleEditorPanel } from "./components/StyleEditorPanel";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { sampleHtml } from "./sampleHtml";
import type {
  EditableStyleKey,
  ModalCommand,
  ModalState,
  PreviewViewportMode,
  SelectElementCommand,
  SelectedElementSnapshot,
  EditableEffects,
  EditableAttributes,
  ElementQuickAction,
  SourcePanelPlacement,
} from "./types/editor";
import { cleanHtmlForExport } from "./utils/cleanHtmlForExport";
import { copyHtmlToClipboard } from "./utils/clipboard";
import { buildEditableDomTree } from "./utils/domTree";
import {
  deleteHtmlElementByHftId,
  duplicateHtmlElementByHftId,
  getHoverBackgroundColor,
  hasElementWithHftId,
  updateHtmlElementByHftId,
} from "./utils/domPath";
import { exportHtml } from "./utils/exportHtml";
import { buildHistoryDisplayItems } from "./utils/historySummary";
import { injectEditableIds } from "./utils/injectEditableIds";

const initialHtml = injectEditableIds(sampleHtml).html;
const MIN_SOURCE_WIDTH = 260;
const MIN_INSPECTOR_WIDTH = 260;
const MIN_PREVIEW_WIDTH = 430;
const DEFAULT_SOURCE_WIDTH = 380;
const DEFAULT_INSPECTOR_WIDTH = 320;
const RESIZER_WIDTH = 18;

export default function App() {
  const history = useEditorHistory({ html: initialHtml, selectedId: null });
  const { state } = history;
  const latestHtmlRef = useRef(state.html);
  const [selectedElement, setSelectedElement] = useState<SelectedElementSnapshot | null>(null);
  const [statusMessage, setStatusMessage] = useState("仅本地运行 · iframe srcDoc · postMessage 通信");
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ found: false, open: false, label: "" });
  const [modalCommand, setModalCommand] = useState<ModalCommand | null>(null);
  const [selectCommand, setSelectCommand] = useState<SelectElementCommand | null>(null);
  const [previewViewportMode, setPreviewViewportMode] = useState<PreviewViewportMode>("desktop");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [exportPreviewHtml, setExportPreviewHtml] = useState<string | null>(null);
  const [sourcePanelPlacement, setSourcePanelPlacement] = useState<SourcePanelPlacement>("side");
  const [sourceWidth, setSourceWidth] = useState(DEFAULT_SOURCE_WIDTH);
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_INSPECTOR_WIDTH);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [hasImportedHtml, setHasImportedHtml] = useState(false);
  const workspaceRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    latestHtmlRef.current = state.html;
  }, [state.html]);

  const updateSelectedElement = useCallback(
    (nextElement: SelectedElementSnapshot) => {
      setSelectedElement(withElementEffects(nextElement, latestHtmlRef.current));
      history.commit(
        {
          html: latestHtmlRef.current,
          selectedId: nextElement.hftId,
        },
        { record: false }
      );
    },
    [history]
  );

  const applyTextUpdate = useCallback(
    (text: string) => {
      if (!selectedElement) return;
      const nextHtml = updateHtmlElementByHftId(state.html, selectedElement.hftId, { text });
      history.commit(
        {
          html: nextHtml,
          selectedId: selectedElement.hftId,
        },
        { debounce: true }
      );
      setSelectedElement({ ...selectedElement, text });
    },
    [history, selectedElement, state.html]
  );

  const applyStyleUpdate = useCallback(
    (property: EditableStyleKey, value: string) => {
      if (!selectedElement) return;
      const styles = withRelatedStyleUpdates(property, value, selectedElement);
      const nextHtml = updateHtmlElementByHftId(state.html, selectedElement.hftId, {
        styles,
      });
      history.commit({
        html: nextHtml,
        selectedId: selectedElement.hftId,
      });
      setSelectedElement({
        ...selectedElement,
        styles: {
          ...selectedElement.styles,
          ...styles,
        },
        hasInlineStyle: true,
      });
    },
    [history, selectedElement, state.html]
  );

  const applyEffectUpdate = useCallback(
    (property: keyof EditableEffects, value: string) => {
      if (!selectedElement) return;
      const nextHtml = updateHtmlElementByHftId(state.html, selectedElement.hftId, {
        effects: { [property]: value },
      });
      history.commit({
        html: nextHtml,
        selectedId: selectedElement.hftId,
      });
      setSelectedElement({
        ...selectedElement,
        effects: {
          ...selectedElement.effects,
          [property]: value,
        },
      });
    },
    [history, selectedElement, state.html]
  );

  const applyAttributeUpdate = useCallback(
    (property: keyof EditableAttributes, value: string) => {
      if (!selectedElement) return;
      const nextHtml = updateHtmlElementByHftId(state.html, selectedElement.hftId, {
        attributes: { [property]: value },
      });
      history.commit({
        html: nextHtml,
        selectedId: selectedElement.hftId,
      });
      setSelectedElement({
        ...selectedElement,
        attributes: {
          ...selectedElement.attributes,
          [property]: value,
        },
      });
    },
    [history, selectedElement, state.html]
  );

  const handleHtmlChange = useCallback(
    (value: string) => {
      const nextHtml = injectEditableIds(value).html;
      history.commit(
        {
          html: nextHtml,
          selectedId: null,
        },
        { debounce: true }
      );
      setSelectedElement(null);
      setModalState({ found: false, open: false, label: "" });
      setModalCommand(null);
    },
    [history]
  );

  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const nextHtml = injectEditableIds(String(reader.result ?? "")).html;
        history.reset({
          html: nextHtml,
          selectedId: null,
        });
        setSelectedElement(null);
        setModalState({ found: false, open: false, label: "" });
        setModalCommand(null);
        setHasImportedHtml(true);
        setStatusMessage(`已导入 ${file.name}`);
      };
      reader.readAsText(file);
    },
    [history]
  );

  const handleCopy = useCallback(async () => {
    const cleanHtml = cleanHtmlForExport(state.html);
    await copyHtmlToClipboard(cleanHtml);
    setStatusMessage("已复制干净 HTML 到剪贴板");
  }, [state.html]);

  const handleExport = useCallback(() => {
    setExportPreviewHtml(cleanHtmlForExport(state.html));
    setStatusMessage("已生成导出前预览");
  }, [state.html]);

  const handleDownloadExportPreview = useCallback(() => {
    if (!exportPreviewHtml) return;
    exportHtml(exportPreviewHtml);
    setExportPreviewHtml(null);
    setStatusMessage("已导出干净 HTML");
  }, [exportPreviewHtml]);

  const handleCopyExportPreview = useCallback(async () => {
    if (!exportPreviewHtml) return;
    await copyHtmlToClipboard(exportPreviewHtml);
    setStatusMessage("已复制导出预览中的干净 HTML");
  }, [exportPreviewHtml]);

  const handleUndo = useCallback(() => {
    history.undo();
    setStatusMessage("已撤销上一步编辑");
  }, [history]);

  const handleRedo = useCallback(() => {
    history.redo();
    setStatusMessage("已重做编辑");
  }, [history]);

  const handleJumpToHistory = useCallback(
    (index: number) => {
      history.jumpToHistoryIndex(index);
      setStatusMessage(`已跳转到历史第 ${index + 1} 步`);
    },
    [history]
  );

  const handleModalStateChange = useCallback((nextState: ModalState) => {
    setModalState(nextState);
  }, []);

  const handleOpenModal = useCallback(() => {
    setModalCommand({ id: Date.now(), action: "open" });
    setStatusMessage("正在打开预览中的弹窗");
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalCommand({ id: Date.now(), action: "close" });
    setStatusMessage("正在关闭预览中的弹窗");
  }, []);

  const isFocusPreview = isSourceCollapsed && isInspectorCollapsed;

  const handleToggleFocusPreview = useCallback(() => {
    if (isSourceCollapsed && isInspectorCollapsed) {
      setIsSourceCollapsed(false);
      setIsInspectorCollapsed(false);
      setStatusMessage("已恢复三栏编辑视图");
    } else {
      setIsSourceCollapsed(true);
      setIsInspectorCollapsed(true);
      setIsHistoryOpen(false);
      setStatusMessage("已进入专注预览");
    }
  }, [isInspectorCollapsed, isSourceCollapsed]);

  const handleToggleSourcePlacement = useCallback(() => {
    setSourcePanelPlacement((placement) => (placement === "side" ? "bottom" : "side"));
    setIsSourceCollapsed(false);
    setStatusMessage(sourcePanelPlacement === "side" ? "源码区已移到底部" : "源码区已回到左侧");
  }, [sourcePanelPlacement]);

  const startPanelResize = useCallback(
    (panel: "source" | "inspector") => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (sourcePanelPlacement !== "side") return;
      const workspace = workspaceRef.current;
      if (!workspace) return;

      event.preventDefault();
      const rect = workspace.getBoundingClientRect();
      const startSourceWidth = sourceWidth;
      const startInspectorWidth = inspectorWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const availableWidth = rect.width - RESIZER_WIDTH * 2;

        if (panel === "source") {
          const nextWidth = clamp(
            moveEvent.clientX - rect.left,
            MIN_SOURCE_WIDTH,
            Math.max(MIN_SOURCE_WIDTH, availableWidth - startInspectorWidth - MIN_PREVIEW_WIDTH)
          );
          setSourceWidth(nextWidth);
          return;
        }

        const nextWidth = clamp(
          rect.right - moveEvent.clientX,
          MIN_INSPECTOR_WIDTH,
          Math.max(MIN_INSPECTOR_WIDTH, availableWidth - startSourceWidth - MIN_PREVIEW_WIDTH)
        );
        setInspectorWidth(nextWidth);
      };

      const handlePointerUp = () => {
        document.body.classList.remove("is-resizing-panels");
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      document.body.classList.add("is-resizing-panels");
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [inspectorWidth, sourcePanelPlacement, sourceWidth]
  );

  const handleSelectFromTree = useCallback((hftId: string) => {
    setSelectCommand({ id: Date.now(), hftId });
    history.commit(
      {
        html: latestHtmlRef.current,
        selectedId: hftId,
      },
      { record: false }
    );
    setStatusMessage(`已从结构面板定位 ${hftId}`);
  }, [history]);

  const handleElementQuickAction = useCallback(
    (hftId: string, action: ElementQuickAction) => {
      const mutatedHtml =
        action === "duplicate"
          ? duplicateHtmlElementByHftId(state.html, hftId)
          : deleteHtmlElementByHftId(state.html, hftId);
      const nextHtml = action === "duplicate" ? injectEditableIds(mutatedHtml).html : mutatedHtml;

      history.commit({
        html: nextHtml,
        selectedId: null,
      });
      setSelectedElement(null);
      setStatusMessage(action === "duplicate" ? "已复制选中元素" : "已删除选中元素");
    },
    [history, state.html]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;

      event.preventDefault();
      if ((key === "z" && event.shiftKey) || key === "y") {
        handleRedo();
      } else {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleRedo, handleUndo]);

  useEffect(() => {
    if (!state.selectedId) {
      setSelectedElement(null);
      return;
    }

    if (!hasElementWithHftId(state.html, state.selectedId)) {
      history.commit(
        {
          html: state.html,
          selectedId: null,
        },
        { record: false }
      );
      setSelectedElement(null);
    }
  }, [history, state.html, state.selectedId]);

  const editorStatus = useMemo(() => {
    if (!selectedElement) return "未选择元素";
    return `已选择 ${selectedElement.tagName.toUpperCase()} · ${selectedElement.hftId}`;
  }, [selectedElement]);

  const domTree = useMemo(() => buildEditableDomTree(state.html), [state.html]);
  const historyItems = useMemo(
    () => buildHistoryDisplayItems(history.timeline, history.currentIndex),
    [history.currentIndex, history.timeline]
  );
  const workspaceStyle = useMemo(
    () =>
      ({
        "--source-col": isSourceCollapsed ? "56px" : `${sourceWidth}px`,
        "--inspector-col": isInspectorCollapsed ? "56px" : `${inspectorWidth}px`,
      }) as CSSProperties,
    [inspectorWidth, isInspectorCollapsed, isSourceCollapsed, sourceWidth]
  );
  const previewStatusText = isPreviewReady ? "实时预览 · 已就绪" : "实时预览 · 渲染中";
  const characterCountText = `${state.html.length.toLocaleString()} 字符`;

  return (
    <div className={`app-shell${isFocusPreview ? " app-shell-focus-preview" : ""}`}>
      <Header
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        hasModal={modalState.found}
        isModalOpen={modalState.open}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleHistory={() => setIsHistoryOpen((value) => !value)}
        onOpenModal={handleOpenModal}
        onCloseModal={handleCloseModal}
        onImport={handleImport}
        onCopy={handleCopy}
        onExport={handleExport}
      />
      {isHistoryOpen && !isFocusPreview ? (
        <HistoryPanel
          items={historyItems}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onJumpTo={handleJumpToHistory}
          onClose={() => setIsHistoryOpen(false)}
        />
      ) : null}
      {exportPreviewHtml ? (
        <ExportPreviewDialog
          html={exportPreviewHtml}
          onClose={() => setExportPreviewHtml(null)}
          onCopy={handleCopyExportPreview}
          onDownload={handleDownloadExportPreview}
        />
      ) : null}
      <main
        ref={workspaceRef}
        style={workspaceStyle}
        className={[
          "workspace",
          isSourceCollapsed ? "workspace-source-collapsed" : "",
          isInspectorCollapsed ? "workspace-inspector-collapsed" : "",
          sourcePanelPlacement === "bottom" ? "workspace-source-bottom" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="HTML FineTune 编辑工作区"
      >
        <HtmlInputPanel
          value={state.html}
          domTree={domTree}
          selectedId={state.selectedId}
          onChange={handleHtmlChange}
          onImport={handleImport}
          onSelectElement={handleSelectFromTree}
          isCollapsed={isSourceCollapsed}
          onToggleCollapse={() => setIsSourceCollapsed((value) => !value)}
          placement={sourcePanelPlacement}
          onTogglePlacement={handleToggleSourcePlacement}
          showImportDropzone={!hasImportedHtml}
        />
        <button
          className="workspace-resizer workspace-resizer-source"
          type="button"
          aria-label="拖拽调整源码区宽度"
          onPointerDown={startPanelResize("source")}
        />
        <PreviewFrame
          html={state.html}
          selectedId={state.selectedId}
          modalCommand={modalCommand}
          selectCommand={selectCommand}
          viewportMode={previewViewportMode}
          isFocusPreview={isFocusPreview}
          onViewportModeChange={setPreviewViewportMode}
          onToggleFocusPreview={handleToggleFocusPreview}
          onElementSelected={updateSelectedElement}
          onModalStateChange={handleModalStateChange}
          onElementAction={handleElementQuickAction}
          onReadyChange={setIsPreviewReady}
        />
        <button
          className="workspace-resizer workspace-resizer-inspector"
          type="button"
          aria-label="拖拽调整检查器宽度"
          onPointerDown={startPanelResize("inspector")}
        />
        <StyleEditorPanel
          selectedElement={selectedElement}
          onTextChange={applyTextUpdate}
          onStyleChange={applyStyleUpdate}
          onEffectChange={applyEffectUpdate}
          onAttributeChange={applyAttributeUpdate}
          isCollapsed={isInspectorCollapsed}
          onToggleCollapse={() => setIsInspectorCollapsed((value) => !value)}
        />
      </main>
      <footer className="status-bar" aria-live="polite">
        <span>{editorStatus}</span>
        <span>{characterCountText}</span>
        <span>{previewStatusText}</span>
        <span>{statusMessage}</span>
      </footer>
    </div>
  );
}

function withElementEffects(element: SelectedElementSnapshot, html: string): SelectedElementSnapshot {
  return {
    ...element,
    effects: {
      ...element.effects,
      hoverBackgroundColor: getHoverBackgroundColor(html, element.hftId),
    },
  };
}

function withRelatedStyleUpdates(
  property: EditableStyleKey,
  value: string,
  selectedElement: SelectedElementSnapshot
): Partial<SelectedElementSnapshot["styles"]> {
  const styles: Partial<SelectedElementSnapshot["styles"]> = { [property]: value };

  if (
    (property === "borderWidth" || property === "borderColor") &&
    value.trim()
  ) {
    styles.borderStyle =
      selectedElement.styles.borderStyle && selectedElement.styles.borderStyle !== "none"
        ? selectedElement.styles.borderStyle
        : "solid";
  }

  return styles;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
