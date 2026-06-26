import { describe, it, expect } from "vitest";
import { htmlMayUseRemoteFont, buildFontLibraryLinkTags, FONT_LIBRARY_ATTRIBUTE } from "../utils/fontLibrary";

describe("htmlMayUseRemoteFont (Pretext string-based detection)", () => {
  it("returns false for HTML without remote fonts", () => {
    const html = '<html><head></head><body><p style="font-family: Arial">Hello</p></body></html>';
    expect(htmlMayUseRemoteFont(html)).toBe(false);
  });

  it("returns true when HTML uses remote fonts in inline style", () => {
    const html = '<html><head></head><body><p style="font-family: \'Noto Sans SC\', sans-serif">你好</p></body></html>';
    expect(htmlMayUseRemoteFont(html)).toBe(true);
  });

  it("returns true when HTML uses remote fonts in style tag", () => {
    const html = `<html><head><style>p { font-family: 'ZCOOL QingKe HuangYou', sans-serif; }</style></head><body><p>test</p></body></html>`;
    expect(htmlMayUseRemoteFont(html)).toBe(true);
  });

  it("is case-insensitive for font names", () => {
    const html = '<p style="font-family: noto sans sc">hello</p>';
    expect(htmlMayUseRemoteFont(html)).toBe(true);
  });

  it("detects remote fonts wrapped in double quotes", () => {
    const html = '<style>p { font-family: "Noto Serif SC", serif; }</style>';
    expect(htmlMayUseRemoteFont(html)).toBe(true);
  });

  it("detects remote fonts when quotes are HTML entities", () => {
    const html = '<p style="font-family: &quot;Ma Shan Zheng&quot;, cursive">hello</p>';
    expect(htmlMayUseRemoteFont(html)).toBe(true);
  });

  it("returns false for empty HTML", () => {
    expect(htmlMayUseRemoteFont("")).toBe(false);
  });
});

describe("buildFontLibraryLinkTags (Pretext string-based injection)", () => {
  it("returns link tags with correct attributes", () => {
    const tags = buildFontLibraryLinkTags();
    expect(tags).toContain("rel=\"preconnect\"");
    expect(tags).toContain("rel=\"stylesheet\"");
    expect(tags).toContain(FONT_LIBRARY_ATTRIBUTE);
    expect(tags).toContain("fonts.googleapis.com");
    expect(tags).toContain("fonts.gstatic.com");
  });

  it("returns non-empty string", () => {
    const tags = buildFontLibraryLinkTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.split("\n").length).toBeGreaterThanOrEqual(2);
  });
});
