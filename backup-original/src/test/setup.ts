import "@testing-library/jest-dom";

// Polyfill OffscreenCanvas with node-canvas so Pretext can measure text
// in the jsdom test environment. Pretext checks for OffscreenCanvas first,
// then falls back to DOM canvas. Neither is available in Node.js by default.
if (typeof globalThis.OffscreenCanvas === "undefined") {
  const { createCanvas } = require("canvas");
  class NodeOffscreenCanvas {
    width: number;
    height: number;
    private _canvas: any;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this._canvas = createCanvas(width, height);
    }

    getContext(type: string): CanvasRenderingContext2D | null {
      if (type === "2d") {
        return this._canvas.getContext("2d") as CanvasRenderingContext2D;
      }
      return null;
    }
  }
  globalThis.OffscreenCanvas = NodeOffscreenCanvas as unknown as {
    new (width: number, height: number): OffscreenCanvas;
  };
}

// Polyfill DOMParser for jsdom
if (typeof globalThis.DOMParser === "undefined") {
  const { JSDOM } = require("jsdom");
  globalThis.DOMParser = new JSDOM().window.DOMParser;
}
