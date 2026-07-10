/**
 * AI provider API key 存储模块。
 * 把 loadStoredAiKeys 从 App.tsx 抽出来,以便独立测试迁移逻辑。
 */

export const AI_KEY_STORAGE = "html-finetune.ai-provider-keys";
export const AI_LEGACY_GEMMA_KEY_STORAGE = "html-finetune.gemma-api-key";

/**
 * 从 localStorage 读取已存储的 AI provider key 集合。
 * 包含一次性迁移:若新版 key 存储不存在,但存在旧版 gemma key,
 * 则把旧 key 落到 AI_KEY_STORAGE 后立即 removeItem 旧 key,
 * 以避免后续 useEffect(rememberAiKeys=false)误删新存储。
 *
 * 隐私模式 / quota 满时静默 fallback 到 { google: legacyGemmaKey } 而不写盘。
 */
export function loadStoredAiKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const rawKeys = window.localStorage.getItem(AI_KEY_STORAGE);
  if (rawKeys) {
    try {
      const parsed = JSON.parse(rawKeys) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      );
    } catch {
      window.localStorage.removeItem(AI_KEY_STORAGE);
    }
  }

  const legacyGemmaKey = window.localStorage.getItem(AI_LEGACY_GEMMA_KEY_STORAGE);
  if (legacyGemmaKey) {
    try {
      window.localStorage.setItem(AI_KEY_STORAGE, JSON.stringify({ google: legacyGemmaKey }));
    } catch {
      return { google: legacyGemmaKey };
    }
    window.localStorage.removeItem(AI_LEGACY_GEMMA_KEY_STORAGE);
    return { google: legacyGemmaKey };
  }
  return {};
}

export function buildRememberedAiKeyMap(storedKeys: Record<string, string>): Record<string, boolean> {
  return Object.fromEntries(Object.keys(storedKeys).map((providerId) => [providerId, true]));
}