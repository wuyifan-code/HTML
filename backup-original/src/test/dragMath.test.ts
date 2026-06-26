import { describe, expect, it } from "vitest";
import { DRAG_ACTIVATION_PX, clamp, computeDragPosition, shouldActivateDrag } from "../utils/dragMath";

describe("dragMath constants", () => {
  it("exposes a sensible activation threshold", () => {
    expect(DRAG_ACTIVATION_PX).toBe(4);
  });
});

describe("clamp", () => {
  it("returns the value when inside [min, max]", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("clamps to min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when value is above range", () => {
    expect(clamp(20, 0, 10)).toBe(10);
  });
});

describe("shouldActivateDrag", () => {
  it("returns false for small jitter under the threshold", () => {
    expect(shouldActivateDrag(2, 2)).toBe(false);
    expect(shouldActivateDrag(3, 0)).toBe(false);
  });

  it("returns true once the distance crosses the threshold", () => {
    expect(shouldActivateDrag(4, 0)).toBe(true);
    expect(shouldActivateDrag(0, 4)).toBe(true);
    expect(shouldActivateDrag(3, 3)).toBe(true); // hypot ≈ 4.24
  });

  it("handles negative deltas", () => {
    expect(shouldActivateDrag(-4, 0)).toBe(true);
  });
});

describe("computeDragPosition", () => {
  it("translates the element by the given delta inside the frame", () => {
    const next = computeDragPosition({
      startLeft: 100,
      startTop: 200,
      dx: 50,
      dy: -30,
      elementWidth: 120,
      elementHeight: 40,
      frameWidth: 1000,
      frameHeight: 800,
    });
    expect(next).toEqual({ left: 150, top: 170 });
  });

  it("clamps to the right/bottom frame edges", () => {
    // right edge: 1000 - 120 = 880; bottom edge: 800 - 40 = 760
    const next = computeDragPosition({
      startLeft: 100,
      startTop: 200,
      dx: 1000,
      dy: 1000,
      elementWidth: 120,
      elementHeight: 40,
      frameWidth: 1000,
      frameHeight: 800,
    });
    expect(next).toEqual({ left: 880, top: 760 });
  });

  it("clamps to the left/top frame edges", () => {
    const next = computeDragPosition({
      startLeft: 100,
      startTop: 200,
      dx: -1000,
      dy: -1000,
      elementWidth: 120,
      elementHeight: 40,
      frameWidth: 1000,
      frameHeight: 800,
    });
    expect(next).toEqual({ left: 0, top: 0 });
  });

  it("respects a zero-delta noop", () => {
    const next = computeDragPosition({
      startLeft: 100,
      startTop: 200,
      dx: 0,
      dy: 0,
      elementWidth: 120,
      elementHeight: 40,
      frameWidth: 1000,
      frameHeight: 800,
    });
    expect(next).toEqual({ left: 100, top: 200 });
  });

  it("handles a tiny frame where the element is bigger than the frame", () => {
    const next = computeDragPosition({
      startLeft: 100,
      startTop: 200,
      dx: 0,
      dy: 0,
      elementWidth: 600,
      elementHeight: 600,
      frameWidth: 200,
      frameHeight: 200,
    });
    // maxLeft and maxTop both clamp to 0
    expect(next).toEqual({ left: 0, top: 0 });
  });
});