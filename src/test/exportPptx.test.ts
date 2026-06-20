import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PPTX_SLIDE_HEIGHT_IN,
  PPTX_SLIDE_WIDTH_IN,
  buildPptxBlob,
  exportPptxFromHtml,
  fitIntoBox,
  type PptxGenJsLike,
} from "../utils/exportPptx";
import { ExportError } from "../utils/exportErrors";
import type { HtmlToImageLike } from "../utils/exportSnapshot";

const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==";

function makeHtmlToImage(): HtmlToImageLike {
  return { toPng: vi.fn().mockResolvedValue(TINY_PNG_DATA_URL) };
}

interface SlideRecord {
  addImage: ReturnType<typeof vi.fn>;
  background?: { color: string };
}

function makePptxGen(): { ctor: PptxGenJsLike; slides: SlideRecord[] } {
  const slides: SlideRecord[] = [];
  const ctor: PptxGenJsLike = function (this: Record<string, unknown>) {
    (this as { layout?: string }).layout = "";
    (this as { defineLayout?: () => void }).defineLayout = () => undefined;
    (this as { LAYOUTS?: Record<string, unknown> }).LAYOUTS = { LAYOUT_WIDE: { name: "x" } };
    (this as { addSlide?: () => SlideRecord }).addSlide = () => {
      const slide: SlideRecord = { addImage: vi.fn() };
      slides.push(slide);
      return slide;
    };
    (this as { write?: (o: { outputType: string }) => Promise<ArrayBuffer> }).write = vi
      .fn()
      .mockResolvedValue(new ArrayBuffer(8));
    // 模拟 pptxgenjs 4.0.1 的 exportPresentation 方法 — buildPptxBlob 优先调这个
    (this as { exportPresentation?: (o: { outputType: string }) => Promise<ArrayBuffer> }).exportPresentation = vi
      .fn()
      .mockResolvedValue(new ArrayBuffer(8));
  } as unknown as PptxGenJsLike;
  // 同时把 ctor 挂到 window.PptxGenBundle,让 loadBundleScript 命中已加载分支
  // (jsdom 测试环境没有真实 bundle 脚本,通过这条路径注入)
  (globalThis as unknown as { window?: unknown }).window = {
    ...((globalThis as unknown as { window?: Record<string, unknown> }).window || {}),
    PptxGenBundle: { default: ctor },
  };
  return { ctor, slides };
}

describe("fitIntoBox", () => {
  it("centers a 16:9 image inside the 16:9 box without scaling", () => {
    const rect = fitIntoBox(1920, 1080, 13.333, 7.5);
    expect(rect.w).toBeCloseTo(13.333, 2);
    expect(rect.h).toBeCloseTo(7.5, 2);
    expect(rect.x).toBeCloseTo(0, 2);
    expect(rect.y).toBeCloseTo(0, 2);
  });

  it("letterboxes a tall image inside the 16:9 box", () => {
    const rect = fitIntoBox(600, 1200, 13.333, 7.5);
    expect(rect.h).toBeCloseTo(7.5, 2);
    expect(rect.w).toBeLessThan(13.333);
    expect(Math.abs(rect.x - (13.333 - rect.w) / 2)).toBeLessThan(0.001);
  });

  it("pillarboxes a wide image", () => {
    const rect = fitIntoBox(2000, 600, 13.333, 7.5);
    expect(rect.w).toBeCloseTo(13.333, 2);
    expect(rect.h).toBeLessThan(7.5);
  });

  it("handles invalid input", () => {
    const rect = fitIntoBox(0, 0, 13.333, 7.5);
    expect(rect.w).toBe(13.333);
    expect(rect.h).toBe(7.5);
  });
});

