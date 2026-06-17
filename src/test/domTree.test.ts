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
});
