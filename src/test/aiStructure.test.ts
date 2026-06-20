import { describe, expect, it, vi } from "vitest";
import {
  AI_PROVIDER_DEFINITIONS,
  AiRequestError,
  analyzeStructureWithAi,
  buildAiStructurePayload,
  formatAiErrorDetail,
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

  it("repairs missing commas between adjacent AI JSON objects", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-1","label":"标题"}{"hftId":"hft-2","label":"副标题","role":"heading"}]}',
      new Set(["hft-1", "hft-2"])
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.hftId)).toEqual(["hft-1", "hft-2"]);
  });

  it("repairs trailing commas in arrays", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-1","label":"标题",}]}',
      new Set(["hft-1"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-1", label: "标题" });
  });

  it("repairs trailing commas in nested objects", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-3","label":"尾随逗号", "role":"heading",}]}',
      new Set(["hft-3"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-3", label: "尾随逗号", role: "heading" });
  });

  it("replaces NaN literals with null and still parses", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-4","label":"置信度","confidence":NaN}]}',
      new Set(["hft-4"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-4", label: "置信度" });
    expect(result[0].confidence).toBe(0);
  });

  it("strips JS comments and parses", () => {
    const result = normalizeAiStructureResponse(
      '{\n  // 第一行注释\n  /* 第二行 */\n  "annotations":[{"hftId":"hft-5","label":"注释测试"}]\n}',
      new Set(["hft-5"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-5", label: "注释测试" });
  });

  it("uses balanced extraction on nested objects within prose", () => {
    const result = normalizeAiStructureResponse(
      '好的,以下是结果(包含对象嵌套):\n前导文字 {"annotations":[{"hftId":"hft-6","label":"嵌套","role":"body","suggestion":"ok"}]} 结尾文字含 {不闭合',
      new Set(["hft-6"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-6", label: "嵌套" });
  });

  it("handles plain JSON without any wrapping", () => {
    const result = normalizeAiStructureResponse(
      '{"annotations":[{"hftId":"hft-7","label":"普通","role":"heading"}]}',
      new Set(["hft-7"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-7", label: "普通" });
  });

  it("handles markdown code fence wrapped JSON", () => {
    const result = normalizeAiStructureResponse(
      '```json\n{"annotations":[{"hftId":"hft-8","label":"fence","role":"heading"}]}\n```',
      new Set(["hft-8"])
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ hftId: "hft-8", label: "fence" });
  });

  it("throws a friendly error for unfixable JSON", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      normalizeAiStructureResponse(
        '以下是结果:这不是JSON, 只是文本 {key without quotes} ',
        new Set(["hft-x"])
      )
    ).toThrow("AI 返回的结构分析结果不是合法 JSON。请换一个模型重试，或降低页面复杂度后重新扫描。");
    expect(consoleError).toHaveBeenCalledWith(
      "[AI Structure] Failed to parse AI JSON response",
      expect.objectContaining({
        message: expect.any(String),
        candidateStart: expect.any(String),
        candidateEnd: expect.any(String),
        rawLength: expect.any(Number),
      })
    );

    consoleError.mockRestore();
  });
});

describe("analyzeStructureWithAi request failures", () => {
  function makeScanInput() {
    const { html } = injectEditableIds("<main><h1>标题</h1><p>正文</p></main>");
    return {
      providerId: "google" as const,
      apiKey: "fake-api-key",
      model: "gemini-test",
      html,
      domTree: buildEditableDomTree(html),
    };
  }

  it("sends strict JSON-only system instructions", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      annotations: [{ hftId: "hft-1", label: "标题", role: "heading" }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await analyzeStructureWithAi(makeScanInput());
      const request = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit];
      const requestBody = JSON.parse(String(request[1].body));
      const systemText = requestBody.systemInstruction.parts[0].text as string;
      expect(systemText).toContain("Return valid JSON only");
      expect(systemText).toContain("No markdown fences");
      expect(systemText).toContain("No trailing commas");
      expect(systemText).toContain('Root object must be exactly {"annotations": [...]}');
      expect(systemText).toContain("Do not omit commas between array elements");
      expect(systemText).toContain("Do not return partial JSON");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("wraps AI request timeouts into a friendly message", async () => {
    vi.useFakeTimers();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("aborted", "AbortError")),
            { once: true }
          );
        })
    ) as unknown as typeof fetch;

    try {
      const promise = analyzeStructureWithAi(makeScanInput()).catch((error) => error);
      await vi.advanceTimersByTimeAsync(120_000);
      const error = await promise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("扫描超过 2 分钟");
      expect((error as Error).message).toContain("请换轻量模型或减少页面内容后重试");
    } finally {
      globalThis.fetch = originalFetch;
      vi.useRealTimers();
    }
  });

  it("wraps browser CORS fetch failures into a friendly message", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))) as unknown as typeof fetch;

    try {
      await expect(analyzeStructureWithAi(makeScanInput())).rejects.toThrow(
        /GitHub Pages 直接跨域调用.*OpenRouter 或本地代理/
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("normalizeAiStructureResponse edge cases", () => {
  it("returns empty array when annotations field is missing", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({ nodes: [] }),
      new Set(["hft-1"])
    );
    expect(result).toEqual([]);
  });

  it("returns empty array when annotations is not an array (string)", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({ annotations: "not-an-array" }),
      new Set(["hft-1"])
    );
    expect(result).toEqual([]);
  });

  it("returns empty array when annotations is an object", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({ annotations: { hftId: "hft-1" } }),
      new Set(["hft-1"])
    );
    expect(result).toEqual([]);
  });

  it("returns empty array when annotations is null", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({ annotations: null }),
      new Set(["hft-1"])
    );
    expect(result).toEqual([]);
  });

  it("deduplicates hftId across multiple annotations", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          { hftId: "hft-1", label: "First" },
          { hftId: "hft-1", label: "Second (should be deduped)" },
          { hftId: "hft-2", label: "Other" },
        ],
      }),
      new Set(["hft-1", "hft-2"])
    );
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.hftId)).toEqual(["hft-1", "hft-2"]);
    expect(result[0].label).toBe("First");
  });

  it("filters out hftId that is not in allowedIds", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          { hftId: "hft-allowed", label: "OK" },
          { hftId: "hft-rogue", label: "Should be filtered" },
        ],
      }),
      new Set(["hft-allowed"])
    );
    expect(result).toHaveLength(1);
    expect(result[0].hftId).toBe("hft-allowed");
  });

  it("filters out annotations with empty label", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          { hftId: "hft-1", label: "OK" },
          { hftId: "hft-2", label: "" },
          { hftId: "hft-3", label: "   " },
          { hftId: "hft-4" }, // no label
        ],
      }),
      new Set(["hft-1", "hft-2", "hft-3", "hft-4"])
    );
    expect(result).toHaveLength(1);
    expect(result[0].hftId).toBe("hft-1");
  });

  it("filters out annotations with empty hftId", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          { hftId: "", label: "No hftId" },
          { hftId: "hft-1", label: "OK" },
        ],
      }),
      new Set(["hft-1"])
    );
    expect(result).toHaveLength(1);
    expect(result[0].hftId).toBe("hft-1");
  });

  it("falls back to default confidence when value is non-numeric", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          { hftId: "hft-1", label: "A", confidence: "high" },
          { hftId: "hft-2", label: "B", confidence: null },
          { hftId: "hft-3", label: "C", confidence: NaN },
          { hftId: "hft-4", label: "D", confidence: { weird: true } },
          { hftId: "hft-5", label: "E" }, // missing
        ],
      }),
      new Set(["hft-1", "hft-2", "hft-3", "hft-4", "hft-5"])
    );
    expect(result).toHaveLength(5);
    for (const a of result) {
      expect(typeof a.confidence).toBe("number");
      expect(a.confidence).toBeGreaterThanOrEqual(0);
      expect(a.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("clamps confidence to [0, 1] range", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          { hftId: "hft-1", label: "Too high", confidence: 5 },
          { hftId: "hft-2", label: "Too low", confidence: -2 },
          { hftId: "hft-3", label: "Valid", confidence: 0.5 },
        ],
      }),
      new Set(["hft-1", "hft-2", "hft-3"])
    );
    expect(result.find((a) => a.hftId === "hft-1")?.confidence).toBeLessThanOrEqual(1);
    expect(result.find((a) => a.hftId === "hft-2")?.confidence).toBeGreaterThanOrEqual(0);
    expect(result.find((a) => a.hftId === "hft-3")?.confidence).toBe(0.5);
  });

  it("normalizes issues array, filtering out non-strings", () => {
    const result = normalizeAiStructureResponse(
      JSON.stringify({
        annotations: [
          {
            hftId: "hft-1",
            label: "A",
            issues: ["tiny-text", 42, null, "image-ratio", { x: 1 }],
          },
        ],
      }),
      new Set(["hft-1"])
    );
    expect(result).toHaveLength(1);
    expect(result[0].issues).toEqual(["tiny-text", "image-ratio"]);
  });
});

describe("AiRequestError", () => {
  it("carries status / url / responseText on the instance", () => {
    const error = new AiRequestError("invalid api key", 401, "https://api.example.com/v1/chat", '{"err":"x"}');
    expect(error.message).toBe("invalid api key");
    expect(error.status).toBe(401);
    expect(error.url).toBe("https://api.example.com/v1/chat");
    expect(error.responseText).toBe('{"err":"x"}');
    expect(error.name).toBe("AiRequestError");
    expect(error instanceof Error).toBe(true);
  });

  it("formatAiErrorDetail truncates the body to a safe length", () => {
    const longBody = "x".repeat(2000);
    const error = new AiRequestError("失败", 500, "https://api.example.com/v1/x", longBody);
    const detail = formatAiErrorDetail(error, 100);
    expect(detail).toContain("[500]");
    expect(detail).toContain("https://api.example.com/v1/x");
    expect(detail.length).toBeLessThan(150);
  });

  it("formatAiErrorDetail handles missing status / url gracefully", () => {
    const error = new AiRequestError("网络异常");
    const detail = formatAiErrorDetail(error);
    expect(detail.startsWith("[?]")).toBe(true);
  });
});
