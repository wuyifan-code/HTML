import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLabelDrag } from "../hooks/useLabelDrag";

/**
 * 把 hook 挂到虚拟目标上,模拟 pointerdown 后用 window-level PointerEvent 派发 move/up。
 */

function makePointerDownEvent(overrides: Partial<React.PointerEvent<HTMLElement>> = {}): React.PointerEvent<HTMLElement> {
  return {
    button: 0,
    currentTarget: document.createElement("div"),
    pointerId: 1,
    clientX: 0,
    ...overrides,
  } as unknown as React.PointerEvent<HTMLElement>;
}

describe("useLabelDrag", () => {
  it("preserves the unit suffix from the initial value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLabelDrag("1.5em", onChange, { step: 0.1 }));

    act(() => {
      result.current.onPointerDown(makePointerDownEvent({ clientX: 100 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 107 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toMatch(/em$/);
    expect(parseFloat(lastCall)).toBeCloseTo(1.7, 1);
  });

  it("clamps to min/max range", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLabelDrag("50", onChange, { min: 0, max: 100, step: 1 }));
    act(() => {
      result.current.onPointerDown(makePointerDownEvent({ clientX: 0 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 10000 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(parseFloat(lastCall)).toBe(100);
  });

  it("ignores non-left button clicks", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLabelDrag("50", onChange));
    act(() => {
      result.current.onPointerDown(makePointerDownEvent({ button: 2 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 100 }));
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls back to base value when parsed num is NaN (does not write 'NaNpx')", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLabelDrag("auto", onChange, { min: 0 }));
    act(() => {
      result.current.onPointerDown(makePointerDownEvent({ clientX: 0 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 50 }));
    });
    if (onChange.mock.calls.length > 0) {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall).not.toContain("NaN");
    }
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    });
  });

  it("does not leak listeners between mounts (cleanup runs on unmount)", () => {
    const onChange = vi.fn();
    const { result, unmount } = renderHook(() => useLabelDrag("10", onChange));
    act(() => {
      result.current.onPointerDown(makePointerDownEvent({ clientX: 0 }));
    });
    unmount();
    onChange.mockClear();
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 50 }));
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves % unit when value is in percentage", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useLabelDrag("50%", onChange, { step: 1 }));
    act(() => {
      result.current.onPointerDown(makePointerDownEvent({ clientX: 0 }));
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 7 })); // +2 step
    });
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toMatch(/%$/);
    expect(parseFloat(lastCall)).toBeCloseTo(52, 1);
  });
});