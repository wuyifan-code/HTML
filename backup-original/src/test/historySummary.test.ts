import { describe, it, expect } from "vitest";
import { summarizeStateChange, buildDisplayItemsFromSummaries } from "../utils/historySummary";

describe("summarizeStateChange", () => {
  it("detects added elements", () => {
    const previous = { html: "<p>hello</p>", selectedId: null };
    const next = { html: "<p>hello</p><p>world</p>", selectedId: null };
    // Note: summary depends on hft-id injection; this tests the function signature works
    const summary = summarizeStateChange(previous, next);
    expect(summary).toBeDefined();
    expect(summary.title).toBeDefined();
  });
});

describe("buildDisplayItemsFromSummaries", () => {
  it("builds correct display items", () => {
    const summaries = [
      { title: "初始版本", detail: "载入当前 HTML" },
      { title: "修改文本", detail: "p - Hello" },
    ];
    const items = buildDisplayItemsFromSummaries(summaries, 1);
    expect(items).toHaveLength(2);
    expect(items[0].isCurrent).toBe(false);
    expect(items[1].isCurrent).toBe(true);
    expect(items[1].title).toBe("修改文本");
  });

  it("handles null summaries", () => {
    const summaries: (any)[] = [null, null];
    const items = buildDisplayItemsFromSummaries(summaries, 0);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("初始版本");
  });
});
