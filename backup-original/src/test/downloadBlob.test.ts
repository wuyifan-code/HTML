import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "../utils/downloadBlob";

describe("downloadBlob", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalDocument = (globalThis as { document?: unknown }).document;

  beforeEach(() => {
    (URL as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = vi
      .fn()
      .mockReturnValue("blob:mock-url") as unknown as typeof URL.createObjectURL;
    (URL as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
    (globalThis as { document: unknown }).document = {
      createElement: vi.fn().mockReturnValue({
        click: vi.fn(),
        parentNode: null,
        remove: vi.fn(),
      }),
      body: { appendChild: vi.fn() },
    };
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    (globalThis as { document: unknown }).document = originalDocument;
    vi.useRealTimers();
  });

  it("uses the injected hooks and forwards filename", () => {
    const createObjectUrl = vi.fn().mockReturnValue("blob:url-1");
    const revokeObjectUrl = vi.fn();
    const anchorMock: { click: ReturnType<typeof vi.fn>; download: string } = {
      click: vi.fn(),
      download: "",
    };
    const createAnchor = vi.fn().mockReturnValue(anchorMock as unknown as HTMLAnchorElement);

    downloadBlob(new Blob(["x"]), "report.pdf", {
      createObjectUrl,
      revokeObjectUrl,
      createAnchor,
      appendAnchor: () => undefined,
      removeAnchor: () => undefined,
    });

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(anchorMock.click).toHaveBeenCalledTimes(1);
    expect(anchorMock.download).toBe("report.pdf");
  });

  it("throws if blob is empty", () => {
    expect(() => downloadBlob(new Blob([]), "x")).toThrow();
  });

  it("revokes the object URL after the download", async () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    const anchorMock = { click: vi.fn() };
    downloadBlob(new Blob(["x"]), "out.bin", {
      createObjectUrl: () => "blob:z",
      revokeObjectUrl: revoke,
      createAnchor: () => anchorMock as unknown as HTMLAnchorElement,
      appendAnchor: () => undefined,
      removeAnchor: () => undefined,
    });
    expect(revoke).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(revoke).toHaveBeenCalledWith("blob:z");
  });
});