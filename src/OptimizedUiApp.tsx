import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ColorField } from "./components/ColorField";
import { ExportPreviewDialog } from "./components/ExportPreviewDialog";
import { PretextMeasureBadge } from "./components/PretextMeasureBadge";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useElementSize } from "./hooks/useElementSize";
import { sampleHtml } from "./sampleHtml";
import type { AiTreeAnnotation, DomTreeNode } from "./types/editor";
import { cleanHtmlForExport } from "./utils/cleanHtmlForExport";
import { copyHtmlToClipboard } from "./utils/clipboard";
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
  type AiProviderId,
} from "./utils/aiStructure";

const initialHtml = injectEditableIds(sampleHtml).html;
const AI_KEY_STORAGE = "html-finetune.ai-provider-keys";
const AI_LEGACY_GEMMA_KEY_STORAGE = "html-finetune.gemma-api-key";

type SourceTab = "objects" | "code" | "ai";
type ZoomMode = "fit" | "88" | "100";
type InspectorTab = "content" | "style" | "interaction";
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
const DEFAULT_SOURCE_WIDTH = 336;
const DEFAULT_INSPECTOR_WIDTH = 360;
const MIN_SOURCE_WIDTH = 280;
const MIN_INSPECTOR_WIDTH = 300;
const MIN_STAGE_WIDTH = 520;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function loadStoredAiKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
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

function buildRememberedAiKeyMap(storedKeys: Record<string, string>): Record<string, boolean> {
  return Object.fromEntries(Object.keys(storedKeys).map((providerId) => [providerId, true]));
}

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

