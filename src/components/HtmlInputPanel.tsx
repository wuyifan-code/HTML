import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import ClaudeLogo from "@lobehub/icons/es/Claude/components/Color";
import DeepSeekLogo from "@lobehub/icons/es/DeepSeek/components/Color";
import DoubaoLogo from "@lobehub/icons/es/Doubao/components/Color";
import GeminiLogo from "@lobehub/icons/es/Gemini/components/Color";
import GemmaLogo from "@lobehub/icons/es/Gemma/components/Color";
import GrokLogo from "@lobehub/icons/es/Grok/components/Mono";
import GroqLogo from "@lobehub/icons/es/Groq/components/Mono";
import KimiLogo from "@lobehub/icons/es/Kimi/components/Mono";
import MetaLogo from "@lobehub/icons/es/Meta/components/Color";
import MinimaxLogo from "@lobehub/icons/es/Minimax/components/Color";
import MistralLogo from "@lobehub/icons/es/Mistral/components/Color";
import OpenAILogo from "@lobehub/icons/es/OpenAI/components/Mono";
import OpenRouterLogo from "@lobehub/icons/es/OpenRouter/components/Mono";
import QwenLogo from "@lobehub/icons/es/Qwen/components/Color";
import SiliconCloudLogo from "@lobehub/icons/es/SiliconCloud/components/Color";
import TogetherLogo from "@lobehub/icons/es/Together/components/Color";
import WenxinLogo from "@lobehub/icons/es/Wenxin/components/Color";
import ZhipuLogo from "@lobehub/icons/es/Zhipu/components/Color";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FileUp,
  KeyRound,
  ListTree,
  PanelBottom,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Tooltip } from "./Tooltip";
import type { AiAnalysisStatus, AiTreeAnnotation, DomTreeNode, SourcePanelPlacement } from "../types/editor";
import type { AiModelFetchStatus, AiModelOption, AiProviderDefinition, AiProviderId } from "../utils/aiStructure";

type SourcePanelView = "source" | "tree";

interface HtmlInputPanelProps {
  value: string;
  domTree: DomTreeNode[];
  aiAnnotations: Record<string, AiTreeAnnotation>;
  aiStatus: AiAnalysisStatus;
  aiError: string;
  aiProvider: AiProviderId;
  aiProviders: AiProviderDefinition[];
  aiApiKey: string;
  aiRememberKey: boolean;
  aiModel: string;
  aiModelOptions: AiModelOption[];
  aiModelFetchStatus: AiModelFetchStatus;
  aiModelFetchError: string;
  selectedId: string | null;
  onChange: (value: string) => void;
  onImport: (file: File) => void;
  onSelectElement: (hftId: string) => void;
  onAiProviderChange: (value: AiProviderId) => void;
  onAiApiKeyChange: (value: string) => void;
  onAiRememberKeyChange: (value: boolean) => void;
  onAiModelChange: (value: string) => void;
  onRefreshAiModels: () => void;
  onAnalyzeStructure: () => void;
  onClearAiAnnotations: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  placement: SourcePanelPlacement;
  onTogglePlacement: () => void;
  showImportDropzone: boolean;
  sourceView: SourcePanelView;
  onSourceViewChange: (view: SourcePanelView) => void;
}

type AiLogoSurface = "plain" | "light";
type AiLogoComponent = ComponentType<{
  className?: string;
  color?: string;
  size?: number | string;
  style?: CSSProperties;
  title?: string;
}>;

interface AiLogoDescriptor {
  Icon: AiLogoComponent;
  title: string;
  surface?: AiLogoSurface;
  color?: string;
}

const GEMMA_LOGO: AiLogoDescriptor = { Icon: GemmaLogo, title: "Gemma", surface: "plain" };
const META_LOGO: AiLogoDescriptor = { Icon: MetaLogo, title: "Meta Llama", surface: "plain" };

