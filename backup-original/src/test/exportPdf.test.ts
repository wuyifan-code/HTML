import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPdfBlob,
  computePdfPageSize,
  dataUrlToUint8Array,
  exportPdfFromHtml,
  type PdfLibLike,
} from "../utils/exportPdf";
import { ExportError } from "../utils/exportErrors";
import type { HtmlToImageLike } from "../utils/exportSnapshot";

/** 生成一个 1x1 PNG 的最小有效 base64 数据 URL */
const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==";

function makeHtmlToImage(width = 800, height = 600): HtmlToImageLike {
  return {
    toPng: vi.fn().mockResolvedValue(TINY_PNG_DATA_URL),
  };
}

function makePdfLib(imageWidth = 800, imageHeight = 600): PdfLibLike {
  const drawnImages: Array<{ x: number; y: number; w: number; h: number }> = [];
  const drawnRects: Array<{ x: number; y: number; w: number; h: number; color: [number, number, number] }> = [];
  const pages: Array<{ width: number; height: number }> = [];
  const instance = {
    embedPng: vi.fn().mockResolvedValue({ width: imageWidth, height: imageHeight }),
    addPage: vi.fn((size: [number, number]) => {
      const page = { width: size[0], height: size[1] };
      pages.push(page);
      return {
        drawImage: vi.fn((_image, opts) => {
          drawnImages.push(opts);
        }),
        drawRectangle: vi.fn((opts) => {
          drawnRects.push({
            x: opts.x,
            y: opts.y,
            w: opts.width,
            h: opts.height,
            color: opts.color,
          });
        }),
      };
    }),
    save: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])),
  };
  return {
    PDFDocument: { create: vi.fn().mockResolvedValue(instance) },
  } as unknown as PdfLibLike;
}

describe("computePdfPageSize", () => {
  it("scales image pixels to PDF points using 72/96 ratio", () => {
    const result = computePdfPageSize(960, 540, 960, 540);
    expect(result.width).toBe(720); // 960 * 0.75
    expect(result.height).toBe(405); // 540 * 0.75
  });

  it("falls back to css dimensions when image dimensions are zero", () => {
    const result = computePdfPageSize(800, 600, 0, 0);
    expect(result.width).toBe(600);
    expect(result.height).toBe(450);
  });

  it("clamps to at least 1x1", () => {
    const result = computePdfPageSize(0, 0, 0, 0);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });
});

describe("dataUrlToUint8Array", () => {
  it("decodes base64 from a data URL", () => {
    const data = dataUrlToUint8Array(TINY_PNG_DATA_URL);
    expect(data.byteLength).toBeGreaterThan(0);
    expect(data[0]).toBe(0x89); // PNG signature
  });

  it("returns empty Uint8Array for invalid input", () => {
    expect(dataUrlToUint8Array("").byteLength).toBe(0);
    expect(dataUrlToUint8Array("not a data url").byteLength).toBe(0);
  });
});

