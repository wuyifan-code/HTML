import { describe, expect, it } from "vitest";
import { serializeDocument } from "../utils/domPath";
import {
  injectEditableIds,
  parseHtmlDocument,
  parseHtmlReadOnly,
} from "../utils/injectEditableIds";

const LARGE_DATA_URL = `data:image/png;base64,${"A".repeat(64 * 1024)}`;
const HTML_WITH_EMBEDDED_IMAGE = `<!doctype html><html><body><img alt="封面" src="${LARGE_DATA_URL}"></body></html>`;

describe("embedded asset compaction", () => {
  it("keeps large base64 payloads out of DOMParser-owned attributes", () => {
    const documentRef = parseHtmlDocument(HTML_WITH_EMBEDDED_IMAGE);
    const parsedSource = documentRef.querySelector("img")?.getAttribute("src") ?? "";

    expect(parsedSource).not.toBe(LARGE_DATA_URL);
    expect(parsedSource.length).toBeLessThan(128);
    expect(serializeDocument(documentRef)).toContain(LARGE_DATA_URL);
  });

  it("preserves embedded images while injecting editor ids", () => {
    const result = injectEditableIds(HTML_WITH_EMBEDDED_IMAGE);

    expect(result.html).toContain(LARGE_DATA_URL);
    expect(result.html).toContain("data-hft-id=");
  });

  it("preserves the asset context on read-only document clones", () => {
    const documentRef = parseHtmlReadOnly(HTML_WITH_EMBEDDED_IMAGE);

    expect(serializeDocument(documentRef)).toContain(LARGE_DATA_URL);
  });
});
