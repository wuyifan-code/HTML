import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import type { CSSProperties } from "react";
import { Header } from "./components/Header";
import { HtmlInputPanel } from "./components/HtmlInputPanel";
import { PreviewFrame } from "./components/PreviewFrame";
import { StyleEditorPanel } from "./components/StyleEditorPanel";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { usePanelResize } from "./hooks/usePanelResize";
import { sampleHtml } from "./sampleHtml";
import type {
  EditableStyleKey,
  ModalCommand,
  ModalState,
  PatchCommand,
  PreviewViewportMode,
  SelectElementCommand,
  SelectedElementSnapshot,
  EditableEffects,
  EditableAttributes,
  ElementQuickAction,
  SourcePanelPlacement,
  AiAnalysisStatus,
  AiTreeAnnotation,
} from "./types/editor";
import { cleanHtmlForExport } from "./utils/cleanHtmlForExport";
import { copyHtmlToClipboard } from "./utils/clipboard";
import { assertCleanExport, getExportWarnings } from "./utils/exportValidation";
import { buildEditableDomTree } from "./utils/domTree";
import {
  deleteHtmlElementByHftId,
  duplicateHtmlElementByHftId,
  getDomPath,
  getHoverBackgroundColor,
  hasElementWithHftId,
  moveHtmlElementByHftId,
  queryElementByHftId,
  updateHtmlElementByHftId,
} from "./utils/domPath";
import { exportHtml } from "./utils/exportHtml";
import { exportPdfFromHtml, formatPdfError } from "./utils/exportPdf";
import { exportPptxFromHtml, formatPptxError } from "./utils/exportPptx";
import type { DocumentExportFormat } from "./utils/exportErrors";
import { buildDisplayItemsFromSummaries } from "./utils/historySummary";
import { injectEditableIds } from "./utils/injectEditableIds";
import {
  getElementClassName,
  getNormalizedTagName,
  isEditableSvgTextElement,
  isRootSvgElement,
  isSvgImageElement,
} from "./utils/editableElement";
import {
  AI_PROVIDER_DEFINITIONS,
  AI_PROVIDER_MAP,
  analyzeStructureWithAi,
  buildPresetAiModelOptions,
  fetchAiModelOptions,
  mergeAiModelOptions,
  type AiModelFetchStatus,
  type AiModelOption,
  type AiProviderId,
} from "./utils/aiStructure";

const HistoryPanel = lazy(() =>
  import("./components/HistoryPanel").then((m) => ({ default: m.HistoryPanel }))
);
const ExportPreviewDialog = lazy(() =>
  import("./components/ExportPreviewDialog").then((m) => ({ default: m.ExportPreviewDialog }))
);

const initialHtml = injectEditableIds(sampleHtml).html;
const DEFAULT_SOURCE_WIDTH = 292;
const DEFAULT_INSPECTOR_WIDTH = 318;
const AI_KEY_STORAGE = "html-finetune.ai-provider-keys";
const AI_LEGACY_GEMMA_KEY_STORAGE = "html-finetune.gemma-api-key";
const DEFAULT_AI_PROVIDER: AiProviderId = "google";

type StyleClipboard = Pick<SelectedElementSnapshot, "styles" | "effects">;

function loadStoredAiKeys(): Record<string, string> {
  const rawKeys = window.localStorage.getItem(AI_KEY_STORAGE);
  if (rawKeys) {
    try {
      const parsed = JSON.parse(rawKeys) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      );
    } catch {
      window.localStorage.removeItem(AI_KEY_STORAGE);
    }
  }

  const legacyGemmaKey = window.localStorage.getItem(AI_LEGACY_GEMMA_KEY_STORAGE);
  return legacyGemmaKey ? { google: legacyGemmaKey } : {};
}

function getInitialAiModelOptions(): Record<string, AiModelOption[]> {
  return Object.fromEntries(
    AI_PROVIDER_DEFINITIONS.map((provider) => [provider.id, buildPresetAiModelOptions(provider)])
  );
}

