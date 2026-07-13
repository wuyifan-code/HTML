import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import ClaudeLogo from "@lobehub/icons/es/Claude/components/Color";
import DeepSeekLogo from "@lobehub/icons/es/DeepSeek/components/Color";
import DoubaoLogo from "@lobehub/icons/es/Doubao/components/Color";
import GeminiLogo from "@lobehub/icons/es/Gemini/components/Color";
import GrokLogo from "@lobehub/icons/es/Grok/components/Mono";
import GroqLogo from "@lobehub/icons/es/Groq/components/Mono";
import KimiLogo from "@lobehub/icons/es/Kimi/components/Mono";
import MinimaxLogo from "@lobehub/icons/es/Minimax/components/Color";
import MistralLogo from "@lobehub/icons/es/Mistral/components/Color";
import OpenAILogo from "@lobehub/icons/es/OpenAI/components/Mono";
import OpenRouterLogo from "@lobehub/icons/es/OpenRouter/components/Mono";
import QwenLogo from "@lobehub/icons/es/Qwen/components/Color";
import SiliconCloudLogo from "@lobehub/icons/es/SiliconCloud/components/Color";
import TogetherLogo from "@lobehub/icons/es/Together/components/Color";
import WenxinLogo from "@lobehub/icons/es/Wenxin/components/Color";
import ZhipuLogo from "@lobehub/icons/es/Zhipu/components/Color";

import { IconChevronDown } from "./Icons";
import type { AiProviderDefinition, AiProviderId } from "../utils/aiStructure";

type AiLogoDescriptor = {
  Icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  surface?: "plain" | "light";
  color?: string;
};

export const AI_PROVIDER_LOGOS: Record<AiProviderId, AiLogoDescriptor> = {
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

export function getProviderLogo(providerId: AiProviderId): AiLogoDescriptor {
  return AI_PROVIDER_LOGOS[providerId];
}

export function AiLogoMark({ logo, className = "" }: { logo: AiLogoDescriptor; className?: string }) {
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

export function AiProviderPicker({
  provider,
  providers,
  onProviderChange,
}: {
  provider: AiProviderId;
  providers: AiProviderDefinition[];
  onProviderChange: (value: AiProviderId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedProvider = providers.find((item) => item.id === provider) ?? providers[0];
  const providerGroups = [
    { label: "本地 / 聚合", ids: ["openrouter", "siliconflow", "groq", "together"] },
    { label: "国内云服务", ids: ["deepseek", "qwen", "kimi", "zhipu", "volcengine", "qianfan", "minimax"] },
    { label: "海外云服务", ids: ["google", "openai", "anthropic", "mistral", "xai"] },
  ] as const;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setIsOpen(false);
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
    <div className="ai-provider-picker" ref={pickerRef}>
      <button
        className="ai-provider-trigger"
        type="button"
        aria-label="AI provider"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <AiLogoMark logo={getProviderLogo(selectedProvider.id)} />
        <span>{selectedProvider.label}</span>
        <IconChevronDown />
      </button>
      {isOpen ? (
        <div className="ai-provider-menu" role="listbox" aria-label="AI provider list">
          {providerGroups.map((group) => {
            const groupProviders = group.ids
              .map((id) => providers.find((item) => item.id === id))
              .filter((item): item is AiProviderDefinition => Boolean(item));
            if (groupProviders.length === 0) return null;
            return (
              <div className="ai-provider-group" key={group.label} role="group" aria-label={group.label}>
                <div className="ai-provider-group-label">{group.label}</div>
                {groupProviders.map((item) => {
            const isSelected = item.id === provider;
            return (
              <button
                key={item.id}
                className={`ai-provider-option${isSelected ? " ai-provider-option-active" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setIsOpen(false);
                  onProviderChange(item.id);
                }}
              >
                <AiLogoMark logo={getProviderLogo(item.id)} />
                <span className="ai-provider-option-text">
                  <span className="ai-provider-option-name">{item.shortLabel}</span>
                  <span className="ai-provider-option-detail">{item.label}</span>
                </span>
                {isSelected ? (
                  <span className="ai-provider-check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            );
                })}
              </div>
            );
          })}
          {providers.some((item) => !providerGroups.some((group) => group.ids.includes(item.id as never))) ? (
            <div className="ai-provider-group" role="group" aria-label="其他服务">
              <div className="ai-provider-group-label">其他服务</div>
              {providers.filter((item) => !providerGroups.some((group) => group.ids.includes(item.id as never))).map((item) => {
                const isSelected = item.id === provider;
                return (
                  <button key={item.id} className={`ai-provider-option${isSelected ? " ai-provider-option-active" : ""}`} type="button" role="option" aria-selected={isSelected} onClick={() => { setIsOpen(false); onProviderChange(item.id); }}>
                    <AiLogoMark logo={getProviderLogo(item.id)} />
                    <span className="ai-provider-option-text"><span className="ai-provider-option-name">{item.shortLabel}</span><span className="ai-provider-option-detail">{item.label}</span></span>
                    {isSelected ? <span className="ai-provider-check" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
