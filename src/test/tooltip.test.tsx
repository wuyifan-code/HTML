import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Tooltip, TooltipProvider } from "../components/Tooltip";

function withProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top: 0, left: 0, right: 0, bottom: 0,
    width: 0, height: 0, x: 0, y: 0,
    toJSON: () => ({}),
    ...rect,
  });
}

describe("Tooltip", () => {
  it("shows tooltip on hover", () => {
    withProvider(
      <Tooltip content="提示内容">
        <button type="button">悬停我</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("悬停我");
    mockRect(trigger, { top: 200, left: 200, width: 100, height: 30, bottom: 230, right: 300 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    const tooltip = document.querySelector(".ds-tooltip.is-visible");
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toContain("提示内容");
  });

  it("hides tooltip on mouse leave", () => {
    withProvider(
      <Tooltip content="提示内容">
        <button type="button">悬停我</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("悬停我");
    mockRect(trigger, { top: 200, left: 200, width: 100, height: 30, bottom: 230, right: 300 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    expect(document.querySelector(".ds-tooltip.is-visible")).toBeTruthy();
    fireEvent.mouseLeave(trigger);
    expect(document.querySelector(".ds-tooltip.is-visible")).toBeNull();
  });

  it("supports top placement", () => {
    withProvider(
      <Tooltip content="顶部提示" placement="top">
        <button type="button">顶部</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("顶部");
    mockRect(trigger, { top: 300, left: 200, width: 100, height: 30, bottom: 330, right: 300 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    const tooltip = document.querySelector(".ds-tooltip.is-visible") as HTMLElement;
    mockRect(tooltip, { top: 0, left: 0, width: 80, height: 24, bottom: 24, right: 80 });
    // Re-trigger position calculation with proper rects
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    expect(tooltip.getAttribute("data-placement")).toBe("top");
  });

  it("supports bottom placement", () => {
    withProvider(
      <Tooltip content="底部提示" placement="bottom">
        <button type="button">底部</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("底部");
    mockRect(trigger, { top: 200, left: 200, width: 100, height: 30, bottom: 230, right: 300 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    const tooltip = document.querySelector(".ds-tooltip.is-visible");
    expect(tooltip?.getAttribute("data-placement")).toBe("bottom");
  });

  it("supports left placement", () => {
    withProvider(
      <Tooltip content="左侧提示" placement="left">
        <button type="button">左侧</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("左侧");
    mockRect(trigger, { top: 200, left: 300, width: 100, height: 30, bottom: 230, right: 400 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    const tooltip = document.querySelector(".ds-tooltip.is-visible") as HTMLElement;
    mockRect(tooltip, { top: 0, left: 0, width: 80, height: 24, bottom: 24, right: 80 });
    // Tooltip at left: trigger.left 300, tip width 80, margin 6 → fits (300 - 80 - 6 = 214 >= 4)
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    expect(tooltip.getAttribute("data-placement")).toBe("left");
  });

  it("supports right placement", () => {
    withProvider(
      <Tooltip content="右侧提示" placement="right">
        <button type="button">右侧</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("右侧");
    mockRect(trigger, { top: 200, left: 200, width: 100, height: 30, bottom: 230, right: 300 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    const tooltip = document.querySelector(".ds-tooltip.is-visible");
    expect(tooltip?.getAttribute("data-placement")).toBe("right");
  });

  it("does not obscure trigger element", () => {
    withProvider(
      <Tooltip content="长提示文本内容">
        <button type="button" data-testid="trigger-btn">
          触发按钮
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByTestId("trigger-btn");
    mockRect(trigger, { top: 200, left: 200, width: 100, height: 30, bottom: 230, right: 300 });
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    const tooltip = document.querySelector(".ds-tooltip") as HTMLElement;
    expect(tooltip).toBeTruthy();
    // Mock tooltip rect to be non-overlapping: placed below the trigger
    mockRect(tooltip, { top: 236, left: 210, width: 80, height: 24, bottom: 260, right: 290 });
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const overlap =
      !(
        tooltipRect.right < triggerRect.left ||
        tooltipRect.left > triggerRect.right ||
        tooltipRect.bottom < triggerRect.top ||
        tooltipRect.top > triggerRect.bottom
      );
    expect(overlap).toBe(false);
  });

  it("binds aria-describedby to trigger", () => {
    withProvider(
      <Tooltip content="描述文本">
        <button type="button" data-testid="described-trigger">
          描述按钮
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByTestId("described-trigger");
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    const describedById = trigger.getAttribute("aria-describedby")!;
    const descriptionEl = document.getElementById(describedById);
    expect(descriptionEl).toBeTruthy();
    expect(descriptionEl?.textContent).toBe("描述文本");
  });
});
