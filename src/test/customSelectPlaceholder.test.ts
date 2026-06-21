import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/components/CustomSelect.tsx"), "utf8");

describe("CustomSelect placeholder prop", () => {
  it("declares an optional placeholder prop in the interface", () => {
    expect(source).toMatch(/placeholder\?:\s*string/);
  });

  it("uses placeholder as fallback when selectedLabel is empty", () => {
    // Either via `selectedLabel || placeholder` or via a conditional render
    expect(source).toMatch(/placeholder/);
    expect(source).not.toMatch(/selectedLabel = selectedIndex >= 0 \? options\[selectedIndex\]\.label : value;/);
  });
});
