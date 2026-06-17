import type { AiTreeAnnotation, DomTreeNode } from "../types/editor";
import { HFT_ID_ATTRIBUTE } from "./editableElement";
import { parseHtmlReadOnly } from "./injectEditableIds";
import { normalizeText, truncate } from "./string";

export type AiProviderId =
  | "google"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "qwen"
  | "kimi"
  | "zhipu"
  | "volcengine"
  | "qianfan"
  | "minimax"
  | "mistral"
  | "xai"
  | "groq"
  | "together"
  | "openrouter"
  | "siliconflow";

type ProviderProtocol = "gemini" | "openai-responses" | "openai-chat" | "anthropic-messages";
export type AiModelFetchStatus = "idle" | "loading" | "ready" | "error";

export interface AiModelOption {
  value: string;
  label: string;
  source: "preset" | "remote";
  contextLength?: number;
  ownedBy?: string;
}

export interface AiProviderDefinition {
  id: AiProviderId;
  label: string;
  shortLabel: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  keyPlaceholder: string;
  defaultModel: string;
  models: Array<{ value: string; label: string }>;
}

export const AI_PROVIDER_DEFINITIONS: AiProviderDefinition[] = [
  {
    id: "google",
    label: "Google AI Studio",
    shortLabel: "Google",
    protocol: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    keyPlaceholder: "Google AI Studio Key",
    defaultModel: "gemma-4-26b-a4b-it",
    models: [
      { value: "gemma-4-26b-a4b-it", label: "Gemma 4 26B A4B" },
      { value: "gemma-4-31b-it", label: "Gemma 4 31B" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    shortLabel: "OpenAI",
    protocol: "openai-responses",
    baseUrl: "https://api.openai.com/v1",
    keyPlaceholder: "OpenAI API Key",
    defaultModel: "gpt-4.1-mini",
    models: [
      { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { value: "gpt-4.1", label: "GPT-4.1" },
      { value: "gpt-4o-mini", label: "GPT-4o mini" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    shortLabel: "Claude",
    protocol: "anthropic-messages",
    baseUrl: "https://api.anthropic.com/v1",
    keyPlaceholder: "Anthropic API Key",
    defaultModel: "claude-sonnet-4-5",
    models: [
      { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { value: "claude-opus-4-1", label: "Claude Opus 4.1" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    shortLabel: "DeepSeek",
    protocol: "openai-chat",
    baseUrl: "https://api.deepseek.com/v1",
    keyPlaceholder: "DeepSeek API Key",
    defaultModel: "deepseek-chat",
    models: [
      { value: "deepseek-chat", label: "DeepSeek Chat" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
    ],
  },
  {
    id: "qwen",
    label: "阿里云 Qwen",
    shortLabel: "Qwen",
    protocol: "openai-chat",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    keyPlaceholder: "DashScope API Key",
    defaultModel: "qwen-plus",
    models: [
      { value: "qwen-plus", label: "Qwen Plus" },
      { value: "qwen-turbo", label: "Qwen Turbo" },
      { value: "qwen-max", label: "Qwen Max" },
    ],
  },
  {
    id: "kimi",
    label: "Moonshot Kimi",
    shortLabel: "Kimi",
    protocol: "openai-chat",
    baseUrl: "https://api.moonshot.ai/v1",
    keyPlaceholder: "Moonshot API Key",
    defaultModel: "kimi-latest",
    models: [
      { value: "kimi-latest", label: "Kimi Latest" },
      { value: "moonshot-v1-8k", label: "Moonshot v1 8K" },
      { value: "moonshot-v1-32k", label: "Moonshot v1 32K" },
    ],
  },
  {
    id: "zhipu",
    label: "智谱 GLM / Z.AI",
    shortLabel: "GLM",
    protocol: "openai-chat",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    keyPlaceholder: "Zhipu / Z.AI API Key",
    defaultModel: "glm-4.5",
    models: [
      { value: "glm-4.5", label: "GLM-4.5" },
      { value: "glm-4.5-air", label: "GLM-4.5 Air" },
      { value: "glm-4.6", label: "GLM-4.6" },
    ],
  },
  {
    id: "volcengine",
    label: "火山方舟 / 豆包",
    shortLabel: "豆包",
    protocol: "openai-chat",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    keyPlaceholder: "Volcengine Ark API Key",
    defaultModel: "doubao-seed-2-0-pro-260215",
    models: [
      { value: "doubao-seed-2-0-pro-260215", label: "Doubao Seed 2.0 Pro" },
      { value: "doubao-1-5-pro-32k-250115", label: "Doubao 1.5 Pro 32K" },
      { value: "doubao-seed-1-8", label: "Doubao Seed 1.8" },
    ],
  },
  {
    id: "qianfan",
    label: "百度千帆",
    shortLabel: "千帆",
    protocol: "openai-chat",
    baseUrl: "https://qianfan.baidubce.com/v2",
    keyPlaceholder: "Qianfan API Key",
    defaultModel: "ernie-4.5-turbo-128k",
    models: [
      { value: "ernie-4.5-turbo-128k", label: "ERNIE 4.5 Turbo 128K" },
      { value: "ernie-4.5-turbo-32k", label: "ERNIE 4.5 Turbo 32K" },
      { value: "ernie-x1-turbo-32k", label: "ERNIE X1 Turbo 32K" },
    ],
  },
  {
    id: "minimax",
    label: "MiniMax",
    shortLabel: "MiniMax",
    protocol: "openai-chat",
    baseUrl: "https://api.minimax.io/v1",
    keyPlaceholder: "MiniMax API Key",
    defaultModel: "MiniMax-M3",
    models: [
      { value: "MiniMax-M3", label: "MiniMax M3" },
      { value: "MiniMax-M2.5", label: "MiniMax M2.5" },
      { value: "MiniMax-M1", label: "MiniMax M1" },
    ],
  },
  {
    id: "mistral",
    label: "Mistral AI",
    shortLabel: "Mistral",
    protocol: "openai-chat",
    baseUrl: "https://api.mistral.ai/v1",
    keyPlaceholder: "Mistral API Key",
    defaultModel: "mistral-large-latest",
    models: [
      { value: "mistral-large-latest", label: "Mistral Large" },
      { value: "mistral-medium-latest", label: "Mistral Medium" },
      { value: "ministral-8b-latest", label: "Ministral 8B" },
    ],
  },
  {
    id: "xai",
    label: "xAI Grok",
    shortLabel: "xAI",
    protocol: "openai-chat",
    baseUrl: "https://api.x.ai/v1",
    keyPlaceholder: "xAI API Key",
    defaultModel: "grok-4.3",
    models: [
      { value: "grok-4.3", label: "Grok 4.3" },
      { value: "grok-4", label: "Grok 4" },
      { value: "grok-3-mini", label: "Grok 3 Mini" },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    shortLabel: "Groq",
    protocol: "openai-chat",
    baseUrl: "https://api.groq.com/openai/v1",
    keyPlaceholder: "Groq API Key",
    defaultModel: "openai/gpt-oss-20b",
    models: [
      { value: "openai/gpt-oss-20b", label: "GPT OSS 20B" },
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "moonshotai/kimi-k2-instruct", label: "Kimi K2" },
    ],
  },
  {
    id: "together",
    label: "Together AI",
    shortLabel: "Together",
    protocol: "openai-chat",
    baseUrl: "https://api.together.ai/v1",
    keyPlaceholder: "Together API Key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: [
      { value: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B" },
      { value: "Qwen/Qwen3-235B-A22B-fp8-tput", label: "Qwen3 235B" },
      { value: "deepseek-ai/DeepSeek-V3.1", label: "DeepSeek V3.1" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    shortLabel: "OpenRouter",
    protocol: "openai-chat",
    baseUrl: "https://openrouter.ai/api/v1",
    keyPlaceholder: "OpenRouter API Key",
    defaultModel: "google/gemini-2.5-flash",
    models: [
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
      { value: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
    ],
  },
  {
    id: "siliconflow",
    label: "硅基流动",
    shortLabel: "SiliconFlow",
    protocol: "openai-chat",
    baseUrl: "https://api.siliconflow.cn/v1",
    keyPlaceholder: "SiliconFlow API Key",
    defaultModel: "Qwen/Qwen3-32B",
    models: [
      { value: "Qwen/Qwen3-32B", label: "Qwen3 32B" },
      { value: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3" },
      { value: "Pro/zai-org/GLM-4.7", label: "GLM-4.7 Pro" },
    ],
  },
];

export const AI_PROVIDER_MAP = Object.fromEntries(
  AI_PROVIDER_DEFINITIONS.map((provider) => [provider.id, provider])
) as Record<AiProviderId, AiProviderDefinition>;

const DEFAULT_MAX_NODES = 420;
const MAX_TEXT_LENGTH = 140;
const AI_REQUEST_TIMEOUT_MS = 120000;

interface AnalyzeStructureWithAiOptions {
  providerId: AiProviderId;
  apiKey: string;
  model: string;
  html: string;
  domTree: DomTreeNode[];
}

interface AiStructureNode {
  hftId: string;
  tagName: string;
  text: string;
  label: string;
  roleHint: string;
  depth: number;
  slide: string;
  className: string;
  id: string;
}

interface AiStructurePayload {
  totalNodes: number;
  includedNodes: number;
  nodes: AiStructureNode[];
}

interface RawAiAnnotation {
  hftId?: unknown;
  label?: unknown;
  role?: unknown;
  issues?: unknown;
  suggestion?: unknown;
  confidence?: unknown;
}

interface RawAiResponse {
  annotations?: RawAiAnnotation[];
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface OpenAiResponsesResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface AnthropicMessagesResponse {
  content?: Array<{
    text?: string;
    type?: string;
  }>;
  error?: {
    message?: string;
  };
}

interface RawModelListResponse {
  data?: RawProviderModel[];
  models?: RawProviderModel[];
  error?: {
    message?: string;
  };
}

interface RawProviderModel {
  id?: unknown;
  name?: unknown;
  displayName?: unknown;
  display_name?: unknown;
  description?: unknown;
  object?: unknown;
  owned_by?: unknown;
  ownedBy?: unknown;
  context_length?: unknown;
  inputTokenLimit?: unknown;
  supportedGenerationMethods?: unknown;
  supportedActions?: unknown;
  architecture?: {
    input_modalities?: unknown;
    output_modalities?: unknown;
    modality?: unknown;
  };
}

export async function analyzeStructureWithAi({
  providerId,
  apiKey,
  model,
  html,
  domTree,
}: AnalyzeStructureWithAiOptions): Promise<AiTreeAnnotation[]> {
  const provider = AI_PROVIDER_MAP[providerId];
  const trimmedKey = apiKey.trim();
  const trimmedModel = model.trim();
  if (!provider) throw new Error("请选择模型厂商");
  if (!trimmedKey) throw new Error(`请先填写 ${provider.keyPlaceholder}`);
  if (!trimmedModel) throw new Error("请选择或输入模型名称");

  const payload = buildAiStructurePayload(html, domTree);
  if (payload.nodes.length === 0) throw new Error("结构树为空，无法扫描");

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const text = await requestAiText({
      provider,
      apiKey: trimmedKey,
      model: trimmedModel,
      payload,
      signal: controller.signal,
    });
    return normalizeAiStructureResponse(text, new Set(payload.nodes.map((node) => node.hftId)));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${provider.shortLabel} 扫描超过 2 分钟，请换轻量模型或减少页面内容后重试`);
    }
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      throw new Error(`${provider.shortLabel} 请求失败：该厂商可能不允许 GitHub Pages 直接跨域调用，可改用 OpenRouter 或本地代理`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchAiModelOptions({
  providerId,
  apiKey,
  signal,
}: {
  providerId: AiProviderId;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<AiModelOption[]> {
  const provider = AI_PROVIDER_MAP[providerId];
  const trimmedKey = apiKey.trim();
  if (!provider) throw new Error("请选择模型厂商");
  if (!trimmedKey) throw new Error(`请先填写 ${provider.keyPlaceholder}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 20000);
  const handleAbort = () => controller.abort();
  signal?.addEventListener("abort", handleAbort, { once: true });

  try {
    const response = await fetch(getModelListUrl(provider, trimmedKey), {
      method: "GET",
      signal: controller.signal,
      headers: getModelListHeaders(provider, trimmedKey),
    });
    const data = (await response.json()) as RawModelListResponse;
    if (!response.ok) throw new Error(data.error?.message || `${provider.shortLabel} 模型列表获取失败`);

    const models = normalizeAiModelOptions(provider, data);
    if (models.length === 0) throw new Error(`${provider.shortLabel} 没有返回可用文本模型`);
    return models;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${provider.shortLabel} 模型列表获取超时，可稍后重试或手动输入模型名`);
    }
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      throw new Error(`${provider.shortLabel} 模型列表请求失败：浏览器可能被跨域限制，可手动输入模型名`);
    }
    throw error;
  } finally {
    signal?.removeEventListener("abort", handleAbort);
    window.clearTimeout(timeoutId);
  }
}

export function buildPresetAiModelOptions(provider: AiProviderDefinition): AiModelOption[] {
  return provider.models.map((model) => ({
    value: model.value,
    label: model.label,
    source: "preset",
  }));
}

export function mergeAiModelOptions(remoteOptions: AiModelOption[], presetOptions: AiModelOption[]): AiModelOption[] {
  const byValue = new Map<string, AiModelOption>();
  [...remoteOptions, ...presetOptions].forEach((option) => {
    const key = option.value.trim();
    if (!key || byValue.has(key)) return;
    byValue.set(key, option);
  });
  return Array.from(byValue.values()).slice(0, 300);
}

export function normalizeAiModelOptions(provider: AiProviderDefinition, data: RawModelListResponse): AiModelOption[] {
  const rawModels = Array.isArray(data.models) ? data.models : Array.isArray(data.data) ? data.data : [];
  const options = rawModels.flatMap((item): AiModelOption[] => {
    const modelId = getModelId(provider, item);
    if (!modelId || !isLikelyChatModel(item, modelId)) return [];
    const label = getModelLabel(item, modelId);
    return [
      {
        value: modelId,
        label,
        source: "remote",
        contextLength: getNumber(item.context_length) || getNumber(item.inputTokenLimit) || undefined,
        ownedBy: getString(item.owned_by) || getString(item.ownedBy) || undefined,
      },
    ];
  });

  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

export function getAiProviderIcon(providerId: AiProviderId) {
  switch (providerId) {
    case "google":
      return { label: "G", tone: "google", title: "Google AI Studio" };
    case "openai":
      return { label: "◎", tone: "openai", title: "OpenAI" };
    case "anthropic":
      return { label: "✦", tone: "claude", title: "Anthropic Claude" };
    case "deepseek":
      return { label: "DS", tone: "deepseek", title: "DeepSeek" };
    case "qwen":
      return { label: "Q", tone: "qwen", title: "Qwen" };
    case "kimi":
      return { label: "K", tone: "kimi", title: "Kimi" };
    case "zhipu":
      return { label: "GLM", tone: "glm", title: "智谱 GLM" };
    case "volcengine":
      return { label: "豆", tone: "doubao", title: "豆包" };
    case "qianfan":
      return { label: "千", tone: "ernie", title: "百度千帆" };
    case "minimax":
      return { label: "MM", tone: "minimax", title: "MiniMax" };
    case "mistral":
      return { label: "M", tone: "mistral", title: "Mistral AI" };
    case "xai":
      return { label: "x", tone: "xai", title: "xAI Grok" };
    case "groq":
      return { label: "GQ", tone: "groq", title: "Groq" };
    case "together":
      return { label: "T", tone: "together", title: "Together AI" };
    case "openrouter":
      return { label: "OR", tone: "openrouter", title: "OpenRouter" };
    case "siliconflow":
      return { label: "SF", tone: "siliconflow", title: "SiliconFlow" };
    default:
      return { label: "AI", tone: "generic", title: "AI provider" };
  }
}

function getModelListUrl(provider: AiProviderDefinition, apiKey: string): string {
  if (provider.protocol === "gemini") {
    const params = new URLSearchParams({
      key: apiKey,
      pageSize: "1000",
    });
    return `${provider.baseUrl}?${params.toString()}`;
  }
  if (provider.id === "openrouter") {
    const params = new URLSearchParams({
      output_modalities: "text",
      sort: "most-popular",
    });
    return `${provider.baseUrl}/models?${params.toString()}`;
  }
  if (provider.id === "siliconflow") {
    const params = new URLSearchParams({
      type: "text",
      sub_type: "chat",
    });
    return `${provider.baseUrl}/models?${params.toString()}`;
  }
  return `${provider.baseUrl}/models`;
}

function getModelListHeaders(provider: AiProviderDefinition, apiKey: string): Record<string, string> {
  if (provider.protocol === "gemini") return {};
  if (provider.protocol === "anthropic-messages") {
    return {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider.id === "openrouter") {
    headers["X-Title"] = "HTML FineTune";
  }
  return headers;
}

function getModelId(provider: AiProviderDefinition, item: RawProviderModel): string {
  const rawId = getString(item.id) || getString(item.name);
  if (!rawId) return "";
  if (provider.protocol === "gemini" && rawId.startsWith("models/")) return rawId.slice("models/".length);
  return rawId;
}

function getModelLabel(item: RawProviderModel, modelId: string): string {
  return getString(item.displayName) || getString(item.display_name) || getString(item.name) || modelId;
}

function isLikelyChatModel(item: RawProviderModel, modelId: string): boolean {
  const supportedGenerationMethods = toStringArray(item.supportedGenerationMethods);
  if (supportedGenerationMethods.length > 0 && !supportedGenerationMethods.includes("generateContent")) return false;

  const supportedActions = toStringArray(item.supportedActions);
  if (supportedActions.length > 0 && !supportedActions.includes("generateContent")) return false;

  const outputModalities = toStringArray(item.architecture?.output_modalities);
  if (outputModalities.length > 0 && !outputModalities.includes("text")) return false;

  const inputModalities = toStringArray(item.architecture?.input_modalities);
  if (inputModalities.length > 0 && !inputModalities.includes("text")) return false;

  const modality = getString(item.architecture?.modality).toLowerCase();
  if (modality && !modality.includes("text")) return false;

  const lowerId = modelId.toLowerCase();
  return !/(embedding|embed|rerank|whisper|tts|speech|moderation|image-|imagen|video|audio)/i.test(lowerId);
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

export function buildAiStructurePayload(
  html: string,
  domTree: DomTreeNode[],
  maxNodes = DEFAULT_MAX_NODES
): AiStructurePayload {
  const documentRef = parseHtmlReadOnly(html);
  const slideIndexByElement = getSlideIndexByElement(documentRef);
  const nodes = domTree.slice(0, maxNodes).map((node) => {
    const element = documentRef.querySelector(`[${HFT_ID_ATTRIBUTE}="${cssEscape(node.hftId)}"]`);
    const slide = element ? describeContainingSlide(element, slideIndexByElement) : "";
    return {
      hftId: node.hftId,
      tagName: node.tagName,
      text: truncate(normalizeText(node.text), MAX_TEXT_LENGTH),
      label: truncate(normalizeText(node.label), MAX_TEXT_LENGTH),
      roleHint: inferRoleHint(node),
      depth: node.depth,
      slide,
      className: truncate(node.className, 80),
      id: truncate(node.id, 80),
    };
  });

  return {
    totalNodes: domTree.length,
    includedNodes: nodes.length,
    nodes,
  };
}

export function normalizeAiStructureResponse(text: string, allowedIds: Set<string>): AiTreeAnnotation[] {
  const parsed = parseJsonObject(text) as RawAiResponse;
  const annotations = Array.isArray(parsed.annotations) ? parsed.annotations : [];
  const seen = new Set<string>();

  return annotations.flatMap((item) => {
    const hftId = typeof item.hftId === "string" ? item.hftId.trim() : "";
    if (!hftId || !allowedIds.has(hftId) || seen.has(hftId)) return [];
    seen.add(hftId);

    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!label) return [];

    return [
      {
        hftId,
        label: truncate(label, 72),
        role: truncate(typeof item.role === "string" ? item.role.trim() : "unknown", 32),
        issues: normalizeIssues(item.issues),
        suggestion: truncate(typeof item.suggestion === "string" ? item.suggestion.trim() : "", 96),
        confidence: normalizeConfidence(item.confidence),
      },
    ];
  });
}

function requestAiText({
  provider,
  apiKey,
  model,
  payload,
  signal,
}: {
  provider: AiProviderDefinition;
  apiKey: string;
  model: string;
  payload: AiStructurePayload;
  signal: AbortSignal;
}): Promise<string> {
  if (provider.protocol === "gemini") {
    return requestGeminiText({ provider, apiKey, model, payload, signal });
  }
  if (provider.protocol === "openai-responses") {
    return requestOpenAiResponsesText({ provider, apiKey, model, payload, signal });
  }
  if (provider.protocol === "anthropic-messages") {
    return requestAnthropicMessagesText({ provider, apiKey, model, payload, signal });
  }
  return requestOpenAiChatText({ provider, apiKey, model, payload, signal });
}

async function requestGeminiText({
  provider,
  apiKey,
  model,
  payload,
  signal,
}: {
  provider: AiProviderDefinition;
  apiKey: string;
  model: string;
  payload: AiStructurePayload;
  signal: AbortSignal;
}): Promise<string> {
  const response = await fetch(`${provider.baseUrl}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: createSystemInstruction() }],
      },
      contents: [
        {
          parts: [{ text: createUserPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }),
  });

  const data = (await response.json()) as GeminiGenerateContentResponse;
  if (!response.ok) throw new Error(data.error?.message || `${provider.shortLabel} 请求失败`);
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
  if (!text) throw new Error(`${provider.shortLabel} 没有返回可解析结果`);
  return text;
}

async function requestOpenAiResponsesText({
  provider,
  apiKey,
  model,
  payload,
  signal,
}: {
  provider: AiProviderDefinition;
  apiKey: string;
  model: string;
  payload: AiStructurePayload;
  signal: AbortSignal;
}): Promise<string> {
  const response = await fetch(`${provider.baseUrl}/responses`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: createSystemInstruction(),
      input: createUserPrompt(payload),
      temperature: 0.2,
      max_output_tokens: 4096,
    }),
  });

  const data = (await response.json()) as OpenAiResponsesResponse;
  if (!response.ok) throw new Error(data.error?.message || `${provider.shortLabel} 请求失败`);
  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n")
      .trim();
  if (!text) throw new Error(`${provider.shortLabel} 没有返回可解析结果`);
  return text;
}

async function requestOpenAiChatText({
  provider,
  apiKey,
  model,
  payload,
  signal,
}: {
  provider: AiProviderDefinition;
  apiKey: string;
  model: string;
  payload: AiStructurePayload;
  signal: AbortSignal;
}): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider.id === "openrouter") {
    headers["X-Title"] = "HTML FineTune";
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: createSystemInstruction() },
        { role: "user", content: createUserPrompt(payload) },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      stream: false,
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) throw new Error(data.error?.message || `${provider.shortLabel} 请求失败`);
  const content = data.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map((part) => part.text || "").join("\n").trim() : content?.trim();
  if (!text) throw new Error(`${provider.shortLabel} 没有返回可解析结果`);
  return text;
}

async function requestAnthropicMessagesText({
  provider,
  apiKey,
  model,
  payload,
  signal,
}: {
  provider: AiProviderDefinition;
  apiKey: string;
  model: string;
  payload: AiStructurePayload;
  signal: AbortSignal;
}): Promise<string> {
  const response = await fetch(`${provider.baseUrl}/messages`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: createSystemInstruction(),
      messages: [{ role: "user", content: createUserPrompt(payload) }],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  const data = (await response.json()) as AnthropicMessagesResponse;
  if (!response.ok) throw new Error(data.error?.message || `${provider.shortLabel} 请求失败`);
  const text = data.content?.map((part) => part.text || "").join("\n").trim();
  if (!text) throw new Error(`${provider.shortLabel} 没有返回可解析结果`);
  return text;
}

function createSystemInstruction(): string {
  return [
    "You are an AI assistant embedded in HTML FineTune, a visual HTML editor.",
    "Analyze editable DOM tree nodes for a structure panel.",
    "Return JSON only. Do not include markdown.",
    "Use only hftId values from the provided input.",
    "Keep labels short and useful for designers editing imported HTML slides.",
    "Mark likely layout risks such as overlap-risk, overflow-risk, tiny-text, image-ratio, crowded-chart, or decorative.",
  ].join("\n");
}

function createUserPrompt(payload: AiStructurePayload): string {
  return JSON.stringify({
    task:
      "Create semantic labels and layout risk markers for this editable HTML structure tree. Return { annotations: [...] }.",
    outputSchema: {
      annotations: [
        {
          hftId: "existing id only",
          label: "short Chinese label for the structure tree",
          role: "heading | body | chart-value | chart-label | image | source | button | decorative | unknown",
          issues: ["optional issue ids"],
          suggestion: "optional short Chinese repair hint",
          confidence: 0.0,
        },
      ],
    },
    input: payload,
  });
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1));
    }
    throw new Error("AI 返回格式不是 JSON");
  }
}

function normalizeIssues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const issues = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
  return Array.from(new Set(issues));
}

function normalizeConfidence(value: unknown): number {
  const confidence = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(confidence)) return 0.65;
  return Math.max(0, Math.min(1, confidence));
}

