import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function readCssBundle(): string {
  const stylesDirectory = resolve(process.cwd(), "src/styles");
  const moduleFiles = readdirSync(stylesDirectory)
    .filter((file) => file.endsWith(".css"))
    .map((file) => resolve(stylesDirectory, file));

  return [resolve(process.cwd(), "src/styles.css"), ...moduleFiles]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

describe("CSS token integrity", () => {
  it("defines every CSS variable that is used without a fallback", () => {
    const css = readCssBundle();
    const defined = new Set(
      Array.from(css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g), (match) => match[1]),
    );

    const missing = Array.from(css.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)([^)]*)\)/g))
      .filter((match) => !match[2].includes(","))
      .map((match) => match[1])
      .filter((token) => !defined.has(token));

    expect(Array.from(new Set(missing)).sort()).toEqual([]);
  });
});