describe("buildPdfBlob", () => {
  it("rejects empty HTML", async () => {
    await expect(buildPdfBlob("   ", { htmlToImage: makeHtmlToImage() })).rejects.toBeInstanceOf(ExportError);
  });

  it("draws a white background rectangle on every page before drawing the image", async () => {
    // We need access to the mock's tracking arrays. Refactor: call buildPdfBlob
    // with a loadPdfLib that exposes a drawRectangle spy we can inspect.
    const drawRects: Array<{ x: number; y: number; w: number; h: number; color: [number, number, number] }> = [];
    const drawImages: Array<{ x: number; y: number; w: number; h: number }> = [];
    const callOrder: string[] = [];
    const customInstance = {
      embedPng: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
      addPage: vi.fn((size: [number, number]) => ({
        drawImage: vi.fn((_img, opts) => {
          drawImages.push(opts);
          callOrder.push("drawImage");
        }),
        drawRectangle: vi.fn((opts) => {
          drawRects.push({ x: opts.x, y: opts.y, w: opts.width, h: opts.height, color: opts.color });
          callOrder.push("drawRectangle");
        }),
        _size: size,
      })),
      save: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])),
    };
    const customLib: PdfLibLike = {
      PDFDocument: { create: vi.fn().mockResolvedValue(customInstance) },
    } as unknown as PdfLibLike;

    await buildPdfBlob("<html><body><h1>hi</h1></body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPdfLib: () => Promise.resolve(customLib),
      singlePage: true,
    });

    expect(drawRects).toHaveLength(1);
    expect(drawRects[0].color).toEqual([1, 1, 1]);
    expect(drawRects[0].x).toBe(0);
    expect(drawRects[0].y).toBe(0);
    expect(drawRects[0].w).toBeGreaterThan(0);
    expect(drawRects[0].h).toBeGreaterThan(0);
    expect(drawImages).toHaveLength(1);
    // 关键: 矩形必须在图片之前绘制, 否则黑底叠在图上面盖住文字/icon。
    expect(callOrder[0]).toBe("drawRectangle");
    expect(callOrder[1]).toBe("drawImage");
  });

  it("produces a PDF Blob from a rendered PNG", async () => {
    const download = vi.fn();
    const blob = await buildPdfBlob("<html><body><h1>hi</h1></body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPdfLib: () => Promise.resolve(makePdfLib()),
      singlePage: true,
    });
    expect(blob.pageCount).toBe(1);
    expect(blob.blob.size).toBeGreaterThan(0);
    expect(blob.blob.type).toBe("application/pdf");
    void download; // not invoked at build stage
  });

  it("wraps snapshot failure into a pdf-render-failed ExportError", async () => {
    const htmlToImage: HtmlToImageLike = {
      toPng: vi.fn().mockRejectedValue(new Error("canvas tainted")),
    };
    await expect(
      buildPdfBlob("<html><body></body></html>", {
        htmlToImage,
        loadPdfLib: () => Promise.resolve(makePdfLib()),
        singlePage: true,
      })
    ).rejects.toMatchObject({ code: "pdf-render-failed" });
  });

  it("wraps pdf-lib failure into a library-load-failed ExportError", async () => {
    await expect(
      buildPdfBlob("<html><body></body></html>", {
        htmlToImage: makeHtmlToImage(),
        loadPdfLib: () => Promise.reject(new Error("chunk missing")),
        singlePage: true,
      })
    ).rejects.toMatchObject({ code: "library-load-failed" });
  });

  it("rejects when the snapshot yields an invalid data URL", async () => {
    const htmlToImage: HtmlToImageLike = {
      toPng: vi.fn().mockResolvedValue(""),
    };
    await expect(
      buildPdfBlob("<html><body></body></html>", {
        htmlToImage,
        loadPdfLib: () => Promise.resolve(makePdfLib()),
        singlePage: true,
      })
    ).rejects.toBeInstanceOf(ExportError);
  });
});

describe("exportPdfFromHtml", () => {
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

  it("downloads a PDF with the configured filename and returns page count", async () => {
    const download = vi.fn();
    const pageCount = await exportPdfFromHtml("<html><body>x</body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPdfLib: () => Promise.resolve(makePdfLib()),
      singlePage: true,
      filename: "deck.pdf",
      download,
    });
    expect(pageCount).toBe(1);
    expect(download).toHaveBeenCalledTimes(1);
    const [blobArg, nameArg] = download.mock.calls[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(nameArg).toBe("deck.pdf");
  });

  it("falls back to default filename when none is supplied", async () => {
    const download = vi.fn();
    await exportPdfFromHtml("<html><body>x</body></html>", {
      htmlToImage: makeHtmlToImage(),
      loadPdfLib: () => Promise.resolve(makePdfLib()),
      singlePage: true,
      download,
    });
    expect(download.mock.calls[0][1]).toBe("edited-page.pdf");
  });
});