function inferRoleHint(node: DomTreeNode): string {
  if (/^h[1-6]$/.test(node.tagName)) return "heading";
  if (node.tagName === "img" || node.tagName === "image") return "image";
  if (node.tagName === "button" || node.tagName === "a") return "action";
  if (node.tagName === "text" && /%|\d/.test(node.text)) return "chart-value";
  if (node.tagName === "text") return "chart-label";
  if (/source|来源|参考/i.test(node.text)) return "source";
  return "body";
}

function getSlideIndexByElement(documentRef: Document): Map<Element, number> {
  const slideIndexByElement = new Map<Element, number>();
  const slides = Array.from(
    documentRef.querySelectorAll(".slide, [data-slide], section[id^='slide-'], article[id^='slide-']")
  );
  slides.forEach((slide, index) => slideIndexByElement.set(slide, index + 1));
  return slideIndexByElement;
}

function describeContainingSlide(element: Element, slideIndexByElement: Map<Element, number>): string {
  const slide = element.closest(".slide, [data-slide], section[id^='slide-'], article[id^='slide-']");
  if (!slide) return "";
  const dataSlide = slide.getAttribute("data-slide");
  if (dataSlide) return `第 ${dataSlide} 页`;
  const index = slideIndexByElement.get(slide);
  return index ? `第 ${index} 页` : "";
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}
