import { describe, expect, it, vi } from "vitest";
import {
  AI_PROVIDER_DEFINITIONS,
  buildAiStructurePayload,
  getAiProviderIcon,
  normalizeAiStructureResponse,
  normalizeAiModelOptions,
} from "../utils/aiStructure";
import { buildEditableDomTree } from "../utils/domTree";
import { injectEditableIds } from "../utils/injectEditableIds";

describe("AI provider definitions", () => {
  it("covers mainstream direct and OpenAI-compatible providers", () => {
    const providerIds = AI_PROVIDER_DEFINITIONS.map((provider) => provider.id);

    expect(providerIds).toEqual(
      expect.arrayContaining([
        "google",
        "openai",
        "anthropic",
        "deepseek",
        "qwen",
        "kimi",
        "zhipu",
        "volcengine",
        "qianfan",
        "minimax",
        "mistral",
        "xai",
        "groq",
        "together",
        "openrouter",
        "siliconflow",
      ])
    );
    expect(new Set(providerIds).size).toBe(providerIds.length);
  });
});

describe("buildAiStructurePayload", () => {
  it("summarizes slide and SVG text nodes for AI structure scans", () => {
    const { html } = injectEditableIds(`
      <section class="slide" data-slide="12">
        <h2>国内案例二</h2>
        <svg viewBox="0 0 400 240"><text x="20" y="40">40.9%</text></svg>
      </section>
    `);
    const tree = buildEditableDomTree(html);
    const payload = buildAiStructurePayload(html, tree);

    expect(payload.nodes.some((node) => node.slide === "第 12 页")).toBe(true);
    expect(payload.nodes.some((node) => node.tagName === "text" && node.roleHint === "chart-value")).toBe(true);
  });
});

describe("normalizeAiModelOptions", () => {
  it("normalizes Gemini listModels responses and keeps generateContent models", () => {
    const google = AI_PROVIDER_DEFINITIONS.find((provider) => provider.id === "google");
    expect(google).toBeTruthy();

    const models = normalizeAiModelOptions(google!, {
      models: [
        {
          name: "models/gemma-4-26b-a4b-it",
          displayName: "Gemma 4 26B",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/text-embedding-004",
          displayName: "Embedding",
          supportedGenerationMethods: ["embedContent"],
        },
      ],
    });

    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      value: "gemma-4-26b-a4b-it",
      label: "Gemma 4 26B",
      source: "remote",
    });
  });

  it("normalizes OpenAI-compatible model lists and filters non-chat models", () => {
    const openrouter = AI_PROVIDER_DEFINITIONS.find((provider) => provider.id === "openrouter");
    expect(openrouter).toBeTruthy();

    const models = normalizeAiModelOptions(openrouter!, {
      data: [
        {
          id: "openai/gpt-4o-mini",
          name: "GPT-4o mini",
          context_length: 128000,
          architecture: { input_modalities: ["text"], output_modalities: ["text"] },
        },
        {
          id: "openai/text-embedding-3-small",
          name: "Embedding",
          architecture: { input_modalities: ["text"], output_modalities: ["embeddings"] },
        },
      ],
    });

    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      value: "openai/gpt-4o-mini",
      label: "GPT-4o mini",
      contextLength: 128000,
    });
  });
});

describe("getAiProviderIcon", () => {
  it("returns branded badges for every configured provider", () => {
    AI_PROVIDER_DEFINITIONS.forEach((provider) => {
      const icon = getAiProviderIcon(provider.id);
      expect(icon.label).not.toBe("");
      expect(icon.title).not.toBe("");
      expect(icon.tone).not.toBe("generic");
    });
  });
});

describe("normalizeAiStructureResponse", () => {
  it("parses plain JSON", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-1","label":"标题","role":"heading","confidence":0.9}]}',
      new Set(["hft-1"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      hftId: "hft-1",
      label: "标题",
      role: "heading",
      confidence: 0.9,
    });
  });

  it("parses fenced JSON and ignores unknown hft ids", () => {
    const result = normalizeAiStructureResponse(
      '```json\n{"annotations":[{"hftId":"hft-1","label":"第 12 页 · 占比","role":"chart-value","issues":["crowded-chart"],"confidence":0.8},{"hftId":"missing","label":"bad"}]}\n```',
      new Set(["hft-1"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      hftId: "hft-1",
      label: "第 12 页 · 占比",
      role: "chart-value",
      issues: ["crowded-chart"],
      confidence: 0.8,
    });
  });

  it("extracts and parses an object surrounded by explanatory text", () => {
    const result = normalizeAiStructureResponse(
      '下面是分析结果：\n{"annotations":[{"hftId":"hft-2","label":"图片","role":"image"}]}\n如需更多建议请继续。',
      new Set(["hft-2"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-2", label: "图片", role: "image" });
  });

  it("repairs common AI JSON punctuation mistakes", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-1","label":"标题",}{"hftId":"hft-2","label":"副标题","role":"heading",}]}',
      new Set(["hft-1", "hft-2"])
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.hftId)).toEqual(["hft-1", "hft-2"]);
  });

  it("throws a friendly error for unrecoverable invalid JSON", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      normalizeAiStructureResponse(
        '{"annotations":[{"hftId":"hft-1","label":"标题" "role":"heading"}]}',
        new Set(["hft-1"])
      )
    ).toThrow("AI 返回的结构分析结果不是合法 JSON。请换一个模型重试，或降低页面复杂度后重新扫描。");
    expect(consoleError).toHaveBeenCalledWith(
      "[AI Structure] Failed to parse AI JSON response",
      expect.objectContaining({
        message: expect.any(String),
        candidateStart: expect.stringContaining('"annotations"'),
        candidateEnd: expect.stringContaining('"annotations"'),
      })
    );

    consoleError.mockRestore();
  });
});
