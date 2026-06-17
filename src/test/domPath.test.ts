import { describe, it, expect } from "vitest";
import { getDomPath, hasElementWithHftId, serializeDocument } from "../utils/domPath";
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
