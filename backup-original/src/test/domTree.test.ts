import { describe, it, expect } from "vitest";
import { buildEditableDomTree } from "../utils/domTree";
import { injectEditableIds } from "../utils/injectEditableIds";

describe("buildEditableDomTree", () => {
  it("returns tree nodes for editable elements", () => {
    const html = "<p>Hello</p><section><p>Nested</p></section>";
    const { html: withIds } = injectEditableIds(html);
    const tree = buildEditableDomTree(withIds);
    expect(tree.length).toBeGreaterThanOrEqual(2);
    expect(tree[0].tagName).toBe("p");
  });

  it("nodes have all required fields", () => {
    const html = "<h1>Title</h1>";
    const { html: withIds } = injectEditableIds(html);
    const tree = buildEditableDomTree(withIds);
    expect(tree[0]).toHaveProperty("hftId");
    expect(tree[0]).toHaveProperty("tagName");
    expect(tree[0]).toHaveProperty("label");
    expect(tree[0]).toHaveProperty("text");
    expect(tree[0]).toHaveProperty("depth");
  });

  it("includes SVG chart text nodes with readable labels", () => {
    const html = `<svg viewBox="0 0 400 240"><text x="20" y="40">40.9%</text></svg>`;
    const { html: withIds } = injectEditableIds(html);
    const tree = buildEditableDomTree(withIds);

    expect(tree.some((node) => node.tagName === "text" && node.text === "40.9%")).toBe(true);
  });
});
