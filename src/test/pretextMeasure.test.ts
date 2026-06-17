import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePretextMeasure } from "../hooks/usePretextMeasure";
import {
  cachedPrepare,
  cachedPrepareWithSegments,
  measureTextHeight,
  measureTextMaxWidth,
  clearPretextCache,
  getPretextCacheStats,
} from "../utils/pretextMeasure";

/**
 * Pretext 使用 Canvas 2D API 测量字形宽度。
 * 在 jsdom 中需要 node-canvas 包支持。
 */
function hasCanvasSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("2d") !== null;
  } catch {
    return false;
  }
}

const canvasSupported = hasCanvasSupport();

describe("cachedPrepare (Pretext precomputation)", () => {
  beforeEach(() => {
    clearPretextCache();
  });

  it("returns a prepared text handle", () => {
    if (!canvasSupported) return; // skip if no canvas
    expect(() => cachedPrepare("Hello world", "16px Inter")).not.toThrow();
  });

  it("returns same reference for same text+font (cache hit)", () => {
    if (!canvasSupported) return;
    const a = cachedPrepare("Test text", "14px Arial");
    const b = cachedPrepare("Test text", "14px Arial");
    expect(a).toBe(b);
  });

  it("returns different handles for different texts", () => {
    if (!canvasSupported) return;
    const a = cachedPrepare("Hello", "16px Inter");
    const b = cachedPrepare("World", "16px Inter");
    expect(a).not.toBe(b);
  });

  it("caps prepared text cache size", () => {
    if (!canvasSupported) return;
    for (let i = 0; i < 240; i += 1) {
      cachedPrepare(`Text ${i}`, "16px Arial");
    }
    expect(getPretextCacheStats().prepareEntries).toBeLessThanOrEqual(200);
  });
});

describe("measureTextHeight (Pretext hot path)", () => {
  beforeEach(() => {
    clearPretextCache();
  });

  it("returns positive height for non-empty text", () => {
    if (!canvasSupported) return;
    const { height, lineCount } = measureTextHeight("Hello world", "16px Inter", 320, 22);
    expect(height).toBeGreaterThan(0);
    expect(lineCount).toBeGreaterThanOrEqual(1);
  });

  it("returns zero height for empty text", () => {
    if (!canvasSupported) return;
    const { height, lineCount } = measureTextHeight("", "16px Inter", 320, 22);
    expect(height).toBe(0);
    expect(lineCount).toBe(0);
  });

  it("produces more lines for narrower width", () => {
    if (!canvasSupported) return;
    const wide = measureTextHeight("Hello world this is a test of text wrapping", "16px Inter", 500, 22);
    const narrow = measureTextHeight("Hello world this is a test of text wrapping", "16px Inter", 100, 22);
    expect(narrow.lineCount).toBeGreaterThanOrEqual(wide.lineCount);
  });
});

describe("measureTextMaxWidth", () => {
  beforeEach(() => {
    clearPretextCache();
  });

  it("returns line stats for non-empty text", () => {
    if (!canvasSupported) return;
    const stats = measureTextMaxWidth("Hello world", "16px Inter", 320);
    expect(stats.lineCount).toBeGreaterThanOrEqual(1);
    expect(stats.maxLineWidth).toBeGreaterThan(0);
  });

  it("returns zero values for empty text", () => {
    if (!canvasSupported) return;
    const stats = measureTextMaxWidth("", "16px Inter", 320);
    expect(stats.lineCount).toBe(0);
    expect(stats.maxLineWidth).toBe(0);
  });
});

describe("cachedPrepareWithSegments", () => {
  beforeEach(() => {
    clearPretextCache();
  });

  it("returns a segments handle", () => {
    if (!canvasSupported) return;
    expect(() => cachedPrepareWithSegments("Hello world", "16px Inter")).not.toThrow();
  });

  it("caps segmented text cache size", () => {
    if (!canvasSupported) return;
    for (let i = 0; i < 240; i += 1) {
      cachedPrepareWithSegments(`Segment text ${i}`, "16px Arial");
    }
    expect(getPretextCacheStats().prepareWithSegmentsEntries).toBeLessThanOrEqual(200);
  });
});

describe("usePretextMeasure", () => {
  beforeEach(() => {
    clearPretextCache();
  });

  it("reports max line width without requesting line details", () => {
    if (!canvasSupported) return;
    const { result } = renderHook(() => usePretextMeasure("Hello world", "16px Arial", 320, 22));
    expect(result.current.maxLineWidth).toBeGreaterThan(0);
    expect(result.current.lines).toEqual([]);
  });
});
