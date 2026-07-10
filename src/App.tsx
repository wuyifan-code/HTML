import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ColorField } from "./components/ColorField";
import { ExportDialog, type ExportFormat } from "./components/ExportDialog";
import { ExportPreviewDialog } from "./components/ExportPreviewDialog";
import { PretextMeasureBadge } from "./components/PretextMeasureBadge";
import { Tooltip, TooltipProvider } from "./components/Tooltip";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useElementSize } from "./hooks/useElementSize";
import { sampleHtml } from "./sampleHtml";
import type { AiTreeAnnotation, DomTreeNode } from "./types/editor";
import { cleanHtmlForExport } from "./utils/cleanHtmlForExport";
import { copyHtmlToClipboard, readHtmlFromClipboard } from "./utils/clipboard";
import {
  deleteHtmlElementByHftId,
  duplicateHtmlElementByHftId,
  getDomPath,
  moveHtmlElementByHftId,
  getHoverBackgroundColor,
  queryElementByHftId,
  serializeDocument,
  updateHtmlElementByHftId,
} from "./utils/domPath";
import { HFT_ID_ATTRIBUTE, getElementClassName, getNormalizedTagName } from "./utils/editableElement";
import { exportHtml } from "./utils/exportHtml";
import { exportPdfFromHtml, formatPdfError } from "./utils/exportPdf";
import { exportPptxFromHtml, formatPptxError } from "./utils/exportPptx";
import { assertCleanExport, getExportWarnings, type ExportWarning } from "./utils/exportValidation";
import { injectEditableIds, parseHtmlDocument } from "./utils/injectEditableIds";
import { buildEditableDomTree } from "./utils/domTree";
import {
  VIEWPORT_PRESET_KEYS,
  VIEWPORT_PRESETS,
  findMatchingPresetKey,
  type ViewportPresetKey,
} from "./utils/viewportPresets";
import {
  AI_PROVIDER_DEFINITIONS,
  AI_PROVIDER_MAP,
  analyzeStructureWithAi,
  buildPresetAiModelOptions,
  fetchAiModelOptions,
  mergeAiModelOptions,
  type AiModelFetchStatus,
  type AiModelOption,
  type AiProviderDefinition,
  type AiProviderId,
} from "./utils/aiStructure";

// 新拆分的子模块及工具函数导入
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconBold,
  IconItalic,
  IconEye,
  IconChevronDown,
  IconSparkles,
  IconScan,
  IconSearch,
  IconMonitor,
  IconTablet,
  IconSmartphone,
  IconMove,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconType,
  IconSpacing,
  IconPalette,
  IconBorder,
  IconRuler,
  IconText,
  IconImage,
  IconActivity,
  IconShield,
} from "./components/Icons";
import { TreeItem, TreeItemNode } from "./components/TreeItem";
import { InspectorDiagnostics } from "./components/InspectorDiagnostics";
import { AiProviderPicker } from "./components/AiProviderPicker";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { buildDisplayItemsFromSummaries } from "./utils/historySummary";
import { useEditorStore } from "./hooks/useEditorStore";

import {
  filterDomTree,
  filterCollapsedTree,
  countTreeChildren,
  getPreferredSelectedId,
  toKindLabel,
} from "./utils/domTree";

import {
  buildPretextFontFromDraft,
  resolveMeasureWidth,
  resolveMeasureLineHeight,
  parseCssNumericValue,
} from "./utils/pretextMeasure";

import {
  resolveZoomScale,
  formatRelativeTime,
  cssString,
  countSourceLines,
  buildSelectedSnapshot,
  buildPreviewSrcDoc,
  hasBlockingExportWarnings,
  formatExportWarningSummary,
} from "./utils/editorUtils";
import { WorkspaceShell } from "./components/workspace/shell/WorkspaceShell";
import { TopBar } from "./components/workspace/shell/TopBar";
import { StatusBar } from "./components/workspace/shell/StatusBar";
import { EmptyWorkspace } from "./components/workspace/EmptyWorkspace";
import { hasMeaningfulHtml, createEmptyDocument } from "./utils/documentState";

const initialHtml = createEmptyDocument().html;
const AI_KEY_STORAGE = "html-finetune.ai-provider-keys";
const AI_LEGACY_GEMMA_KEY_STORAGE = "html-finetune.gemma-api-key";

type SourceTab = "structure" | "source" | "ai";
type ZoomMode = "fit" | "88" | "100";
type InspectorTab = "content" | "style" | "interaction";
type StatusTone = "ready" | "busy" | "warning" | "error";
type PreviewContentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};
type CopiedStyle = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  marginTop: string;
  marginBottom: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  borderRadius: string;
  boxShadow: string;
  width: string;
  height: string;
  maxWidth: string;
  objectFit: string;
  hoverBackgroundColor: string;
};

const BLOCKING_EXPORT_WARNING_TYPES: ExportWarning["type"][] = [
  "internal-attribute",
  "internal-element",
  "empty-html",
];
const DEFAULT_SOURCE_WIDTH = 280;
const DEFAULT_INSPECTOR_WIDTH = 360;
const MIN_SOURCE_WIDTH = 220;
const MIN_INSPECTOR_WIDTH = 320;
const MIN_STAGE_WIDTH = 520;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getStatusTone(message: string): StatusTone {
  if (/失败|错误|异常/.test(message)) return "error";
  if (/警告|暂停|风险|过大|不能为空|未找到|请先|发现/.test(message)) return "warning";
  if (/正在|扫描|导出|刷新|检查中|运行/.test(message)) return "busy";
  return "ready";
}

import { loadStoredAiKeys, buildRememberedAiKeyMap } from "./utils/aiKeyStorage";

interface SelectedSnapshot {
  hftId: string;
  tagName: string;
  id: string;
  label: string;
  text: string;
  path: string;
  className: string;
  fontFamily: string;
  fontSize: string;
  fontStyle: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  marginTop: string;
  marginBottom: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  borderRadius: string;
  boxShadow: string;
  width: string;
  height: string;
  maxWidth: string;
  objectFit: string;
  hoverBackgroundColor: string;
  src: string;
  alt: string;
  canEditText: boolean;
}

