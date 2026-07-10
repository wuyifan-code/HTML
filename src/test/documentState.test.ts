import { describe, expect, it } from "vitest";
import { hasMeaningfulHtml, createEmptyDocument } from "../utils/documentState";

describe("hasMeaningfulHtml", () => {
  it("returns false for empty string", () => {
    expect(hasMeaningfulHtml("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(hasMeaningfulHtml("   \n  \t  ")).toBe(false);
  });

  it("returns false for empty document shell", () => {
    const html = "<!DOCTYPE html><html><head></head><body></body></html>";
    expect(hasMeaningfulHtml(html)).toBe(false);
  });

  it("returns false for html with only comments", () => {
    const html = "<!DOCTYPE html><html><head><!-- comment --></head><body></body></html>";
    expect(hasMeaningfulHtml(html)).toBe(false);
  });

  it("returns true for html with text content", () => {
    expect(hasMeaningfulHtml("<p>Hello</p>")).toBe(true);
  });

  it("returns true for html with body content", () => {
    const html = "<!DOCTYPE html><html><body><h1>Title</h1></body></html>";
    expect(hasMeaningfulHtml(html)).toBe(true);
  });

  it("considers whitespace-only body as empty", () => {
    const html = "<!DOCTYPE html><html><head></head><body>   </body></html>";
    expect(hasMeaningfulHtml(html)).toBe(false);
  });
});

describe("createEmptyDocument", () => {
  it("returns empty document struct", () => {
    const doc = createEmptyDocument();
    expect(doc.html).toContain("<!DOCTYPE html>");
    expect(doc.html).toContain("<body></body>");
    expect(doc.selectedId).toBeNull();
  });
});
