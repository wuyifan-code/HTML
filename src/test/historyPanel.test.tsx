import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistoryDrawer } from "../components/HistoryDrawer";
import type { HistoryDisplayItem } from "../utils/historySummary";

const items: HistoryDisplayItem[] = [
  {
    index: 0,
    title: "初始版本",
    detail: "载入当前 HTML",
    isCurrent: false,
    timestamp: 1,
    category: "Edit",
    timeLabel: "10:00",
    dateLabel: "Today",
  },
  {
    index: 1,
    title: "修改文本",
    detail: "p - 第二版",
    isCurrent: true,
    timestamp: 2,
    category: "Text",
    timeLabel: "10:01",
    dateLabel: "Today",
  },
];

describe("HistoryDrawer", () => {
  it("renders the supplied design structure and jumps to a selected version", () => {
    const onJumpTo = vi.fn();
    render(
      <HistoryDrawer
        items={items}
        onJumpTo={onJumpTo}
        onClose={() => {}}
        onClearAll={() => {}}
      />
    );

    expect(screen.getByRole("dialog", { name: "History" })).toBeInTheDocument();
    expect(screen.getByLabelText(/修改文本.*当前版本/)).toHaveAttribute("aria-current", "step");
    fireEvent.click(screen.getByLabelText(/初始版本/));
    expect(onJumpTo).toHaveBeenCalledWith(0);
  });

  it("focuses close, closes on Escape, and only offers clear for multiple versions", () => {
    const onClose = vi.fn();
    const onClearAll = vi.fn();
    const windowEscapeHandler = vi.fn();
    window.addEventListener("keydown", windowEscapeHandler);
    const { rerender } = render(
      <HistoryDrawer
        items={items}
        onJumpTo={() => {}}
        onClose={onClose}
        onClearAll={onClearAll}
      />
    );

    expect(screen.getByRole("button", { name: "关闭历史记录" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Clear all history" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(windowEscapeHandler).not.toHaveBeenCalled();
    window.removeEventListener("keydown", windowEscapeHandler);

    rerender(
      <HistoryDrawer
        items={[items[1]]}
        onJumpTo={() => {}}
        onClose={onClose}
        onClearAll={onClearAll}
      />
    );
    expect(screen.queryByRole("button", { name: "Clear all history" })).not.toBeInTheDocument();
  });
});