const AI_PROVIDER_LOGOS: Record<AiProviderId, AiLogoDescriptor> = {
  google: { Icon: GeminiLogo, title: "Google Gemini", surface: "plain" },
  openai: { Icon: OpenAILogo, title: "OpenAI", surface: "light", color: "#101828" },
  anthropic: { Icon: ClaudeLogo, title: "Anthropic Claude", surface: "plain" },
  deepseek: { Icon: DeepSeekLogo, title: "DeepSeek", surface: "plain" },
  qwen: { Icon: QwenLogo, title: "Qwen", surface: "plain" },
  kimi: { Icon: KimiLogo, title: "Kimi / Moonshot", surface: "light", color: "#1783ff" },
  zhipu: { Icon: ZhipuLogo, title: "GLM / Z.AI", surface: "plain" },
  volcengine: { Icon: DoubaoLogo, title: "Doubao", surface: "plain" },
  qianfan: { Icon: WenxinLogo, title: "Baidu Wenxin / Qianfan", surface: "plain" },
  minimax: { Icon: MinimaxLogo, title: "MiniMax", surface: "plain" },
  mistral: { Icon: MistralLogo, title: "Mistral AI", surface: "plain" },
  xai: { Icon: GrokLogo, title: "xAI Grok", surface: "light", color: "#101828" },
  groq: { Icon: GroqLogo, title: "Groq", surface: "light", color: "#101828" },
  together: { Icon: TogetherLogo, title: "Together AI", surface: "plain" },
  openrouter: { Icon: OpenRouterLogo, title: "OpenRouter", surface: "light", color: "#101828" },
  siliconflow: { Icon: SiliconCloudLogo, title: "SiliconFlow", surface: "plain" },
};

function getProviderLogo(providerId: AiProviderId): AiLogoDescriptor {
  return AI_PROVIDER_LOGOS[providerId];
}

function getModelLogo(modelId: string, providerId: AiProviderId): AiLogoDescriptor {
  const value = modelId.toLowerCase();
  if (value.includes("claude") || value.includes("anthropic")) return getProviderLogo("anthropic");
  if (value.includes("deepseek")) return getProviderLogo("deepseek");
  if (value.includes("qwen")) return getProviderLogo("qwen");
  if (value.includes("gemma")) return GEMMA_LOGO;
  if (value.includes("gemini")) return getProviderLogo("google");
  if (value.includes("gpt") || value.includes("openai")) return getProviderLogo("openai");
  if (value.includes("kimi") || value.includes("moonshot")) return getProviderLogo("kimi");
  if (value.includes("glm") || value.includes("zai")) return getProviderLogo("zhipu");
  if (value.includes("doubao")) return getProviderLogo("volcengine");
  if (value.includes("ernie") || value.includes("wenxin")) return getProviderLogo("qianfan");
  if (value.includes("minimax")) return getProviderLogo("minimax");
  if (value.includes("mistral") || value.includes("ministral")) return getProviderLogo("mistral");
  if (value.includes("grok")) return getProviderLogo("xai");
  if (value.includes("llama") || value.includes("meta-llama")) return META_LOGO;
  return getProviderLogo(providerId);
}

