import { beforeEach, describe, expect, it } from "vitest";
import {
  DOCUMENT_STORAGE_KEY,
  MAX_PERSISTED_HTML_LENGTH,
  clearPersistedDocument,
  loadPersistedDocument,
  savePersistedDocument,
} from "../utils/documentPersistence";

describe("document persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and restores the editable document state", () => {
    expect(savePersistedDocument({ html: "<main>saved</main>", selectedId: "hft-1" }, "lesson.html")).toBe("saved");
    expect(loadPersistedDocument()).toMatchObject({
      html: "<main>saved</main>",
      selectedId: "hft-1",
      documentName: "lesson.html",
      version: 1,
    });
  });

  it("ignores malformed payloads and can clear the document", () => {
    window.localStorage.setItem(DOCUMENT_STORAGE_KEY, "not-json");
    expect(loadPersistedDocument()).toBeNull();
    savePersistedDocument({ html: "<p>draft</p>", selectedId: null }, "draft.html");
    clearPersistedDocument();
    expect(loadPersistedDocument()).toBeNull();
  });

  it("skips synchronous persistence for oversized imported documents", () => {
    const oversizedHtml = `<main>${"x".repeat(MAX_PERSISTED_HTML_LENGTH + 1)}</main>`;
    expect(savePersistedDocument({ html: oversizedHtml, selectedId: null }, "large.html")).toBe("unavailable");
    expect(window.localStorage.getItem(DOCUMENT_STORAGE_KEY)).toBeNull();
  });
});
