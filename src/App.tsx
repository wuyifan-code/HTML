import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
        className={[
          "workspace",
          isSourceCollapsed ? "workspace-source-collapsed" : "",
          isInspectorCollapsed ? "workspace-inspector-collapsed" : "",
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
          onSelectElement={handleSelectFromTree}
          isCollapsed={isSourceCollapsed}
          onToggleCollapse={() => setIsSourceCollapsed((value) => !value)}
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