describe("buildPptxBlob", () => {
  it("rejects empty HTML", async () => {
    const pptx = makePptxGen();
    await expect(
      buildPptxBlob("   ", {
        htmlToImage: makeHtmlToImage(),
        loadPptxGen: () => Promise.resolve(pptx.ctor),
        singlePage: true,
      })
    ).rejects.toBeInstanceOf(ExportError);
  });

  it("builds a PPTX blob with a single slide and the configured layout", async () => {
    const pptx = makePptxGen();
    const result = await buildPptxBlob("<html><body><h1>x</h1></body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPptxGen: () => Promise.resolve(pptx.ctor),
      singlePage: true,
    });

    expect(result.pageCount).toBe(1);
    expect(result.blob.size).toBe(8);
    expect(result.blob.type).toContain("presentationml");
    expect(pptx.slides).toHaveLength(1);
    expect(pptx.slides[0].background?.color).toBe("FFFFFF");
    expect(pptx.slides[0].addImage).toHaveBeenCalledTimes(1);
    const addImageArg = pptx.slides[0].addImage.mock.calls[0][0];
    expect(addImageArg.data).toBe(TINY_PNG_DATA_URL);
    // layout size is 16:9
    expect(PPTX_SLIDE_WIDTH_IN / PPTX_SLIDE_HEIGHT_IN).toBeCloseTo(16 / 9, 3);
  });

  it("wraps pptxgenjs failure into pptx-write-failed", async () => {
    const ctor: PptxGenJsLike = function (this: Record<string, unknown>) {
      (this as { addSlide?: () => unknown }).addSlide = () => ({
        background: { color: "FFFFFF" },
        addImage: () => undefined,
      });
      (this as { defineLayout?: unknown }).defineLayout = () => undefined;
      (this as { write?: () => Promise<never> }).write = () => Promise.reject(new Error("disk full"));
    } as unknown as PptxGenJsLike;

    await expect(
      buildPptxBlob("<html><body>x</body></html>", {
        htmlToImage: makeHtmlToImage(),
        loadPptxGen: () => Promise.resolve(ctor),
        singlePage: true,
      })
    ).rejects.toMatchObject({ code: "pptx-write-failed" });
  });

  it("wraps snapshot failures into pptx-render-failed", async () => {
    const pptx = makePptxGen();
    const htmlToImage: HtmlToImageLike = {
      toPng: vi.fn().mockRejectedValue(new Error("tainted canvas")),
    };
    await expect(
      buildPptxBlob("<html><body>x</body></html>", {
        htmlToImage,
        loadPptxGen: () => Promise.resolve(pptx.ctor),
        singlePage: true,
      })
    ).rejects.toMatchObject({ code: "pptx-render-failed" });
  });

  it("wraps library load failures into library-load-failed", async () => {
    await expect(
      buildPptxBlob("<html><body>x</body></html>", {
        htmlToImage: makeHtmlToImage(),
        loadPptxGen: () => Promise.reject(new Error("chunk missing")),
        singlePage: true,
      })
    ).rejects.toMatchObject({ code: "library-load-failed" });
  });

  it("returns an empty-pptx error when pptxgenjs cannot add slides", async () => {
    const ctor: PptxGenJsLike = function (this: Record<string, unknown>) {
      (this as { addSlide?: unknown }).addSlide = undefined;
      (this as { defineLayout?: () => void }).defineLayout = () => undefined;
      (this as { write?: () => Promise<ArrayBuffer> }).write = () => Promise.resolve(new ArrayBuffer(0));
    } as unknown as PptxGenJsLike;

    await expect(
      buildPptxBlob("<html><body>x</body></html>", {
        htmlToImage: makeHtmlToImage(),
        loadPptxGen: () => Promise.resolve(ctor),
        singlePage: true,
      })
    ).rejects.toBeInstanceOf(ExportError);
  });
});

describe("exportPptxFromHtml", () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("downloads a PPTX with the configured filename and returns page count", async () => {
    const pptx = makePptxGen();
    const download = vi.fn();
    const pageCount = await exportPptxFromHtml("<html><body>x</body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPptxGen: () => Promise.resolve(pptx.ctor),
      singlePage: true,
      filename: "deck.pptx",
      download,
    });
    expect(pageCount).toBe(1);
    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0][1]).toBe("deck.pptx");
  });

  it("defaults to edited-page.pptx when no filename is supplied", async () => {
    const pptx = makePptxGen();
    const download = vi.fn();
    await exportPptxFromHtml("<html><body>x</body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPptxGen: () => Promise.resolve(pptx.ctor),
      singlePage: true,
      download,
    });
    expect(download.mock.calls[0][1]).toBe("edited-page.pptx");
  });
});