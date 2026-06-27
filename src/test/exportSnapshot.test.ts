import { describe, expect, it, vi } from "vitest";
import { capturePreviewAsPng } from "../utils/exportSnapshot";
import { ExportError } from "../utils/exportErrors";

const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==";

function fakeDocument(slides: number): Document {
  const slideEls = Array.from({ length: slides }, (_, i) => ({
    classList: { contains: () => true, add: () => undefined, remove: () => undefined },
    hasAttribute: (n: string) => n === "data-slide",
    id: `slide-${i + 1}`,
    style: {
      _map: new Map<string, string>(),
      setProperty(k: string, v: string) {
        this._map.set(k, v);
      },
      getPropertyValue(k: string) {
        return this._map.get(k) ?? "";
      },
      getPropertyPriority() {
        return "";
      },
      removeProperty(k: string) {
        this._map.delete(k);
      },
    },
    scrollWidth: 1024,
    scrollHeight: 768,
    getBoundingClientRect: () => ({
      width: 1024,
      height: 768,
      left: 0,
      top: 0,
      right: 1024,
      bottom: 768,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    }),
  }));
  return {
    body: {},
    images: [],
    querySelectorAll: (sel: string) => (sel.includes("slide") ? slideEls : []),
    querySelector: (_sel?: string) => null,
    fonts: { ready: Promise.resolve() },
  } as unknown as Document;
}

function fakeIframe(overrides: Partial<{
  contentDocument: ReturnType<typeof fakeDocument>;
  clientWidth: number;
  clientHeight: number;
  remove: () => void;
}> = {}) {
  const doc = overrides.contentDocument ?? fakeDocument(2);
  const frameWindow = {
    requestAnimationFrame: (cb: () => void) => {
      cb();
      return 1;
    },
    getComputedStyle: () => ({ display: "block" }),
  };
  const listeners: Record<string, Array<() => void>> = {};
  return {
    contentDocument: doc,
    contentWindow: frameWindow,
    clientWidth: overrides.clientWidth ?? 1024,
    clientHeight: overrides.clientHeight ?? 768,
    style: {} as CSSStyleDeclaration,
    remove: overrides.remove ?? (() => undefined),
    addEventListener: (event: string, cb: () => void) => {
      (listeners[event] ??= []).push(cb);
      // 立即异步触发 load 事件,模拟 iframe 加载完成
      if (event === "load") setTimeout(cb, 0);
    },
    removeEventListener: (event: string, cb: () => void) => {
      const list = listeners[event];
      if (!list) return;
      const idx = list.indexOf(cb);
      if (idx >= 0) list.splice(idx, 1);
    },
  };
}

