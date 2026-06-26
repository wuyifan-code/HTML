import { describe, it, expect } from "vitest";
import { getDomPath, hasElementWithHftId, serializeDocument, simplifyDomPath, updateHtmlElementByHftId } from "../utils/domPath";
import { HFT_ID_ATTRIBUTE } from "../utils/editableElement";

describe("getDomPath", () => {
  it("builds path for a simple element", () => {
    const div = document.createElement("div");
    const p = document.createElement("p");
    div.appendChild(p);
    document.body.appendChild(div);

    const path = getDomPath(p);
    expect(path).toMatch(/html > body(:nth-of-type\(\d+\))? > div:nth-of-type\(\d+\) > p:nth-of-type\(\d+\)/);

    document.body.removeChild(div);
  });
});

describe("simplifyDomPath", () => {
  it("strips nth-of-type from every segment", () => {
    const input = "html > body:nth-of-type(1) > main:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(1) > h1:nth-of-type(1)";
    expect(simplifyDomPath(input)).toBe("html > body > main > section > div > h1");
  });

  it("leaves a path without nth-of-type unchanged", () => {
    expect(simplifyDomPath("html > body > h1")).toBe("html > body > h1");
  });

  it("returns empty string for empty input", () => {
    expect(simplifyDomPath("")).toBe("");
  });

  it("handles single segment", () => {
    expect(simplifyDomPath("div:nth-of-type(3)")).toBe("div");
  });
});

describe("hasElementWithHftId", () => {
  it("returns true when hft-id exists in html", () => {
    const html = `<div ${HFT_ID_ATTRIBUTE}="hft-0001">test</div>`;
    expect(hasElementWithHftId(html, "hft-0001")).toBe(true);
  });

  it("returns false when hft-id does not exist", () => {
    const html = `<div ${HFT_ID_ATTRIBUTE}="hft-0001">test</div>`;
    expect(hasElementWithHftId(html, "hft-9999")).toBe(false);
  });
});

describe("serializeDocument", () => {
  it("produces a doctype-prefixed string", () => {
    const doc = new DOMParser().parseFromString("<html><body><p>hi</p></body></html>", "text/html");
    const result = serializeDocument(doc);
    expect(result).toMatch(/^<!doctype html>/i);
    expect(result).toContain("<p>hi</p>");
  });
});

describe("updateHtmlElementByHftId", () => {
  it("updates leaf SVG text content", () => {
    const html = `<svg viewBox="0 0 400 240"><text ${HFT_ID_ATTRIBUTE}="hft-chart-label" x="20" y="40">40.9%</text></svg>`;
    const result = updateHtmlElementByHftId(html, "hft-chart-label", { text: "41.0%" });

    expect(result).toContain(">41.0%</text>");
    expect(result).not.toContain(">40.9%</text>");
  });
});
