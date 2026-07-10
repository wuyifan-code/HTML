import { describe, expect, it, beforeEach } from "vitest";
import { loadStoredAiKeys, buildRememberedAiKeyMap, AI_KEY_STORAGE, AI_LEGACY_GEMMA_KEY_STORAGE } from "../utils/aiKeyStorage";

describe("AI key storage migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty object when nothing is persisted", () => {
    expect(loadStoredAiKeys()).toEqual({});
  });

  it("migrates legacy gemma key into new AI_KEY_STORAGE and removes legacy entry", () => {
    window.localStorage.setItem(AI_LEGACY_GEMMA_KEY_STORAGE, "legacy-key-abc");

    const result = loadStoredAiKeys();

    expect(result).toEqual({ google: "legacy-key-abc" });
    expect(window.localStorage.getItem(AI_LEGACY_GEMMA_KEY_STORAGE)).toBeNull();
    // 新结构已写入
    expect(window.localStorage.getItem(AI_KEY_STORAGE)).toBe(JSON.stringify({ google: "legacy-key-abc" }));
  });

  it("preserves migrated key on subsequent calls (no double-migration wipe)", () => {
    window.localStorage.setItem(AI_LEGACY_GEMMA_KEY_STORAGE, "legacy-key-1");
    const first = loadStoredAiKeys();
    expect(first).toEqual({ google: "legacy-key-1" });

    // 模拟 App 的 useEffect(rememberAiKeys=false)再次跑:loadStoredAiKeys 仍能读到
    const second = loadStoredAiKeys();
    expect(second).toEqual({ google: "legacy-key-1" });
  });

  it("returns existing new-format keys without re-migrating", () => {
    window.localStorage.setItem(AI_KEY_STORAGE, JSON.stringify({ google: "g", openai: "o" }));
    expect(loadStoredAiKeys()).toEqual({ google: "g", openai: "o" });
    expect(window.localStorage.getItem(AI_LEGACY_GEMMA_KEY_STORAGE)).toBeNull();
  });

  it("ignores non-string values when parsing new-format", () => {
    window.localStorage.setItem(
      AI_KEY_STORAGE,
      JSON.stringify({ google: "g", bogus: 123, openai: "o" })
    );
    expect(loadStoredAiKeys()).toEqual({ google: "g", openai: "o" });
  });

  it("falls back gracefully when setItem throws (private mode / quota)", () => {
    const setItem = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    try {
      window.localStorage.setItem(AI_LEGACY_GEMMA_KEY_STORAGE, "legacy-x");
      const result = loadStoredAiKeys();
      // 即便 setItem 抛错,仍返回 { google: legacy } — UI 能继续显示
      expect(result).toEqual({ google: "legacy-x" });
    } finally {
      window.localStorage.setItem = setItem;
    }
  });

  it("buildRememberedAiKeyMap turns all keys into {providerId: true}", () => {
    expect(buildRememberedAiKeyMap({ google: "g", openai: "o" })).toEqual({
      google: true,
      openai: true,
    });
  });
});