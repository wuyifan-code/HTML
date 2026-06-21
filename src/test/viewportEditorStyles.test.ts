import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("viewport-editor CSS", () => {
  it("declares .viewport-editor container", () => {
    expect(styles).toMatch(/\.viewport-editor\s*\{/);
  });

  it("declares .viewport-size-input with right-aligned text and monospace font", () => {
    const block = styles.match(/\.viewport-size-input\s*\{[^}]+\}/);
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/text-align:\s*right/);
    expect(block![0]).toMatch(/font-family:\s*var\(--mono\)/);
  });

  it("overrides .custom-select width inside .viewport-editor to auto", () => {
    expect(styles).toMatch(/\.viewport-editor\s+\.custom-select\s*\{[\s\S]*?width:\s*auto/);
  });

  it("declares .viewport-fit-btn and .viewport-fit-btn-active", () => {
    expect(styles).toMatch(/\.viewport-fit-btn\s*\{/);
    expect(styles).toMatch(/\.viewport-fit-btn-active\s*\{/);
  });
});
