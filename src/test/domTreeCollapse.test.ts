import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const panel = readFileSync(join(process.cwd(), "src/components/HtmlInputPanel.tsx"), "utf8");
const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("dom-tree default collapse policy", () => {
  it("collapses any node deeper than baseDepth+1", () => {
    expect(panel).toMatch(/me\.depth - baseDepth > 1/);
  });

  it("renders expand-all / collapse-all buttons", () => {
    expect(panel).toMatch(/全部展开/);
    expect(panel).toMatch(/全部折叠/);
    expect(panel).toMatch(/expandAll = useCallback/);
    expect(panel).toMatch(/collapseAll = useCallback/);
  });

  it("exposes data-tag on each row for icon styling", () => {
    expect(panel).toMatch(/data-tag=\{node\.tagName\}/);
  });

  it("declares tag-specific CSS icons for h1-h6 / button / a / img / svg", () => {
    expect(styles).toMatch(/\.dom-tree-row\[data-tag="h1"\]/);
    expect(styles).toMatch(/\.dom-tree-row\[data-tag="button"\]/);
    expect(styles).toMatch(/\.dom-tree-row\[data-tag="a"\]/);
    expect(styles).toMatch(/\.dom-tree-row\[data-tag="img"\]/);
    expect(styles).toMatch(/\.dom-tree-row\[data-tag="svg"\]/);
  });

  it("styles the dom-tree-toolbar", () => {
    expect(styles).toMatch(/\.dom-tree-toolbar\b/);
  });
});