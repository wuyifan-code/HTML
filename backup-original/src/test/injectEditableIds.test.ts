import { describe, it, expect } from "vitest";
import { injectEditableIds, parseHtmlReadOnly } from "../utils/injectEditableIds";
import { HFT_ID_ATTRIBUTE } from "../utils/editableElement";

describe("injectEditableIds", () => {
  it("injects hft-id attributes on editable elements", () => {
    const html = `<p>Hello world</p>`;
    const result = injectEditableIds(html);
    expect(result.html).toContain(HFT_ID_ATTRIBUTE);
    expect(result.ids.length).toBeGreaterThan(0);
  });

  it("preserves existing hft-id attributes", () => {
    const html = `<p ${HFT_ID_ATTRIBUTE}="custom-id">Hello</p>`;
    const result = injectEditableIds(html);
    expect(result.html).toContain('custom-id');
    expect(result.ids).toContain('custom-id');
  });

  it("does not inject hft-id on non-editable elements", () => {
    const html = `<script>alert(1)</script><p>Hello</p>`;
    const result = injectEditableIds(html);
    const doc = new DOMParser().parseFromString(result.html, "text/html");
    const scriptElements = doc.querySelectorAll("script");
    scriptElements.forEach((el) => {
      expect(el.hasAttribute(HFT_ID_ATTRIBUTE)).toBe(false);
    });
  });

  it("injects hft-id attributes on SVG chart text and image nodes", () => {
    const html = `
      <svg viewBox="0 0 400 240">
        <text x="20" y="40">40.9%</text>
        <image href="chart.png" x="80" y="60" width="120" height="90" />
      </svg>
    `;
    const result = injectEditableIds(html);
    const doc = new DOMParser().parseFromString(result.html, "text/html");

    expect(doc.querySelector("svg")?.hasAttribute(HFT_ID_ATTRIBUTE)).toBe(true);
    expect(doc.querySelector("text")?.hasAttribute(HFT_ID_ATTRIBUTE)).toBe(true);
    expect(doc.querySelector("image")?.hasAttribute(HFT_ID_ATTRIBUTE)).toBe(true);
  });
});

describe("parseHtmlReadOnly", () => {
  it("caches and returns Document for same html", () => {
    const html = "<p>test</p>";
    const doc1 = parseHtmlReadOnly(html);
    const doc2 = parseHtmlReadOnly(html);
    expect(doc1.body.innerHTML).toBe(doc2.body.innerHTML);
  });

  it("returns different Document for different html", () => {
    const doc1 = parseHtmlReadOnly("<p>first</p>");
    const doc2 = parseHtmlReadOnly("<p>second</p>");
    expect(doc1.body.innerHTML).not.toBe(doc2.body.innerHTML);
  });
});
