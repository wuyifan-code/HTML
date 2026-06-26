import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PreviewFrame } from "../components/PreviewFrame";
import type {
  ModalCommand,
  PatchCommand,
  SelectElementCommand,
  SelectedElementSnapshot,
} from "../types/editor";

// Stub iframe-only deps: the iframe will never actually load in jsdom,
// so we don't need to mock the bridge — we just verify the DOM renders.

const noop = () => {};

const baseProps = {
  html: "<!doctype html><html><body><h1>hi</h1></body></html>",
  selectedId: null,
  reloadNonce: 0,
  patchCommand: null as PatchCommand | null,
  modalCommand: null as ModalCommand | null,
  selectCommand: null as SelectElementCommand | null,
  viewportMode: "desktop" as const,
  viewportWidth: 1280,
  viewportHeight: 800,
  isFocusPreview: false,
  onViewportSizeChange: noop,
  onViewportPresetSelect: noop,
  onFitToggle: noop,
  onToggleFocusPreview: noop,
  onElementSelected: noop as (e: SelectedElementSnapshot) => void,
  onModalStateChange: noop,
  onElementAction: noop,
  onElementDragged: noop,
  onReadyChange: noop,
};

describe("Canvas toolbar DOM (refactor)", () => {
  it("renders the new viewport-editor container with exactly two number inputs", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    expect(container.querySelector(".viewport-editor")).not.toBeNull();
    const inputs = container.querySelectorAll('.viewport-editor input[type="number"]');
    expect(inputs.length).toBe(2);
  });

  it("renders a CustomSelect dropdown for presets (not 5 separate preset buttons)", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    // New structure: a single custom-select trigger inside the editor
    expect(container.querySelector(".viewport-editor .custom-select")).not.toBeNull();
    // Old structure: 5 segmented-buttons with the label
    const desktopBtns = Array.from(container.querySelectorAll("button")).filter((b) =>
      Array.from(b.querySelectorAll("span")).some((s) => s.textContent === "桌面")
    );
    // No top-level preset buttons — the only "桌面" text should be inside the dropdown
    expect(desktopBtns.length).toBe(0);
  });

  it("renders the 适配 button inside the editor", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    const fitBtn = container.querySelector(".viewport-fit-btn");
    expect(fitBtn).not.toBeNull();
    expect(fitBtn?.textContent).toMatch(/适配/);
  });

  it("disables inputs when in fit mode", () => {
    const { container } = render(<PreviewFrame {...baseProps} viewportMode="fit" />);
    const inputs = container.querySelectorAll('.viewport-editor input[type="number"]');
    inputs.forEach((input) => {
      expect((input as HTMLInputElement).disabled).toBe(true);
    });
    const fitBtn = container.querySelector(".viewport-fit-btn");
    expect(fitBtn?.className).toMatch(/viewport-fit-btn-active/);
  });

  it("does not render the legacy .canvas-size-control or .preview-mode-control", () => {
    const { container } = render(<PreviewFrame {...baseProps} />);
    expect(container.querySelector(".canvas-size-control")).toBeNull();
    expect(container.querySelector(".preview-mode-control")).toBeNull();
  });

  it("calls onViewportSizeChange when the width input changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <PreviewFrame {...baseProps} onViewportSizeChange={onChange} />
    );
    const widthInput = container.querySelectorAll('.viewport-editor input[type="number"]')[0] as HTMLInputElement;
    // React 19 controls inputs via the native value setter + a synthetic input event
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeSetter?.call(widthInput, "1024");
    widthInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onChange).toHaveBeenCalled();
  });
});