describe("capturePreviewAsPng", () => {
  it("renders every detected slide as a PNG page", async () => {
    const iframe = fakeIframe() as unknown as HTMLIFrameElement;
    const htmlToImage = { toPng: vi.fn().mockResolvedValue(TINY_PNG_DATA_URL) };
    const slide1 = { id: "slide-1" } as unknown as HTMLElement;
    const slide2 = { id: "slide-2" } as unknown as HTMLElement;

    const pages = await capturePreviewAsPng({
      html: "<html><body><section class='slide'>a</section><section class='slide'>b</section></body></html>",
      htmlToImage,
      createIframe: () => iframe,
      waitForAssets: async () => undefined,
      settle: async () => undefined,
      activateSlide: () => undefined,
      findSlides: () => [slide1, slide2],
      measureTarget: () => ({ width: 1024, height: 768 }),
    });

    expect(pages).toHaveLength(2);
    expect(pages[0].label).toBe("Slide 1");
    expect(pages[1].label).toBe("Slide 2");
    expect(pages[0].dataUrl).toBe(TINY_PNG_DATA_URL);
    expect(htmlToImage.toPng).toHaveBeenCalledTimes(2);
  });

  it("freezes canvas size to the first slide's dimensions, ignoring later measure values", async () => {
    // 关键回归测试: 即使后面 slide 测量出更小的尺寸, 也必须用第一张 slide 的尺寸。
    // 防止 "每页按当前 slide 缩放 iframe" 的旧实现回归 → 修这个 bug 的目的是
    // 让所有 PDF 页大小一致, 不出现用户报告的"页面大小递减"。
    const iframe = fakeIframe() as unknown as HTMLIFrameElement;
    const htmlToImage = { toPng: vi.fn().mockResolvedValue(TINY_PNG_DATA_URL) };
    const slide1 = { id: "slide-1" } as unknown as HTMLElement;
    const slide2 = { id: "slide-2" } as unknown as HTMLElement;
    const slide3 = { id: "slide-3" } as unknown as HTMLElement;

    // 模拟"递减尺寸": 第 1 张 1440x812, 后面越来越小
    const measureCalls: number[] = [];
    const measureTarget = (() => {
      const sizes = [
        { width: 1440, height: 812 },
        { width: 800, height: 600 },
        { width: 400, height: 300 },
      ];
      let i = 0;
      return () => {
        measureCalls.push(i);
        return sizes[i++] ?? sizes[sizes.length - 1];
      };
    })();

    const pages = await capturePreviewAsPng({
      html: "<html><body><section class='slide'>a</section><section class='slide'>b</section><section class='slide'>c</section></body></html>",
      htmlToImage,
      createIframe: () => iframe,
      waitForAssets: async () => undefined,
      settle: async () => undefined,
      activateSlide: () => undefined,
      findSlides: () => [slide1, slide2, slide3],
      measureTarget,
    });

    // 只测了第一张, 后面两张不再重测
    expect(measureCalls).toEqual([0]);

    // 所有页必须用第一张 slide 的尺寸
    expect(pages).toHaveLength(3);
    expect(pages[0].width).toBe(1440);
    expect(pages[0].height).toBe(812);
    expect(pages[1].width).toBe(1440);
    expect(pages[1].height).toBe(812);
    expect(pages[2].width).toBe(1440);
    expect(pages[2].height).toBe(812);

    // htmlToImage 也必须收到统一的尺寸参数, 不应该看到 800/600 或 400/300
    const toPngCalls = htmlToImage.toPng.mock.calls;
    expect(toPngCalls[0][1]).toMatchObject({ width: 1440, height: 812 });
    expect(toPngCalls[1][1]).toMatchObject({ width: 1440, height: 812 });
    expect(toPngCalls[2][1]).toMatchObject({ width: 1440, height: 812 });
  });

  it("falls back to a single page when no slides are present", async () => {
    const doc = {
      body: {},
      images: [],
      querySelectorAll: () => [],
      querySelector: (sel: string) => (sel === "main" ? { id: "root" } : null),
      fonts: { ready: Promise.resolve() },
    } as unknown as Document;
    const iframe = fakeIframe({ contentDocument: doc }) as unknown as HTMLIFrameElement;
    const htmlToImage = { toPng: vi.fn().mockResolvedValue(TINY_PNG_DATA_URL) };

    const pages = await capturePreviewAsPng({
      html: "<html><body><main>x</main></body></html>",
      htmlToImage,
      createIframe: () => iframe,
      waitForAssets: async () => undefined,
      settle: async () => undefined,
      measureTarget: () => ({ width: 1024, height: 768 }),
      findSlides: () => [],
      activateSlide: () => undefined,
    });
    expect(pages).toHaveLength(1);
    expect(pages[0].label).toBe("Page");
  });

  it("prefers an explicit .page container over inner main content", async () => {
    const pageEl = {
      classList: { contains: (name: string) => name === "page", add: () => undefined, remove: () => undefined },
      hasAttribute: () => false,
      id: "",
      style: {
        _map: new Map<string, string>(),
        setProperty(k: string, v: string) {
          this._map.set(k, v);
        },
        getPropertyValue(k: string) {
          return k === "width" ? "210mm" : k === "height" ? "297mm" : this._map.get(k) ?? "";
        },
        getPropertyPriority() {
          return "";
        },
        removeProperty(k: string) {
          this._map.delete(k);
        },
      },
      scrollWidth: 794,
      scrollHeight: 1123,
      getBoundingClientRect: () => ({
        width: 794,
        height: 1123,
        left: 0,
        top: 0,
        right: 794,
        bottom: 1123,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }),
    } as unknown as HTMLElement;
    const mainEl = { id: "main" } as unknown as HTMLElement;
    const doc = {
      body: {},
      images: [],
      querySelectorAll: (sel: string) => (sel.includes(".page") ? [pageEl] : []),
      querySelector: (sel: string) => (sel === "main" ? mainEl : null),
      fonts: { ready: Promise.resolve() },
    } as unknown as Document;
    const iframe = fakeIframe({ contentDocument: doc }) as unknown as HTMLIFrameElement;
    const htmlToImage = { toPng: vi.fn().mockResolvedValue(TINY_PNG_DATA_URL) };

    const pages = await capturePreviewAsPng({
      html: "<html><body><div class='page'><main>content</main></div></body></html>",
      htmlToImage,
      createIframe: () => iframe,
      waitForAssets: async () => undefined,
      settle: async () => undefined,
      measureTarget: () => ({ width: 794, height: 1123 }),
      activateSlide: () => undefined,
    });

    expect(pages).toHaveLength(1);
    expect(htmlToImage.toPng).toHaveBeenCalledWith(pageEl, expect.objectContaining({ width: 794, height: 1123 }));
  });

  it("throws snapshot-no-slide-target when fallback target is missing", async () => {
    const doc = {
      body: {},
      images: [],
      querySelectorAll: () => [],
      querySelector: () => null,
      fonts: { ready: Promise.resolve() },
    } as unknown as Document;
    const iframe = fakeIframe({ contentDocument: doc }) as unknown as HTMLIFrameElement;

    await expect(
      capturePreviewAsPng({
        html: "<html><body></body></html>",
        htmlToImage: { toPng: vi.fn() },
        createIframe: () => iframe,
        waitForAssets: async () => undefined,
        settle: async () => undefined,
        findSlides: () => [],
        findFallbackTarget: () => doc.body as unknown as HTMLElement,
        measureTarget: () => ({ width: 1024, height: 768 }),
        activateSlide: () => undefined,
      })
    ).rejects.toBeInstanceOf(ExportError);
  });

  it("throws when measured target dimensions are zero", async () => {
    const doc = fakeDocument(0);
    const iframe = fakeIframe({
      contentDocument: doc,
      clientWidth: 0,
      clientHeight: 0,
    }) as unknown as HTMLIFrameElement;

    await expect(
      capturePreviewAsPng({
        html: "<html><body></body></html>",
        htmlToImage: { toPng: vi.fn() },
        createIframe: () => iframe,
        waitForAssets: async () => undefined,
        settle: async () => undefined,
        findSlides: () => [],
        findFallbackTarget: () => doc.body as unknown as HTMLElement,
        measureTarget: () => ({ width: 0, height: 0 }),
        activateSlide: () => undefined,
      })
    ).rejects.toMatchObject({ code: "snapshot-render-failed" });
  });

  it("rejects empty dataUrl from html-to-image", async () => {
    const doc = fakeDocument(0);
    const iframe = fakeIframe({ contentDocument: doc }) as unknown as HTMLIFrameElement;

    await expect(
      capturePreviewAsPng({
        html: "<html><body></body></html>",
        htmlToImage: { toPng: vi.fn().mockResolvedValue("") },
        createIframe: () => iframe,
        waitForAssets: async () => undefined,
        settle: async () => undefined,
        findSlides: () => [],
        findFallbackTarget: () => doc.body as unknown as HTMLElement,
        measureTarget: () => ({ width: 1024, height: 768 }),
        activateSlide: () => undefined,
      })
    ).rejects.toMatchObject({ code: "snapshot-empty" });
  });

  it("rejects unsupported data URL mime", async () => {
    const doc = fakeDocument(0);
    const iframe = fakeIframe({ contentDocument: doc }) as unknown as HTMLIFrameElement;

    await expect(
      capturePreviewAsPng({
        html: "<html><body></body></html>",
        htmlToImage: { toPng: vi.fn().mockResolvedValue("data:image/svg+xml;base64,PHN2Zy8+") },
        createIframe: () => iframe,
        waitForAssets: async () => undefined,
        settle: async () => undefined,
        findSlides: () => [],
        findFallbackTarget: () => doc.body as unknown as HTMLElement,
        measureTarget: () => ({ width: 1024, height: 768 }),
        activateSlide: () => undefined,
      })
    ).rejects.toMatchObject({ code: "snapshot-empty" });
  });

  it("removes the iframe even when snapshot throws", async () => {
    const remove = vi.fn();
    const doc = fakeDocument(0);
    const iframe = fakeIframe({ contentDocument: doc, remove }) as unknown as HTMLIFrameElement;

    await expect(
      capturePreviewAsPng({
        html: "<html><body></body></html>",
        htmlToImage: { toPng: vi.fn().mockRejectedValue(new Error("oops")) },
        createIframe: () => iframe,
        waitForAssets: async () => undefined,
        settle: async () => undefined,
        findSlides: () => [],
        findFallbackTarget: () => doc.body as unknown as HTMLElement,
        measureTarget: () => ({ width: 1024, height: 768 }),
        activateSlide: () => undefined,
      })
    ).rejects.toBeInstanceOf(Error);
    expect(remove).toHaveBeenCalled();
  });
});