export default function App() {
  const history = useEditorHistory({ html: initialHtml, selectedId: null });
  const {
    state,
    commit,
    reset,
    undo,
    redo,
    jumpToHistoryIndex,
    timeline,
    summaries,
    currentIndex,
    canUndo,
    canRedo,
    flushDebouncedHistory,
  } = history;
  const latestHtmlRef = useRef(state.html);
  const [selectedElement, setSelectedElement] = useState<SelectedElementSnapshot | null>(null);
  const [statusMessage, setStatusMessage] = useState("仅本地运行 · iframe srcDoc · postMessage 通信");
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ found: false, open: false, label: "" });
  const [modalCommand, setModalCommand] = useState<ModalCommand | null>(null);
  const [selectCommand, setSelectCommand] = useState<SelectElementCommand | null>(null);
  const [patchCommand, setPatchCommand] = useState<PatchCommand | null>(null);
  const [styleClipboard, setStyleClipboard] = useState<StyleClipboard | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [sourceView, setSourceView] = useState<"source" | "tree">("tree");
  const [previewViewportMode, setPreviewViewportMode] = useState<PreviewViewportMode>("desktop");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStatusSecondaryOpen, setIsStatusSecondaryOpen] = useState(false);
  const [exportPreviewHtml, setExportPreviewHtml] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<DocumentExportFormat | null>(null);
  const [sourcePanelPlacement, setSourcePanelPlacement] = useState<SourcePanelPlacement>("side");
  const [sourceWidth, setSourceWidth] = useState(DEFAULT_SOURCE_WIDTH);
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_INSPECTOR_WIDTH);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [hasImportedHtml, setHasImportedHtml] = useState(false);
  const [aiProvider, setAiProvider] = useState<AiProviderId>(DEFAULT_AI_PROVIDER);
  const [aiApiKeys, setAiApiKeys] = useState<Record<string, string>>(() => loadStoredAiKeys());
  const [rememberAiKeys, setRememberAiKeys] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Object.keys(loadStoredAiKeys()).map((providerId) => [providerId, true]))
  );
  const [aiModels, setAiModels] = useState<Record<string, string>>(() =>
    Object.fromEntries(AI_PROVIDER_DEFINITIONS.map((provider) => [provider.id, provider.defaultModel]))
  );
  const [aiModelOptions, setAiModelOptions] = useState<Record<string, AiModelOption[]>>(() => getInitialAiModelOptions());
  const [aiModelFetchStatus, setAiModelFetchStatus] = useState<AiModelFetchStatus>("idle");
  const [aiModelFetchError, setAiModelFetchError] = useState("");
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<AiAnalysisStatus>("idle");
  const [aiAnalysisError, setAiAnalysisError] = useState("");
  const [aiAnnotations, setAiAnnotations] = useState<Record<string, AiTreeAnnotation>>({});
  const workspaceRef = useRef<HTMLElement | null>(null);
  const aiModelFetchRequestRef = useRef(0);
  const currentAiProvider = AI_PROVIDER_MAP[aiProvider] ?? AI_PROVIDER_MAP[DEFAULT_AI_PROVIDER];
  const currentAiKey = aiApiKeys[aiProvider] || "";
  const currentAiRememberKey = Boolean(rememberAiKeys[aiProvider]);
  const currentAiModel = aiModels[aiProvider] || currentAiProvider.defaultModel;
  const currentAiModelOptions = aiModelOptions[aiProvider] || buildPresetAiModelOptions(currentAiProvider);
  const domTree = useMemo(() => buildEditableDomTree(state.html), [state.html]);

  useEffect(() => {
    latestHtmlRef.current = state.html;
  }, [state.html]);

  useEffect(() => {
    const storedKeys = Object.fromEntries(
      Object.entries(aiApiKeys)
        .map(([providerId, key]) => [providerId, key.trim()] as const)
        .filter(([providerId, key]) => rememberAiKeys[providerId] && key)
    );
    if (Object.keys(storedKeys).length > 0) {
      window.localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(storedKeys));
    } else {
      window.localStorage.removeItem(AI_KEY_STORAGE);
    }
    window.localStorage.removeItem(AI_LEGACY_GEMMA_KEY_STORAGE);
  }, [aiApiKeys, rememberAiKeys]);

  const updateSelectedElement = useCallback(
    (nextElement: SelectedElementSnapshot) => {
      const currentHtml = latestHtmlRef.current;
      const elementWithEffects = withElementEffects(nextElement, currentHtml);
      // ⑦ 守卫:同一元素的重复回传仍刷新检查器,但不再写历史。
      if (nextElement.hftId === state.selectedId && selectedElement?.hftId === nextElement.hftId) {
        flushDebouncedHistory();
        setSelectedElement(elementWithEffects);
        return;
      }
      flushDebouncedHistory();
      setSelectedElement(elementWithEffects);
      commit(
        {
          html: currentHtml,
          selectedId: nextElement.hftId,
        },
        { record: false }
      );
    },
    [commit, flushDebouncedHistory, selectedElement?.hftId, state.selectedId]
  );

	  const applyTextUpdate = useCallback(
	    (text: string) => {
	      if (!selectedElement?.canEditText) return;
	      const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, selectedElement.hftId, { text });
	      latestHtmlRef.current = nextHtml;
	      commit(
	        {
	          html: nextHtml,
	          selectedId: selectedElement.hftId,
	        },
	        { debounce: true }
	      );
	      setSelectedElement({ ...selectedElement, text });
	      setPatchCommand({ id: Date.now(), hftId: selectedElement.hftId, patch: { text } });
	    },
    [commit, selectedElement]
  );

	  const applyStyleUpdate = useCallback(
	    (property: EditableStyleKey, value: string) => {
	      if (!selectedElement) return;
	      const styles = withRelatedStyleUpdates(property, value, selectedElement);
	      const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, selectedElement.hftId, {
	        styles,
	      });
	      latestHtmlRef.current = nextHtml;
	      commit(
	        {
	          html: nextHtml,
	          selectedId: selectedElement.hftId,
	        },
	        { debounce: true }
	      );
	      setSelectedElement({
	        ...selectedElement,
	        styles: {
	          ...selectedElement.styles,
	          ...styles,
	        },
	        hasInlineStyle: true,
	      });
	      setPatchCommand({ id: Date.now(), hftId: selectedElement.hftId, patch: { styles } });
	    },
    [commit, selectedElement]
  );

	  const applyEffectUpdate = useCallback(
	    (property: keyof EditableEffects, value: string) => {
	      if (!selectedElement) return;
	      const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, selectedElement.hftId, {
	        effects: { [property]: value },
	      });
	      latestHtmlRef.current = nextHtml;
	      commit(
	        {
	          html: nextHtml,
	          selectedId: selectedElement.hftId,
	        },
	        { debounce: true }
	      );
	      setSelectedElement({
	        ...selectedElement,
	        effects: {
	          ...selectedElement.effects,
	          [property]: value,
	        },
	      });
	      setPatchCommand({ id: Date.now(), hftId: selectedElement.hftId, patch: { effects: { [property]: value } } });
	    },
	    [commit, selectedElement]
	  );

	  const applyAttributeUpdate = useCallback(
	    (property: keyof EditableAttributes, value: string) => {
	      if (!selectedElement) return;
	      const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, selectedElement.hftId, {
	        attributes: { [property]: value },
	      });
	      latestHtmlRef.current = nextHtml;
	      commit({
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
	      setPatchCommand({ id: Date.now(), hftId: selectedElement.hftId, patch: { attributes: { [property]: value } } });
	    },
	    [commit, selectedElement]
	  );

  const handleHtmlChange = useCallback(
    (value: string) => {
      const nextHtml = injectEditableIds(value).html;
      latestHtmlRef.current = nextHtml;
      commit(
        {
          html: nextHtml,
          selectedId: null,
        },
        { debounce: true }
      );
      setSelectedElement(null);
      setModalState({ found: false, open: false, label: "" });
      setModalCommand(null);
      setReloadNonce((n) => n + 1);
    },
    [commit]
  );

  const handleImport = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
        setStatusMessage("仅支持 .html / .htm 文件");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage("文件过大（上限 5MB），请减小后再试");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const rawHtml = String(reader.result ?? "");
        try {
          const { html: nextHtml } = injectEditableIds(rawHtml);
          latestHtmlRef.current = nextHtml;
          reset({
            html: nextHtml,
            selectedId: null,
          });
          setSelectedElement(null);
          setModalState({ found: false, open: false, label: "" });
          setModalCommand(null);
          setHasImportedHtml(true);
          setStatusMessage(`已导入 ${file.name}（${(file.size / 1024).toFixed(1)} KB）`);
          setReloadNonce((n) => n + 1);
        } catch {
          setStatusMessage("导入失败：HTML 格式异常，请检查文件内容");
        }
      };
      reader.onerror = () => {
        setStatusMessage("文件读取失败，请检查文件权限或编码");
      };
      reader.readAsText(file);
    },
    [reset]
  );

  const handleCopy = useCallback(async () => {
    try {
      const cleanHtml = cleanHtmlForExport(latestHtmlRef.current);
      await copyHtmlToClipboard(cleanHtml);
      setStatusMessage("已复制干净 HTML 到剪贴板");
    } catch {
      setStatusMessage("复制失败，请检查浏览器剪贴板权限");
    }
  }, []);

  const handleExport = useCallback(() => {
    const cleanHtml = cleanHtmlForExport(latestHtmlRef.current);
    assertCleanExport(cleanHtml);
    const warnings = getExportWarnings(cleanHtml);
    if (warnings.length > 0) {
      setStatusMessage(`导出含 ${warnings.length} 项警告，请检查控制台`);
      warnings.forEach((w) => console.warn(`[导出] ${w.message}`));
    }
    setExportPreviewHtml(cleanHtml);
    setStatusMessage("已生成导出前预览");
  }, []);

  const handleDownloadExportPreview = useCallback(() => {
    if (!exportPreviewHtml) return;
    exportHtml(exportPreviewHtml);
    setExportPreviewHtml(null);
    setStatusMessage("已导出干净 HTML");
  }, [exportPreviewHtml]);

  const runAiExportPreflight = useCallback(async () => {
    const existingAnnotations = Object.values(aiAnnotations);
    if (existingAnnotations.length > 0) {
      return { annotations: existingAnnotations, source: "cached" as const };
    }

    if (!currentAiKey.trim() || !currentAiModel.trim()) {
      return { annotations: [] as AiTreeAnnotation[], source: "skipped" as const };
    }

    setSourceView("tree");
    setAiAnalysisStatus("running");
    setAiAnalysisError("");
    const annotations = await analyzeStructureWithAi({
      providerId: aiProvider,
      apiKey: currentAiKey,
      model: currentAiModel,
      html: latestHtmlRef.current,
      domTree,
    });
    const nextAnnotations = Object.fromEntries(annotations.map((annotation) => [annotation.hftId, annotation]));
    setAiAnnotations(nextAnnotations);
    setAiAnalysisStatus("ready");
    return { annotations, source: "fresh" as const };
  }, [aiAnnotations, aiProvider, currentAiKey, currentAiModel, domTree]);

  const handleDocumentExport = useCallback(
    async (format: DocumentExportFormat) => {
      if (exportingFormat) return;

      const label = format === "pdf" ? "PDF" : "PPTX";
      setExportingFormat(format);
      setSourceView("tree");

      try {
        const cleanHtml = cleanHtmlForExport(latestHtmlRef.current);
        assertCleanExport(cleanHtml);
        const warnings = getExportWarnings(cleanHtml);
        if (warnings.length > 0) {
          warnings.forEach((w) => console.warn(`[Export] ${w.message}`));
        }

        setStatusMessage(`正在进行 AI 导出预检，然后生成 ${label}`);
        let annotations: AiTreeAnnotation[] = [];
        try {
          const preflight = await runAiExportPreflight();
          annotations = preflight.annotations;
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI 导出预检失败";
          setAiAnalysisStatus("error");
          setAiAnalysisError(message);
          setStatusMessage(`AI 预检失败，继续生成 ${label}`);
        }

        const riskCount = annotations.filter((annotation) =>
          annotation.issues.some((issue) => issue.trim().length > 0)
        ).length;
        if (riskCount > 0) {
          setStatusMessage(`AI 预检发现 ${riskCount} 个风险点，正在生成 ${label}`);
        } else if (annotations.length > 0) {
          setStatusMessage(`AI 预检通过，正在生成 ${label}`);
        } else {
          setStatusMessage(`未配置 AI 预检，正在生成 ${label}`);
        }

        const pageCount =
          format === "pdf" ? await exportPdfFromHtml(cleanHtml) : await exportPptxFromHtml(cleanHtml);
        setStatusMessage(
          riskCount > 0
            ? `已导出 ${pageCount} 页 ${label}，AI 标注了 ${riskCount} 个风险点`
            : `已导出 ${pageCount} 页 ${label}`
        );
      } catch (error) {
        // 调试: 把真实错误堆栈打到 console, 方便 e2e 抓取 + 用户排查
        // eslint-disable-next-line no-console
        console.error("[HTML FineTune] export error:", error);
        const message =
          format === "pdf" ? formatPdfError(error) : formatPptxError(error);
        setStatusMessage(message);
      } finally {
        setExportingFormat(null);
      }
    },
    [exportingFormat, runAiExportPreflight]
  );

  const handleExportPdf = useCallback(() => {
    void handleDocumentExport("pdf");
  }, [handleDocumentExport]);

  const handleExportPptx = useCallback(() => {
    void handleDocumentExport("pptx");
  }, [handleDocumentExport]);

  const handleCopyExportPreview = useCallback(async () => {
    if (!exportPreviewHtml) return;
    try {
      await copyHtmlToClipboard(exportPreviewHtml);
      setStatusMessage("已复制导出预览中的干净 HTML");
    } catch {
      setStatusMessage("复制失败，请检查浏览器剪贴板权限");
    }
  }, [exportPreviewHtml]);

  const handleUndo = useCallback(() => {
    undo();
    setReloadNonce((n) => n + 1);
    setStatusMessage("已撤销上一步编辑");
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    setReloadNonce((n) => n + 1);
    setStatusMessage("已重做编辑");
  }, [redo]);

  const handleJumpToHistory = useCallback(
    (index: number) => {
      jumpToHistoryIndex(index);
      setReloadNonce((n) => n + 1);
      setStatusMessage(`已跳转到历史第 ${index + 1} 步`);
    },
    [jumpToHistoryIndex]
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

  const handleToggleModal = useCallback(() => {
    if (modalState.open) {
      handleCloseModal();
    } else {
      handleOpenModal();
    }
  }, [modalState.open, handleOpenModal, handleCloseModal]);

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

  const { startPanelResize } = usePanelResize({
    workspaceRef,
    sourceWidth,
    inspectorWidth,
    setSourceWidth,
    setInspectorWidth,
    sourcePanelPlacement,
  });

  const handleSelectFromTree = useCallback((hftId: string) => {
    const treeSnapshot = buildElementSnapshotFromHtml(latestHtmlRef.current, hftId);
    if (treeSnapshot) {
      setSelectedElement(treeSnapshot);
    }
    setSelectCommand({ id: Date.now(), hftId });
    flushDebouncedHistory();
    commit(
      {
        html: latestHtmlRef.current,
        selectedId: hftId,
      },
      { record: false }
    );
    setStatusMessage(`已从结构面板定位 ${hftId}`);
  }, [commit, flushDebouncedHistory]);

  const handleElementDragged = useCallback(
    (hftId: string, position: string, top: string, left: string) => {
      const styles = { position, top, left };
      const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, hftId, { styles });
      if (nextHtml === latestHtmlRef.current) return;
      latestHtmlRef.current = nextHtml;
      commit(
        {
          html: nextHtml,
          selectedId: hftId,
        },
        { debounce: true }
      );
      setSelectedElement(buildElementSnapshotFromHtml(nextHtml, hftId));
      setPatchCommand({ id: Date.now(), hftId, patch: { styles } });
      setStatusMessage(`已将元素移动到 ${top} / ${left}`);
    },
    [commit]
  );

  const handleElementQuickAction = useCallback(
    (hftId: string, action: ElementQuickAction) => {
      if (action === "copy-style") {
        const snapshot =
          selectedElement?.hftId === hftId
            ? selectedElement
            : buildElementSnapshotFromHtml(latestHtmlRef.current, hftId);
        if (!snapshot) {
          setStatusMessage("未找到要复制样式的元素");
          return;
        }

        setStyleClipboard({
          styles: { ...snapshot.styles },
          effects: { ...snapshot.effects },
        });
        setStatusMessage(`已复制 ${snapshot.location || hftId} 的样式`);
        return;
      }

      if (action === "paste-style") {
        if (!styleClipboard) {
          setStatusMessage("先复制一个元素的样式，再粘贴到目标元素");
          return;
        }

        const patch = {
          styles: { ...styleClipboard.styles },
          effects: { ...styleClipboard.effects },
        };
        const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, hftId, patch);
        latestHtmlRef.current = nextHtml;
        commit({
          html: nextHtml,
          selectedId: hftId,
        });
        setSelectedElement(buildElementSnapshotFromHtml(nextHtml, hftId));
        setPatchCommand({ id: Date.now(), hftId, patch });
        setStatusMessage("已套用样式到选中元素");
        return;
      }

      if (action === "move-up" || action === "move-down") {
        const nextHtml = moveHtmlElementByHftId(latestHtmlRef.current, hftId, action === "move-up" ? "up" : "down");
        if (nextHtml === latestHtmlRef.current) {
          setStatusMessage(action === "move-up" ? "这个元素已经在同级最上方" : "这个元素已经在同级最下方");
          return;
        }

        latestHtmlRef.current = nextHtml;
        commit({
          html: nextHtml,
          selectedId: hftId,
        });
        setSelectedElement(buildElementSnapshotFromHtml(nextHtml, hftId));
        setSelectCommand({ id: Date.now(), hftId });
        setReloadNonce((n) => n + 1);
        setStatusMessage(action === "move-up" ? "已将元素上移一位" : "已将元素下移一位");
        return;
      }

      const mutatedHtml =
        action === "duplicate"
          ? duplicateHtmlElementByHftId(latestHtmlRef.current, hftId)
          : deleteHtmlElementByHftId(latestHtmlRef.current, hftId);
      const nextHtml = action === "duplicate" ? injectEditableIds(mutatedHtml).html : mutatedHtml;

      latestHtmlRef.current = nextHtml;
      commit({
        html: nextHtml,
        selectedId: null,
      });
      setSelectedElement(null);
      setReloadNonce((n) => n + 1);
      setStatusMessage(action === "duplicate" ? "已克隆选中元素" : "已删除选中元素");
    },
    [commit, selectedElement, styleClipboard]
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

  // 侦听 iframe 超时等自定义状态消息
  useEffect(() => {
    const handleStatusEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail === "string") {
        setStatusMessage(detail);
      }
    };
    window.addEventListener("hft-status", handleStatusEvent);
    return () => window.removeEventListener("hft-status", handleStatusEvent);
  }, []);

  useEffect(() => {
    if (!state.selectedId) {
      setSelectedElement(null);
      return;
    }

    if (!hasElementWithHftId(state.html, state.selectedId)) {
      commit(
        {
          html: state.html,
          selectedId: null,
        },
        { record: false }
      );
      setSelectedElement(null);
    } else {
      // html 变化后重建 selectedElement 快照，避免快照过期
      setSelectedElement(buildElementSnapshotFromHtml(state.html, state.selectedId));
    }
  }, [commit, state.html, state.selectedId]);

  const selectionStatus = useMemo(() => {
    if (!selectedElement) {
      return {
        label: "未选择",
        detail: "从结构树或 Canvas 选择元素",
      };
    }
    return {
      label: "已选择",
      detail: `${selectedElement.tagName.toUpperCase()} · ${selectedElement.hftId}`,
    };
  }, [selectedElement]);

  useEffect(() => {
    setAiAnnotations({});
    setAiAnalysisStatus("idle");
    setAiAnalysisError("");
  }, [state.html]);

  const fetchModelsForProvider = useCallback(
    async (providerId: AiProviderId, apiKey: string, mode: "auto" | "manual", signal?: AbortSignal) => {
      const provider = AI_PROVIDER_MAP[providerId] ?? AI_PROVIDER_MAP[DEFAULT_AI_PROVIDER];
      const trimmedKey = apiKey.trim();
      const fallbackOptions = buildPresetAiModelOptions(provider);
      if (!trimmedKey) {
        setAiModelOptions((options) => ({
          ...options,
          [provider.id]: fallbackOptions,
        }));
        setAiModelFetchStatus("idle");
        setAiModelFetchError("");
        return;
      }

      const requestId = aiModelFetchRequestRef.current + 1;
      aiModelFetchRequestRef.current = requestId;
      setAiModelFetchStatus("loading");
      setAiModelFetchError("");

      try {
        const remoteOptions = await fetchAiModelOptions({
          providerId: provider.id,
          apiKey: trimmedKey,
          signal,
        });
        if (signal?.aborted || requestId !== aiModelFetchRequestRef.current) return;

        const nextOptions = mergeAiModelOptions(remoteOptions, fallbackOptions);
        setAiModelOptions((options) => ({
          ...options,
          [provider.id]: nextOptions,
        }));
        setAiModelFetchStatus("ready");
        setAiModels((models) => {
          const currentModel = models[provider.id] || provider.defaultModel;
          const hasCurrentModel = nextOptions.some((option) => option.value === currentModel);
          if (currentModel && (hasCurrentModel || currentModel !== provider.defaultModel)) return models;
          return {
            ...models,
            [provider.id]: nextOptions[0]?.value || provider.defaultModel,
          };
        });
        setStatusMessage(`${provider.shortLabel} 已获取 ${remoteOptions.length} 个模型`);
      } catch (error) {
        if (signal?.aborted || requestId !== aiModelFetchRequestRef.current) return;
        const message = error instanceof Error ? error.message : "模型列表获取失败";
        setAiModelOptions((options) => ({
          ...options,
          [provider.id]: fallbackOptions,
        }));
        setAiModelFetchStatus("error");
        setAiModelFetchError(message);
        if (mode === "manual") setStatusMessage(message);
      }
    },
    []
  );

  useEffect(() => {
    const trimmedKey = currentAiKey.trim();
    if (trimmedKey.length < 8) {
      setAiModelFetchStatus("idle");
      setAiModelFetchError("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchModelsForProvider(aiProvider, trimmedKey, "auto", controller.signal);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [aiProvider, currentAiKey, fetchModelsForProvider]);

  const handleAnalyzeStructure = useCallback(async () => {
    setSourceView("tree");
    setAiAnalysisStatus("running");
    setAiAnalysisError("");
    try {
      const annotations = await analyzeStructureWithAi({
        providerId: aiProvider,
        apiKey: currentAiKey,
        model: currentAiModel,
        html: latestHtmlRef.current,
        domTree,
      });
      const nextAnnotations = Object.fromEntries(annotations.map((annotation) => [annotation.hftId, annotation]));
      setAiAnnotations(nextAnnotations);
      setAiAnalysisStatus("ready");
      setStatusMessage(`${currentAiProvider.shortLabel} 已标注 ${annotations.length} 个结构节点`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 扫描失败";
      setAiAnalysisStatus("error");
      setAiAnalysisError(message);
      setStatusMessage(message);
    }
  }, [aiProvider, currentAiKey, currentAiModel, currentAiProvider.shortLabel, domTree]);

  const handleAiProviderChange = useCallback((providerId: AiProviderId) => {
    const provider = AI_PROVIDER_MAP[providerId] ?? AI_PROVIDER_MAP[DEFAULT_AI_PROVIDER];
    setAiProvider(provider.id);
    setAiModels((models) => ({
      ...models,
      [provider.id]: models[provider.id] || provider.defaultModel,
    }));
    setAiAnalysisError("");
  }, []);

  const handleAiApiKeyChange = useCallback(
    (value: string) => {
      setAiApiKeys((keys) => ({
        ...keys,
        [aiProvider]: value,
      }));
    },
    [aiProvider]
  );

  const handleAiRememberKeyChange = useCallback(
    (value: boolean) => {
      setRememberAiKeys((keys) => ({
        ...keys,
        [aiProvider]: value,
      }));
    },
    [aiProvider]
  );

  const handleAiModelChange = useCallback(
    (value: string) => {
      setAiModels((models) => ({
        ...models,
        [aiProvider]: value,
      }));
    },
    [aiProvider]
  );

  const handleRefreshAiModels = useCallback(() => {
    void fetchModelsForProvider(aiProvider, currentAiKey, "manual");
  }, [aiProvider, currentAiKey, fetchModelsForProvider]);

  const handleClearAiAnnotations = useCallback(() => {
    setAiAnnotations({});
    setAiAnalysisStatus("idle");
    setAiAnalysisError("");
    setStatusMessage("已清空 AI 结构标注");
  }, []);

  const historyItems = useMemo(
    () => buildDisplayItemsFromSummaries(summaries, currentIndex),
    [currentIndex, summaries]
  );
  const workspaceStyle = useMemo(
    () =>
      ({
        "--source-col": isSourceCollapsed ? "44px" : `${sourceWidth}px`,
        "--inspector-col": isInspectorCollapsed ? "44px" : `${inspectorWidth}px`,
      }) as CSSProperties,
    [inspectorWidth, isInspectorCollapsed, isSourceCollapsed, sourceWidth]
  );
  const previewStatus = isPreviewReady
    ? { label: "实时预览", detail: "已就绪", tone: "ready" }
    : { label: "实时预览", detail: "渲染中", tone: "busy" };
  const characterCountText = `${state.html.length.toLocaleString()} 字符`;

  return (
    <div className={`app-shell${isFocusPreview ? " app-shell-focus-preview" : ""}`}>
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        hasModal={modalState.found}
        isModalOpen={modalState.open}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleHistory={() => setIsHistoryOpen((value) => !value)}
        onModalToggle={handleToggleModal}
        onImport={handleImport}
        onCopy={handleCopy}
        onExport={handleExport}
        onExportPdf={handleExportPdf}
        onExportPptx={handleExportPptx}
        exportingFormat={exportingFormat}
      />
      {isHistoryOpen && !isFocusPreview ? (
        <Suspense fallback={null}>
          <HistoryPanel
            items={historyItems}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onJumpTo={handleJumpToHistory}
            onClose={() => setIsHistoryOpen(false)}
          />
        </Suspense>
      ) : null}
      {exportPreviewHtml ? (
        <Suspense fallback={null}>
          <ExportPreviewDialog
            html={exportPreviewHtml}
            onClose={() => setExportPreviewHtml(null)}
            onCopy={handleCopyExportPreview}
            onDownload={handleDownloadExportPreview}
          />
        </Suspense>
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
          aiAnnotations={aiAnnotations}
          aiStatus={aiAnalysisStatus}
          aiError={aiAnalysisError}
          aiProvider={aiProvider}
          aiProviders={AI_PROVIDER_DEFINITIONS}
          aiApiKey={currentAiKey}
          aiRememberKey={currentAiRememberKey}
          aiModel={currentAiModel}
          aiModelOptions={currentAiModelOptions}
          aiModelFetchStatus={aiModelFetchStatus}
          aiModelFetchError={aiModelFetchError}
          selectedId={state.selectedId}
          onChange={handleHtmlChange}
          onImport={handleImport}
          onSelectElement={handleSelectFromTree}
          onAiProviderChange={handleAiProviderChange}
          onAiApiKeyChange={handleAiApiKeyChange}
          onAiRememberKeyChange={handleAiRememberKeyChange}
          onAiModelChange={handleAiModelChange}
          onRefreshAiModels={handleRefreshAiModels}
          onAnalyzeStructure={handleAnalyzeStructure}
          onClearAiAnnotations={handleClearAiAnnotations}
          isCollapsed={isSourceCollapsed}
          onToggleCollapse={() => setIsSourceCollapsed((value) => !value)}
          placement={sourcePanelPlacement}
          onTogglePlacement={handleToggleSourcePlacement}
          showImportDropzone={!hasImportedHtml}
          sourceView={sourceView}
          onSourceViewChange={setSourceView}
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
          reloadNonce={reloadNonce}
          patchCommand={patchCommand}
          modalCommand={modalCommand}
          selectCommand={selectCommand}
          viewportMode={previewViewportMode}
          isFocusPreview={isFocusPreview}
          onViewportModeChange={setPreviewViewportMode}
          onToggleFocusPreview={handleToggleFocusPreview}
          onElementSelected={updateSelectedElement}
          onModalStateChange={handleModalStateChange}
          onElementAction={handleElementQuickAction}
          onElementDragged={handleElementDragged}
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
        <div className="status-bar-primary">
          <div className={`status-item status-selection${selectedElement ? " status-item-active" : ""}`}>
            <span className="status-dot" aria-hidden="true" />
            <span className="status-copy">
              <strong>{selectionStatus.label}</strong>
              <small>{selectionStatus.detail}</small>
            </span>
          </div>
          <div className="status-item status-count">
            <span className="status-dot status-dot-muted" aria-hidden="true" />
            <span>{characterCountText}</span>
          </div>
          <div className={`status-item status-preview status-preview-${previewStatus.tone}`}>
            <span className="status-dot" aria-hidden="true" />
            <span className="status-copy">
              <strong>{previewStatus.label}</strong>
              <small>{previewStatus.detail}</small>
            </span>
          </div>
          <div className="status-item status-message">
            <span>{statusMessage}</span>
          </div>
          <button
            className="status-bar-toggle"
            type="button"
            aria-expanded={isStatusSecondaryOpen}
            aria-controls="status-bar-secondary-panel"
            title={isStatusSecondaryOpen ? "收起技术信息" : "展开技术信息"}
            onClick={() => setIsStatusSecondaryOpen((v) => !v)}
          >
            {isStatusSecondaryOpen ? "▴" : "▾"}
          </button>
        </div>
        <div
          id="status-bar-secondary-panel"
          className={`status-bar-secondary${isStatusSecondaryOpen ? " status-bar-secondary-open" : ""}`}
          aria-hidden={!isStatusSecondaryOpen}
        >
          <span className="status-bar-tech-label">iframe srcDoc · postMessage 通信</span>
        </div>
      </footer>
    </div>
  );
}

function buildElementSnapshotFromHtml(html: string, hftId: string): SelectedElementSnapshot | null {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  const element = queryElementByHftId(documentRef, hftId);
  if (!element) return null;

  return {
    hftId,
    path: getDomPath(element),
    tagName: getNormalizedTagName(element),
    id: element.id || "",
    className: getElementClassName(element),
    text: element.textContent || "",
    styles: getInlineStyleSnapshot(element),
    effects: {
      hoverBackgroundColor: getHoverBackgroundColor(html, hftId),
    },
    attributes: {
      src: getElementSourceAttribute(element),
      alt: getElementAltAttribute(element),
    },
    location: describeElementLocation(element),
    hasInlineStyle: Boolean(element.getAttribute("style")),
    canEditText: canEditElementText(element),
  };
}

function getInlineStyleSnapshot(element: HTMLElement | SVGElement): SelectedElementSnapshot["styles"] {
  const inline = element.style;
  return {
    fontFamily: inline.fontFamily,
    fontSize: inline.fontSize,
    color: inline.color,
    fontWeight: inline.fontWeight,
    lineHeight: inline.lineHeight,
    letterSpacing: inline.letterSpacing,
    textAlign: inline.textAlign,
    backgroundColor: inline.backgroundColor,
    borderColor: inline.borderColor,
    borderWidth: inline.borderWidth,
    borderStyle: inline.borderStyle,
    borderRadius: inline.borderRadius,
    boxShadow: inline.boxShadow,
    width: inline.width,
    height: inline.height,
    maxWidth: inline.maxWidth,
    objectFit: inline.objectFit,
    marginTop: inline.marginTop,
    marginBottom: inline.marginBottom,
    paddingTop: inline.paddingTop,
    paddingBottom: inline.paddingBottom,
    paddingLeft: inline.paddingLeft,
    paddingRight: inline.paddingRight,
  };
}

function describeElementLocation(element: HTMLElement | SVGElement): string {
  const className = getElementClassName(element);
  const classes = className.trim()
    ? `.${className.trim().split(/\s+/).filter(Boolean).join(".")}`
    : "";
  const id = element.id ? `#${element.id}` : "";
  return `${getNormalizedTagName(element)}${id}${classes}`;
}

function getElementSourceAttribute(element: HTMLElement | SVGElement): string {
  if (element instanceof HTMLImageElement) return element.getAttribute("src") || "";
  if (isRootSvgElement(element)) return element.getAttribute("viewBox") || "";
  if (isSvgImageElement(element)) {
    return element.getAttribute("href") || element.getAttribute("xlink:href") || "";
  }
  return "";
}

function getElementAltAttribute(element: HTMLElement | SVGElement): string {
  if (element instanceof HTMLImageElement) return element.getAttribute("alt") || "";
  if (element instanceof SVGElement) return element.getAttribute("aria-label") || "";
  return "";
}

function canEditElementText(element: HTMLElement | SVGElement): boolean {
  if (isEditableSvgTextElement(element)) return element.children.length === 0;
  if (element instanceof SVGElement || element instanceof HTMLImageElement) return false;
  return element.children.length === 0;
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
