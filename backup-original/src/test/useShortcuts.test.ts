import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShortcuts } from "../hooks/useShortcuts";

function fireKey(target: EventTarget, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("useShortcuts", () => {
  it("matches mod+Z and mod+shift+Z as distinct combos", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { unmount } = renderHook(() =>
      useShortcuts([
        { combo: "mod+z", handler: undo, allowInInputs: true },
        { combo: "mod+shift+z", handler: redo, allowInInputs: true },
      ])
    );

    fireKey(window, { key: "z", ctrlKey: true });
    fireKey(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("skips handlers when typing in an input unless allowInInputs is set", () => {
    const handler = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    renderHook(() => useShortcuts([{ combo: "mod+d", handler }]));
    fireKey(input, { key: "d", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("allows Delete when not focused inside an input", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ combo: "delete", handler }]));
    fireKey(window, { key: "Delete" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("matches digit combos like mod+2", () => {
    const handler = vi.fn();
    renderHook(() => useShortcuts([{ combo: "mod+2", handler }]));
    fireKey(window, { key: "2", metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});