export default function App() {
  const {
    theme,
    setTheme,
    sourceWidth,
    setSourceWidth,
    inspectorWidth,
    setInspectorWidth,
    isSourceCollapsed,
    setIsSourceCollapsed,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    zoomMode,
    setZoomMode,
    viewportSize,
    setViewportSize,
    isHistoryOpen,
    setIsHistoryOpen,
    isFocusMode,
    setIsFocusMode,
  } = useEditorStore();
  const {
    state,
    commit,
    reset,
    undo,
    redo,
    jumpToHistoryIndex,
    clearHistory,
    summaries,
    allEntries,
    currentIndex,
    canUndo,
    canRedo,
    flushDebouncedHistory,
  } = useEditorHistory({ html: initialHtml, selectedId: null });

  const historyDisplayItems = useMemo(
    () => buildDisplayItemsFromSummaries(summaries, currentIndex, allEntries.map((e) => e.timestamp)),
    [summaries, currentIndex, allEntries]
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourceTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sourceLineGutterRef = useRef<HTMLPreElement | null>(null);
  const exportTriggerRef = useRef<HTMLButtonElement | null>(null);
  const historyTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileActionsRef = useRef<HTMLDivElement | null>(null);
  const sourcePanelRef = useRef<HTMLElement | null>(null);
  const inspectorPanelRef = useRef<HTMLElement | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const treeScrollRef = useRef<HTMLDivElement | null>(null);
  const latestHtmlRef = useRef(state.html);
  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
    window.setTimeout(() => historyTriggerRef.current?.focus(), 0);
  }, [setIsHistoryOpen]);
  // 与 iframe 桥脚本共享的 token — 每次 App mount 生成,仅用于校验同源 frame 的消息
  const bridgeTokenRef = useRef<string>(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tok-${Math.random().toString(36).slice(2)}-${Date.now()}`
  );
  const [sourceTab, setSourceTab] = useState<SourceTab>("structure");
  const [search, setSearch] = useState("");
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(() => new Set());
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const [isEmptyDoc, setIsEmptyDoc] = useState(true);
  const [sourceDraft, setSourceDraft] = useState(state.html);
  const hasHtmlUnclosedRisk = useMemo(() => {
    const openMatches = sourceDraft.match(/<(div|section|span|p|a|ul|li|ol|button)(?:\s[^>]*?)?>/g) || [];
    const closeMatches = sourceDraft.match(/<\/(div|section|span|p|a|ul|li|ol|button)>/gi) || [];
    return openMatches.length !== closeMatches.length;
  }, [sourceDraft]);
  const [draftText, setDraftText] = useState("");
  const [draftFontFamily, setDraftFontFamily] = useState("");
  const [draftFontSize, setDraftFontSize] = useState("");
  const [draftFontWeight, setDraftFontWeight] = useState("");
  const [draftLineHeight, setDraftLineHeight] = useState("");
  const [draftLetterSpacing, setDraftLetterSpacing] = useState("");
  const [draftTextAlign, setDraftTextAlign] = useState("");
  const [draftMarginTop, setDraftMarginTop] = useState("");
  const [draftMarginBottom, setDraftMarginBottom] = useState("");
  const [draftPaddingTop, setDraftPaddingTop] = useState("");
  const [draftPaddingBottom, setDraftPaddingBottom] = useState("");
  const [draftPaddingLeft, setDraftPaddingLeft] = useState("");
  const [draftPaddingRight, setDraftPaddingRight] = useState("");
  const [draftColor, setDraftColor] = useState("");
  const [draftBackgroundColor, setDraftBackgroundColor] = useState("");
  const [draftBorderColor, setDraftBorderColor] = useState("");
  const [draftBorderWidth, setDraftBorderWidth] = useState("");
  const [draftBorderStyle, setDraftBorderStyle] = useState("");
  const [draftBorderRadius, setDraftBorderRadius] = useState("");
  const [draftBoxShadow, setDraftBoxShadow] = useState("");
  const [draftWidth, setDraftWidth] = useState("");
  const [draftHeight, setDraftHeight] = useState("");
  const [draftMaxWidth, setDraftMaxWidth] = useState("");
  const [draftObjectFit, setDraftObjectFit] = useState("");
  const [draftHoverBackground, setDraftHoverBackground] = useState("");
  const [draftSrc, setDraftSrc] = useState("");
  const [draftAlt, setDraftAlt] = useState("");
  const [statusMessage, setStatusMessage] = useState("实时预览 · 刚刚");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportDialogFormat, setExportDialogFormat] = useState<ExportFormat>("html");
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "pptx" | null>(null);
  // Inspector tab 合并后,保留 setInspectorTab 为 noop 避免破坏既有调用点。
  // 后续清理可以删除所有调用并移除该函数。
  const setInspectorTab = useCallback((_value: InspectorTab) => {
    /* no-op: tabs are merged into a single scrollable panel */
  }, []);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageSize = useElementSize(stageRef);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<CopiedStyle | null>(null);
  const [isMobileShell, setIsMobileShell] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const [isSourceSoftWrap, setIsSourceSoftWrap] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceSearchPosition, setSourceSearchPosition] = useState<{ matchNumber: number; lineNumber: number } | null>(null);
  const [hasImportedHtml, setHasImportedHtml] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now());
  const [isAiCardCollapsed, setIsAiCardCollapsed] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [previewContentBounds, setPreviewContentBounds] = useState<PreviewContentBounds | null>(null);
  const [aiProvider, setAiProvider] = useState<AiProviderId>("google");
  const [aiApiKeys, setAiApiKeys] = useState<Record<string, string>>(() => loadStoredAiKeys());
  const [rememberAiKeys, setRememberAiKeys] = useState<Record<string, boolean>>(() =>
    buildRememberedAiKeyMap(loadStoredAiKeys())
  );
  const [aiModels, setAiModels] = useState<Record<string, string>>(() =>
    Object.fromEntries(AI_PROVIDER_DEFINITIONS.map((provider) => [provider.id, provider.defaultModel]))
  );
  const [aiModelOptions, setAiModelOptions] = useState<Record<string, AiModelOption[]>>(() =>
    Object.fromEntries(AI_PROVIDER_DEFINITIONS.map((provider) => [provider.id, buildPresetAiModelOptions(provider)]))
  );
  const [aiModelFetchStatus, setAiModelFetchStatus] = useState<AiModelFetchStatus>("idle");
  const [aiModelFetchError, setAiModelFetchError] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "running" | "ready" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const [aiAnnotations, setAiAnnotations] = useState<Record<string, AiTreeAnnotation>>({});
  const [aiPreflightNote, setAiPreflightNote] = useState("未运行");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  interface Toast { id: string; message: string; }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimerRef = useRef<number | null>(null);
  const aiModelFetchRequestRef = useRef(0);

  const domTree = useMemo(() => buildEditableDomTree(state.html), [state.html]);
  const selectedId =
    state.selectedId && domTree.some((node) => node.hftId === state.selectedId)
      ? state.selectedId
      : isSelectionCleared
        ? null
      : getPreferredSelectedId(domTree);
  const selected = useMemo(
    () => (selectedId ? buildSelectedSnapshot(state.html, selectedId) : null),
    [selectedId, state.html]
  );
  const filteredTree = useMemo(() => filterDomTree(domTree, search), [domTree, search]);
  const treeChildCounts = useMemo(() => countTreeChildren(domTree), [domTree]);
  const collapsibleTreeIds = useMemo(
    () => domTree.filter((node) => (treeChildCounts[node.hftId] ?? 0) > 0).map((node) => node.hftId),
    [domTree, treeChildCounts]
  );
  const visibleTree = useMemo(
    () => (search.trim() ? filteredTree : filterCollapsedTree(filteredTree, collapsedTreeIds)),
    [collapsedTreeIds, filteredTree, search]
  );
  const previewSrcDoc = useMemo(() => buildPreviewSrcDoc(state.html, selectedId, bridgeTokenRef.current), [selectedId, state.html]);
  const cleanHtml = useMemo(() => cleanHtmlForExport(state.html), [state.html]);
  const exportWarnings = useMemo(() => getExportWarnings(cleanHtml), [cleanHtml]);
  const isDocumentEmpty = useMemo(() => !hasMeaningfulHtml(state.html), [state.html]);
  const sourceLineCount = useMemo(() => countSourceLines(sourceDraft), [sourceDraft]);
  const sourceLineNumbers = useMemo(
    () => Array.from({ length: Math.max(1, sourceLineCount) }, (_, index) => String(index + 1)).join("\n"),
    [sourceLineCount]
  );
  const sourceCharCount = sourceDraft.length;
  const isSourceDirty = sourceDraft !== state.html;
  const sourceSearchMatchCount = useMemo(() => {
    const query = sourceSearch.trim();
    if (!query) return 0;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return sourceDraft.match(new RegExp(escaped, "gi"))?.length ?? 0;
  }, [sourceDraft, sourceSearch]);
  const sourceSearchQuery = sourceSearch.trim();
  const sourceSearchState = sourceSearchQuery ? (sourceSearchMatchCount > 0 ? "found" : "empty") : "idle";
  const sourceSyncState = hasHtmlUnclosedRisk ? "warning" : isSourceDirty ? "dirty" : "synced";
  const sourceSyncTitle =
    sourceSyncState === "warning" ? "结构需复核" : sourceSyncState === "dirty" ? "草稿未应用" : "源码已同步";
  const sourceSyncDetail =
    sourceSyncState === "warning"
      ? "检测到可能未闭合的标签，应用前请复核结构。"
      : sourceSyncState === "dirty"
        ? "当前修改只保存在源码草稿中，应用后会刷新画布。"
        : "源码草稿与当前画布保持一致。";
  const blockingExportWarningCount = useMemo(
    () => exportWarnings.filter((warning) => BLOCKING_EXPORT_WARNING_TYPES.includes(warning.type)).length,
    [exportWarnings]
  );
  const currentAiProvider = AI_PROVIDER_MAP[aiProvider];
  const currentAiModels = aiModelOptions[aiProvider] ?? buildPresetAiModelOptions(currentAiProvider);
  const currentAiModel = aiModels[aiProvider] || currentAiProvider.defaultModel;
  const currentAiKey = aiApiKeys[aiProvider] ?? "";
  const currentAiRememberKey = Boolean(rememberAiKeys[aiProvider]);
  const selectedAnnotation = selected ? aiAnnotations[selected.hftId] : undefined;
  const aiRiskAnnotations = useMemo(
    () => Object.values(aiAnnotations).filter((annotation) => annotation.issues.length > 0),
    [aiAnnotations]
  );
  const matchingViewportPreset = findMatchingPresetKey(viewportSize.width, viewportSize.height);
  const isContentFitPreview = zoomMode === "fit" && previewContentBounds !== null;
  const previewFrameBounds = useMemo(
    () =>
      isContentFitPreview && previewContentBounds
        ? previewContentBounds
        : { x: 0, y: 0, width: viewportSize.width, height: viewportSize.height },
    [isContentFitPreview, previewContentBounds, viewportSize.height, viewportSize.width]
  );
  const previewIframeStyle = useMemo(
    () =>
      isContentFitPreview
        ? ({
            width: viewportSize.width,
            height: viewportSize.height,
            transform: `translate(${-previewFrameBounds.x}px, ${-previewFrameBounds.y}px)`,
          } as CSSProperties)
        : undefined,
    [isContentFitPreview, previewFrameBounds.x, previewFrameBounds.y, viewportSize.height, viewportSize.width]
  );
  const previewScale = useMemo(
    () => resolveZoomScale(zoomMode, previewFrameBounds, stageSize),
    [previewFrameBounds, stageSize, zoomMode]
  );
  const previewShellStyle = useMemo(
    () =>
      ({
        width: Math.max(1, Math.round(previewFrameBounds.width * previewScale)),
        height: Math.max(1, Math.round(previewFrameBounds.height * previewScale)),
      }) as CSSProperties,
    [previewFrameBounds.height, previewFrameBounds.width, previewScale]
  );

  useEffect(() => {
    latestHtmlRef.current = state.html;
    setLastSyncedAt(Date.now());
  }, [state.html]);

  useEffect(() => {
    setIsEmptyDoc(!hasMeaningfulHtml(state.html));
  }, [state.html]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 760px)");
    const syncMobileShell = () => {
      const isMobile = media.matches;
      setIsMobileShell(isMobile);
      if (isMobile) {
        setIsSourceCollapsed(true);
        setIsInspectorCollapsed(true);
        setIsMobileActionsOpen(false);
      } else {
        setIsMobileActionsOpen(false);
      }
    };

    syncMobileShell();
    media.addEventListener("change", syncMobileShell);
    return () => media.removeEventListener("change", syncMobileShell);
  }, []);

  useEffect(() => {
    const setPanelInteraction = (panel: HTMLElement | null, isCollapsed: boolean) => {
      if (!panel) return;
      if (isCollapsed) {
        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("inert", "");
      } else {
        panel.removeAttribute("aria-hidden");
        panel.removeAttribute("inert");
      }
    };

    setPanelInteraction(document.querySelector<HTMLElement>("[data-dom-id='panel-source-tree']"), isSourceCollapsed);
    setPanelInteraction(document.querySelector<HTMLElement>("[data-dom-id='panel-inspector']"), isInspectorCollapsed);

    return () => {
      document.querySelector<HTMLElement>("[data-dom-id='panel-source-tree']")?.removeAttribute("inert");
      document.querySelector<HTMLElement>("[data-dom-id='panel-source-tree']")?.removeAttribute("aria-hidden");
      document.querySelector<HTMLElement>("[data-dom-id='panel-inspector']")?.removeAttribute("inert");
      document.querySelector<HTMLElement>("[data-dom-id='panel-inspector']")?.removeAttribute("aria-hidden");
    };
  }, [isInspectorCollapsed, isSourceCollapsed]);

  useEffect(() => {
    if (!isMobileActionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !mobileActionsRef.current?.contains(target)) {
        setIsMobileActionsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsMobileActionsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isMobileActionsOpen]);

  useEffect(() => {
    if (!isMobileShell || (isSourceCollapsed && isInspectorCollapsed)) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (sourcePanelRef.current?.contains(target)) return;
      if (inspectorPanelRef.current?.contains(target)) return;
      if (mobileActionsRef.current?.contains(target)) return;

      setIsSourceCollapsed(true);
      setIsInspectorCollapsed(true);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isInspectorCollapsed, isMobileShell, isSourceCollapsed]);

  useEffect(() => {
    setAiModels((models) => ({
      ...models,
      [aiProvider]: models[aiProvider] || AI_PROVIDER_MAP[aiProvider].defaultModel,
    }));
  }, [aiProvider]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedKeys = Object.fromEntries(
      Object.entries(aiApiKeys)
        .map(([providerId, key]) => [providerId, key.trim()] as const)
        .filter(([providerId, key]) => rememberAiKeys[providerId] && key.length > 0)
    );

    if (Object.keys(storedKeys).length > 0) {
      window.localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(storedKeys));
    } else {
      window.localStorage.removeItem(AI_KEY_STORAGE);
    }
    // 注意:旧版 gemma key 的迁移与删除在 loadStoredAiKeys() 阶段一次性完成,
    // 这里不再无条件 removeItem 旧 key,避免 rememberAiKeys=false 时把刚迁移的 key 也抹掉。
  }, [aiApiKeys, rememberAiKeys]);

  useEffect(() => {
    setSourceDraft(state.html);
  }, [state.html]);

  useEffect(() => {
    setSourceSearchPosition(null);
  }, [sourceDraft, sourceSearch]);

  useEffect(() => {
    setIsPreviewReady(false);
    setPreviewContentBounds(null);
  }, [previewSrcDoc]);

  const measurePreviewContent = useCallback(() => {
    previewFrameRef.current?.contentWindow?.postMessage(
      { type: "HTML_FINETUNE_OPTIMIZED_MEASURE_CONTENT" },
      "*"
    );
  }, []);

  useEffect(() => {
    if (!isPreviewReady) return;
    const frameId = window.requestAnimationFrame(() => {
      measurePreviewContent();
      window.setTimeout(measurePreviewContent, 120);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isPreviewReady, measurePreviewContent, previewSrcDoc, selectedId]);

  // Scroll the selected tree node into view (predictive return)
  useEffect(() => {
    if (!selected) return;
    const root = treeScrollRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-dom-id="node-${selected.hftId}"]`);
    if (!el || typeof el.scrollIntoView !== "function") return;
    const rootRect = root.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const outTop = elRect.top < rootRect.top + 16;
    const outBottom = elRect.bottom > rootRect.bottom - 16;
    if (outTop || outBottom) {
      try {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch {
        // jsdom / older engines: fall back silently
      }
    }
  }, [selected?.hftId]);

  useEffect(() => {
    setAiAnnotations({});
    setAiStatus("idle");
    setAiError("");
    setAiPreflightNote("未运行");
  }, [state.html]);

  useEffect(() => {
    if (!selected) {
      setDraftText("");
      setDraftFontFamily("");
      setDraftFontSize("");
      setDraftFontWeight("");
      setDraftLineHeight("");
      setDraftLetterSpacing("");
      setDraftTextAlign("");
      setDraftMarginTop("");
      setDraftMarginBottom("");
      setDraftPaddingTop("");
      setDraftPaddingBottom("");
      setDraftPaddingLeft("");
      setDraftPaddingRight("");
      setDraftColor("");
      setDraftBackgroundColor("");
      setDraftBorderColor("");
      setDraftBorderWidth("");
      setDraftBorderStyle("");
      setDraftBorderRadius("");
      setDraftBoxShadow("");
      setDraftWidth("");
      setDraftHeight("");
      setDraftMaxWidth("");
      setDraftObjectFit("");
      setDraftHoverBackground("");
      setDraftSrc("");
      setDraftAlt("");
      return;
    }
    setDraftText(selected.text);
    setDraftFontFamily(selected.fontFamily);
    setDraftFontSize(selected.fontSize);
    setDraftFontWeight(selected.fontWeight);
    setDraftLineHeight(selected.lineHeight);
    setDraftLetterSpacing(selected.letterSpacing);
    setDraftTextAlign(selected.textAlign);
    setDraftMarginTop(selected.marginTop);
    setDraftMarginBottom(selected.marginBottom);
    setDraftPaddingTop(selected.paddingTop);
    setDraftPaddingBottom(selected.paddingBottom);
    setDraftPaddingLeft(selected.paddingLeft);
    setDraftPaddingRight(selected.paddingRight);
    setDraftColor(selected.color);
    setDraftBackgroundColor(selected.backgroundColor);
    setDraftBorderColor(selected.borderColor);
    setDraftBorderWidth(selected.borderWidth);
    setDraftBorderStyle(selected.borderStyle);
    setDraftBorderRadius(selected.borderRadius);
    setDraftBoxShadow(selected.boxShadow);
    setDraftWidth(selected.width);
    setDraftHeight(selected.height);
    setDraftMaxWidth(selected.maxWidth);
    setDraftObjectFit(selected.objectFit);
    setDraftHoverBackground(selected.hoverBackgroundColor);
    setDraftSrc(selected.src);
    setDraftAlt(selected.alt);
  }, [
    selected?.hftId,
    selected?.text,
    selected?.fontFamily,
    selected?.fontSize,
    selected?.fontWeight,
    selected?.lineHeight,
    selected?.letterSpacing,
    selected?.textAlign,
    selected?.marginTop,
    selected?.marginBottom,
    selected?.paddingTop,
    selected?.paddingBottom,
    selected?.paddingLeft,
    selected?.paddingRight,
    selected?.color,
    selected?.backgroundColor,
    selected?.borderColor,
    selected?.borderWidth,
    selected?.borderStyle,
    selected?.borderRadius,
    selected?.boxShadow,
    selected?.width,
    selected?.height,
    selected?.maxWidth,
    selected?.objectFit,
    selected?.hoverBackgroundColor,
    selected?.src,
    selected?.alt,
  ]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;
      // 安全守卫 1: 消息必须来自我们自己的 preview iframe
      if (event.source !== previewFrameRef.current?.contentWindow) return;
      // 安全守卫 2: 消息必须带匹配的 token,否则视为伪造
      if (typeof data.token !== "string" || data.token !== bridgeTokenRef.current) return;
      if (data.type === "HTML_FINETUNE_OPTIMIZED_CONTENT_BOUNDS") {
        const bounds = data.bounds;
        const hasValidBounds =
          bounds &&
          typeof bounds.x === "number" &&
          typeof bounds.y === "number" &&
          typeof bounds.width === "number" &&
          typeof bounds.height === "number" &&
          bounds.width > 0 &&
          bounds.height > 0;
        setPreviewContentBounds(hasValidBounds ? bounds : null);
        return;
      }
      if (data.type === "HTML_FINETUNE_OPTIMIZED_STATUS" && typeof data.message === "string") {
        setStatusMessage(data.message.slice(0, 180));
        return;
      }
      if (data.type === "HTML_FINETUNE_OPTIMIZED_MODAL_STATE") {
        setStatusMessage(data.found ? (data.open ? "预览弹窗已打开" : "预览弹窗已关闭") : "当前预览未发现弹窗");
        return;
      }
      if (
        data.type === "HTML_FINETUNE_OPTIMIZED_DRAG" &&
        typeof data.hftId === "string" &&
        data.styles &&
        typeof data.styles === "object"
      ) {
        const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, data.hftId, {
          styles: {
            position: String(data.styles.position ?? ""),
            left: String(data.styles.left ?? ""),
            top: String(data.styles.top ?? ""),
          },
        });
        latestHtmlRef.current = nextHtml;
        commit({ html: nextHtml, selectedId: data.hftId });
        setStatusMessage("已拖拽定位元素");
        return;
      }
      if (
        data.type === "HTML_FINETUNE_OPTIMIZED_ACTION" &&
        typeof data.hftId === "string" &&
        typeof data.action === "string"
      ) {
        const hftId = data.hftId;
        const action = data.action;
        if (!domTree.some((node) => node.hftId === hftId)) return;
        flushDebouncedHistory();
        setIsSelectionCleared(false);

        if (action === "edit-text") {
          commit({ html: latestHtmlRef.current, selectedId: hftId }, { record: false });
          setInspectorTab("content");
          window.requestAnimationFrame(() => {
            const textarea = document.querySelector<HTMLTextAreaElement>("#contentInput");
            textarea?.focus();
            textarea?.select();
          });
          setStatusMessage("已从 Canvas 进入文字编辑");
          return;
        }

        if (action === "copy-style") {
          const snapshot = buildSelectedSnapshot(latestHtmlRef.current, hftId);
          if (!snapshot) return;
          setCopiedStyle({
            fontFamily: snapshot.fontFamily,
            fontSize: snapshot.fontSize,
            fontWeight: snapshot.fontWeight,
            lineHeight: snapshot.lineHeight,
            letterSpacing: snapshot.letterSpacing,
            textAlign: snapshot.textAlign,
            marginTop: snapshot.marginTop,
            marginBottom: snapshot.marginBottom,
            paddingTop: snapshot.paddingTop,
            paddingBottom: snapshot.paddingBottom,
            paddingLeft: snapshot.paddingLeft,
            paddingRight: snapshot.paddingRight,
            color: snapshot.color,
            backgroundColor: snapshot.backgroundColor,
            borderColor: snapshot.borderColor,
            borderWidth: snapshot.borderWidth,
            borderStyle: snapshot.borderStyle,
            borderRadius: snapshot.borderRadius,
            boxShadow: snapshot.boxShadow,
            width: snapshot.width,
            height: snapshot.height,
            maxWidth: snapshot.maxWidth,
            objectFit: snapshot.objectFit,
            hoverBackgroundColor: snapshot.hoverBackgroundColor,
          });
          commit({ html: latestHtmlRef.current, selectedId: hftId }, { record: false });
          setStatusMessage("已从 Canvas 复制样式");
          return;
        }

        if (action === "paste-style") {
          if (!copiedStyle) {
            setStatusMessage("请先复制一个元素的样式");
            return;
          }
          const { hoverBackgroundColor, ...styles } = copiedStyle;
          const nextHtml = updateHtmlElementByHftId(latestHtmlRef.current, hftId, {
            styles,
            effects: { hoverBackgroundColor },
          });
          latestHtmlRef.current = nextHtml;
          commit({ html: nextHtml, selectedId: hftId });
          setStatusMessage("已从 Canvas 粘贴样式");
          return;
        }

        if (action === "move-up" || action === "move-down") {
          const direction = action === "move-up" ? "up" : "down";
          const nextHtml = moveHtmlElementByHftId(latestHtmlRef.current, hftId, direction);
          if (nextHtml === latestHtmlRef.current) {
            setStatusMessage(direction === "up" ? "这个元素已经在同级最上方" : "这个元素已经在同级最下方");
            return;
          }
          latestHtmlRef.current = nextHtml;
          commit({ html: nextHtml, selectedId: hftId });
          setStatusMessage(direction === "up" ? "已从 Canvas 上移元素" : "已从 Canvas 下移元素");
          return;
        }

        if (action === "duplicate" || action === "delete") {
          const mutatedHtml =
            action === "duplicate"
              ? duplicateHtmlElementByHftId(latestHtmlRef.current, hftId)
              : deleteHtmlElementByHftId(latestHtmlRef.current, hftId);
          const nextHtml = action === "duplicate" ? injectEditableIds(mutatedHtml).html : mutatedHtml;
          latestHtmlRef.current = nextHtml;
          if (action === "delete") setIsSelectionCleared(true);
          commit({ html: nextHtml, selectedId: action === "delete" ? null : hftId });
          setStatusMessage(action === "duplicate" ? "已从 Canvas 复制元素" : "已从 Canvas 删除元素");
          return;
        }
      }
      if (data.type !== "HTML_FINETUNE_OPTIMIZED_SELECT" || typeof data.hftId !== "string") return;
      if (!domTree.some((node) => node.hftId === data.hftId)) return;
      flushDebouncedHistory();
      setIsSelectionCleared(false);
      commit({ html: latestHtmlRef.current, selectedId: data.hftId }, { record: false });
      setStatusMessage("已从 Canvas 选择元素");
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [commit, copiedStyle, domTree, flushDebouncedHistory]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setIsToastVisible(false), 1600);
  }, []);

  const selectElement = useCallback(
    (hftId: string) => {
      setIsSelectionCleared(false);
      flushDebouncedHistory();
      commit({ html: state.html, selectedId: hftId }, { record: false });
      setStatusMessage("已选择元素");
    },
    [commit, flushDebouncedHistory, state.html]
  );

  const commitHtml = useCallback(
    (nextHtml: string, nextSelectedId = selectedId) => {
      commit({ html: nextHtml, selectedId: nextSelectedId }, { debounce: true });
    },
    [commit, selectedId]
  );

  const applyViewportPreset = useCallback((presetKey: ViewportPresetKey) => {
    const preset = VIEWPORT_PRESETS[presetKey];
    setViewportSize({ width: preset.width, height: preset.height });
    setStatusMessage(`Viewport ${preset.width} × ${preset.height}`);
  }, []);

  const updateViewportDimension = useCallback((dimension: "width" | "height", value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(240, Math.min(2400, parsed));
    setViewportSize((current) => ({ ...current, [dimension]: clamped }));
    setStatusMessage("Viewport 已自定义");
  }, []);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!/\.html?$/i.test(file.name)) {
        showToast("只支持 HTML 文件");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage("文件过大（上限 5MB），请减小后再试");
        showToast("文件超过 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const nextHtml = injectEditableIds(String(reader.result ?? "")).html;
          setIsSelectionCleared(false);
          reset({ html: nextHtml, selectedId: null });
          setIsEmptyDoc(false);
          setSourceTab("structure");
          setHasImportedHtml(true);
          setStatusMessage(`已导入 ${file.name}`);
          showToast("HTML 已导入");
        } catch (error) {
          const message = error instanceof Error ? error.message : "HTML 解析失败";
          setStatusMessage(message);
          showToast("导入失败");
        }
      };
      reader.onerror = () => {
        setStatusMessage("文件读取失败");
        showToast("文件读取失败");
      };
      reader.readAsText(file);
    }, [reset, showToast]);

  const handleSourceDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      handleFile(event.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  const handleSourceDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleApplyText = useCallback(() => {
    if (!selected) return;
    const nextText = draftText.trim();
    if (!nextText) {
      setStatusMessage("文字内容不能为空");
      showToast("空文案未应用");
      return;
    }
    const nextHtml = updateHtmlElementByHftId(state.html, selected.hftId, { text: draftText });
    commitHtml(nextHtml, selected.hftId);
    setStatusMessage("文字已应用到 Canvas");
    showToast("已更新文字");
  }, [commitHtml, draftText, selected, showToast, state.html]);

  const handleApplyStyle = useCallback(() => {
    if (!selected) return;
    const nextHtml = updateHtmlElementByHftId(state.html, selected.hftId, {
      styles: {
        fontFamily: draftFontFamily,
        fontSize: draftFontSize,
        fontWeight: draftFontWeight,
        lineHeight: draftLineHeight,
        letterSpacing: draftLetterSpacing,
        textAlign: draftTextAlign,
        marginTop: draftMarginTop,
        marginBottom: draftMarginBottom,
        paddingTop: draftPaddingTop,
        paddingBottom: draftPaddingBottom,
        paddingLeft: draftPaddingLeft,
        paddingRight: draftPaddingRight,
        color: draftColor,
        backgroundColor: draftBackgroundColor,
        borderColor: draftBorderColor,
        borderWidth: draftBorderWidth,
        borderStyle: draftBorderStyle,
        borderRadius: draftBorderRadius,
        boxShadow: draftBoxShadow,
        width: draftWidth,
        height: draftHeight,
        maxWidth: draftMaxWidth,
        objectFit: draftObjectFit,
      },
      effects: {
        hoverBackgroundColor: draftHoverBackground,
      },
    });
    commitHtml(nextHtml, selected.hftId);
    setStatusMessage("样式已应用到 Canvas");
    showToast("已更新样式");
  }, [
    commitHtml,
    draftBackgroundColor,
    draftBorderColor,
    draftBorderRadius,
    draftBorderStyle,
    draftBorderWidth,
    draftBoxShadow,
    draftColor,
    draftFontFamily,
    draftFontSize,
    draftFontWeight,
    draftHeight,
    draftHoverBackground,
    draftLetterSpacing,
    draftLineHeight,
    draftMarginBottom,
    draftMarginTop,
    draftMaxWidth,
    draftObjectFit,
    draftPaddingBottom,
    draftPaddingLeft,
    draftPaddingRight,
    draftPaddingTop,
    draftTextAlign,
    draftWidth,
    selected,
    showToast,
    state.html,
  ]);

  const applyShortcutStyle = useCallback(
    (styles: Partial<Pick<SelectedSnapshot, "fontWeight" | "textAlign">>, label: string) => {
      if (!selected) return;
      const nextHtml = updateHtmlElementByHftId(state.html, selected.hftId, { styles });
      commitHtml(nextHtml, selected.hftId);
      if (styles.fontWeight !== undefined) setDraftFontWeight(styles.fontWeight);
      if (styles.textAlign !== undefined) setDraftTextAlign(styles.textAlign);
      setInspectorTab("style");
      setStatusMessage(label);
      showToast(label);
    },
    [commitHtml, selected, showToast, state.html]
  );

  const handleApplyAttributes = useCallback(() => {
    if (!selected) return;
    const nextHtml = updateHtmlElementByHftId(state.html, selected.hftId, {
      attributes: {
        src: draftSrc,
        alt: draftAlt,
      },
    });
    commitHtml(nextHtml, selected.hftId);
    setStatusMessage("属性已应用到 Canvas");
    showToast("已更新属性");
  }, [commitHtml, draftAlt, draftSrc, selected, showToast, state.html]);

  const handleApplySource = useCallback(() => {
    try {
      const nextHtml = injectEditableIds(sourceDraft).html;
      setIsSelectionCleared(false);
      reset({ html: nextHtml, selectedId: null });
      setStatusMessage("源码已重新解析");
      showToast("源码已应用");
    } catch (error) {
      const message = error instanceof Error ? error.message : "源码解析失败";
      setStatusMessage(message);
      showToast("源码解析失败");
    }
  }, [reset, showToast, sourceDraft]);

  const handleResetSourceDraft = useCallback(() => {
    setSourceDraft(state.html);
    setStatusMessage("源码草稿已重置");
    showToast("源码已重置");
  }, [showToast, state.html]);

  const handleSourceScroll = useCallback(() => {
    if (!sourceTextareaRef.current || !sourceLineGutterRef.current) return;
    sourceLineGutterRef.current.scrollTop = sourceTextareaRef.current.scrollTop;
  }, []);

  const handleFindSourceMatch = useCallback(() => {
    const query = sourceSearch.trim();
    const textarea = sourceTextareaRef.current;
    if (!query || !textarea) return;

    const haystack = sourceDraft.toLowerCase();
    const needle = query.toLowerCase();
    const startIndex = Math.max(textarea.selectionEnd, 0);
    let matchIndex = haystack.indexOf(needle, startIndex);
    if (matchIndex === -1) matchIndex = haystack.indexOf(needle);
    if (matchIndex === -1) {
      setSourceSearchPosition(null);
      setStatusMessage("源码中未找到匹配项");
      showToast("未找到源码匹配");
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(matchIndex, matchIndex + query.length);
    const lineIndex = sourceDraft.slice(0, matchIndex).split("\n").length - 1;
    let matchNumber = 1;
    let seenMatches = 0;
    let searchFrom = 0;
    while (searchFrom <= haystack.length) {
      const index = haystack.indexOf(needle, searchFrom);
      if (index === -1) break;
      seenMatches += 1;
      if (index === matchIndex) {
        matchNumber = seenMatches;
        break;
      }
      searchFrom = index + Math.max(needle.length, 1);
    }
    textarea.scrollTop = Math.max(0, lineIndex * 22 - 88);
    handleSourceScroll();
    setSourceSearchPosition({ matchNumber, lineNumber: lineIndex + 1 });
    setStatusMessage(`已定位源码匹配：第 ${lineIndex + 1} 行`);
  }, [handleSourceScroll, showToast, sourceDraft, sourceSearch]);

  const handleImportClick = useCallback(() => {
    setIsMobileActionsOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handlePasteHtml = useCallback(async () => {
    const html = await readHtmlFromClipboard();
    if (!html) {
      setStatusMessage("剪贴板中没有可用的 HTML 内容");
      showToast("未找到 HTML");
      return;
    }
    try {
      const nextHtml = injectEditableIds(html).html;
      setIsSelectionCleared(false);
      reset({ html: nextHtml, selectedId: null });
      setSourceTab("structure");
      setHasImportedHtml(true);
      setIsEmptyDoc(false);
      setStatusMessage("已从剪贴板粘贴 HTML");
      showToast("HTML 已粘贴");
    } catch (error) {
      const message = error instanceof Error ? error.message : "HTML 解析失败";
      setStatusMessage(message);
      showToast("粘贴失败");
    }
  }, [reset, showToast]);

  const handleCopy = useCallback(async () => {
    try {
      await copyHtmlToClipboard(cleanHtml);
      setStatusMessage("已复制干净 HTML");
      showToast("已复制 HTML");
    } catch (error) {
      const message = error instanceof Error ? error.message : "复制失败";
      setStatusMessage(message);
      showToast("复制失败");
    }
  }, [cleanHtml, showToast]);

  const handleOpenExport = useCallback((format: ExportFormat) => {
    assertCleanExport(cleanHtml);
    exportWarnings.forEach((warning) => console.warn(`[ExportWarning] ${warning.message}`));
    setIsExportOpen(false);
    setIsMobileActionsOpen(false);
    setExportDialogFormat(format);
    setIsExportDialogOpen(true);
    setStatusMessage(exportWarnings.length ? `导出预览含 ${exportWarnings.length} 项警告` : "已生成导出前预览");
  }, [cleanHtml, exportWarnings]);

  const handleCloseExportDialog = useCallback(() => {
    setIsExportDialogOpen(false);
    window.requestAnimationFrame(() => {
      exportTriggerRef.current?.focus();
    });
  }, []);

  const handleOpenSourcePanel = useCallback(() => {
    setIsMobileActionsOpen(false);
    setIsSourceCollapsed(false);
    if (isMobileShell) {
      setIsInspectorCollapsed(true);
    }
  }, [isMobileShell]);

  const handleCloseSourcePanel = useCallback(() => {
    setIsSourceCollapsed(true);
  }, []);

  const handleOpenInspectorPanel = useCallback(() => {
    setIsMobileActionsOpen(false);
    setIsInspectorCollapsed(false);
    if (isMobileShell) {
      setIsSourceCollapsed(true);
    }
  }, [isMobileShell]);

  const handleCloseInspectorPanel = useCallback(() => {
    setIsInspectorCollapsed(true);
  }, []);

  const handleCloseMobilePanels = useCallback(() => {
    setIsSourceCollapsed(true);
    setIsInspectorCollapsed(true);
    setStatusMessage("已收起移动侧栏");
  }, []);

  const handleExportHtml = useCallback(() => {
    try {
      assertCleanExport(cleanHtml);
      exportHtml(cleanHtml);
      setIsExportOpen(false);
      setIsExportDialogOpen(false);
      setStatusMessage("已导出 HTML");
      showToast("HTML 已导出");
    } catch (error) {
      const message = error instanceof Error ? error.message : "导出失败";
      setStatusMessage(message);
      showToast("导出失败");
    }
  }, [cleanHtml, showToast]);

  const handleAnalyzeStructure = useCallback(async () => {
    setAiStatus("running");
    setAiError("");
    setStatusMessage("AI 正在扫描结构");
    try {
      const annotations = await analyzeStructureWithAi({
        providerId: aiProvider,
        apiKey: currentAiKey,
        model: currentAiModel,
        html: state.html,
        domTree,
      });
      setAiAnnotations(Object.fromEntries(annotations.map((annotation) => [annotation.hftId, annotation])));
      setAiStatus("ready");
      setSourceTab("structure");
      setStatusMessage(`AI 已标注 ${annotations.length} 个结构节点`);
      showToast("AI 扫描完成");
      return annotations;
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 扫描失败";
      setAiStatus("error");
      setAiError(message);
      setStatusMessage(message.split("\n")[0] || "AI 扫描失败");
      showToast("AI 扫描失败");
      throw error;
    }
  }, [aiProvider, currentAiKey, currentAiModel, domTree, showToast, state.html]);

  const handleRefreshAiModels = useCallback(async (mode: "manual" | "auto" = "manual", signal?: AbortSignal) => {
    const trimmedKey = currentAiKey.trim();
    const presetOptions = buildPresetAiModelOptions(AI_PROVIDER_MAP[aiProvider]);
    if (!trimmedKey) {
      setAiModelOptions((prev) => ({ ...prev, [aiProvider]: presetOptions }));
      setAiModelFetchStatus("idle");
      setAiModelFetchError("");
      if (mode === "manual") showToast("请先填写 API Key");
      return;
    }
    setSourceTab("ai");
    setAiModelFetchStatus("loading");
    setAiModelFetchError("");
    if (mode === "manual") setStatusMessage("正在刷新 AI 模型列表");
    const requestId = aiModelFetchRequestRef.current + 1;
    aiModelFetchRequestRef.current = requestId;
    try {
      const remoteOptions = await fetchAiModelOptions({
        providerId: aiProvider,
        apiKey: trimmedKey,
        signal,
      });
      if (signal?.aborted) return;
      if (requestId !== aiModelFetchRequestRef.current) return;
      const merged = mergeAiModelOptions(remoteOptions, presetOptions);
      setAiModelOptions((prev) => ({ ...prev, [aiProvider]: merged }));
      if (!merged.some((option) => option.value === currentAiModel)) {
        setAiModels((models) => ({
          ...models,
          [aiProvider]: merged[0]?.value ?? AI_PROVIDER_MAP[aiProvider].defaultModel,
        }));
      }
      setAiModelFetchStatus("ready");
      setStatusMessage(`已刷新 ${merged.length} 个模型`);
      if (mode === "manual") showToast("模型列表已刷新");
    } catch (error) {
      if (signal?.aborted) return;
      if (requestId !== aiModelFetchRequestRef.current) return;
      const message = error instanceof Error ? error.message : "模型列表刷新失败";
      setAiModelFetchStatus("error");
      setAiModelFetchError(message);
      if (mode === "manual") {
        setStatusMessage(message.split("\n")[0] || "模型列表刷新失败");
        showToast("模型刷新失败");
      }
    }
  }, [aiProvider, currentAiKey, currentAiModel, showToast]);

  useEffect(() => {
    const trimmedKey = currentAiKey.trim();
    if (!trimmedKey || trimmedKey.length < 3) {
      setAiModelFetchStatus("idle");
      setAiModelFetchError("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void handleRefreshAiModels("auto", controller.signal);
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [currentAiKey, handleRefreshAiModels]);

  const runAiExportPreflight = useCallback(async () => {
    if (!currentAiKey.trim() || !currentAiModel.trim()) {
      setAiPreflightNote("未配置 API Key，已跳过");
      return [];
    }
    if (Object.keys(aiAnnotations).length > 0) {
      const cached = Object.values(aiAnnotations);
      const riskCount = cached.filter((annotation) => annotation.issues.length > 0).length;
      setAiPreflightNote(riskCount > 0 ? `复用缓存：${riskCount} 个风险` : "复用缓存：未发现风险");
      return cached;
    }
    try {
      const annotations = await handleAnalyzeStructure();
      const riskCount = annotations.filter((annotation) => annotation.issues.length > 0).length;
      setAiPreflightNote(riskCount > 0 ? `发现 ${riskCount} 个风险` : "通过");
      return annotations;
    } catch {
      setAiPreflightNote("AI 预检失败，已继续导出");
      return [];
    }
  }, [aiAnnotations, currentAiKey, currentAiModel, handleAnalyzeStructure]);

  const handleClearAiAnnotations = useCallback(() => {
    setAiAnnotations({});
    setAiStatus("idle");
    setAiError("");
    setAiPreflightNote("未运行");
    setStatusMessage("已清空 AI 结构标注");
    showToast("AI 标注已清空");
  }, [showToast]);

  const handleToggleTreeNode = useCallback((hftId: string) => {
    setCollapsedTreeIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(hftId)) {
        nextIds.delete(hftId);
      } else {
        nextIds.add(hftId);
      }
      return nextIds;
    });
  }, []);

  const handleExpandAllTreeNodes = useCallback(() => {
    setCollapsedTreeIds(new Set());
    setStatusMessage("结构树已全部展开");
  }, []);

  const handleCollapseAllTreeNodes = useCallback(() => {
    setCollapsedTreeIds(new Set(collapsibleTreeIds));
    setStatusMessage("结构树已全部折叠");
  }, [collapsibleTreeIds]);

  const handleStartPanelResize = useCallback(
    (panel: "source" | "inspector") => (event: ReactPointerEvent<HTMLButtonElement>) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      event.preventDefault();
      const rect = workspace.getBoundingClientRect();
      const startSourceWidth = sourceWidth;
      const startInspectorWidth = inspectorWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const availableWidth = rect.width;
        if (panel === "source") {
          const maxSourceWidth = Math.max(
            MIN_SOURCE_WIDTH,
            availableWidth - startInspectorWidth - MIN_STAGE_WIDTH
          );
          setSourceWidth(clamp(moveEvent.clientX - rect.left, MIN_SOURCE_WIDTH, maxSourceWidth));
          return;
        }

        const maxInspectorWidth = Math.max(
          MIN_INSPECTOR_WIDTH,
          availableWidth - startSourceWidth - MIN_STAGE_WIDTH
        );
        setInspectorWidth(clamp(rect.right - moveEvent.clientX, MIN_INSPECTOR_WIDTH, maxInspectorWidth));
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
    [inspectorWidth, sourceWidth]
  );

  const handleExportPdf = useCallback(async () => {
    if (exportingFormat) return;
    assertCleanExport(cleanHtml);
    exportWarnings.forEach((warning) => console.warn(`[ExportWarning] ${warning.message}`));
    if (hasBlockingExportWarnings(exportWarnings)) {
      setIsExportOpen(false);
      setExportDialogFormat("pdf");
      setIsExportDialogOpen(true);
      setStatusMessage(`PDF 导出已暂停：${exportWarnings.length} 项导出警告`);
      showToast("请先检查导出预览");
      return;
    }
    setExportingFormat("pdf");
    setIsExportOpen(false);
    setStatusMessage("正在导出 PDF");
    try {
      const annotations = await runAiExportPreflight();
      const riskCount = annotations.filter((annotation) => annotation.issues.length > 0).length;
      if (riskCount > 0) setStatusMessage(`AI 预检发现 ${riskCount} 个风险，继续导出 PDF`);
      const pageCount = await exportPdfFromHtml(cleanHtml);
      setStatusMessage(`已导出 PDF · ${pageCount} 页`);
      showToast("PDF 已导出");
    } catch (error) {
      const message = formatPdfError(error);
      setStatusMessage(message);
      showToast("PDF 导出失败");
    } finally {
      setExportingFormat(null);
    }
  }, [cleanHtml, exportWarnings, exportingFormat, runAiExportPreflight, showToast]);

  const handleExportPptx = useCallback(async () => {
    if (exportingFormat) return;
    assertCleanExport(cleanHtml);
    exportWarnings.forEach((warning) => console.warn(`[ExportWarning] ${warning.message}`));
    if (hasBlockingExportWarnings(exportWarnings)) {
      setIsExportOpen(false);
      setExportDialogFormat("pptx");
      setIsExportDialogOpen(true);
      setStatusMessage(`PPTX 导出已暂停：${exportWarnings.length} 项导出警告`);
      showToast("请先检查导出预览");
      return;
    }
    setExportingFormat("pptx");
    setIsExportOpen(false);
    setStatusMessage("正在导出 PPTX");
    try {
      const annotations = await runAiExportPreflight();
      const riskCount = annotations.filter((annotation) => annotation.issues.length > 0).length;
      if (riskCount > 0) setStatusMessage(`AI 预检发现 ${riskCount} 个风险，继续导出 PPTX`);
      const pageCount = await exportPptxFromHtml(cleanHtml);
      setStatusMessage(`已导出 PPTX · ${pageCount} 页`);
      showToast("PPTX 已导出");
    } catch (error) {
      const message = formatPptxError(error);
      setStatusMessage(message);
      showToast("PPTX 导出失败");
    } finally {
      setExportingFormat(null);
    }
  }, [cleanHtml, exportWarnings, exportingFormat, runAiExportPreflight, showToast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      const key = event.key.toLowerCase();
      if (!isTextInput && key === "escape") {
        if (isMobileActionsOpen) {
          event.preventDefault();
          setIsMobileActionsOpen(false);
          return;
        }
        if (isMobileShell && (!isSourceCollapsed || !isInspectorCollapsed)) {
          event.preventDefault();
          setIsSourceCollapsed(true);
          setIsInspectorCollapsed(true);
          return;
        }
        if (isCheatsheetOpen) {
          event.preventDefault();
          setIsCheatsheetOpen(false);
          return;
        }
        event.preventDefault();
        setIsHistoryOpen(false);
        setIsExportOpen(false);
        setIsExportDialogOpen(false);
        setIsSelectionCleared(true);
        commit({ html: state.html, selectedId: null }, { record: false });
        setStatusMessage("已取消选择");
        return;
      }
      if (!isTextInput && !event.metaKey && !event.ctrlKey && event.key === "?") {
        event.preventDefault();
        setIsCheatsheetOpen((value) => !value);
        return;
      }
      if (!isTextInput && (key === "delete" || key === "backspace") && selected) {
        event.preventDefault();
        const nextHtml = deleteHtmlElementByHftId(state.html, selected.hftId);
        setIsSelectionCleared(true);
        commit({ html: nextHtml, selectedId: null });
        setStatusMessage("元素已删除");
        showToast("已删除元素");
        return;
      }

      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      if (key === "z" && !isTextInput) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (key === "y" && !isTextInput) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "s") {
        event.preventDefault();
        handleExportHtml();
        return;
      }
      if (key === "o") {
        event.preventDefault();
        handleImportClick();
        return;
      }
      if (key === "e" && !event.shiftKey) {
        event.preventDefault();
        handleOpenExport("html");
        return;
      }
      if (key === "d" && !isTextInput && selected) {
        event.preventDefault();
        const duplicatedHtml = duplicateHtmlElementByHftId(state.html, selected.hftId);
        const nextHtml = injectEditableIds(duplicatedHtml).html;
        commit({ html: nextHtml, selectedId: selected.hftId });
        setStatusMessage("元素已复制");
        showToast("已复制元素");
        return;
      }
      if (key === "f" && !isTextInput) {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>("[data-tree-search-input]");
        input?.focus();
        input?.select();
        return;
      }
      if (key === "i" && !isTextInput) {
        event.preventDefault();
        setInspectorTab("content");
        window.requestAnimationFrame(() => {
          const textarea = document.querySelector<HTMLTextAreaElement>("#contentInput");
          textarea?.focus();
          textarea?.select();
        });
        setStatusMessage("在右侧检查器编辑文字");
        return;
      }
      if (key === "b" && !isTextInput) {
        event.preventDefault();
        applyShortcutStyle({ fontWeight: "700" }, "已设为粗体");
        return;
      }
      if (key === "l" && !isTextInput) {
        event.preventDefault();
        applyShortcutStyle({ textAlign: "left" }, "已左对齐");
        return;
      }
      if (key === "r" && !isTextInput) {
        event.preventDefault();
        applyShortcutStyle({ textAlign: "right" }, "已右对齐");
        return;
      }
      if ((key === "j" || (key === "e" && event.shiftKey)) && !isTextInput) {
        event.preventDefault();
        applyShortcutStyle({ textAlign: "justify" }, "已两端对齐");
        return;
      }
      if (!isTextInput && key >= "1" && key <= "4") {
        event.preventDefault();
        const presetKey = VIEWPORT_PRESET_KEYS[Number(key) - 1];
        if (presetKey) applyViewportPreset(presetKey);
        return;
      }
      if (!isTextInput && key === "5") {
        event.preventDefault();
        setZoomMode("fit");
        setStatusMessage("Viewport 已切换为适配缩放");
        return;
      }
      if (key === "c" && event.shiftKey && !isTextInput) {
        event.preventDefault();
        void handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyShortcutStyle, applyViewportPreset, commit, handleCopy, handleExportHtml, handleImportClick, handleOpenExport, isCheatsheetOpen, isInspectorCollapsed, isMobileActionsOpen, isMobileShell, isSourceCollapsed, redo, selected, showToast, state.html, undo]);

  // 3. 空格键抓手机械拖拽平移与物理惯性滚动引擎
  // 注意:依赖 [stageSize.width, stageSize.height] 而不是 [stageRef.current],
  // 因为 ref.current 的变化不触发 useEffect 重跑。
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let isSpacePressed = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    let velocityX = 0;
    let velocityY = 0;
    let animationFrameId = 0;
    let lastTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName.toLowerCase();
      if (activeEl === "input" || activeEl === "textarea" || activeEl === "select") return;

      if (e.key === " " || e.code === "Space") {
        if (!isSpacePressed) {
          e.preventDefault();
          isSpacePressed = true;
          stage.style.cursor = "grab";
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        isSpacePressed = false;
        isDragging = false;
        stage.style.cursor = "";
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const isMiddle = e.button === 1;
      const isLeft = e.button === 0;
      if (!isMiddle && !(isLeft && isSpacePressed)) return;

      isDragging = true;
      stage.style.cursor = "grabbing";

      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = stage.scrollLeft;
      scrollTop = stage.scrollTop;

      velocityX = 0;
      velocityY = 0;
      lastTime = performance.now();
      cancelAnimationFrame(animationFrameId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      stage.scrollLeft = scrollLeft - deltaX;
      stage.scrollTop = scrollTop - deltaY;

      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed > 0) {
        velocityX = (deltaX / elapsed) * 16;
        velocityY = (deltaY / elapsed) * 16;
      }
      lastTime = now;
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      stage.style.cursor = isSpacePressed ? "grab" : "";

      const friction = 0.94;
      const step = () => {
        if (Math.abs(velocityX) < 0.15 && Math.abs(velocityY) < 0.15) {
          cancelAnimationFrame(animationFrameId);
          return;
        }
        stage.scrollLeft -= velocityX;
        stage.scrollTop -= velocityY;
        velocityX *= friction;
        velocityY *= friction;
        animationFrameId = requestAnimationFrame(step);
      };
      animationFrameId = requestAnimationFrame(step);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    stage.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      stage.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [stageSize.width, stageSize.height]);

  // 8. 全局按钮微型水波纹涟漪事件委托
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(".ds-btn, .icon-button, .segmented-button, .history-drawer-row");
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ds-ripple";

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      const originalPosition = window.getComputedStyle(btn).position;
      if (originalPosition === "static") {
        (btn as HTMLElement).style.position = "relative";
      }

      btn.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
        if (originalPosition === "static") {
          (btn as HTMLElement).style.position = "";
        }
      }, 400);
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  const handleMoveElement = useCallback(
    (direction: "up" | "down") => {
      if (!selected) return;
      const nextHtml = moveHtmlElementByHftId(state.html, selected.hftId, direction);
      commit({ html: nextHtml, selectedId: selected.hftId });
      setStatusMessage(direction === "up" ? "元素已上移" : "元素已下移");
      showToast(direction === "up" ? "已上移元素" : "已下移元素");
    },
    [commit, selected, showToast, state.html]
  );

  const handleDuplicateElement = useCallback(() => {
    if (!selected) return;
    const duplicatedHtml = duplicateHtmlElementByHftId(state.html, selected.hftId);
    const nextHtml = injectEditableIds(duplicatedHtml).html;
    commit({ html: nextHtml, selectedId: selected.hftId });
    setStatusMessage("元素已复制");
    showToast("已复制元素");
  }, [commit, selected, showToast, state.html]);

  const handleDeleteElement = useCallback(() => {
    if (!selected) return;
    const nextHtml = deleteHtmlElementByHftId(state.html, selected.hftId);
    setIsSelectionCleared(true);
    commit({ html: nextHtml, selectedId: null });
    setStatusMessage("元素已删除");
    showToast("已删除元素");
  }, [commit, selected, showToast, state.html]);

  const handleCopyStyle = useCallback(() => {
    if (!selected) return;
    setCopiedStyle({
      fontFamily: selected.fontFamily,
      fontSize: selected.fontSize,
      fontWeight: selected.fontWeight,
      lineHeight: selected.lineHeight,
      letterSpacing: selected.letterSpacing,
      textAlign: selected.textAlign,
      marginTop: selected.marginTop,
      marginBottom: selected.marginBottom,
      paddingTop: selected.paddingTop,
      paddingBottom: selected.paddingBottom,
      paddingLeft: selected.paddingLeft,
      paddingRight: selected.paddingRight,
      color: selected.color,
      backgroundColor: selected.backgroundColor,
      borderColor: selected.borderColor,
      borderWidth: selected.borderWidth,
      borderStyle: selected.borderStyle,
      borderRadius: selected.borderRadius,
      boxShadow: selected.boxShadow,
      width: selected.width,
      height: selected.height,
      maxWidth: selected.maxWidth,
      objectFit: selected.objectFit,
      hoverBackgroundColor: selected.hoverBackgroundColor,
    });
    setStatusMessage("样式已复制");
    showToast("已复制样式");
  }, [selected, showToast]);

  const handlePasteStyle = useCallback(() => {
    if (!selected || !copiedStyle) return;
    const { hoverBackgroundColor, ...styles } = copiedStyle;
    const nextHtml = updateHtmlElementByHftId(state.html, selected.hftId, {
      styles,
      effects: { hoverBackgroundColor },
    });
    commit({ html: nextHtml, selectedId: selected.hftId });
    setStatusMessage("样式已粘贴");
    showToast("已粘贴样式");
  }, [commit, copiedStyle, selected, showToast, state.html]);

  const handleModalCommand = useCallback(
    (action: "open" | "close") => {
      previewFrameRef.current?.contentWindow?.postMessage(
        { type: "HTML_FINETUNE_OPTIMIZED_MODAL", action },
        "*"
      );
      setStatusMessage(action === "open" ? "已请求打开预览弹窗" : "已请求关闭预览弹窗");
      showToast(action === "open" ? "已发送打开弹窗" : "已发送关闭弹窗");
    },
    [showToast]
  );

  const handleRunCheck = useCallback(() => {
    setIsChecking(true);
    setStatusMessage("正在运行发布检查");
    window.setTimeout(() => {
      setIsChecking(false);
      const hasEmptyText = domTree.some((node) => node.text.trim().length === 0);
      setStatusMessage(hasEmptyText ? "发布检查发现空文案" : "发布检查通过");
      showToast(hasEmptyText ? "发现空文案" : "发布检查通过");
    }, 700);
  }, [domTree, showToast]);

  const currentCount = domTree.length;
  const selectedTitle = selected?.label ?? "未选择";
  const statusTone = useMemo(() => getStatusTone(statusMessage), [statusMessage]);
  const isMobilePanelOpen = isMobileShell && (!isSourceCollapsed || !isInspectorCollapsed);
  const canEditSelectedText = Boolean(selected?.canEditText);
  const workspaceStyle = useMemo(
    () =>
      ({
        "--source-col": isSourceCollapsed ? "0px" : `${sourceWidth}px`,
        "--inspector-col": isInspectorCollapsed ? "0px" : `${inspectorWidth}px`,
      }) as CSSProperties,
    [inspectorWidth, sourceWidth, isSourceCollapsed, isInspectorCollapsed]
  );

  return (
    <WorkspaceShell>
      <div
        className={[
          "nw-app",
          "app-shell",
          isMobileShell ? "is-mobile-shell" : "",
          isFocusMode ? "is-focus-mode" : "",
        ].filter(Boolean).join(" ")}
      >
      <TopBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onExport={handleOpenExport}
        onImportClick={handleImportClick}
        onCopy={handleCopy}
        onToggleCheatsheet={() => setIsCheatsheetOpen(v => !v)}
        exportingFormat={exportingFormat}
        isMobileShell={isMobileShell}
        isMobileActionsOpen={isMobileActionsOpen}
        onToggleMobileActions={() => setIsMobileActionsOpen(v => !v)}
        fileInputRef={fileInputRef}
        historyTriggerRef={historyTriggerRef}
        exportTriggerRef={exportTriggerRef}
        mobileActionsRef={mobileActionsRef}
        onFileSelected={(file) => { handleFile(file); }}
      />

      {isHistoryOpen ? (
        <>
        <button
          className="history-drawer-backdrop"
          type="button"
          aria-label="关闭历史记录"
          title="关闭历史记录"
          onClick={handleCloseHistory}
        />
        <HistoryDrawer
      items={historyDisplayItems}
      onJumpTo={(index) => {
        jumpToHistoryIndex(index);
        setStatusMessage("已跳转历史记录");
      }}
      onClose={handleCloseHistory}
      onClearAll={() => {
        clearHistory();
        setStatusMessage("已清空历史记录");
      }}
    />
        </>
      ) : null}

      <main
        className={[
          "nw-body",
          "workspace",
          isMobileShell ? "workspace-mobile-shell" : "",
          isMobilePanelOpen ? "workspace-mobile-panel-open" : "",
          isSourceExpanded && sourceTab === "source" ? "workspace-source-expanded" : "",
        ].filter(Boolean).join(" ")}
        ref={workspaceRef}
        style={workspaceStyle}
      >
        {isEmptyDoc ? (
          <EmptyWorkspace
            onImportClick={handleImportClick}
            onPasteClick={handlePasteHtml}
            onDrop={(file) => handleFile(file)}
          />
        ) : (<>
        {isMobilePanelOpen ? (
          <button
            className="mobile-panel-backdrop"
            type="button"
            aria-label="关闭移动侧栏"
            title="关闭侧栏"
            onClick={handleCloseMobilePanels}
          />
        ) : null}
        {isSourceCollapsed && (
          <button
            className="panel-expand-btn panel-expand-btn--left"
            type="button"
            aria-label="展开结构树"
            aria-controls="source-panel"
            aria-expanded="false"
            title="展开左侧侧边栏"
            onClick={handleOpenSourcePanel}
          >
            <ChevronRight size={14} />
          </button>
        )}
        <aside
          id="source-panel"
          ref={sourcePanelRef}
          className={[
            "nw-left-panel",
            "panel",
            isSourceCollapsed ? "is-collapsed" : "",
          ].filter(Boolean).join(" ")}
          aria-label="结构树"
          data-dom-id="panel-source-tree"
        >
          {!isSourceCollapsed && (
            <button
              className="panel-resizer panel-resizer-source"
              type="button"
              aria-label="拖拽调整结构面板宽度"
              onPointerDown={handleStartPanelResize("source")}
            />
          )}
          <div
            className="nw-panel-tabs-row"
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid var(--n-border-default)",
              flexShrink: 0,
            }}
          >
            <div
              className="nw-tabs"
              role="tablist"
              style={{ flex: 1, borderBottom: "none" }}
            >
              <button
                className={`nw-tab ${sourceTab === "source" ? "nw-tab-active" : ""}`}
                type="button"
                onClick={() => setSourceTab("source")}
                role="tab"
                aria-selected={sourceTab === "source"}
                data-dom-id="tab-source"
              >来源</button>
              <button
                className={`nw-tab ${sourceTab === "structure" ? "nw-tab-active" : ""}`}
                type="button"
                onClick={() => setSourceTab("structure")}
                role="tab"
                aria-selected={sourceTab === "structure"}
              >DOM 树</button>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px" }}
            >
              <button
                className={`nw-tool-btn nw-tool-btn-icon${sourceTab === "ai" ? " is-on" : ""}`}
                type="button"
                aria-label="AI 结构扫描"
                aria-pressed={sourceTab === "ai"}
                onClick={() => setSourceTab("ai")}
                title="AI 结构扫描"
              >
                <IconSparkles />
              </button>
              {!isSourceCollapsed && (
                <button
                  className="panel-collapse-btn nw-tool-btn nw-tool-btn-icon"
                  type="button"
                  aria-label="收起结构树"
                  aria-controls="source-panel"
                  aria-expanded="true"
                  title="收起侧边栏"
                  onClick={handleCloseSourcePanel}
                >
                  <ChevronLeft size={14} />
                </button>
              )}
            </div>
          </div>

          {sourceTab === "structure" ? (
            <>
              {/* Search bar */}
              <div className="search-bar">
                <div className="ds-input">
                  <IconSearch />
                  <input
                    type="text"
                    data-tree-search-input
                    placeholder="搜索元素..."
                    aria-label="搜索元素"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              {/* Structure tree */}
              <div className="structure-tree" ref={treeScrollRef}>
                {visibleTree.map((node) => (
                  <TreeItemNode
                    key={node.hftId}
                    node={node}
                    isSelected={node.hftId === selectedId}
                    annotation={aiAnnotations[node.hftId]}
                    childCount={treeChildCounts[node.hftId] ?? 0}
                    isCollapsed={collapsedTreeIds.has(node.hftId)}
                    onSelect={selectElement}
                    onToggleCollapse={handleToggleTreeNode}
                  />
                ))}
                {visibleTree.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-state-card__icon">
                      <IconSearch />
                    </div>
                    <h3>搜索无匹配项</h3>
                    <p>没有找到与 “{search}” 相关的元素。换一个关键词,或直接在画布中选择对象。</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {sourceTab === "ai" ? (
            <div className="ai-tab-panel">
              <div className="ai-scan-card">
                <button
                  className={"ai-scan-card__head" + (isAiCardCollapsed ? " is-collapsed" : "")}
                  type="button"
                  aria-expanded={!isAiCardCollapsed}
                  onClick={() => setIsAiCardCollapsed((value) => !value)}
                >
                  <IconChevronDown />
                  <IconSparkles />
                  <span className="ai-scan-card__title">AI 结构扫描</span>
                  <span className="ai-scan-card__count">
                    <span className="dot" aria-hidden="true"></span>
                    {domTree.length} 节点
                  </span>
                </button>
                <div className={"ai-scan-card__body" + (isAiCardCollapsed ? " is-hidden" : "")}>
                  <div className="ai-scan-row">
                    <label htmlFor="aiProvider">厂商</label>
                    <AiProviderPicker
                      provider={aiProvider}
                      providers={AI_PROVIDER_DEFINITIONS}
                      onProviderChange={(nextProvider) => {
                        setAiProvider(nextProvider);
                        setAiModels((models) => ({
                          ...models,
                          [nextProvider]: models[nextProvider] || AI_PROVIDER_MAP[nextProvider].defaultModel,
                        }));
                        setAiModelFetchError("");
                      }}
                    />
                  </div>
                  <div className="ai-scan-row">
                    <label htmlFor="aiApiKey">Key</label>
                    <div className="ds-input">
                      <input
                        id="aiApiKey"
                        type="password"
                        value={currentAiKey}
                        placeholder={aiModelFetchStatus === "idle" ? "输入 Key 自动获取模型" : ""}
                        onChange={(event) => {
                          const nextKey = event.target.value;
                          setAiApiKeys((keys) => ({ ...keys, [aiProvider]: nextKey }));
                        }}
                      />
                    </div>
                  </div>
                  {aiModelFetchStatus === "loading" ? (
                    <p className="ai-scan-model-status">正在获取模型...</p>
                  ) : aiModelFetchStatus === "ready" ? (
                    <p className="ai-scan-model-status">已加载 {currentAiModels.length} 个模型</p>
                  ) : null}
                  <div className="ai-scan-row">
                    <label htmlFor="aiModel">模型</label>
                    <div className="ds-input">
                      <input
                        id="aiModel"
                        value={currentAiModel}
                        list="aiModelPresets"
                        onChange={(event) => {
                          const nextModel = event.target.value;
                          setAiModels((models) => ({ ...models, [aiProvider]: nextModel }));
                        }}
                      />
                      <datalist id="aiModelPresets">
                        {currentAiModels.map((model) => (
                          <option key={model.value} value={model.value}>{model.label}</option>
                        ))}
                      </datalist>
                      {aiModelFetchStatus === "loading" ? (
                        <span className="ai-scan-loading" aria-live="polite" title="正在获取模型列表">
                          <span className="spinner" aria-hidden="true"></span>
                        </span>
                      ) : aiModelFetchStatus === "ready" ? (
                        <span className="ai-scan-ok" aria-live="polite" title={`已加载 ${currentAiModels.length} 个模型`}>✓</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="ai-scan-actions">
                    <button
                      className="ds-btn ds-btn--ghost ds-btn--sm"
                      type="button"
                      onClick={handleClearAiAnnotations}
                      disabled={Object.keys(aiAnnotations).length === 0 || aiStatus === "running"}
                    >清空标注</button>
                    <button
                      className="ds-btn ds-btn--brand ds-btn--sm"
                      type="button"
                      onClick={() => void handleAnalyzeStructure()}
                      disabled={aiStatus === "running"}
                    >
                      <IconScan />
                      <span>{aiStatus === "running" ? "扫描中" : "AI 扫描"}</span>
                    </button>
                  </div>
                  {aiError ? (
                    <p className="meta ai-error" tabIndex={0} title={aiError} role="status">
                      {aiError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {sourceTab === "source" ? (
            <div className="source-editor" onDrop={handleSourceDrop} onDragOver={handleSourceDragOver}>
              <div className="source-import-dropzone">
                <div>
                  <strong>拖入 HTML 文件</strong>
                  <span>{sourceLineCount.toLocaleString()} 行 · {sourceCharCount.toLocaleString()} 字符 · {isSourceDirty ? "未应用" : "已同步"}</span>
                </div>
                <button className="ds-btn ds-btn--secondary ds-btn--sm" type="button" onClick={handleImportClick}>
                  导入
                </button>
              </div>
              <div
                id="source-editor-status"
                className="source-editor-status"
                data-state={sourceSyncState}
                role="status"
                aria-live="polite"
              >
                <span className="source-editor-status__dot" aria-hidden="true" />
                <strong>{sourceSyncTitle}</strong>
                <span>{sourceSyncDetail}</span>
              </div>
              <div className="source-editor-tools" aria-label="源码工具">
                <label className="source-search-field" data-state={sourceSearchState}>
                  <IconSearch />
                  <input
                    type="search"
                    value={sourceSearch}
                    placeholder="搜索源码"
                    aria-label="搜索源码"
                    onChange={(event) => setSourceSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleFindSourceMatch();
                      }
                    }}
                  />
                </label>
                <span className="source-search-count" data-state={sourceSearchState} aria-live="polite">
                  {sourceSearchQuery
                    ? sourceSearchMatchCount > 0
                      ? sourceSearchPosition
                        ? `${sourceSearchPosition.matchNumber}/${sourceSearchMatchCount} · 第 ${sourceSearchPosition.lineNumber} 行`
                        : `${sourceSearchMatchCount} 项`
                      : "0 项"
                    : "未搜索"}
                </span>
                <button
                  className="ds-btn ds-btn--ghost ds-btn--sm"
                  type="button"
                  onClick={handleFindSourceMatch}
                  disabled={!sourceSearchQuery}
                  aria-label="定位下一个源码匹配"
                  title="定位下一个源码匹配"
                >
                  定位
                </button>
                <button className={"ds-btn ds-btn--ghost ds-btn--sm" + (isSourceSoftWrap ? " is-on" : "")} type="button" aria-pressed={isSourceSoftWrap} onClick={() => setIsSourceSoftWrap((value) => !value)}>
                  {isSourceSoftWrap ? "软换行" : "横向滚动"}
                </button>
                <button className={"ds-btn ds-btn--secondary ds-btn--sm" + (isSourceExpanded ? " is-on" : "")} type="button" aria-pressed={isSourceExpanded} onClick={() => setIsSourceExpanded((value) => !value)}>
                  {isSourceExpanded ? "回到侧栏" : "展开源码"}
                </button>
              </div>
              <div className="field">
                <label htmlFor="sourceCode">HTML 源码</label>
                <div className="source-code-shell">
                  <pre ref={sourceLineGutterRef} className="source-line-gutter" aria-hidden="true">{sourceLineNumbers}</pre>
                  <textarea
                    ref={sourceTextareaRef}
                    id="sourceCode"
                    className={"textarea code-editor source-textarea" + (isSourceSoftWrap ? " source-textarea--wrap" : " source-textarea--nowrap")}
                    aria-label="HTML 源码"
                    aria-describedby="source-editor-status"
                    value={sourceDraft}
                    wrap={isSourceSoftWrap ? "soft" : "off"}
                    spellCheck={false}
                    onScroll={handleSourceScroll}
                    onChange={(event) => setSourceDraft(event.target.value)}
                  />
                </div>
              </div>
              <div className="source-editor-actions">
                <button className="ds-btn ds-btn--brand ds-btn--sm" type="button" onClick={handleApplySource} disabled={!isSourceDirty}>
                  {isSourceDirty ? <span className="dirty-breath-dot" /> : null}
                  <span>应用源码</span>
                </button>
                <button className="ds-btn ds-btn--ghost ds-btn--sm" type="button" onClick={handleResetSourceDraft} disabled={!isSourceDirty}>重置草稿</button>
                {hasHtmlUnclosedRisk ? (
                  <span className="source-validator-warning" title="检测到可能存在未闭合的标签，应用后可能引起预览乱序，请仔细核查">⚠️ 标签未闭合</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="nw-canvas panel stage-panel" aria-label="画布" data-od-id="canvas" tabIndex={-1}>
          <div className="viewport-bar" aria-label="画布工具栏">
            <div className="segmented-viewport-control" aria-label="视口预设切换">
              <span className="segmented-active-slide-bg" />
              <button
                type="button"
                className={"segmented-button" + ((matchingViewportPreset === "desktop" || matchingViewportPreset === "wide") ? " is-on" : "")}
                data-dom-id="vp-desktop"
                title="桌面端"
                aria-label="桌面端"
                aria-pressed={matchingViewportPreset === "desktop" || matchingViewportPreset === "wide"}
                onClick={() => applyViewportPreset("desktop")}
              >
                <IconMonitor />
              </button>
              <button
                type="button"
                className={"segmented-button" + (matchingViewportPreset === "tablet" ? " is-on" : "")}
                data-dom-id="vp-tablet"
                title="平板端"
                aria-label="平板端"
                aria-pressed={matchingViewportPreset === "tablet"}
                onClick={() => applyViewportPreset("tablet")}
              >
                <IconTablet />
              </button>
              <button
                type="button"
                className={"segmented-button" + (matchingViewportPreset === "mobile" ? " is-on" : "")}
                data-dom-id="vp-mobile"
                title="移动端"
                aria-label="移动端"
                aria-pressed={matchingViewportPreset === "mobile"}
                onClick={() => applyViewportPreset("mobile")}
              >
                <IconSmartphone />
              </button>
            </div>
            <span className="app-toolbar-sep" aria-hidden="true"></span>
            <span className="viewport-bar__dim">
              <IconMove />
              <span>{viewportSize.width} × {viewportSize.height}</span>
            </span>
            <div className="viewport-bar__group">
              <button
                type="button"
                className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
                data-dom-id="btn-zoom-out"
                title="缩小"
                aria-label="缩小"
                onClick={() => setZoomMode(zoomMode === "100" ? "88" : "fit")}
              >
                <IconZoomOut />
              </button>
              <span className="viewport-bar__zoom">{zoomMode === "fit" ? "适配" : (zoomMode === "88" ? "88%" : "100%")}</span>
              <button
                type="button"
                className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
                data-dom-id="btn-zoom-in"
                title="放大"
                aria-label="放大"
                onClick={() => setZoomMode(zoomMode === "fit" ? "88" : "100")}
              >
                <IconZoomIn />
              </button>
              <button
                type="button"
                className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon"
                data-dom-id="btn-fit"
                title="适应窗口"
                aria-label="适应窗口"
                onClick={() => setZoomMode("fit")}
              >
                <IconMaximize />
              </button>
              <span className="app-toolbar-sep" aria-hidden="true"></span>
              <button
                className={"ds-btn ds-btn--ghost ds-btn--sm" + (isFocusMode ? " is-on" : "")}
                type="button"
                aria-pressed={isFocusMode}
                onClick={() => {
                  setIsFocusMode(!isFocusMode);
                  setStatusMessage(isFocusMode ? "已退出专注模式" : "已进入专注模式");
                }}
              >
                {isFocusMode ? "退出专注" : "专注"}
              </button>
            </div>
          </div>
          <div className="stage" ref={stageRef}>
            {aiStatus === "running" ? (
              <div className="canvas-scan-overlay">
                <div className="canvas-scan-line" />
              </div>
            ) : null}
            <section className="nw-canvas" aria-label="预览画布">
              <div className="nw-preview-card">
                <div className="nw-preview-urlbar">
                  <span className="nw-preview-urlbar-dot" />
                  <span className="nw-preview-urlbar-dot" />
                  <span className="nw-preview-urlbar-dot" />
                  <div className="nw-preview-urlbar-input">localhost:5173</div>
                </div>
                <div className="page-preview-shell" style={previewShellStyle}>
                  <article
                    className={"page-preview" + (isContentFitPreview ? " page-preview--content-fit" : "")}
                    aria-label="页面预览"
                    style={{
                      width: previewFrameBounds.width,
                      height: previewFrameBounds.height,
                      transform: `scale(${previewScale})`,
                    }}
                  >
                    <iframe
                      ref={previewFrameRef}
                      className="live-preview-frame"
                      title="实时 HTML 预览"
                      srcDoc={previewSrcDoc}
                      sandbox="allow-scripts allow-forms allow-popups"
                      style={previewIframeStyle}
                      onLoad={() => {
                        setIsPreviewReady(true);
                        window.setTimeout(measurePreviewContent, 40);
                      }}
                    />
                  </article>
                </div>
              </div>
            </section>
          </div>
        </section>

        {isInspectorCollapsed && (
          <button
            className="panel-expand-btn panel-expand-btn--right"
            type="button"
            aria-label="展开样式检查器"
            aria-controls="inspector-panel"
            aria-expanded="false"
            title="展开右侧侧边栏"
            onClick={handleOpenInspectorPanel}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        <aside
          id="inspector-panel"
          ref={inspectorPanelRef}
          className={[
            "nw-right-panel",
            "panel",
            "inspector",
            isInspectorCollapsed ? "is-collapsed" : "",
          ].filter(Boolean).join(" ")}
          aria-label="属性面板"
          data-dom-id="panel-inspector"
        >
          {!isInspectorCollapsed && (
            <button
              className="panel-resizer panel-resizer-inspector"
              type="button"
              aria-label="拖拽调整属性面板宽度"
              onPointerDown={handleStartPanelResize("inspector")}
            />
          )}
          <div className="inspector-tabs-wrap">
            <span className="nw-inspector-title" style={{fontSize:'var(--n-text-xs)', fontWeight:600, color:'var(--n-fg-secondary)', textTransform:'uppercase', letterSpacing:'0.04em', fontFamily:'var(--n-font-sans)'}}>Inspector</span>
            {!isInspectorCollapsed && (
              <button
                className="panel-collapse-btn"
                type="button"
                aria-label="收起样式检查器"
                aria-controls="inspector-panel"
                aria-expanded="true"
                title="收起侧边栏"
                onClick={handleCloseInspectorPanel}
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          {selected ? (
            <div className="inspector-selection" data-dom-id="inspector-selection">
              <div className="inspector-selection__row1">
                <span className="inspector-selection__pill">{selected.tagName.toUpperCase()}</span>
                <span className="inspector-selection__path" title={selected.path}>
                  {selected.className ? `.${selected.className}` : (selected.label || selected.tagName)}
                </span>
              </div>
              <div className="inspector-selection__metrics">
                <span>{selected.width || "auto"} × {selected.height || "auto"} px</span>
                <span>{selected.fontSize || "—"} / {selected.lineHeight || "—"}</span>
                <span>{selected.fontWeight || "—"}</span>
              </div>
            </div>
          ) : null}
          <div className="inspector-body">
            {selectedAnnotation ? (
              <p className="meta ai-selected-note">
                AI：{selectedAnnotation.label} · {selectedAnnotation.role}
                {selectedAnnotation.issues.length ? " · " + selectedAnnotation.issues.join(" / ") : ""}
              </p>
            ) : null}
            {!selected ? (
              <section className="property-card inspector-empty" aria-label="选择提示">
                <strong>未选择元素</strong>
                <p className="meta">在左侧结构树或画布中点击任意元素即可在此处编辑内容、样式和属性。</p>
                <p className="meta">提示：按 <kbd>?</kbd> 查看全部快捷键。</p>
              </section>
            ) : null}
            {selected ? (
              <section className="property-card inspector-card" data-dom-id="alignment-bar">
                <div className="inspector-card__head">
                  <IconAlignCenter />
                  <span className="inspector-card__title">对齐</span>
                </div>
                <div className="alignment-bar">
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.textAlign === "left" ? " is-on" : "")}
                    title="左对齐 · B"
                    aria-label="左对齐"
                    aria-pressed={selected.textAlign === "left"}
                    onClick={() => applyShortcutStyle({ textAlign: "left" }, "已左对齐")}
                  >
                    <IconAlignLeft />
                  </button>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.textAlign === "center" ? " is-on" : "")}
                    title="居中 · E"
                    aria-label="居中对齐"
                    aria-pressed={selected.textAlign === "center"}
                    onClick={() => applyShortcutStyle({ textAlign: "center" }, "已居中")}
                  >
                    <IconAlignCenter />
                  </button>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.textAlign === "right" ? " is-on" : "")}
                    title="右对齐 · R"
                    aria-label="右对齐"
                    aria-pressed={selected.textAlign === "right"}
                    onClick={() => applyShortcutStyle({ textAlign: "right" }, "已右对齐")}
                  >
                    <IconAlignRight />
                  </button>
                  <span className="alignment-bar__sep" aria-hidden="true"></span>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.fontWeight === "bold" || selected.fontWeight === "700" ? " is-on" : "")}
                    title="加粗 · L"
                    aria-label="加粗"
                    aria-pressed={selected.fontWeight === "bold" || selected.fontWeight === "700"}
                    onClick={() => applyShortcutStyle(
                      { fontWeight: (selected.fontWeight === "bold" || selected.fontWeight === "700") ? "400" : "700" },
                      "已切换字重"
                    )}
                  >
                    <IconBold />
                  </button>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.fontStyle === "italic" ? " is-on" : "")}
                    title="斜体 · J"
                    aria-label="斜体"
                    aria-pressed={selected.fontStyle === "italic"}
                    onClick={() => {
                      if (!selected) return;
                      const currentStyle = selected.fontStyle;
                      const nextHtml = updateHtmlElementByHftId(state.html, selected.hftId, {
                        styles: { fontStyle: currentStyle === "italic" ? "normal" : "italic" },
                      });
                      commitHtml(nextHtml, selected.hftId);
                      setStatusMessage(currentStyle === "italic" ? "已取消斜体" : "已应用斜体");
                      showToast(currentStyle === "italic" ? "已取消斜体" : "已应用斜体");
                    }}
                  >
                    <IconItalic />
                  </button>
                </div>
              </section>
            ) : null}
            <section className="property-card" data-od-id="content-editor">
              <section className="inspector-card" data-dom-id="inspector-content">
                <div className="inspector-card__head">
                  <IconText />
                  <span className="inspector-card__title">文字内容</span>
                </div>
                <div className="inspector-card__body">
                  <div className="field">
                    <label htmlFor="contentInput">正文</label>
                    <textarea
                      className="textarea"
                      id="contentInput"
                      aria-label="正文"
                      aria-describedby="contentHint"
                      aria-invalid={!draftText.trim()}
                      disabled={!canEditSelectedText}
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                    />
                    <p className="meta" id="contentHint">
                      {canEditSelectedText ? "留空会触发错误提示，避免误发布空文案。" : "当前元素包含子节点或媒体内容，暂不支持直接改文字。"}
                    </p>
                {selected && canEditSelectedText ? (
                  <PretextMeasureBadge
                    text={draftText}
                    font={buildPretextFontFromDraft(selected, draftFontFamily, draftFontSize, draftFontWeight)}
                    maxWidth={resolveMeasureWidth(draftWidth, draftMaxWidth, selected.width, selected.maxWidth)}
                    lineHeight={resolveMeasureLineHeight(draftLineHeight, selected.lineHeight, draftFontSize, selected.fontSize)}
                  />
                ) : null}
                </div>
                </div>
              </section>
              <button className="btn btn-primary" type="button" onClick={handleApplyText} disabled={!canEditSelectedText}>应用到 Canvas</button>
            </section>
            <section className="property-card" data-od-id="style-editor">
              <h3>快速样式</h3>
              <div className="token-row">
                <span>强调色</span>
                <span className="token-swatch" aria-hidden="true" style={{ backgroundColor: draftColor || undefined }} />
              </div>

              {/* 字体 */}
              <section className="inspector-card" data-dom-id="inspector-typography">
                <div className="inspector-card__head">
                  <IconType />
                  <span className="inspector-card__title">字体</span>
                </div>
                <div className="inspector-card__body">
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="fontSize">字号</label>
                      <input className="input" id="fontSize" value={draftFontSize} placeholder="66px" onChange={(event) => setDraftFontSize(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="fontWeightInput">字重</label>
                      <select className="input" id="fontWeightInput" value={draftFontWeight} onChange={(event) => setDraftFontWeight(event.target.value)}>
                        <option value="">继承</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                        <option value="600">600</option>
                        <option value="700">700</option>
                        <option value="800">800</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="fontFamilyInput">字体</label>
                    <input className="input" id="fontFamilyInput" value={draftFontFamily} placeholder="Inter, sans-serif" onChange={(event) => setDraftFontFamily(event.target.value)} />
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="lineHeightInput">行高</label>
                      <input className="input" id="lineHeightInput" value={draftLineHeight} placeholder="1.5 / 24px" onChange={(event) => setDraftLineHeight(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="letterSpacingInput">字距</label>
                      <input className="input" id="letterSpacingInput" value={draftLetterSpacing} placeholder="0.2px" onChange={(event) => setDraftLetterSpacing(event.target.value)} />
                    </div>
                  </div>
                </div>
              </section>

              {/* 间距 */}
              <section className="inspector-card" data-dom-id="inspector-spacing">
                <div className="inspector-card__head">
                  <IconSpacing />
                  <span className="inspector-card__title">间距</span>
                </div>
                <div className="inspector-card__body">
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="spacingInput">上外边距</label>
                      <input className="input" id="spacingInput" value={draftMarginTop} placeholder="24px" onChange={(event) => setDraftMarginTop(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="marginBottomInput">下外边距</label>
                      <input className="input" id="marginBottomInput" value={draftMarginBottom} placeholder="24px" onChange={(event) => setDraftMarginBottom(event.target.value)} />
                    </div>
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="paddingTopInput">上内边距</label>
                      <input className="input" id="paddingTopInput" value={draftPaddingTop} placeholder="16px" onChange={(event) => setDraftPaddingTop(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="paddingBottomInput">下内边距</label>
                      <input className="input" id="paddingBottomInput" value={draftPaddingBottom} placeholder="16px" onChange={(event) => setDraftPaddingBottom(event.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="paddingInlineInput">左右内边距</label>
                    <input className="input" id="paddingInlineInput" value={draftPaddingLeft || draftPaddingRight} placeholder="24px" onChange={(event) => {
                      setDraftPaddingLeft(event.target.value);
                      setDraftPaddingRight(event.target.value);
                    }} />
                  </div>
                </div>
              </section>

              {/* 颜色 */}
              {/* 尺寸 + 图片填充 */}
              <section className="inspector-card" data-dom-id="inspector-size">
                <div className="inspector-card__head">
                  <IconRuler />
                  <span className="inspector-card__title">尺寸</span>
                </div>
                <div className="inspector-card__body">
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="widthInput">宽度</label>
                      <input className="input" id="widthInput" value={draftWidth} placeholder="auto / 320px / 100%" onChange={(event) => setDraftWidth(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="heightInput">高度</label>
                      <input className="input" id="heightInput" value={draftHeight} placeholder="auto / 240px" onChange={(event) => setDraftHeight(event.target.value)} />
                    </div>
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="maxWidthInput">最大宽度</label>
                      <input className="input" id="maxWidthInput" value={draftMaxWidth} placeholder="640px / none" onChange={(event) => setDraftMaxWidth(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="objectFitInput">图片填充</label>
                      <select className="input" id="objectFitInput" value={draftObjectFit} onChange={(event) => setDraftObjectFit(event.target.value)}>
                        <option value="">继承</option>
                        <option value="cover">cover</option>
                        <option value="contain">contain</option>
                        <option value="fill">fill</option>
                        <option value="none">none</option>
                        <option value="scale-down">scale-down</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* 外观 — 颜色 */}
              <section className="inspector-card" data-dom-id="inspector-color">
                <div className="inspector-card__head">
                  <IconPalette />
                  <span className="inspector-card__title">颜色</span>
                </div>
                <div className="inspector-card__body">
                  <ColorField label="文字" value={draftColor} onChange={(val) => {
                    setDraftColor(val);
                    if (selected) commitHtml(updateHtmlElementByHftId(state.html, selected.hftId, { styles: { color: val } }), selected.hftId);
                  }} full />
                  <ColorField label="背景" value={draftBackgroundColor} onChange={(val) => {
                    setDraftBackgroundColor(val);
                    if (selected) commitHtml(updateHtmlElementByHftId(state.html, selected.hftId, { styles: { backgroundColor: val } }), selected.hftId);
                  }} full />
                  <ColorField label="Hover 背景" value={draftHoverBackground} onChange={(val) => {
                    setDraftHoverBackground(val);
                    if (selected) commitHtml(updateHtmlElementByHftId(state.html, selected.hftId, { effects: { hoverBackgroundColor: val } }), selected.hftId);
                  }} full />
                </div>
              </section>

              {/* 外观 — 边框 */}
              <section className="inspector-card" data-dom-id="inspector-border">
                <div className="inspector-card__head">
                  <IconBorder />
                  <span className="inspector-card__title">边框</span>
                </div>
                <div className="inspector-card__body">
                  <div className="field-grid">
                    <ColorField label="边框色" value={draftBorderColor} onChange={(val) => {
                      setDraftBorderColor(val);
                      if (selected) commitHtml(updateHtmlElementByHftId(state.html, selected.hftId, { styles: { borderColor: val } }), selected.hftId);
                    }} />
                    <div className="field">
                      <label htmlFor="borderWidthInput">宽度</label>
                      <input className="input" id="borderWidthInput" value={draftBorderWidth} placeholder="1px" onChange={(event) => setDraftBorderWidth(event.target.value)} />
                    </div>
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label htmlFor="borderStyleInput">样式</label>
                      <select className="input" id="borderStyleInput" value={draftBorderStyle} onChange={(event) => setDraftBorderStyle(event.target.value)}>
                        <option value="">继承</option>
                        <option value="solid">solid</option>
                        <option value="dashed">dashed</option>
                        <option value="none">none</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="radiusInput">圆角</label>
                      <input className="input" id="radiusInput" value={draftBorderRadius} placeholder="16px" onChange={(event) => setDraftBorderRadius(event.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="boxShadowInput">阴影</label>
                    <input className="input" id="boxShadowInput" value={draftBoxShadow} placeholder="0 18px 50px rgba(15, 23, 42, .12)" onChange={(event) => setDraftBoxShadow(event.target.value)} />
                  </div>
                </div>
              </section>

              <button className="btn btn-primary" type="button" onClick={handleApplyStyle} disabled={!selected}>应用样式</button>
            </section>
            <section className="property-card" data-od-id="attribute-editor">
              <section className="inspector-card" data-dom-id="inspector-attribute">
                <div className="inspector-card__head">
                  <IconImage />
                  <span className="inspector-card__title">媒体 / 属性</span>
                </div>
                <div className="inspector-card__body">
                  <div className="field">
                    <label htmlFor="srcInput">src / viewBox / href</label>
                    <input className="input" id="srcInput" value={draftSrc} placeholder="图片地址、SVG viewBox 或 href" onChange={(event) => setDraftSrc(event.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="altInput">alt / aria-label</label>
                    <input className="input" id="altInput" value={draftAlt} placeholder="替代文本或可访问名称" onChange={(event) => setDraftAlt(event.target.value)} />
                  </div>
                </div>
              </section>
              <button className="btn btn-primary" type="button" onClick={handleApplyAttributes} disabled={!selected}>应用属性</button>
            </section>
            <section className="property-card" data-od-id="interaction-editor">
              <section className="inspector-card" data-dom-id="inspector-interaction">
                <div className="inspector-card__head">
                  <IconActivity />
                  <span className="inspector-card__title">交互状态</span>
                </div>
                <div className="inspector-card__body">
                  <div className="token-row"><span>悬停状态</span><span className="meta">预览可点击选中</span></div>
                  <div className="token-row"><span>焦点状态</span><span className="meta">iframe 内可访问</span></div>
                  <div className="token-row"><span>拖拽定位</span><span className="meta">松手后写回 HTML</span></div>
                  <div className="token-row"><span>AI 预检</span><span className="meta">{aiPreflightNote}</span></div>
                  <div className="token-row"><span>导出检查</span><span className="meta">{formatExportWarningSummary(exportWarnings.length, blockingExportWarningCount)}</span></div>
                  <div className="token-row"><span>发布检查</span><span className="meta">{isChecking ? "检查中" : "可运行"}</span></div>
                </div>
              </section>
              <InspectorDiagnostics selected={selected} />
              <div className={`ai-risk-summary${aiRiskAnnotations.length > 0 ? " has-risk" : ""}`}>
                <div>
                  <strong>AI 风险摘要</strong>
                  <span className="meta">
                    {Object.keys(aiAnnotations).length === 0
                      ? "尚未扫描"
                      : aiRiskAnnotations.length > 0
                        ? `${aiRiskAnnotations.length} 个节点需要复核`
                        : "未发现风险"}
                  </span>
                </div>
                {aiRiskAnnotations.length > 0 ? (
                  <div className="ai-risk-list">
                    {aiRiskAnnotations.slice(0, 5).map((annotation) => (
                      <button key={annotation.hftId} type="button" onClick={() => selectElement(annotation.hftId)}>
                        <span>{annotation.label}</span>
                        <small>{annotation.issues.join(" / ")}</small>
                      </button>
                    ))}
                    {aiRiskAnnotations.length > 5 ? <p className="meta">还有 {aiRiskAnnotations.length - 5} 项，请到 AI 建议列表查看。</p> : null}
                  </div>
                ) : null}
              </div>
              <div className="quick-actions" aria-label="元素操作">
                <button className="btn" type="button" onClick={() => handleMoveElement("up")} disabled={!selected}>上移</button>
                <button className="btn" type="button" onClick={() => handleMoveElement("down")} disabled={!selected}>下移</button>
                <button className="btn" type="button" onClick={handleDuplicateElement} disabled={!selected}>复制元素</button>
                <button className="btn" type="button" onClick={handleDeleteElement} disabled={!selected}>删除</button>
                <button className="btn" type="button" onClick={handleCopyStyle} disabled={!selected}>复制样式</button>
                <button className="btn" type="button" onClick={handlePasteStyle} disabled={!selected || !copiedStyle}>粘贴样式</button>
                {selected ? (
                  <>
                    <button className="btn" type="button" onClick={() => handleModalCommand("open")}>打开弹窗</button>
                    <button className="btn" type="button" onClick={() => handleModalCommand("close")}>关闭弹窗</button>
                  </>
                ) : null}
              </div>
            </section>
            <section className="property-card is-compact" data-od-id="state-coverage">
              <section className="inspector-card" data-dom-id="inspector-state">
                <div className="inspector-card__head">
                  <IconShield />
                  <span className="inspector-card__title">状态覆盖</span>
                </div>
                <div className="inspector-card__body">
                  <div className="state-grid" aria-live="polite">
                    <div className={`state-card${isPreviewReady ? "" : " is-loading"}`}><span className="state-dot"></span><strong>{isPreviewReady ? "预览就绪" : "预览渲染中"}</strong><span className="meta">iframe</span></div>
                    <div className="state-card" hidden={isChecking}><span className="state-dot"></span><strong>编辑就绪</strong><span className="meta">可编辑</span></div>
                    <div className="state-card is-loading" hidden={!isChecking}><span className="state-dot"></span><strong>检查中</strong><span className="meta">0.7s</span></div>
                  </div>
                  <button className="btn" type="button" onClick={handleRunCheck}>运行发布检查</button>
                </div>
              </section>
            </section>
          </div>
        </aside>
        </>)}
      </main>

      <StatusBar
        htmlLength={state.html.length}
        selectedLabel={selected?.label ?? "未选择"}
        statusMessage={statusMessage}
        statusTone={statusTone}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
      />

      {isExportDialogOpen ? (
        <ExportDialog
          html={cleanHtml}
          warnings={exportWarnings}
          onClose={handleCloseExportDialog}
          onCopyHtml={handleCopy}
          onDownloadHtml={handleExportHtml}
          onExportPdf={handleExportPdf}
          onExportPptx={handleExportPptx}
          initialFormat={exportDialogFormat}
          isExportingPdf={exportingFormat === "pdf"}
          isExportingPptx={exportingFormat === "pptx"}
        />
      ) : null}

      <div className={`toast${isToastVisible ? " is-visible" : ""}`} role="status" aria-live="polite">{toastMessage || "已更新"}</div>

      {isCheatsheetOpen ? (
        <div className="cheatsheet-backdrop" onClick={() => setIsCheatsheetOpen(false)}>
          <section
            className="cheatsheet"
            role="dialog"
            aria-modal="true"
            aria-label="快捷键"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cheatsheet-head">
              <div>
                <h2>快捷键</h2>
                <p>不离开键盘完成所有操作</p>
              </div>
              <button className="icon-btn" type="button" aria-label="关闭" onClick={() => setIsCheatsheetOpen(false)}>×</button>
            </header>
            <div className="cheatsheet-body">
              <section className="cheatsheet-section">
                <h3 className="cheatsheet-section__title">编辑</h3>
                <div className="cheatsheet-list">
                  <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd><span>+</span><kbd>Z</kbd></dt><dd>撤销</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd><span>+</span><kbd>Y</kbd></dt><dd>重做</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>Shift</kbd><span>+</span><kbd>Ctrl/⌘</kbd><span>+</span><kbd>Z</kbd></dt><dd>重做（备选）</dd></div>
                </div>
              </section>

              <section className="cheatsheet-section">
                <h3 className="cheatsheet-section__title">文件</h3>
                <div className="cheatsheet-list">
                  <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd><span>+</span><kbd>O</kbd></dt><dd>导入 HTML</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd><span>+</span><kbd>S</kbd></dt><dd>导出</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>Shift</kbd><span>+</span><kbd>Ctrl/⌘</kbd><span>+</span><kbd>C</kbd></dt><dd>复制干净 HTML</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>E</kbd></dt><dd>导出预览</dd></div>
                </div>
              </section>

              <section className="cheatsheet-section">
                <h3 className="cheatsheet-section__title">画布</h3>
                <div className="cheatsheet-list">
                  <div className="cheatsheet-row"><dt><kbd>D</kbd></dt><dd>复制当前元素</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>I</kbd></dt><dd>在右侧检查器编辑文字</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>F</kbd></dt><dd>聚焦结构树搜索</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>1</kbd><span>·</span><kbd>2</kbd><span>·</span><kbd>3</kbd><span>·</span><kbd>4</kbd></dt><dd>切换 viewport 预设</dd></div>
                </div>
              </section>

              <section className="cheatsheet-section">
                <h3 className="cheatsheet-section__title">样式</h3>
                <div className="cheatsheet-list">
                  <div className="cheatsheet-row"><dt><kbd>B</kbd></dt><dd>粗体</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>L</kbd></dt><dd>左对齐</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>R</kbd></dt><dd>右对齐</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>J</kbd></dt><dd>两端对齐</dd></div>
                </div>
              </section>

              <section className="cheatsheet-section">
                <h3 className="cheatsheet-section__title">其它</h3>
                <div className="cheatsheet-list">
                  <div className="cheatsheet-row"><dt><kbd>?</kbd></dt><dd>显示本面板</dd></div>
                  <div className="cheatsheet-row"><dt><kbd>Esc</kbd></dt><dd>关闭弹窗 / 取消选择</dd></div>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
      </div>
    </WorkspaceShell>
  );
}
