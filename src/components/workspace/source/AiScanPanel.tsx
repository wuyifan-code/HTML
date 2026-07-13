import { IconChevronDown, IconScan, IconSparkles } from "../../Icons";
import { AiProviderPicker } from "../../AiProviderPicker";
import type {
  AiModelFetchStatus,
  AiModelOption,
  AiProviderDefinition,
  AiProviderId,
} from "../../../utils/aiStructure";

interface AiScanPanelProps {
  provider: AiProviderId;
  providers: AiProviderDefinition[];
  onProviderChange: (provider: AiProviderId) => void;
  apiKey: string;
  keyPlaceholder: string;
  onApiKeyChange: (value: string) => void;
  rememberKey: boolean;
  onRememberKeyChange: (value: boolean) => void;
  model: string;
  models: AiModelOption[];
  onModelChange: (value: string) => void;
  modelFetchStatus: AiModelFetchStatus;
  modelFetchError: string;
  onRefreshModels: () => void;
  status: "idle" | "running" | "ready" | "error";
  errorMessage: string;
  annotationCount: number;
  onScan: () => void;
  onClear: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AiScanPanel({
  provider,
  providers,
  onProviderChange,
  apiKey,
  keyPlaceholder,
  onApiKeyChange,
  rememberKey,
  onRememberKeyChange,
  model,
  models,
  onModelChange,
  modelFetchStatus,
  modelFetchError,
  onRefreshModels,
  status,
  errorMessage,
  annotationCount,
  onScan,
  onClear,
  isCollapsed,
  onToggleCollapsed,
}: AiScanPanelProps) {
  return (
    <div className="ai-tab-panel">
      <div className="ai-scan-card">
        <button
          className={`ai-scan-card__head${isCollapsed ? " is-collapsed" : ""}`}
          type="button"
          aria-expanded={!isCollapsed}
          onClick={onToggleCollapsed}
        >
          <span className="chev"><IconChevronDown /></span>
          <span className="sparkle"><IconSparkles /></span>
          <span className="ai-scan-card__title">AI 结构扫描</span>
          <span className="ai-scan-card__count">
            <span className="dot" aria-hidden="true" />
            {annotationCount} 个标注
          </span>
        </button>

         {!isCollapsed ? (
           <div className="ai-scan-card__body">
             <p className="ai-scan-security-note" role="note">
               API Key 只用于当前浏览器请求。勾选“记住”后会明文保存在本机 localStorage，请勿在共享设备使用。
             </p>
             <div className="ai-scan-row">
              <label htmlFor="aiProvider">厂商</label>
              <AiProviderPicker
                provider={provider}
                providers={providers}
                onProviderChange={onProviderChange}
              />
            </div>

            <div className="ai-scan-row">
              <label htmlFor="aiApiKey">Key</label>
              <div className="ds-input">
                <input
                  id="aiApiKey"
                  type="password"
                  value={apiKey}
                  placeholder={keyPlaceholder}
                  onChange={(event) => onApiKeyChange(event.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <label className="ai-scan-remember">
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(event) => onRememberKeyChange(event.target.checked)}
              />
              <span>记住此 Key（仅保存在本机）</span>
            </label>

            <div className="ai-scan-row">
              <label htmlFor="aiModel">模型</label>
              <div className="ds-input ai-model-input">
                <input
                  id="aiModel"
                  value={model}
                  list="aiModelPresets"
                  onChange={(event) => onModelChange(event.target.value)}
                />
                <datalist id="aiModelPresets">
                  {models.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </datalist>
                {modelFetchStatus === "loading" ? (
                  <span className="ai-scan-loading" aria-live="polite" title="正在获取模型列表">
                    <span className="spinner" aria-hidden="true" />
                  </span>
                ) : modelFetchStatus === "ready" ? (
                  <span className="ai-scan-ok" aria-live="polite" title={`已加载 ${models.length} 个模型`}>✓</span>
                ) : null}
              </div>
            </div>

            <div className="ai-scan-model-footer">
              <span>
                {modelFetchStatus === "loading"
                  ? "正在获取模型…"
                  : modelFetchStatus === "ready"
                    ? `已加载 ${models.length} 个模型`
                    : modelFetchStatus === "error"
                      ? modelFetchError || "模型列表获取失败"
                      : "可使用预设模型"}
              </span>
              <button type="button" onClick={onRefreshModels} disabled={modelFetchStatus === "loading"}>
                刷新模型
              </button>
            </div>

            <div className="ai-scan-actions">
              <button
                className="ds-btn ds-btn--ghost ds-btn--sm"
                type="button"
                onClick={onClear}
                disabled={annotationCount === 0 || status === "running"}
              >清空标注</button>
              <button
                className="ds-btn ds-btn--brand ds-btn--sm"
                type="button"
                onClick={onScan}
                disabled={status === "running"}
              >
                <IconScan />
                <span>{status === "running" ? "扫描中" : "开始扫描"}</span>
              </button>
            </div>
            {errorMessage ? (
              <p className="meta ai-error" tabIndex={0} title={errorMessage} role="status">
                {errorMessage}
              </p>
            ) : null}
            {status === "ready" ? (
              <p className="ai-scan-success" role="status">扫描完成，可在 DOM 树和检查器中查看标注。</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
