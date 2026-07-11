import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ViewportToolbar } from "../components/workspace/canvas/ViewportToolbar";
import { DeviceFrame } from "../components/workspace/canvas/DeviceFrame";
import { CanvasPanel } from "../components/workspace/canvas/CanvasPanel";
import type { RefObject } from "react";

const noop = () => {};

const baseViewport = { width: 1440, height: 900 };

function createMockRef<T extends HTMLElement | HTMLIFrameElement>(): RefObject<T | null> {
  return { current: null };
}

describe("ViewportToolbar", () => {
  it("renders three preset buttons with correct data-dom-id attributes", () => {
    const { container } = render(
      <ViewportToolbar
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={false}
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
      />
    );

    expect(container.querySelector('[data-dom-id="vp-desktop"]')).not.toBeNull();
    expect(container.querySelector('[data-dom-id="vp-tablet"]')).not.toBeNull();
    expect(container.querySelector('[data-dom-id="vp-mobile"]')  ).not.toBeNull();
  });

  it("marks the matching preset button as pressed", () => {
    const { container } = render(
      <ViewportToolbar
        viewportSize={{ width: 375, height: 667 }}
        zoomMode="100"
        isFocusMode={false}
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
      />
    );

    const mobileBtn = container.querySelector('[data-dom-id="vp-mobile"]');
    expect(mobileBtn?.getAttribute("aria-pressed")).toBe("true");

    const desktopBtn = container.querySelector('[data-dom-id="vp-desktop"]');
    expect(desktopBtn?.getAttribute("aria-pressed")).toBe("false");
  });

  it("renders zoom controls with data-dom-id attributes", () => {
    const { container } = render(
      <ViewportToolbar
        viewportSize={baseViewport}
        zoomMode="88"
        isFocusMode={false}
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
      />
    );

    expect(container.querySelector('[data-dom-id="btn-zoom-out"]')).not.toBeNull();
    expect(container.querySelector('[data-dom-id="btn-zoom-in"]') ).not.toBeNull();
    expect(container.querySelector('[data-dom-id="btn-fit"]')     ).not.toBeNull();

    const zoomLabel = container.querySelector(".viewport-bar__zoom");
    expect(zoomLabel?.textContent).toBe("88%");
  });

  it("toggles focus mode aria-pressed", () => {
    const { container, rerender } = render(
      <ViewportToolbar
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={false}
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
      />
    );

    const focusBtn = container.querySelector('.viewport-bar__btn--label[aria-label*="专注"]');
    expect(focusBtn?.getAttribute("aria-pressed")).toBe("false");

    rerender(
      <ViewportToolbar
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={true}
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
      />
    );

    expect(focusBtn?.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("DeviceFrame", () => {
  it("shows device frame with notch and home indicator for mobile preset", () => {
    const { container } = render(
      <DeviceFrame viewportWidth={375} viewportHeight={667} preset="mobile">
        <div data-testid="content" />
      </DeviceFrame>
    );

    const frame = container.querySelector(".device-frame");
    expect(frame).not.toBeNull();
    expect(container.querySelector(".device-notch")).not.toBeNull();
    expect(container.querySelector(".device-home")).not.toBeNull();
    expect(frame?.getAttribute("style")).toContain("border-radius: 36px");
  });

  it("shows device frame without notch for tablet preset", () => {
    const { container } = render(
      <DeviceFrame viewportWidth={768} viewportHeight={1024} preset="tablet">
        <div data-testid="content" />
      </DeviceFrame>
    );

    expect(container.querySelector(".device-frame")).not.toBeNull();
    expect(container.querySelector(".device-notch")).toBeNull();
    expect(container.querySelector(".device-home--light")).not.toBeNull();
  });

  it("renders children directly without device frame for desktop preset", () => {
    const { container } = render(
      <DeviceFrame viewportWidth={1440} viewportHeight={900} preset="desktop">
        <div data-testid="content" />
      </DeviceFrame>
    );

    expect(container.querySelector(".device-frame")).toBeNull();
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull();
  });
});

describe("CanvasPanel", () => {
  it("renders the canvas section with viewport toolbar and iframe", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<html><body>hello</body></html>"
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="desktop"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    const section = container.querySelector(".nw-canvas");
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-label")).toBe("画布");

    expect(container.querySelector(".viewport-bar")).not.toBeNull();
    expect(container.querySelector("iframe.live-preview-frame")).not.toBeNull();
  });

  it("shows scan overlay when aiStatus is running", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="desktop"
        aiStatus="running"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    expect(container.querySelector(".canvas-scan-overlay")).not.toBeNull();
  });

  it("hides scan overlay when aiStatus is idle", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="desktop"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    expect(container.querySelector(".canvas-scan-overlay")).toBeNull();
  });

  it("passes srcDoc to the iframe", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<!doctype html><html><body>Hello World</body></html>"
        viewportSize={baseViewport}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="desktop"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    const iframe = container.querySelector("iframe.live-preview-frame") as HTMLIFrameElement;
    expect(iframe?.getAttribute("srcdoc")).toBe("<!doctype html><html><body>Hello World</body></html>");
  });
});

describe("CanvasPanel DeviceFrame integration (D05)", () => {
  it("renders device frame for mobile preset", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={{ width: 375, height: 667 }}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="mobile"
        matchingViewportPreset="mobile"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    expect(container.querySelector(".device-frame")).not.toBeNull();
    expect(container.querySelector(".device-notch")).not.toBeNull();
    expect(container.querySelector(".device-home")).not.toBeNull();
  });

  it("renders device frame with notch for mobile, not for desktop", () => {
    const { container: mobileContainer } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={{ width: 375, height: 667 }}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="mobile"
        matchingViewportPreset="mobile"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );
    expect(mobileContainer.querySelector(".device-frame")).not.toBeNull();

    const { container: desktopContainer } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={{ width: 1440, height: 900 }}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="desktop"
        matchingViewportPreset="desktop"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );
    expect(desktopContainer.querySelector(".device-frame")).toBeNull();
  });

  it("mobile device frame outer dimensions are viewport + 24px padding", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={{ width: 375, height: 667 }}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="mobile"
        matchingViewportPreset="mobile"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    const frame = container.querySelector(".device-frame") as HTMLElement;
    expect(frame).not.toBeNull();
    expect(frame?.style.width).toBe("399px");
    expect(frame?.style.height).toBe("691px");
  });

  it("iframe is rendered inside device frame for mobile preset", () => {
    const { container } = render(
      <CanvasPanel
        srcDoc="<html><body>test</body></html>"
        viewportSize={{ width: 375, height: 667 }}
        zoomMode="100"
        isFocusMode={false}
        viewportPreset="mobile"
        matchingViewportPreset="mobile"
        aiStatus="idle"
        onViewportChange={noop}
        onZoomChange={noop}
        onFocusToggle={noop}
        onViewportPresetChange={noop}
        onIframeLoad={noop}
        iframeRef={createMockRef<HTMLIFrameElement>()}
        stageRef={createMockRef<HTMLDivElement>()}
      />
    );

    const frame = container.querySelector(".device-frame");
    expect(frame).not.toBeNull();
    const iframe = frame?.querySelector("iframe.live-preview-frame");
    expect(iframe).not.toBeNull();
  });
});