function HtmlInputPanelComponent({
  value,
  domTree,
  aiAnnotations,
  aiStatus,
  aiError,
  aiProvider,
  aiProviders,
  aiApiKey,
  aiRememberKey,
  aiModel,
  aiModelOptions,
  aiModelFetchStatus,
  aiModelFetchError,
  selectedId,
  onChange,
  onImport,
  onSelectElement,
  onAiProviderChange,
  onAiApiKeyChange,
  onAiRememberKeyChange,
  onAiModelChange,
  onRefreshAiModels,
  onAnalyzeStructure,
  onClearAiAnnotations,
  isCollapsed,
  onToggleCollapse,
  placement,
  onTogglePlacement,
  showImportDropzone,
  sourceView,
  onSourceViewChange,
}: HtmlInputPanelProps) {
  const activeView = sourceView;
  const setActiveView = onSourceViewChange;
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [treeQuery, setTreeQuery] = useState("");
  const isBottomPlacement = placement === "bottom";
  const filteredDomTree = useMemo(() => {
    const query = treeQuery.trim().toLowerCase();
    if (!query) return domTree;
    return domTree.filter((node) => {
      const annotation = aiAnnotations[node.hftId];
      return [
        node.tagName,
        node.text,
        node.label,
        annotation?.label,
        annotation?.role,
        annotation?.suggestion,
        ...(annotation?.issues ?? []),
      ].some((value) => (value || "").toLowerCase().includes(query));
    });
  }, [aiAnnotations, domTree, treeQuery]);
  const sourceLineCount = useMemo(() => (value.match(/\r\n|\r|\n/g)?.length ?? 0) + 1, [value]);

  const handleImportFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) onImport(file);
  };

  if (isCollapsed) {
    return (
      <section className="panel collapsed-panel collapsed-source-panel" aria-label="HTML 源码已收起">
        <Tooltip content="展开 HTML 源码" placement="right">
          <button
            className="collapse-rail-button"
            type="button"
            onClick={onToggleCollapse}
            aria-label="展开 HTML 源码"
          >
            <PanelLeftOpen size={18} strokeWidth={1.75} />
            <span>展开源码</span>
          </button>
        </Tooltip>
      </section>
    );
  }

  return (
    <section className={`panel source-panel${isBottomPlacement ? " source-panel-bottom" : ""}`} aria-label="HTML 源码编辑器">
      <div className="panel-header">
        <div className="panel-title">
          {activeView === "source" ? <Code2 size={18} strokeWidth={1.75} /> : <ListTree size={18} strokeWidth={1.75} />}
          <span>{activeView === "source" ? "源码" : "结构导航"}</span>
        </div>
        <div className="source-header-actions">
          <div className="segmented-control compact-segmented" aria-label="左侧视图">
            <button
              className={`segmented-button${activeView === "source" ? " segmented-button-active" : ""}`}
              type="button"
              aria-pressed={activeView === "source"}
              onClick={() => setActiveView("source")}
            >
              <Code2 size={14} strokeWidth={1.75} />
              源码
            </button>
            <button
              className={`segmented-button${activeView === "tree" ? " segmented-button-active" : ""}`}
              type="button"
              aria-pressed={activeView === "tree"}
              onClick={() => setActiveView("tree")}
            >
              <ListTree size={14} strokeWidth={1.75} />
              结构
            </button>
          </div>
          {activeView === "tree" ? (
            <AiTreePopover
              apiKey={aiApiKey}
              rememberKey={aiRememberKey}
              model={aiModel}
              modelOptions={aiModelOptions}
              modelFetchStatus={aiModelFetchStatus}
              modelFetchError={aiModelFetchError}
              status={aiStatus}
              error={aiError}
              provider={aiProvider}
              providers={aiProviders}
              annotationCount={Object.keys(aiAnnotations).length}
              onProviderChange={onAiProviderChange}
              onApiKeyChange={onAiApiKeyChange}
              onRememberKeyChange={onAiRememberKeyChange}
              onModelChange={onAiModelChange}
              onRefreshModels={onRefreshAiModels}
              onAnalyze={onAnalyzeStructure}
              onClear={onClearAiAnnotations}
            />
          ) : null}
          <Tooltip content={isBottomPlacement ? "源码区移回左侧" : "源码区移到底部"} placement="bottom">
            <button
              className="icon-button"
              type="button"
              onClick={onTogglePlacement}
              aria-label={isBottomPlacement ? "将源码区移回左侧" : "将源码区移到底部"}
            >
              {isBottomPlacement ? <PanelLeft size={18} strokeWidth={1.75} /> : <PanelBottom size={18} strokeWidth={1.75} />}
            </button>
          </Tooltip>
          <Tooltip content="收起 HTML 源码" placement="bottom">
            <button
              className="icon-button"
              type="button"
              onClick={onToggleCollapse}
              aria-label="收起 HTML 源码"
            >
              <PanelLeftClose size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="source-panel-shell">
        <div className="source-panel-main">
          {activeView === "source" ? (
            <>
              {showImportDropzone ? (
                <label
                  className={`source-dropzone${isDraggingFile ? " source-dropzone-active" : ""}`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(false);
                    handleImportFiles(event.dataTransfer.files);
                  }}
                >
                  <FileUp size={16} strokeWidth={1.75} />
                  <span>拖拽 HTML 文件到此处</span>
                  <small>或点击导入 .html</small>
                  <input
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={(event) => {
                      handleImportFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              ) : null}
              <div className="source-editor-shell">
                <div className="source-editor-meta">
                  <span className="source-editor-language">
                    <Code2 size={13} strokeWidth={1.75} />
                    HTML
                  </span>
                  <span>{sourceLineCount.toLocaleString()} 行</span>
                </div>
                <textarea
                  className="source-textarea"
                  spellCheck={false}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  aria-label="可编辑 HTML 源码"
                />
              </div>
            </>
          ) : (
            <>
              {showImportDropzone ? (
                <label
                  className={`source-dropzone source-dropzone-compact${isDraggingFile ? " source-dropzone-active" : ""}`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingFile(false);
                    handleImportFiles(event.dataTransfer.files);
                  }}
                >
                  <FileUp size={16} strokeWidth={1.75} />
                  <span>导入 HTML</span>
                  <small>拖入文件或点击选择</small>
                  <input
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={(event) => {
                      handleImportFiles(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              ) : null}
              <div className="source-outline-header">
                <span>可编辑元素</span>
                <small>{filteredDomTree.length} / {domTree.length}</small>
              </div>
              <TreeSearch value={treeQuery} onChange={setTreeQuery} />
              <DomTreeList
                nodes={filteredDomTree}
                aiAnnotations={aiAnnotations}
                selectedId={selectedId}
                onSelectElement={onSelectElement}
                emptyText={treeQuery ? "没有匹配的元素" : "没有可编辑文本元素"}
              />
            </>
          )}
        </div>
      </div>
      <div className="panel-footer">
        <span>{activeView === "source" ? "源码直改" : "点击元素定位到预览"}</span>
        <span>{value.length.toLocaleString()} 字符</span>
      </div>
    </section>
  );
}

export const HtmlInputPanel = memo(HtmlInputPanelComponent);

function TreeSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="tree-search">
      <Search size={14} strokeWidth={1.75} />
      <input
        type="search"
        data-tree-search-input
        value={value}
        placeholder="查找标签、文本或类名"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface AiTreeControlsProps {
  apiKey: string;
  rememberKey: boolean;
  model: string;
  modelOptions: AiModelOption[];
  modelFetchStatus: AiModelFetchStatus;
  modelFetchError: string;
  status: AiAnalysisStatus;
  error: string;
  provider: AiProviderId;
  providers: AiProviderDefinition[];
  annotationCount: number;
  onProviderChange: (value: AiProviderId) => void;
  onApiKeyChange: (value: string) => void;
  onRememberKeyChange: (value: boolean) => void;
  onModelChange: (value: string) => void;
  onRefreshModels: () => void;
  onAnalyze: () => void;
  onClear: () => void;
}

function AiTreePopover(props: AiTreeControlsProps) {
  const {
    annotationCount,
    model,
    provider,
    status,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const modelLogo = getModelLogo(model, provider);
  const triggerLabel = status === "running" ? "扫描" : annotationCount > 0 ? `${annotationCount}` : "AI";

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="ai-toolbar-popover" ref={popoverRef}>
      <Tooltip content="AI 结构扫描" placement="bottom">
        <button
          className={`ai-toolbar-trigger ai-toolbar-trigger-${status}${isOpen ? " ai-toolbar-trigger-open" : ""}`}
          type="button"
          aria-label="AI 结构扫描设置"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => setIsOpen((value) => !value)}
        >
          <AiLogoMark className="ai-toolbar-logo" logo={modelLogo} />
          <span>{triggerLabel}</span>
        </button>
      </Tooltip>
      {isOpen ? (
        <div className="ai-toolbar-panel" role="dialog" aria-label="AI 结构扫描设置">
          <AiTreeControls {...props} />
        </div>
      ) : null}
    </div>
  );
}

function AiTreeControls({
  apiKey,
  rememberKey,
  model,
  modelOptions,
  modelFetchStatus,
  modelFetchError,
  status,
  error,
  provider,
  providers,
  annotationCount,
  onProviderChange,
  onApiKeyChange,
  onRememberKeyChange,
  onModelChange,
  onRefreshModels,
  onAnalyze,
  onClear,
}: AiTreeControlsProps) {
  const isRunning = status === "running";
  const isFetchingModels = modelFetchStatus === "loading";
  const hasAnnotations = annotationCount > 0;
  const canAnalyze = apiKey.trim().length > 0 && !isRunning;
  const canRefreshModels = apiKey.trim().length > 0 && !isFetchingModels;
  const selectedProvider = providers.find((item) => item.id === provider) ?? providers[0];
  const availableModelOptions = modelOptions.length > 0 ? modelOptions : [];
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const providerPickerRef = useRef<HTMLDivElement | null>(null);
  const modelPickerRef = useRef<HTMLDivElement | null>(null);
  const customModelValue = "__hft_custom_model__";
  const isKnownModel = availableModelOptions.some((option) => option.value === model);
  const showCustomModel = isCustomModel || !isKnownModel;
  const modelSelectValue = showCustomModel ? customModelValue : model;
  const selectedModelOption = availableModelOptions.find((option) => option.value === model);
  const selectedModelLabel = showCustomModel ? model.trim() || "手动输入模型" : selectedModelOption?.label || model;
  const selectedProviderLogo = getProviderLogo(selectedProvider.id);
  const selectedModelLogo = getModelLogo(model, provider);
  const modelStatusText =
    modelFetchStatus === "loading"
      ? "获取模型中"
      : modelFetchStatus === "ready"
        ? `已获取 ${availableModelOptions.length} 个模型`
        : modelFetchStatus === "error"
          ? "模型列表获取失败"
          : "使用内置模型";

  useEffect(() => {
    if (!isProviderMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!providerPickerRef.current?.contains(event.target as Node)) {
        setIsProviderMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProviderMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProviderMenuOpen]);

  useEffect(() => {
    if (!isModelMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!modelPickerRef.current?.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModelMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModelMenuOpen]);

  return (
    <div className={`ai-tree-card ai-tree-card-${status}`}>
      <div className="ai-tree-row">
        <div className="ai-provider-picker" ref={providerPickerRef}>
          <button
            className="ai-provider-trigger"
            type="button"
            aria-label="AI 厂商"
            aria-haspopup="listbox"
            aria-expanded={isProviderMenuOpen}
            onClick={() => setIsProviderMenuOpen((value) => !value)}
          >
            <AiLogoMark logo={selectedProviderLogo} />
            <span>{selectedProvider.shortLabel}</span>
            <ChevronDown size={13} strokeWidth={1.8} />
          </button>
          {isProviderMenuOpen ? (
            <div className="ai-provider-menu" role="listbox" aria-label="AI 厂商列表">
              {providers.map((item) => {
                const isSelected = item.id === provider;
                return (
                  <button
                    key={item.id}
                    className={`ai-provider-option${isSelected ? " ai-provider-option-active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setIsCustomModel(false);
                      setIsProviderMenuOpen(false);
                      onProviderChange(item.id);
                    }}
                  >
                    <AiLogoMark logo={getProviderLogo(item.id)} />
                    <span className="ai-provider-option-text">
                      <span className="ai-provider-option-name">{item.shortLabel}</span>
                      <span className="ai-provider-option-detail">{item.label}</span>
                    </span>
                    {isSelected ? <Check className="ai-provider-check" size={13} strokeWidth={2} /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="ai-model-picker" ref={modelPickerRef}>
          <button
            className="ai-model-trigger"
            type="button"
            aria-label="AI 模型"
            aria-haspopup="listbox"
            aria-expanded={isModelMenuOpen}
            onClick={() => setIsModelMenuOpen((value) => !value)}
          >
            <AiLogoMark className="ai-model-brand-icon" logo={selectedModelLogo} />
            <span className="ai-model-trigger-text">{selectedModelLabel}</span>
            <ChevronDown size={13} strokeWidth={1.8} />
          </button>
          {isModelMenuOpen ? (
            <div className="ai-model-menu" role="listbox" aria-label="AI 模型列表">
              <div className={`ai-model-menu-meta ai-model-menu-meta-${modelFetchStatus}`}>{modelStatusText}</div>
              {availableModelOptions.map((option) => {
                const isSelected = option.value === model && !showCustomModel;
                return (
                  <button
                    key={option.value}
                    className={`ai-model-option${isSelected ? " ai-model-option-active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    title={option.value}
                    onClick={() => {
                      setIsCustomModel(false);
                      setIsModelMenuOpen(false);
                      onModelChange(option.value);
                    }}
                  >
                    <AiLogoMark className="ai-model-option-logo" logo={getModelLogo(option.value, provider)} />
                    <span className="ai-model-option-text">
                      <span className="ai-model-option-name">{option.label}</span>
                      <span className="ai-model-option-id">{option.value}</span>
                    </span>
                    {isSelected ? <Check className="ai-provider-check" size={13} strokeWidth={2} /> : null}
                  </button>
                );
              })}
              <button
                className={`ai-model-option ai-model-option-custom${showCustomModel ? " ai-model-option-active" : ""}`}
                type="button"
                role="option"
                aria-selected={showCustomModel}
                onClick={() => {
                  setIsCustomModel(true);
                  setIsModelMenuOpen(false);
                }}
              >
                <Sparkles size={15} strokeWidth={1.8} />
                <span className="ai-model-option-text">
                  <span className="ai-model-option-name">手动输入模型</span>
                  <span className="ai-model-option-id">自定义模型 ID</span>
                </span>
                {showCustomModel ? <Check className="ai-provider-check" size={13} strokeWidth={2} /> : null}
              </button>
            </div>
          ) : null}
        </div>
        <label className="ai-model-field ai-model-field-native">
          <AiLogoMark className="ai-model-brand-icon" logo={selectedModelLogo} />
          <select
            className="ai-model-select"
            value={modelSelectValue}
            aria-label="AI 模型"
            onChange={(event) => {
              const nextModel = event.target.value;
              if (nextModel === customModelValue) {
                setIsCustomModel(true);
                return;
              }
              setIsCustomModel(false);
              onModelChange(nextModel);
            }}
          >
            {availableModelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value={customModelValue}>手动输入模型...</option>
          </select>
        </label>
      </div>
      {showCustomModel ? (
        <label className="ai-custom-model-field">
          <span>手动</span>
          <input
            value={model}
            aria-label="手动输入 AI 模型"
            placeholder="输入模型 ID"
            spellCheck={false}
            onChange={(event) => onModelChange(event.target.value)}
          />
        </label>
      ) : null}
      <div className="ai-tree-row">
        <label className="ai-key-field">
          <KeyRound size={13} strokeWidth={1.8} />
          <input
            type="password"
            value={apiKey}
            placeholder={selectedProvider.keyPlaceholder}
            name={`hft-ai-api-key-${provider}`}
            autoComplete="new-password"
            spellCheck={false}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
        </label>
        <button
          className={`ai-refresh-models-button${isFetchingModels ? " ai-refresh-models-button-loading" : ""}`}
          type="button"
          title="重新获取模型列表"
          aria-label="重新获取模型列表"
          disabled={!canRefreshModels}
          onClick={onRefreshModels}
        >
          <RefreshCw size={13} strokeWidth={1.8} />
        </button>
      </div>
      <div className={`ai-model-status-line ai-model-status-line-${modelFetchStatus}`} title={modelFetchError || modelStatusText}>
        {modelStatusText}
      </div>
      <div className="ai-tree-actions">
        <label className="ai-remember-key">
          <input
            type="checkbox"
            checked={rememberKey}
            onChange={(event) => onRememberKeyChange(event.target.checked)}
          />
          <span>记住</span>
        </label>
        <button
          className="ai-scan-button"
          type="button"
          disabled={!canAnalyze}
          onClick={onAnalyze}
        >
          <Sparkles size={13} strokeWidth={1.8} />
          <span>{isRunning ? "扫描中" : hasAnnotations ? `已标注 ${annotationCount}` : "AI 扫描"}</span>
        </button>
        {hasAnnotations ? (
          <button className="ai-clear-button" type="button" title="清空 AI 标注" aria-label="清空 AI 标注" onClick={onClear}>
            <Trash2 size={13} strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
      {modelFetchStatus === "error" && modelFetchError ? (
        <AiErrorBlock message={modelFetchError} className="ai-model-fetch-error" />
      ) : null}
      {status === "error" && error ? (
        <AiErrorBlock message={error} className="ai-tree-error" />
      ) : null}
    </div>
  );
}

function AiLogoMark({ logo, className = "" }: { logo: AiLogoDescriptor; className?: string }) {
  const Icon = logo.Icon;
  return (
    <span
      className={`ai-logo-mark ai-logo-mark-${logo.surface ?? "plain"}${className ? ` ${className}` : ""}`}
      title={logo.title}
      aria-hidden="true"
      style={logo.color ? ({ color: logo.color } as CSSProperties) : undefined}
    >
      <Icon size={18} />
    </span>
  );
}

function DomTreeList({
  nodes,
  aiAnnotations,
  selectedId,
  onSelectElement,
  emptyText,
  compact = false,
}: {
  nodes: DomTreeNode[];
  aiAnnotations: Record<string, AiTreeAnnotation>;
  selectedId: string | null;
  onSelectElement: (hftId: string) => void;
  emptyText: string;
  compact?: boolean;
}) {
  const baseDepth = nodes[0]?.depth ?? 0;

  // 1. 算每个节点的直接子节点数,O(n)
  const childCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < nodes.length; i++) {
      const me = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j].depth <= me.depth) break;
        if (nodes[j].depth === me.depth + 1) {
          map.set(me.hftId, (map.get(me.hftId) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [nodes]);

  // 2. 默认折叠: depth > baseDepth + 1 的非叶子节点 (Task 7: 只展开顶层 2 层)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const init = new Set<string>();
    for (let i = 0; i < nodes.length; i++) {
      const me = nodes[i];
      const childCount = childCountMap.get(me.hftId) ?? 0;
      if (childCount > 0 && me.depth - baseDepth > 1) {
        init.add(me.hftId);
      }
    }
    return init;
  });

  const toggleCollapse = useCallback((hftId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(hftId)) next.delete(hftId);
      else next.add(hftId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);
  const collapseAll = useCallback(() => {
    const all = new Set<string>();
    for (const node of nodes) {
      if ((childCountMap.get(node.hftId) ?? 0) > 0) {
        all.add(node.hftId);
      }
    }
    setCollapsed(all);
  }, [nodes, childCountMap]);

  // 3. 一次 pass 算"实际需要渲染的节点列表" (跳过被折叠祖先挡住的)
  const visibleRows = useMemo(() => {
    type Row = {
      node: DomTreeNode;
      visibleDepth: number;
      hasChildren: boolean;
      isCollapsed: boolean;
      hiddenCount: number; // 如果是折叠根,显示"还有 N 个"
    };
    const rows: Row[] = [];
    const collapsedStack: DomTreeNode[] = [];
    const hiddenAccumulator: number[] = []; // 每个折叠根的"被隐藏后代数"

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // pop 掉比当前节点浅的栈
      while (
        collapsedStack.length > 0 &&
        collapsedStack[collapsedStack.length - 1].depth >= node.depth
      ) {
        const popped = collapsedStack.pop()!;
        // 把隐藏数绑回给该折叠根 (只会触发一次,在 pop 那个节点自身那行)
        const lastRow = rows[rows.length - 1];
        if (lastRow && lastRow.node.hftId === popped.hftId) {
          lastRow.hiddenCount = hiddenAccumulator.pop() ?? 0;
        }
      }

      // 当前是否在某个折叠子树内
      if (collapsedStack.length > 0) {
        // 累加到当前折叠根
        if (hiddenAccumulator.length > 0) hiddenAccumulator[hiddenAccumulator.length - 1]++;
        continue;
      }

      const visibleDepth = Math.min(
        Math.max(node.depth - baseDepth, 0),
        compact ? 3 : 8,
      );
      const childCount = childCountMap.get(node.hftId) ?? 0;
      const hasChildren = childCount > 0;
      const isCollapsed = collapsed.has(node.hftId);

      rows.push({ node, visibleDepth, hasChildren, isCollapsed, hiddenCount: 0 });

      if (isCollapsed) {
        collapsedStack.push(node);
        hiddenAccumulator.push(0);
      }
    }

    // 处理最后留在栈里的折叠根
    while (collapsedStack.length > 0) {
      const popped = collapsedStack.pop()!;
      const lastRow = rows[rows.length - 1];
      if (lastRow && lastRow.node.hftId === popped.hftId) {
        lastRow.hiddenCount = hiddenAccumulator.pop() ?? 0;
      } else {
        hiddenAccumulator.pop();
      }
    }

    return rows;
  }, [nodes, baseDepth, compact, collapsed, childCountMap]);

  return (
    <>
      <div className="dom-tree-toolbar" role="group" aria-label="树视图批量操作">
        <button type="button" className="ghost-button compact-action" onClick={expandAll}>全部展开</button>
        <button type="button" className="ghost-button compact-action" onClick={collapseAll}>全部折叠</button>
      </div>
      <div
        className={`dom-tree${compact ? " dom-tree-compact" : ""}`}
        role="tree"
        aria-label="可编辑元素结构"
      >
      {visibleRows.length === 0 ? (
        <div className="dom-tree-empty">{emptyText}</div>
      ) : (
        visibleRows.map(({ node, visibleDepth, hasChildren, isCollapsed, hiddenCount }) => {
          const annotation = aiAnnotations[node.hftId];
          const primaryLabel = annotation?.label || node.text || node.label;
          const issueLabel = annotation?.issues[0] ? issueText(annotation.issues[0]) : "";
          return (
            <div
              key={node.hftId}
              className={[
                "dom-tree-row",
                node.hftId === selectedId ? "dom-tree-row-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              role="treeitem"
              aria-selected={node.hftId === selectedId}
              aria-level={visibleDepth + 1}
              aria-expanded={hasChildren ? !isCollapsed : undefined}
              data-depth={visibleDepth}
              data-tag={node.tagName}
              style={{ "--tree-indent": `${visibleDepth * 16}px` } as CSSProperties}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="dom-tree-chevron"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(node.hftId);
                  }}
                  aria-label={isCollapsed ? "展开子元素" : "折叠子元素"}
                  title={isCollapsed ? `展开 (${hiddenCount} 个隐藏)` : "折叠"}
                >
                  {isCollapsed ? (
                    <ChevronRight size={12} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={12} strokeWidth={2} />
                  )}
                </button>
              ) : (
                <span className="dom-tree-chevron-placeholder" aria-hidden="true" />
              )}
              <button
                className={[
                  "dom-tree-node",
                  node.hftId === selectedId ? "dom-tree-node-active" : "",
                  annotation ? "dom-tree-node-ai" : "",
                  issueLabel ? "dom-tree-node-risk" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                title={annotation?.suggestion || annotation?.label || node.label}
                onClick={() => onSelectElement(node.hftId)}
              >
                <span className="dom-tree-tag">{node.tagName}</span>
                <span className="dom-tree-copy">
                  <span className="dom-tree-label">{primaryLabel}</span>
                  {annotation ? (
                    <span className="dom-tree-ai-line">
                      <Sparkles size={11} strokeWidth={1.8} />
                      <span>{annotation.role || "ai"}</span>
                      {issueLabel ? <em>{issueLabel}</em> : null}
                    </span>
                  ) : null}
                </span>
                {isCollapsed && hiddenCount > 0 ? (
                  <span className="dom-tree-collapsed-count">+{hiddenCount}</span>
                ) : null}
              </button>
            </div>
          );
        })
      )}
    </div>
    </>
  );
}

function issueText(issue: string): string {
  const labels: Record<string, string> = {
    "overlap-risk": "重叠",
    "overflow-risk": "溢出",
    "tiny-text": "过小",
    "image-ratio": "比例",
    "crowded-chart": "拥挤",
    decorative: "装饰",
  };
  return labels[issue] ?? issue;
}

interface ErrorDisplay {
  summary: string;
  detail: string;
}

/**
 * 错误信息用 "\n\n" 分隔首行(摘要)和后续 detail(URL、状态码、响应体)。
 * 让错误区可以"首行粗体 + 折叠显示原始响应"。
 */
function splitErrorMessage(message: string): ErrorDisplay {
  const separatorIndex = message.indexOf("\n\n");
  if (separatorIndex < 0) {
    return { summary: message.trim(), detail: "" };
  }
  return {
    summary: message.slice(0, separatorIndex).trim(),
    detail: message.slice(separatorIndex + 2).trim(),
  };
}

function AiErrorBlock({ message, className }: { message: string; className: string }) {
  const { summary, detail } = splitErrorMessage(message);
  return (
    <div className={className}>
      <strong>{summary}</strong>
      {detail ? (
        <details className="ai-error-details">
          <summary>显示原始响应</summary>
          <pre className="ai-error-detail">{detail}</pre>
        </details>
      ) : null}
    </div>
  );
}
