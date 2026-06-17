import { memo, useEffect, useMemo, useRef, useState } from "react";
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
        <button
          className="collapse-rail-button"
          type="button"
          onClick={onToggleCollapse}
          aria-label="展开 HTML 源码"
          title="展开 HTML 源码"
        >
          <PanelLeftOpen size={18} strokeWidth={1.75} />
          <span>展开源码</span>
        </button>
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
          <button
            className="icon-button"
            type="button"
            onClick={onTogglePlacement}
            aria-label={isBottomPlacement ? "将源码区移回左侧" : "将源码区移到底部"}
            title={isBottomPlacement ? "源码区移回左侧" : "源码区移到底部"}
          >
            {isBottomPlacement ? <PanelLeft size={18} strokeWidth={1.75} /> : <PanelBottom size={18} strokeWidth={1.75} />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onToggleCollapse}
            aria-label="收起 HTML 源码"
            title="收起 HTML 源码"
          >
            <PanelLeftClose size={18} strokeWidth={1.75} />
          </button>
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
      <button
        className={`ai-toolbar-trigger ai-toolbar-trigger-${status}${isOpen ? " ai-toolbar-trigger-open" : ""}`}
        type="button"
        aria-label="AI 结构扫描设置"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="AI 结构扫描"
        onClick={() => setIsOpen((value) => !value)}
      >
        <AiLogoMark className="ai-toolbar-logo" logo={modelLogo} />
        <span>{triggerLabel}</span>
      </button>
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
      {modelFetchStatus === "error" && modelFetchError ? <div className="ai-model-fetch-error">{modelFetchError}</div> : null}
      {status === "error" && error ? <div className="ai-tree-error">{error}</div> : null}
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

  return (
    <div className={`dom-tree${compact ? " dom-tree-compact" : ""}`} role="tree" aria-label="可编辑元素结构">
      {nodes.length === 0 ? (
        <div className="dom-tree-empty">{emptyText}</div>
      ) : (
        nodes.map((node) => {
          const visibleDepth = Math.min(Math.max(node.depth - baseDepth, 0), compact ? 3 : 8);
          const annotation = aiAnnotations[node.hftId];
          const primaryLabel = annotation?.label || node.text || node.label;
          const issueLabel = annotation?.issues[0] ? issueText(annotation.issues[0]) : "";
          return (
            <button
              key={node.hftId}
              className={[
                "dom-tree-node",
                node.hftId === selectedId ? "dom-tree-node-active" : "",
                annotation ? "dom-tree-node-ai" : "",
                issueLabel ? "dom-tree-node-risk" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              role="treeitem"
              aria-selected={node.hftId === selectedId}
              aria-level={visibleDepth + 1}
              data-depth={visibleDepth}
              style={{ "--tree-indent": `${visibleDepth * 12}px` } as CSSProperties}
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
            </button>
          );
        })
      )}
    </div>
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