export default function OptimizedUiApp() {
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
  } = useEditorHistory({ html: initialHtml, selectedId: null });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const latestHtmlRef = useRef(state.html);
  const [sourceTab, setSourceTab] = useState<SourceTab>("objects");
  const [search, setSearch] = useState("");
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(() => new Set());
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const [sourceDraft, setSourceDraft] = useState(state.html);
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
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "pptx" | null>(null);
  // Inspector tab 合并后,保留 setInspectorTab 为 noop 避免破坏既有调用点。
  // 后续清理可以删除所有调用并移除该函数。
  const setInspectorTab = useCallback((_value: InspectorTab) => {
    /* no-op: tabs are merged into a single scrollable panel */
  }, []);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageSize = useElementSize(stageRef);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: VIEWPORT_PRESETS.desktop.width,
    height: VIEWPORT_PRESETS.desktop.height,
  }));
  const [isChecking, setIsChecking] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<CopiedStyle | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [sourceWidth, setSourceWidth] = useState(DEFAULT_SOURCE_WIDTH);
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_INSPECTOR_WIDTH);
  const [hasImportedHtml, setHasImportedHtml] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now());
  const [isPreviewReady, setIsPreviewReady] = useState(false);
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
  const previewSrcDoc = useMemo(() => buildPreviewSrcDoc(state.html, selectedId), [selectedId, state.html]);
  const cleanHtml = useMemo(() => cleanHtmlForExport(state.html), [state.html]);
  const exportWarnings = useMemo(() => getExportWarnings(cleanHtml), [cleanHtml]);
  const sourceLineCount = useMemo(() => countSourceLines(sourceDraft), [sourceDraft]);
  const sourceCharCount = sourceDraft.length;
  const isSourceDirty = sourceDraft !== state.html;
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

  useEffect(() => {
    latestHtmlRef.current = state.html;
    setLastSyncedAt(Date.now());
  }, [state.html]);

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
    window.localStorage.removeItem(AI_LEGACY_GEMMA_KEY_STORAGE);
  }, [aiApiKeys, rememberAiKeys]);

  useEffect(() => {
    setSourceDraft(state.html);
  }, [state.html]);

  useEffect(() => {
    setIsPreviewReady(false);
  }, [previewSrcDoc]);

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
          setSourceTab("objects");
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
    },
    [reset, showToast]
  );

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

  const handleOpenExportPreview = useCallback(() => {
    assertCleanExport(cleanHtml);
    exportWarnings.forEach((warning) => console.warn(`[ExportWarning] ${warning.message}`));
    setIsExportOpen(false);
    setIsExportPreviewOpen(true);
    setStatusMessage(exportWarnings.length ? `导出预览含 ${exportWarnings.length} 项警告` : "已生成导出前预览");
  }, [cleanHtml, exportWarnings]);

  const handleExportHtml = useCallback(() => {
    try {
      assertCleanExport(cleanHtml);
      exportHtml(cleanHtml);
      setIsExportOpen(false);
      setIsExportPreviewOpen(false);
      setStatusMessage("已导出 HTML");
      showToast("HTML 已导出");
    } catch (error) {
      const message = error instanceof Error ? error.message : "导出失败";
      setStatusMessage(message);
      showToast("导出失败");
    }
  }, [cleanHtml, showToast]);

  const handleAnalyzeStructure = useCallback(async () => {
    setSourceTab("ai");
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
    if (trimmedKey.length < 8) {
      setAiModelFetchStatus("idle");
      setAiModelFetchError("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void handleRefreshAiModels("auto", controller.signal);
    }, 700);

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

  const handleToggleSourcePanel = useCallback(() => {
    setIsSourceCollapsed((value) => {
      const nextValue = !value;
      setStatusMessage(nextValue ? "结构面板已折叠" : "结构面板已展开");
      return nextValue;
    });
  }, []);

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

  const handleToggleInspectorPanel = useCallback(() => {
    setIsInspectorCollapsed((value) => {
      const nextValue = !value;
      setStatusMessage(nextValue ? "属性面板已折叠" : "属性面板已展开");
      return nextValue;
    });
  }, []);

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
      setIsExportPreviewOpen(true);
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
      setIsExportPreviewOpen(true);
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
        if (isCheatsheetOpen) {
          event.preventDefault();
          setIsCheatsheetOpen(false);
          return;
        }
        event.preventDefault();
        setIsHistoryOpen(false);
        setIsExportOpen(false);
        setIsExportPreviewOpen(false);
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
        fileInputRef.current?.click();
        return;
      }
      if (key === "e" && !event.shiftKey) {
        event.preventDefault();
        handleOpenExportPreview();
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
  }, [applyShortcutStyle, applyViewportPreset, commit, handleCopy, handleExportHtml, handleOpenExportPreview, isCheatsheetOpen, redo, selected, showToast, state.html, undo]);

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
  const canEditSelectedText = Boolean(selected?.canEditText);
  const workspaceStyle = useMemo(
    () =>
      ({
        "--source-col": `${sourceWidth}px`,
        "--inspector-col": `${inspectorWidth}px`,
      }) as CSSProperties,
    [inspectorWidth, sourceWidth]
  );

  return (
    <div
      className={[
        "app-shell",
        isFocusMode ? "is-focus-mode" : "",
        isSourceCollapsed ? "is-source-collapsed" : "",
        isInspectorCollapsed ? "is-inspector-collapsed" : "",
      ].filter(Boolean).join(" ")}
    >
      <header className="topbar">
        <div className="brand" aria-label="产品标识">
          <div className="brand-mark">&lt;/&gt;</div>
          <div>
            <h1>HTML Fine Tune</h1>
            <p>实时页面微调工作台</p>
          </div>
        </div>

        <div className="toolbar" aria-label="主要操作">
          <button className="icon-btn btn-muted" type="button" title="撤销 · Ctrl/⌘+Z" aria-label="撤销" onClick={undo} disabled={!canUndo}>
            <IconUndo />
          </button>
          <button className="icon-btn btn-muted" type="button" title="重做 · Ctrl/⌘+Y 或 Shift+Ctrl/⌘+Z" aria-label="重做" onClick={redo} disabled={!canRedo}>
            <IconRedo />
          </button>
          <button className="btn" type="button" title="复制干净 HTML · Shift+Ctrl/⌘+C" onClick={handleCopy}>复制 HTML</button>
          <div className={`dropdown${isExportOpen ? " is-open" : ""}`}>
            <button
              className="btn btn-primary"
              type="button"
              title="导出 HTML · Ctrl/⌘+S"
              aria-haspopup="menu"
              aria-expanded={isExportOpen}
              onClick={() => setIsExportOpen((value) => !value)}
            >
              <IconDownload />
              导出
            </button>
            <div className="dropdown-panel" role="menu" aria-label="导出格式">
              <button className="menu-action" type="button" role="menuitem" onClick={handleOpenExportPreview}>导出 HTML</button>
              <button className="menu-action" type="button" role="menuitem" onClick={handleExportPdf} disabled={exportingFormat !== null}>
                {exportingFormat === "pdf" ? "PDF 生成中" : "导出 PDF"}
              </button>
              <button className="menu-action" type="button" role="menuitem" onClick={handleExportPptx} disabled={exportingFormat !== null}>
                {exportingFormat === "pptx" ? "PPTX 生成中" : "导出 PPTX"}
              </button>
            </div>
          </div>
          <button className="icon-btn" type="button" title="查看历史" aria-label="查看历史" onClick={() => setIsHistoryOpen((value) => !value)}>
            <IconHistory />
          </button>
          <button className="icon-btn" type="button" title="快捷键 (?)" aria-label="快捷键" onClick={() => setIsCheatsheetOpen((value) => !value)}>
            <IconKeyboard />
          </button>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".html,.htm,text/html"
            onChange={(event) => {
              handleFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </header>

      {isHistoryOpen ? (
        <section className="history-drawer" aria-label="历史记录">
          <div className="history-drawer-head">
            <strong>历史记录</strong>
            <button className="icon-btn" type="button" aria-label="关闭历史记录" onClick={() => setIsHistoryOpen(false)}>×</button>
          </div>
          <div className="history-drawer-list">
            {timeline.map((entry, index) => (
              <button
                key={index}
                className={`history-drawer-item${index === currentIndex ? " is-current" : ""}`}
                type="button"
                onClick={() => {
                  jumpToHistoryIndex(index);
                  setStatusMessage("已跳转历史记录");
                }}
              >
                <span>{index === currentIndex ? "当前" : `#${index + 1}`}</span>
                <strong>{summaries[index]?.title ?? (index === 0 ? "初始状态" : "编辑记录")}</strong>
                <small>{summaries[index]?.detail ?? `${entry.html.length.toLocaleString()} 字符`}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <main className="workspace" ref={workspaceRef} style={workspaceStyle}>
        <aside className="panel" aria-label="结构树">
          <button
            className="panel-resizer panel-resizer-source"
            type="button"
            aria-label="拖拽调整结构面板宽度"
            onPointerDown={handleStartPanelResize("source")}
          />
          <div className="panel-head">
            <div className="panel-title">
              <IconMenu />
              结构
            </div>
            <div className="panel-head-actions">
              <span className="meta">{visibleTree.length} / {currentCount}</span>
              <button className="icon-btn panel-collapse-btn" type="button" aria-label="折叠结构面板" onClick={handleToggleSourcePanel}>‹</button>
            </div>
          </div>
          <div className="left-tools">
            <label
              className={`upload-card${hasImportedHtml ? " is-imported" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <strong>{hasImportedHtml ? "替换 HTML" : "导入 HTML"}</strong>
              <p className="meta">{hasImportedHtml ? "当前文档已载入，可拖入新文件替换" : "拖入文件，或点击上传"}</p>
              <input
                type="file"
                accept=".html,.htm,text/html"
                onChange={(event) => {
                  handleFile(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <input
              className="search"
              data-tree-search-input
              type="search"
              placeholder="查找标题、按钮、图片或标签"
              aria-label="查找元素"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="segmented" aria-label="结构视图">
              <button className={`seg-btn${sourceTab === "objects" ? " is-active" : ""}`} type="button" onClick={() => setSourceTab("objects")}>对象</button>
              <button className={`seg-btn${sourceTab === "code" ? " is-active" : ""}`} type="button" onClick={() => setSourceTab("code")}>代码</button>
              <button className={`seg-btn${sourceTab === "ai" ? " is-active" : ""}`} type="button" onClick={() => setSourceTab("ai")}>AI 建议</button>
            </div>

            {sourceTab === "objects" ? (
              <div className="tree">
                <div className="tree-group">
                  <div className="tree-label">可编辑元素</div>
                  <div className="tree-toolbar-actions" role="group" aria-label="结构树批量操作">
                    <button className="tree-action" type="button" onClick={handleExpandAllTreeNodes}>全部展开</button>
                    <button className="tree-action" type="button" onClick={handleCollapseAllTreeNodes} disabled={collapsibleTreeIds.length === 0}>全部折叠</button>
                  </div>
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
                </div>
                {visibleTree.length === 0 ? (
                  <div className="empty-state">没有匹配元素。换一个关键词，或直接在画布中选择对象。</div>
                ) : null}
              </div>
            ) : null}

            {sourceTab === "code" ? (
              <div className="property-card">
                <div className="source-editor-meta">
                  <span className="source-editor-language">HTML</span>
                  <span>{sourceLineCount.toLocaleString()} 行</span>
                  <span>{sourceCharCount.toLocaleString()} 字符</span>
                  {isSourceDirty ? <span className="source-dirty">未应用</span> : <span>已同步</span>}
                </div>
                <div className="field">
                  <label htmlFor="sourceCode">HTML 源码</label>
                  <textarea
                    id="sourceCode"
                    className="textarea code-editor"
                    value={sourceDraft}
                    onChange={(event) => setSourceDraft(event.target.value)}
                  />
                </div>
                <div className="source-editor-actions">
                  <button className="btn btn-primary" type="button" onClick={handleApplySource} disabled={!isSourceDirty}>应用源码</button>
                  <button className="btn" type="button" onClick={handleResetSourceDraft} disabled={!isSourceDirty}>重置草稿</button>
                </div>
              </div>
            ) : null}

            {sourceTab === "ai" ? (
              <div className="property-card ai-panel">
                <h3>AI 结构扫描</h3>
                <div className="field">
                  <label htmlFor="aiProvider">模型厂商</label>
                  <select
                    id="aiProvider"
                    className="input"
                    value={aiProvider}
                    onChange={(event) => {
                      const nextProvider = event.target.value as AiProviderId;
                      setAiProvider(nextProvider);
                      setAiModels((models) => ({
                        ...models,
                        [nextProvider]: models[nextProvider] || AI_PROVIDER_MAP[nextProvider].defaultModel,
                      }));
                      setAiModelFetchError("");
                    }}
                  >
                    {AI_PROVIDER_DEFINITIONS.map((provider) => (
                      <option key={provider.id} value={provider.id}>{provider.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="aiModel">模型</label>
                  <input
                    id="aiModel"
                    className="input"
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
                </div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => void handleRefreshAiModels()}
                  disabled={aiModelFetchStatus === "loading"}
                >
                  {aiModelFetchStatus === "loading" ? "刷新中" : "刷新模型列表"}
                </button>
                <p className="meta">
                  {aiModelFetchStatus === "ready"
                    ? "已加载 " + currentAiModels.length + " 个模型"
                    : aiModelFetchStatus === "error"
                      ? "模型列表刷新失败"
                      : "当前 " + currentAiModels.length + " 个预设模型"}
                </p>
                {aiModelFetchError ? <p className="meta ai-error">{aiModelFetchError}</p> : null}
                <div className="field">
                  <label htmlFor="aiApiKey">{currentAiProvider.keyPlaceholder}</label>
                  <input
                    id="aiApiKey"
                    className="input"
                    type="password"
                    value={currentAiKey}
                    placeholder={currentAiRememberKey ? "已选择记住：写入浏览器 localStorage" : "仅保存在当前页面状态，不写入文件"}
                    onChange={(event) => {
                      const nextKey = event.target.value;
                      setAiApiKeys((keys) => ({ ...keys, [aiProvider]: nextKey }));
                    }}
                  />
                  <label className="remember-key-row">
                    <input
                      type="checkbox"
                      checked={currentAiRememberKey}
                      onChange={(event) =>
                        setRememberAiKeys((keys) => ({ ...keys, [aiProvider]: event.target.checked }))
                      }
                    />
                    <span>记住此厂商 Key（写入浏览器 localStorage）</span>
                  </label>
                </div>
                <div className="ai-action-row">
                  <button className="btn btn-primary" type="button" onClick={() => void handleAnalyzeStructure()} disabled={aiStatus === "running"}>
                    {aiStatus === "running" ? "扫描中" : "扫描结构"}
                  </button>
                  <button className="btn" type="button" onClick={handleClearAiAnnotations} disabled={Object.keys(aiAnnotations).length === 0 || aiStatus === "running"}>
                    清空标注
                  </button>
                </div>
                {aiError ? <p className="meta ai-error">{aiError}</p> : null}
                <div className="ai-result-list">
                  {Object.values(aiAnnotations).length > 0 ? (
                    Object.values(aiAnnotations).slice(0, 18).map((annotation) => (
                      <button key={annotation.hftId} className="ai-result-item" type="button" onClick={() => selectElement(annotation.hftId)}>
                        <strong>{annotation.label}</strong>
                        <span>{annotation.role}{annotation.issues.length ? ` · ${annotation.issues.join(" / ")}` : ""}</span>
                        {annotation.suggestion ? <small>{annotation.suggestion}</small> : null}
                      </button>
                    ))
                  ) : (
                    <p className="meta">扫描后会在这里列出结构标签和风险提示。</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="panel stage-panel" aria-label="画布" data-od-id="canvas">
          <div className="panel-head stage-head">
            <div className="panel-title">
              <IconEye />
              Canvas
            </div>
            <div className="canvas-tools">
              <div className="viewport-controls" aria-label="Viewport 尺寸">
                <select
                  className="input viewport-select"
                  aria-label="Viewport 预设"
                  value={matchingViewportPreset ?? "custom"}
                  onChange={(event) => {
                    if (event.target.value === "custom") return;
                    applyViewportPreset(event.target.value as ViewportPresetKey);
                  }}
                >
                  {VIEWPORT_PRESET_KEYS.map((presetKey) => (
                    <option key={presetKey} value={presetKey}>{VIEWPORT_PRESETS[presetKey].label}</option>
                  ))}
                  <option value="custom">自定义</option>
                </select>
                <input
                  id="viewportWidthInput"
                  className="input viewport-size-input"
                  aria-label="Viewport 宽度"
                  inputMode="numeric"
                  value={viewportSize.width}
                  onChange={(event) => updateViewportDimension("width", event.target.value)}
                />
                <span className="viewport-times" aria-hidden="true">×</span>
                <input
                  id="viewportHeightInput"
                  className="input viewport-size-input"
                  aria-label="Viewport 高度"
                  inputMode="numeric"
                  value={viewportSize.height}
                  onChange={(event) => updateViewportDimension("height", event.target.value)}
                />
              </div>
              <div className="segmented" aria-label="画布缩放">
                <button className={`seg-btn${zoomMode === "fit" ? " is-active" : ""}`} type="button" onClick={() => setZoomMode("fit")}>适配</button>
                <button className={`seg-btn${zoomMode === "88" ? " is-active" : ""}`} type="button" onClick={() => setZoomMode("88")}>88%</button>
                <button className={`seg-btn${zoomMode === "100" ? " is-active" : ""}`} type="button" onClick={() => setZoomMode("100")}>100%</button>
              </div>
            </div>
            <button
              className="btn"
              type="button"
              aria-pressed={isFocusMode}
              onClick={() => {
                setIsFocusMode((value) => !value);
                setStatusMessage(isFocusMode ? "已退出专注模式" : "已进入专注模式");
              }}
            >
              {isFocusMode ? "退出专注" : "专注"}
            </button>
          </div>
          <div className="stage" ref={stageRef}>
            <article
              className="page-preview"
              aria-label="页面预览"
              style={{
                width: viewportSize.width,
                height: viewportSize.height,
                transform: zoomToTransform(zoomMode, viewportSize, stageSize),
              }}
            >
              <iframe
                ref={previewFrameRef}
                className="live-preview-frame"
                title="实时 HTML 预览"
                srcDoc={previewSrcDoc}
                sandbox="allow-scripts allow-forms allow-popups"
                onLoad={() => setIsPreviewReady(true)}
              />
            </article>
          </div>
        </section>

        <aside className="panel inspector" aria-label="属性面板">
          <button
            className="panel-resizer panel-resizer-inspector"
            type="button"
            aria-label="拖拽调整属性面板宽度"
            onPointerDown={handleStartPanelResize("inspector")}
          />
          <div className="inspector-tabs-wrap">
            <span className="inspector-title">属性</span>
            <button className="icon-btn panel-collapse-btn" type="button" aria-label="折叠属性面板" onClick={handleToggleInspectorPanel}>›</button>
          </div>
          <div className="inspector-body">
            {selectedAnnotation ? (
              <p className="meta ai-selected-note">
                AI：{selectedAnnotation.label} · {selectedAnnotation.role}
                {selectedAnnotation.issues.length ? " · " + selectedAnnotation.issues.join(" / ") : ""}
              </p>
            ) : null}
            <section className="property-card" data-od-id="content-editor">
              <div className="field">
                <label htmlFor="contentInput">文字内容</label>
                <textarea
                  className="textarea"
                  id="contentInput"
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
              <button className="btn btn-primary" type="button" onClick={handleApplyText} disabled={!canEditSelectedText}>应用到 Canvas</button>
            </section>
            <section className="property-card" data-od-id="style-editor">
              <h3>快速样式</h3>
              <div className="token-row">
                <span>强调色</span>
                <span className="token-swatch" aria-hidden="true" style={{ backgroundColor: draftColor || undefined }} />
              </div>
              <ColorField label="颜色" value={draftColor} onChange={setDraftColor} full />
              <ColorField label="背景色" value={draftBackgroundColor} onChange={setDraftBackgroundColor} full />
              <ColorField label="Hover 背景" value={draftHoverBackground} onChange={setDraftHoverBackground} full />
              <div className="field">
                <label htmlFor="fontSize">字号</label>
                <input className="input" id="fontSize" value={draftFontSize} placeholder="66px" onChange={(event) => setDraftFontSize(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="fontFamilyInput">字体</label>
                <input className="input" id="fontFamilyInput" value={draftFontFamily} placeholder="Inter, sans-serif" onChange={(event) => setDraftFontFamily(event.target.value)} />
              </div>
              <div className="field-grid">
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
                <div className="field">
                  <label htmlFor="textAlignInput">对齐</label>
                  <select className="input" id="textAlignInput" value={draftTextAlign} onChange={(event) => setDraftTextAlign(event.target.value)}>
                    <option value="">继承</option>
                    <option value="left">左</option>
                    <option value="center">中</option>
                    <option value="right">右</option>
                    <option value="justify">两端</option>
                  </select>
                </div>
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
              <div className="field">
                <label htmlFor="spacingInput">上外边距</label>
                <input className="input" id="spacingInput" value={draftMarginTop} placeholder="24px" onChange={(event) => setDraftMarginTop(event.target.value)} />
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="marginBottomInput">下外边距</label>
                  <input className="input" id="marginBottomInput" value={draftMarginBottom} placeholder="24px" onChange={(event) => setDraftMarginBottom(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="paddingTopInput">上内边距</label>
                  <input className="input" id="paddingTopInput" value={draftPaddingTop} placeholder="16px" onChange={(event) => setDraftPaddingTop(event.target.value)} />
                </div>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="paddingBottomInput">下内边距</label>
                  <input className="input" id="paddingBottomInput" value={draftPaddingBottom} placeholder="16px" onChange={(event) => setDraftPaddingBottom(event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="paddingInlineInput">左右内边距</label>
                  <input className="input" id="paddingInlineInput" value={draftPaddingLeft || draftPaddingRight} placeholder="24px" onChange={(event) => {
                    setDraftPaddingLeft(event.target.value);
                    setDraftPaddingRight(event.target.value);
                  }} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="radiusInput">圆角</label>
                <input className="input" id="radiusInput" value={draftBorderRadius} placeholder="16px" onChange={(event) => setDraftBorderRadius(event.target.value)} />
              </div>
              <div className="field-grid">
                <ColorField label="边框色" value={draftBorderColor} onChange={setDraftBorderColor} />
                <div className="field">
                  <label htmlFor="borderWidthInput">边框宽度</label>
                  <input className="input" id="borderWidthInput" value={draftBorderWidth} placeholder="1px" onChange={(event) => setDraftBorderWidth(event.target.value)} />
                </div>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="borderStyleInput">边框样式</label>
                  <select className="input" id="borderStyleInput" value={draftBorderStyle} onChange={(event) => setDraftBorderStyle(event.target.value)}>
                    <option value="">继承</option>
                    <option value="solid">solid</option>
                    <option value="dashed">dashed</option>
                    <option value="none">none</option>
                  </select>
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
              <div className="field">
                <label htmlFor="boxShadowInput">阴影</label>
                <input className="input" id="boxShadowInput" value={draftBoxShadow} placeholder="0 18px 50px rgba(15, 23, 42, .12)" onChange={(event) => setDraftBoxShadow(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="widthInput">宽度</label>
                <input className="input" id="widthInput" value={draftWidth} placeholder="auto / 320px / 100%" onChange={(event) => setDraftWidth(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="maxWidthInput">最大宽度</label>
                <input className="input" id="maxWidthInput" value={draftMaxWidth} placeholder="640px / none" onChange={(event) => setDraftMaxWidth(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="heightInput">高度</label>
                <input className="input" id="heightInput" value={draftHeight} placeholder="auto / 240px" onChange={(event) => setDraftHeight(event.target.value)} />
              </div>
              <button className="btn btn-primary" type="button" onClick={handleApplyStyle} disabled={!selected}>应用样式</button>
            </section>
            <section className="property-card" data-od-id="attribute-editor">
              <h3>媒体 / 属性</h3>
              <div className="field">
                <label htmlFor="srcInput">src / viewBox / href</label>
                <input className="input" id="srcInput" value={draftSrc} placeholder="图片地址、SVG viewBox 或 href" onChange={(event) => setDraftSrc(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="altInput">alt / aria-label</label>
                <input className="input" id="altInput" value={draftAlt} placeholder="替代文本或可访问名称" onChange={(event) => setDraftAlt(event.target.value)} />
              </div>
              <button className="btn btn-primary" type="button" onClick={handleApplyAttributes} disabled={!selected}>应用属性</button>
            </section>
            <section className="property-card" data-od-id="interaction-editor">
              <h3>交互状态</h3>
              <div className="token-row"><span>悬停状态</span><span className="meta">预览可点击选中</span></div>
              <div className="token-row"><span>焦点状态</span><span className="meta">iframe 内可访问</span></div>
              <div className="token-row"><span>拖拽定位</span><span className="meta">松手后写回 HTML</span></div>
              <div className="token-row"><span>AI 预检</span><span className="meta">{aiPreflightNote}</span></div>
              <div className="token-row"><span>导出检查</span><span className="meta">{formatExportWarningSummary(exportWarnings.length, blockingExportWarningCount)}</span></div>
              <div className="token-row"><span>发布检查</span><span className="meta">{isChecking ? "检查中" : "可运行"}</span></div>
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
                <button className="btn" type="button" onClick={() => handleModalCommand("open")}>打开弹窗</button>
                <button className="btn" type="button" onClick={() => handleModalCommand("close")}>关闭弹窗</button>
              </div>
            </section>
            <section className="property-card is-compact" data-od-id="state-coverage">
              <h3>状态覆盖</h3>
              <div className="state-grid" aria-live="polite">
                <div className={`state-card${isPreviewReady ? "" : " is-loading"}`}><span className="state-dot"></span><strong>{isPreviewReady ? "预览就绪" : "预览渲染中"}</strong><span className="meta">iframe</span></div>
                <div className="state-card" hidden={isChecking}><span className="state-dot"></span><strong>编辑就绪</strong><span className="meta">可编辑</span></div>
                <div className="state-card is-loading" hidden={!isChecking}><span className="state-dot"></span><strong>检查中</strong><span className="meta">0.7s</span></div>
              </div>
              <button className="btn" type="button" onClick={handleRunCheck}>运行发布检查</button>
            </section>
          </div>
        </aside>
      </main>

      <footer className="statusbar">
        <div className="status-left"><span className="dot"></span><span>已选择：{selectedTitle}</span></div>
        <div className="status-right"><span>{state.html.length.toLocaleString()} 字符</span></div>
      </footer>

      {isExportPreviewOpen ? (
        <ExportPreviewDialog
          html={cleanHtml}
          warnings={exportWarnings}
          onClose={() => setIsExportPreviewOpen(false)}
          onCopy={handleCopy}
          onDownload={handleExportHtml}
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
              <h2>快捷键</h2>
              <button className="icon-btn" type="button" aria-label="关闭" onClick={() => setIsCheatsheetOpen(false)}>×</button>
            </header>
            <dl className="cheatsheet-list">
              <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd> + <kbd>Z</kbd></dt><dd>撤销</dd></div>
              <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd> + <kbd>Y</kbd></dt><dd>重做</dd></div>
              <div className="cheatsheet-row"><dt><kbd>Shift</kbd> + <kbd>Ctrl/⌘</kbd> + <kbd>Z</kbd></dt><dd>重做（备选）</dd></div>
              <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd> + <kbd>O</kbd></dt><dd>导入 HTML</dd></div>
              <div className="cheatsheet-row"><dt><kbd>Shift</kbd> + <kbd>Ctrl/⌘</kbd> + <kbd>C</kbd></dt><dd>复制干净 HTML</dd></div>
              <div className="cheatsheet-row"><dt><kbd>Ctrl/⌘</kbd> + <kbd>S</kbd></dt><dd>导出</dd></div>
              <div className="cheatsheet-row"><dt><kbd>1</kbd> · <kbd>2</kbd> · <kbd>3</kbd> · <kbd>4</kbd></dt><dd>切换 viewport 预设</dd></div>
              <div className="cheatsheet-row"><dt><kbd>F</kbd></dt><dd>专注模式</dd></div>
              <div className="cheatsheet-row"><dt><kbd>?</kbd></dt><dd>显示本面板</dd></div>
              <div className="cheatsheet-row"><dt><kbd>Esc</kbd></dt><dd>关闭弹窗</dd></div>
            </dl>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function InspectorDiagnostics({ selected }: { selected: SelectedSnapshot | null }) {
  if (!selected) {
    return (
      <div className="inspector-diagnostics">
        <div className="diagnostic-card">
          <h4>Computed / Events</h4>
          <p className="meta">未选择元素。请在画布或结构树中选择一个对象查看只读诊断信息。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-diagnostics" aria-label="元素诊断信息">
      <div className="diagnostic-card">
        <div className="diagnostic-head">
          <span>Computed</span>
          <strong>{selected.tagName}</strong>
        </div>
        <h4>Typography</h4>
        <dl className="diagnostic-list">
          <InfoRow label="字体" value={selected.fontFamily || "inherit"} />
          <InfoRow label="字号" value={selected.fontSize || "inherit"} />
          <InfoRow label="字重" value={selected.fontWeight || "normal"} />
          <InfoRow label="行高" value={selected.lineHeight || "normal"} />
          <InfoRow label="对齐" value={selected.textAlign || "start"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <h4>Box</h4>
        <dl className="diagnostic-list">
          <InfoRow label="宽度" value={selected.width || "auto"} />
          <InfoRow label="高度" value={selected.height || "auto"} />
          <InfoRow label="最大宽度" value={selected.maxWidth || "none"} />
          <InfoRow label="上外边距" value={selected.marginTop || "0px"} />
          <InfoRow label="下外边距" value={selected.marginBottom || "0px"} />
          <InfoRow label="圆角" value={selected.borderRadius || "0px"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <h4>Paint</h4>
        <dl className="diagnostic-list">
          <InfoRow label="文字色" value={selected.color || "inherit"} />
          <InfoRow label="背景色" value={selected.backgroundColor || "transparent"} />
          <InfoRow label="边框色" value={selected.borderColor || "transparent"} />
          <InfoRow label="阴影" value={selected.boxShadow || "none"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <div className="diagnostic-head">
          <span>Events</span>
          <strong>{selected.tagName}</strong>
        </div>
        <h4>Element State</h4>
        <dl className="diagnostic-list">
          <InfoRow label="点击语义" value={interactionLabel(selected)} />
          <InfoRow label="文本编辑" value={selected.canEditText ? "可编辑" : "继承子元素"} />
          <InfoRow label="Hover 背景" value={selected.hoverBackgroundColor || "未设置"} />
          <InfoRow label="行内样式" value={hasInlineStyleSnapshot(selected) ? "已设置" : "未设置"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <h4>Attributes</h4>
        <dl className="diagnostic-list">
          <InfoRow label="标签" value={selected.tagName} />
          <InfoRow label="ID" value={selected.id || "无"} />
          <InfoRow label="类名" value={selected.className || "无"} />
          <InfoRow label="HFT ID" value={selected.hftId} />
        </dl>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
    </div>
  );
}

function interactionLabel(selected: SelectedSnapshot): string {
  if (selected.tagName === "button") return "按钮";
  if (selected.tagName === "a") return selected.src ? "链接" : "锚点";
  if (["input", "textarea", "select"].includes(selected.tagName)) return "表单控件";
  if (selected.src) return "媒体资源";
  return selected.canEditText ? "可编辑文本" : "结构容器";
}

function hasInlineStyleSnapshot(selected: SelectedSnapshot): boolean {
  return [
    selected.fontFamily,
    selected.fontSize,
    selected.fontWeight,
    selected.lineHeight,
    selected.letterSpacing,
    selected.textAlign,
    selected.marginTop,
    selected.marginBottom,
    selected.paddingTop,
    selected.paddingBottom,
    selected.paddingLeft,
    selected.paddingRight,
    selected.color,
    selected.backgroundColor,
    selected.borderColor,
    selected.borderWidth,
    selected.borderStyle,
    selected.borderRadius,
    selected.boxShadow,
    selected.width,
    selected.height,
    selected.maxWidth,
    selected.objectFit,
  ].some((value) => value.trim().length > 0);
}

function TreeItemNode({
  node,
  isSelected,
  annotation,
  childCount,
  isCollapsed,
  onSelect,
  onToggleCollapse,
}: {
  node: DomTreeNode;
  isSelected: boolean;
  annotation?: AiTreeAnnotation;
  childCount: number;
  isCollapsed: boolean;
  onSelect: (hftId: string) => void;
  onToggleCollapse: (hftId: string) => void;
}) {
  const hasChildren = childCount > 0;
  return (
    <div className="tree-item-row" style={{ "--tree-depth": node.depth } as CSSProperties}>
      {hasChildren ? (
        <button
          className="tree-toggle"
          type="button"
          aria-label={isCollapsed ? "展开子节点" : "折叠子节点"}
          aria-expanded={!isCollapsed}
          onClick={() => onToggleCollapse(node.hftId)}
        >
          {isCollapsed ? "›" : "⌄"}
        </button>
      ) : (
        <span className="tree-toggle-placeholder" aria-hidden="true" />
      )}
      <button
        className={`tree-item${isSelected ? " is-selected" : ""}`}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(node.hftId)}
      >
        <span className="node-icon">{toNodeIcon(node.tagName)}</span>
        <span className="node-copy">
          <strong>{annotation?.label ?? toKindLabel(node.tagName)}</strong>
          <span>{node.tagName} 路 {node.text || node.label}</span>
          {annotation ? (
            <span className="ai-node-hint">
              {annotation.role}
              {annotation.issues.length ? " 路 " + annotation.issues.join(" / ") : ""}
            </span>
          ) : null}
        </span>
        <span className="meta">{hasChildren ? `${childCount} 子` : node.depth === 0 ? "主" : "子"}</span>
      </button>
    </div>
  );
}

function TreeItem({
  node,
  isSelected,
  annotation,
  onSelect,
}: {
  node: DomTreeNode;
  isSelected: boolean;
  annotation?: AiTreeAnnotation;
  onSelect: (hftId: string) => void;
}) {
  return (
    <button
      className={`tree-item${isSelected ? " is-selected" : ""}`}
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(node.hftId)}
    >
      <span className="node-icon">{toNodeIcon(node.tagName)}</span>
      <span className="node-copy">
        <strong>{annotation?.label ?? toKindLabel(node.tagName)}</strong>
        <span>{node.tagName} · {node.text || node.label}</span>
        {annotation ? (
          <span className="ai-node-hint">
            {annotation.role}
            {annotation.issues.length ? " · " + annotation.issues.join(" / ") : ""}
          </span>
        ) : null}
      </span>
      <span className="meta">{node.depth === 0 ? "主" : "子"}</span>
    </button>
  );
}

function buildSelectedSnapshot(html: string, hftId: string): SelectedSnapshot | null {
  try {
    const documentRef = parseHtmlDocument(html);
    const element = queryElementByHftId(documentRef, hftId);
    if (!element) return null;
    const tagName = getNormalizedTagName(element);
    const text = element.textContent?.trim() ?? "";
    const label = toKindLabel(tagName);
    const style = element instanceof HTMLElement || element instanceof SVGElement ? element.style : null;

    return {
      hftId,
      tagName,
      id: element.id,
      label,
      text,
      path: getDomPath(element),
      className: getElementClassName(element),
      fontFamily: style?.getPropertyValue("font-family") || "",
      fontSize: style?.getPropertyValue("font-size") || "",
      fontWeight: style?.getPropertyValue("font-weight") || "",
      lineHeight: style?.getPropertyValue("line-height") || "",
      letterSpacing: style?.getPropertyValue("letter-spacing") || "",
      textAlign: style?.getPropertyValue("text-align") || "",
      marginTop: style?.getPropertyValue("margin-top") || "",
      marginBottom: style?.getPropertyValue("margin-bottom") || "",
      paddingTop: style?.getPropertyValue("padding-top") || "",
      paddingBottom: style?.getPropertyValue("padding-bottom") || "",
      paddingLeft: style?.getPropertyValue("padding-left") || "",
      paddingRight: style?.getPropertyValue("padding-right") || "",
      color: style?.getPropertyValue("color") || "",
      backgroundColor: style?.getPropertyValue("background-color") || "",
      borderColor: style?.getPropertyValue("border-color") || "",
      borderWidth: style?.getPropertyValue("border-width") || "",
      borderStyle: style?.getPropertyValue("border-style") || "",
      borderRadius: style?.getPropertyValue("border-radius") || "",
      boxShadow: style?.getPropertyValue("box-shadow") || "",
      width: style?.getPropertyValue("width") || "",
      height: style?.getPropertyValue("height") || "",
      maxWidth: style?.getPropertyValue("max-width") || "",
      objectFit: style?.getPropertyValue("object-fit") || "",
      hoverBackgroundColor: getHoverBackgroundColor(html, hftId),
      src: getElementSourceValue(element),
      alt: getElementAltValue(element),
      canEditText: element.children.length === 0 && tagName !== "img" && tagName !== "svg" && tagName !== "image",
    };
  } catch {
    return null;
  }
}

function getElementSourceValue(element: HTMLElement | SVGElement): string {
  const tagName = getNormalizedTagName(element);
  if (tagName === "svg") return element.getAttribute("viewBox") ?? "";
  if (tagName === "image") return element.getAttribute("href") ?? element.getAttribute("xlink:href") ?? "";
  return element.getAttribute("src") ?? element.getAttribute("href") ?? "";
}

function getElementAltValue(element: HTMLElement | SVGElement): string {
  const tagName = getNormalizedTagName(element);
  if (tagName === "svg" || tagName === "image") return element.getAttribute("aria-label") ?? "";
  return element.getAttribute("alt") ?? element.getAttribute("aria-label") ?? "";
}

function buildPretextFontFromDraft(
  selected: SelectedSnapshot,
  fontFamily: string,
  fontSize: string,
  fontWeight: string
): string {
  const size = parseCssNumericValue(fontSize) || parseCssNumericValue(selected.fontSize) || 16;
  const family = fontFamily.trim() || selected.fontFamily || "system-ui, sans-serif";
  const weight = fontWeight.trim() || selected.fontWeight;
  return `${weight && weight !== "400" ? `${weight} ` : ""}${size}px ${family}`;
}

function resolveMeasureWidth(...values: string[]): number {
  for (const value of values) {
    const parsed = parseCssNumericValue(value);
    if (parsed > 0) return parsed;
  }
  return 320;
}

function resolveMeasureLineHeight(lineHeight: string, selectedLineHeight: string, fontSize: string, selectedFontSize: string): number {
  const size = parseCssNumericValue(fontSize) || parseCssNumericValue(selectedFontSize) || 16;
  const raw = lineHeight.trim() || selectedLineHeight.trim();
  if (!raw || raw === "normal") return Math.round(size * 1.35);

  const parsed = parseCssNumericValue(raw);
  if (!parsed) return Math.round(size * 1.35);
  if (/^-?\d*\.?\d+$/.test(raw)) return Math.round(size * parsed);
  return parsed;
}

function parseCssNumericValue(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasBlockingExportWarnings(warnings: ExportWarning[]): boolean {
  return warnings.some((warning) => BLOCKING_EXPORT_WARNING_TYPES.includes(warning.type));
}

function formatExportWarningSummary(totalCount: number, blockingCount: number): string {
  if (blockingCount > 0) return `${blockingCount} 项阻断风险`;
  if (totalCount > 0) return `${totalCount} 项提示`;
  return "干净";
}

function countSourceLines(value: string): number {
  return (value.match(/\r\n|\r|\n/g)?.length ?? 0) + 1;
}

function buildPreviewSrcDoc(html: string, selectedId: string | null): string {
  const documentRef = parseHtmlDocument(html);
  const styleElement = documentRef.createElement("style");
  styleElement.textContent = `
    [${HFT_ID_ATTRIBUTE}] {
      cursor: pointer;
    }
    [${HFT_ID_ATTRIBUTE}]:hover {
      outline: 2px dashed rgba(16, 184, 168, 0.6) !important;
      outline-offset: 3px !important;
    }
    ${selectedId ? `[${HFT_ID_ATTRIBUTE}="${cssString(selectedId)}"] {
      outline: 4px solid #10b8a8 !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 8px rgba(16, 184, 168, 0.16) !important;
    }` : ""}
    #html-finetune-quickbar {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center;
      gap: 4px;
      max-width: min(92vw, 520px);
      padding: 6px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
      backdrop-filter: blur(12px);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    #html-finetune-quickbar[data-open="true"] {
      display: flex;
    }
    #html-finetune-quickbar button {
      min-height: 28px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #334155;
      padding: 0 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    #html-finetune-quickbar button:hover {
      background: rgba(16, 184, 168, 0.12);
      color: #0f766e;
    }
    #html-finetune-quickbar button[data-action="delete"] {
      color: #be123c;
    }
  `;
  documentRef.head.appendChild(styleElement);

  const scriptElement = documentRef.createElement("script");
  scriptElement.textContent = `
    (() => {
      const attr = "${HFT_ID_ATTRIBUTE}";
      const modalSelectors = [
        "dialog",
        "[role='dialog']",
        "[aria-modal='true']",
        ".modal",
        ".dialog",
        ".popup",
        "[data-modal]"
      ];

      function findModal() {
        return document.querySelector(modalSelectors.join(","));
      }

      function sendStatus(message) {
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_STATUS", message: String(message || "") }, "*");
      }

      let quickbarTarget = null;

      function sendAction(action) {
        if (!quickbarTarget) return;
        const hftId = quickbarTarget.getAttribute(attr);
        if (!hftId) return;
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_ACTION", hftId, action }, "*");
      }

      function ensureQuickbar() {
        let quickbar = document.getElementById("html-finetune-quickbar");
        if (quickbar) return quickbar;
        quickbar = document.createElement("div");
        quickbar.id = "html-finetune-quickbar";
        quickbar.setAttribute("aria-label", "HTML FineTune element actions");
        quickbar.innerHTML = [
          '<button type="button" data-action="edit-text">编辑</button>',
          '<button type="button" data-action="move-up">上移</button>',
          '<button type="button" data-action="move-down">下移</button>',
          '<button type="button" data-action="duplicate">复制</button>',
          '<button type="button" data-action="copy-style">复制样式</button>',
          '<button type="button" data-action="paste-style">粘贴样式</button>',
          '<button type="button" data-action="delete">删除</button>'
        ].join("");
        quickbar.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const button = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
          if (!button) return;
          sendAction(button.getAttribute("data-action"));
        });
        document.body.appendChild(quickbar);
        return quickbar;
      }

      function showQuickbarFor(element) {
        quickbarTarget = element;
        const quickbar = ensureQuickbar();
        const rect = element.getBoundingClientRect();
        quickbar.dataset.open = "true";
        const width = quickbar.offsetWidth || 360;
        const height = quickbar.offsetHeight || 40;
        const top = Math.max(8, rect.top - height - 12);
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left));
        quickbar.style.top = Math.round(top) + "px";
        quickbar.style.left = Math.round(left) + "px";
      }

      function openModal() {
        const modal = findModal();
        if (!modal) {
          window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: false, open: false }, "*");
          return;
        }
        if (typeof HTMLDialogElement !== "undefined" && modal instanceof HTMLDialogElement) {
          try {
            if (!modal.open) modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.classList.add("is-open", "open", "show");
          if (modal.style.display === "none") modal.style.display = "block";
          modal.style.visibility = "visible";
          modal.style.pointerEvents = "auto";
        }
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: true, open: true }, "*");
      }

      function closeModal() {
        const modal = findModal();
        if (!modal) {
          window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: false, open: false }, "*");
          return;
        }
        if (typeof HTMLDialogElement !== "undefined" && modal instanceof HTMLDialogElement) {
          if (modal.open) modal.close();
          modal.removeAttribute("open");
        } else {
          modal.setAttribute("hidden", "");
          modal.setAttribute("aria-hidden", "true");
          modal.classList.remove("is-open", "open", "show");
          modal.style.display = "none";
        }
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_MODAL_STATE", found: true, open: false }, "*");
      }

      let dragState = null;

      function toPx(value) {
        const parsed = Number.parseFloat(value || "0");
        return Number.isFinite(parsed) ? parsed : 0;
      }

      document.addEventListener("pointerdown", (event) => {
        if (event.target instanceof Element && event.target.closest("#html-finetune-quickbar")) return;
        const target = event.target instanceof Element ? event.target.closest("[" + attr + "]") : null;
        if (!target || !(target instanceof HTMLElement)) return;
        const computed = window.getComputedStyle(target);
        dragState = {
          element: target,
          hftId: target.getAttribute(attr),
          startX: event.clientX,
          startY: event.clientY,
          baseLeft: toPx(target.style.left || computed.left),
          baseTop: toPx(target.style.top || computed.top),
          originalPosition: computed.position,
          dragging: false
        };
      }, true);

      document.addEventListener("pointermove", (event) => {
        if (!dragState || !dragState.element) return;
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        if (!dragState.dragging && Math.hypot(dx, dy) < 5) return;
        dragState.dragging = true;
        event.preventDefault();
        event.stopPropagation();
        const element = dragState.element;
        if (dragState.originalPosition === "static") element.style.position = "relative";
        element.style.left = Math.round(dragState.baseLeft + dx) + "px";
        element.style.top = Math.round(dragState.baseTop + dy) + "px";
        element.style.zIndex = element.style.zIndex || "2";
      }, true);

      document.addEventListener("pointerup", (event) => {
        if (!dragState) return;
        const completed = dragState;
        dragState = null;
        if (!completed.dragging || !completed.hftId || !completed.element) return;
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({
          type: "HTML_FINETUNE_OPTIMIZED_DRAG",
          hftId: completed.hftId,
          styles: {
            position: completed.element.style.position || "relative",
            left: completed.element.style.left || "0px",
            top: completed.element.style.top || "0px"
          }
        }, "*");
      }, true);

      document.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("#html-finetune-quickbar")) return;
        const target = event.target instanceof Element ? event.target.closest("[" + attr + "]") : null;
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        showQuickbarFor(target);
        window.parent.postMessage({ type: "HTML_FINETUNE_OPTIMIZED_SELECT", hftId: target.getAttribute(attr) }, "*");
      }, true);

      window.addEventListener("message", (event) => {
        const data = event.data || {};
        if (data.type !== "HTML_FINETUNE_OPTIMIZED_MODAL") return;
        if (data.action === "open") openModal();
        if (data.action === "close") closeModal();
      });

      sendStatus("预览桥接已就绪");
    })();
  `;
  documentRef.body.appendChild(scriptElement);

  return serializeDocument(documentRef);
}

function filterDomTree(nodes: DomTreeNode[], query: string): DomTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;
  return nodes.filter((node) =>
    [node.tagName, node.label, node.text, node.className, node.id]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

function filterCollapsedTree(nodes: DomTreeNode[], collapsedIds: Set<string>): DomTreeNode[] {
  if (collapsedIds.size === 0) return nodes;
  const visibleNodes: DomTreeNode[] = [];
  let collapsedDepth: number | null = null;
  for (const node of nodes) {
    if (collapsedDepth !== null) {
      if (node.depth > collapsedDepth) continue;
      collapsedDepth = null;
    }
    visibleNodes.push(node);
    if (collapsedIds.has(node.hftId)) {
      collapsedDepth = node.depth;
    }
  }
  return visibleNodes;
}

function countTreeChildren(nodes: DomTreeNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  nodes.forEach((node, index) => {
    let childCount = 0;
    for (let cursor = index + 1; cursor < nodes.length; cursor += 1) {
      const candidate = nodes[cursor];
      if (candidate.depth <= node.depth) break;
      if (candidate.depth === node.depth + 1) childCount += 1;
    }
    counts[node.hftId] = childCount;
  });
  return counts;
}

function getPreferredSelectedId(nodes: DomTreeNode[]): string | null {
  return (
    nodes.find((node) => /^h[1-6]$/.test(node.tagName)) ??
    nodes.find((node) => node.text.trim().length > 0 && !["div", "section", "article"].includes(node.tagName)) ??
    nodes[0] ??
    null
  )?.hftId ?? null;
}

function toKindLabel(tagName: string): string {
  if (/^h[1-6]$/.test(tagName)) return "标题";
  if (tagName === "p") return "正文";
  if (tagName === "button") return "按钮";
  if (tagName === "a") return "链接";
  if (tagName === "img" || tagName === "svg" || tagName === "image") return "图片";
  if (tagName === "section" || tagName === "article" || tagName === "div") return "区块";
  return tagName;
}

function toNodeIcon(tagName: string): string {
  if (/^h[1-6]$/.test(tagName)) return tagName.toUpperCase();
  if (tagName === "button") return "BTN";
  if (tagName === "a") return "A";
  if (tagName === "img" || tagName === "svg" || tagName === "image") return "IMG";
  return tagName.slice(0, 3).toUpperCase();
}

function zoomToTransform(
  mode: ZoomMode,
  viewportSize: { width: number; height: number },
  stageSize: { width: number; height: number }
): string | undefined {
  if (mode === "100") return "scale(1)";
  if (mode === "fit") {
    if (stageSize.width === 0 || stageSize.height === 0) return "scale(0.72)";
    // 预留 32px 边距,避免 page-preview 贴边
    const scale = Math.min(
      (stageSize.width - 32) / viewportSize.width,
      (stageSize.height - 32) / viewportSize.height,
      1
    );
    return `scale(${scale.toFixed(3)})`;
  }
  return "scale(0.88)";
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "刚刚";
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Date(timestamp).toLocaleString();
}

function cssString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function IconUndo() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></svg>;
}

function IconRedo() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/></svg>;
}

function IconImport() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4h14v-4"/></svg>;
}

function IconDownload() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>;
}

function IconHistory() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v6l4 2"/></svg>;
}

function IconMenu() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h10M4 18h16"/></svg>;
}

function IconKeyboard() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>;
}

function IconEye() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
}
