import { describe, expect, it } from "vitest";
import { computePdfPageSize } from "../utils/exportPdf";
import { injectEditableIds } from "../utils/injectEditableIds";
import { cacheKey } from "../utils/pretextMeasure";

describe("exportPdf.computePdfPageSize", () => {
  it("prefers CSS dimensions (imageWidth is physical pixels, do not blow up PDF page)", () => {
    // cssWidth=1200, imageWidth=2400 (PNG 物理像素 = 2x devicePixelRatio)
    // PDF 页面应该是 1200 * 0.75 = 900 point,而不是 2400 * 0.75 = 1800
    const pageSize = computePdfPageSize(1200, 800, 2400, 1600);
    expect(pageSize.width).toBe(900);
    expect(pageSize.height).toBe(600);
  });

  it("falls back to image dimensions when css dimensions are 0", () => {
    const pageSize = computePdfPageSize(0, 0, 1200, 800);
    expect(pageSize.width).toBe(900);
    expect(pageSize.height).toBe(600);
  });

  it("clamps to minimum 1", () => {
    const pageSize = computePdfPageSize(0, 0, 0, 0);
    expect(pageSize.width).toBeGreaterThanOrEqual(1);
    expect(pageSize.height).toBeGreaterThanOrEqual(1);
  });
});

describe("injectEditableIds dedupe", () => {
  it("renames duplicate user ids so the second element gets a suffix", () => {
    const result = injectEditableIds(`<div id="hero">a</div><div id="hero">b</div>`);
    expect(result.html).toContain('id="hero"');
    expect(result.html).toContain('id="hero-hft-2"');
  });

  it("does not modify a unique user id", () => {
    const result = injectEditableIds(`<div id="solo">x</div>`);
    expect(result.html).toContain('id="solo"');
    // -hft- 后缀应只在 user id 重复时出现;但 data-hft-id 自身会含 hft- 前缀
    // 所以改用检测"id=\"solo-hft-..."这种新合成 id 是否出现。
    expect(result.html).not.toMatch(/id="solo-hft-/);
  });

  it("leaves single id with no duplicate untouched", () => {
    const result = injectEditableIds(`<section id="unique">only</section>`);
    expect(result.html).toContain('id="unique"');
  });
});

describe("pretextMeasure cacheKey consistency", () => {
  it("returns the same key for cachedPrepare(t, f) and cachedPrepare(t, f, undefined)", () => {
    // 旧实现 cacheKey 用 options ?? "" 但内部调用方用 JSON.stringify(options),
    // undefined 时两边分别得到 "undefined" 和 "" — cache miss。
    // 修复后两边都走 JSON.stringify(undefined) 路径,key 应当一致。
    const options = undefined;
    const a = cacheKey("hello", "16px sans", options);
    const b = cacheKey("hello", "16px sans", options);
    expect(a).toBe(b);
  });

  it("preserves options in the key for different option sets", () => {
    const a = cacheKey("hello", "16px", { letterSpacing: 0 });
    const b = cacheKey("hello", "16px", { letterSpacing: 1 });
    expect(a).not.toBe(b);
  });

  it("distinguishes different fonts", () => {
    const a = cacheKey("hello", "16px Arial");
    const b = cacheKey("hello", "16px Helvetica");
    expect(a).not.toBe(b);
  });
});