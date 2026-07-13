import { describe, it, expect } from "vitest";
import { buildEditableDomTree, filterCollapsedTree } from "../utils/domTree";
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

  it("does not repeat all descendant copy in container rows", () => {
    const html = `<a class="hero" href="#"><span>主标题</span><small>正文内容</small></a>`;
    const { html: withIds } = injectEditableIds(html);
    const tree = buildEditableDomTree(withIds);
    const container = tree.find((node) => node.tagName === "a");

    expect(container?.text).toBe("");
    expect(container?.label).not.toContain("主标题");
    expect(tree.find((node) => node.tagName === "span")?.text).toBe("主标题");
  });
});

describe("filterCollapsedTree", () => {
  it("hides children of collapsed nodes", () => {
    const tree = [
      { hftId: "1", tagName: "div", label: "Parent", text: "", depth: 0, className: "", id: "1" },
      { hftId: "2", tagName: "p", label: "Child", text: "hello", depth: 1, className: "", id: "2" },
      { hftId: "3", tagName: "p", label: "Child2", text: "world", depth: 1, className: "", id: "3" },
    ] as any;
    const collapsed = new Set(["1"]);
    const result = filterCollapsedTree(tree, collapsed);
    expect(result).toHaveLength(1);
    expect(result[0].hftId).toBe("1");
  });

  it("shows children of expanded nodes", () => {
    const tree = [
      { hftId: "1", tagName: "div", label: "Parent", text: "", depth: 0, className: "", id: "1" },
      { hftId: "2", tagName: "p", label: "Child", text: "hello", depth: 1, className: "", id: "2" },
    ] as any;
    const collapsed = new Set<string>();
    const result = filterCollapsedTree(tree, collapsed);
    expect(result).toHaveLength(2);
  });

  it("returns empty for empty input", () => {
    expect(filterCollapsedTree([], new Set())).toHaveLength(0);
  });
});
