import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, fireEvent, screen } from "@testing-library/react";
import { ColorField } from "../components/ColorField";
import { COLOR_HISTORY_LIMIT } from "../utils/color";

describe("ColorField history debounce", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not push intermediate keystrokes to history; only the final settled value", () => {
    const onChange = vi.fn();
    render(<ColorField label="文本颜色" value="#000000" onChange={onChange} />);

    const input = document.querySelector("input[type='text']") as HTMLInputElement;
    // 模拟一字一字敲 "#c96442"
    const sequence = ["#", "#c", "#c9", "#c96", "#c964", "#c9644", "#c96442"];
    for (const value of sequence) {
      fireEvent.change(input, { target: { value } });
    }
    // 立即调用 onChange 完成 + setTimeout 排队 → 推进 timers 触发 record
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const stored = window.localStorage.getItem("hft-color-history");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toContain("#c96442");
    // 中间值不应入栈
    expect(parsed).not.toContain("#c");
    expect(parsed).not.toContain("#c9");
    expect(parsed).not.toContain("#c964");
  });

  it("respects the COLOR_HISTORY_LIMIT cap after debounce settles", () => {
    const onChange = vi.fn();
    render(<ColorField label="填充" value="#000000" onChange={onChange} />);
    const input = document.querySelector("input[type='text']") as HTMLInputElement;

    // 输入 8 个不同色,中间不 await
    const colors = ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777", "#888888"];
    for (const value of colors) {
      fireEvent.change(input, { target: { value } });
    }
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const stored = window.localStorage.getItem("hft-color-history");
    const parsed = JSON.parse(stored!);
    // debounce 在最后一次才提交,所以 history 应只有 1 个色 (#888888)
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toBe("#888888");
  });

  it("opens as an accessible popover and closes with Escape", () => {
    const onChange = vi.fn();
    render(<ColorField label="文本颜色" value="#000000" onChange={onChange} />);

    const swatch = screen.getByRole("button", { name: "选择文本颜色" });
    fireEvent.click(swatch);

    const dialog = screen.getByRole("dialog", { name: "文本颜色颜色选择器" });
    expect(dialog.id).toBeTruthy();
    expect(swatch.getAttribute("aria-expanded")).toBe("true");
    expect(swatch.getAttribute("aria-haspopup")).toBe("dialog");
    expect(swatch.getAttribute("aria-controls")).toBe(dialog.id);

    fireEvent.keyDown(document, { key: "Escape" });

    // The popover plays a brief exit animation (~220ms) before unmounting.
    // Advance fake timers past the closing transition to flush it.
    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(document.querySelector(".color-popover")).toBeNull();
    expect(swatch.getAttribute("aria-expanded")).toBe("false");
  });

  it("records keyboard-adjusted picker colors after the debounce settles", () => {
    const onChange = vi.fn();
    render(<ColorField label="文本颜色" value="#808080" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "选择文本颜色" }));
    fireEvent.keyDown(screen.getByRole("slider", { name: "饱和度与明度" }), { key: "ArrowRight" });

    const committed = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(committed).toMatch(/^#[0-9a-f]{6}$/);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const parsed = JSON.parse(window.localStorage.getItem("hft-color-history")!);
    expect(parsed[0]).toBe(committed);
  });
});
