import { describe, expect, it, vi } from "vitest";
import { ExportError, formatExportError, toExportError } from "../utils/exportErrors";
import { formatPdfError } from "../utils/exportPdf";
import { formatPptxError } from "../utils/exportPptx";

describe("ExportError", () => {
  it("carries code + cause", () => {
    const cause = new Error("boom");
    const err = new ExportError("x", "pdf-render-failed", cause);
    expect(err.message).toBe("x");
    expect(err.code).toBe("pdf-render-failed");
    expect(err.cause).toBe(cause);
    expect(err.name).toBe("ExportError");
  });
});

describe("toExportError", () => {
  it("returns the same instance if already an ExportError", () => {
    const e = new ExportError("a", "pdf-empty");
    expect(toExportError(e)).toBe(e);
  });

  it("classifies tainted canvas errors", () => {
    const e = toExportError(new Error("Canvas tainted by cross-origin"));
    expect(e.code).toBe("snapshot-render-failed");
  });

  it("classifies timeout/abort errors", () => {
    const e = toExportError(new Error("The operation was aborted"));
    expect(e.code).toBe("snapshot-render-failed");
  });

  it("falls back to unknown when no keyword matches", () => {
    const e = toExportError(new Error("random"), "pdf-empty");
    expect(e.code).toBe("pdf-empty");
    expect(e.message).toContain("PDF");
  });

  it("handles non-Error throwables", () => {
    const e = toExportError("string failure", "pptx-empty");
    expect(e.code).toBe("pptx-empty");
  });
});

describe("formatExportError", () => {
  it("logs to console.error in non-production", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const message = formatExportError(new Error("boom"), "pdf-render-failed");
    expect(message).toContain("PDF");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("formatPdfError returns the PDF friendly message", () => {
    const msg = formatPdfError(new Error("anything"));
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toMatch(/PDF/);
  });

  it("formatPptxError returns the PPTX friendly message", () => {
    const msg = formatPptxError(new Error("anything"));
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toMatch(/PPTX/);
  });
});

describe("loadBundleScript", () => {
  it("resolves to null in non-browser environment", async () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window: unknown }).window = undefined;
    const { loadBundleScript } = await import("../utils/exportErrors");
    const result = await loadBundleScript("/foo.js", "FooBundle");
    expect(result).toBeNull();
    (globalThis as { window: unknown }).window = originalWindow;
  });

  it("reuses an already loaded global", async () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window: unknown }).window = {
      location: { href: "http://localhost/" },
      XBundle: { default: { hello: "world" } },
    };
    const { loadBundleScript } = await import("../utils/exportErrors");
    const result = await loadBundleScript("/x.js", "XBundle");
    expect(result).toEqual({ hello: "world" });
    (globalThis as { window: unknown }).window = originalWindow;
  });
});