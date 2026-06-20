import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/PreviewFrame.tsx"), "utf8");

describe("PreviewFrame viewport tooltip", () => {
  it("passes dimensions to every PreviewModeButton", () => {
    const matches = source.match(/dimensions=\{viewportDimensions\./g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(5);
  });

  it("uses pixel-format dimText in the title and inline label", () => {
    expect(source).toMatch(/\$\{label\}预览 · \$\{dimText\}/);
    expect(source).toMatch(/\$\{dimensions\.width\}×\$\{dimensions\.height\}/);
  });

  it("declares .viewport-dim styles in styles.css", () => {
    const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
    expect(styles).toMatch(/\.viewport-dim\b/);
    expect(styles).toMatch(/\.viewport-dim[\s\S]{0,400}opacity:\s*0/);
  });
});