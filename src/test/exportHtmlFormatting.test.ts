import { describe, expect, it } from "vitest";
import { formatExportHtml } from "../utils/formatExportHtml";

describe("formatExportHtml", () => {
  const sampleHtml = "<html><head><title>Test</title></head><body><!-- comment --><p>Hello</p></body></html>";

  it("minified mode removes comments when includeComments is false", () => {
    const result = formatExportHtml(sampleHtml, { mode: "minified", includeComments: false });
    expect(result).not.toContain("<!--");
    expect(result).not.toContain("comment");
  });

  it("minified mode preserves comments when includeComments is true", () => {
    const result = formatExportHtml(sampleHtml, { mode: "minified", includeComments: true });
    expect(result).toContain("<!-- comment -->");
  });

  it("pretty mode adds newlines and indentation", () => {
    const result = formatExportHtml(sampleHtml, { mode: "pretty", includeComments: false });
    expect(result).toContain("\n");
    expect(result).toContain("  <body>");
  });

  it("pretty mode with comments includes them", () => {
    const result = formatExportHtml(sampleHtml, { mode: "pretty", includeComments: true });
    expect(result).toContain("<!-- comment -->");
    expect(result).toContain("\n");
  });

  it("minified mode collapses whitespace between tags", () => {
    const html = "<div>   <p>  text  </p>   </div>";
    const result = formatExportHtml(html, { mode: "minified", includeComments: false });
    expect(result).not.toMatch(/>\s+</);
  });

  it("returns empty string for empty input", () => {
    expect(formatExportHtml("", { mode: "pretty", includeComments: false })).toBe("");
  });

  it("does not alter the HTML structure beyond formatting", () => {
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><h1>Title</h1></body></html>';
    const result = formatExportHtml(html, { mode: "pretty", includeComments: false });
    expect(result).toContain("<!doctype html>");
    expect(result).toContain("Title");
    expect(result).toContain("h1");
  });
});
