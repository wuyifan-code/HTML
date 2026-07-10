import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { ToastRegion, type Toast } from "../components/ui/ToastRegion";

describe("ToastRegion", () => {
  it("renders success toast", () => {
    const toasts: Toast[] = [{ id: "1", type: "success", message: "操作成功" }];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    const toast = document.querySelector(".toast-item.toast-success");
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("操作成功");
  });

  it("renders error toast", () => {
    const toasts: Toast[] = [{ id: "1", type: "error", message: "操作失败" }];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    const toast = document.querySelector(".toast-item.toast-error");
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("操作失败");
  });

  it("renders info toast", () => {
    const toasts: Toast[] = [{ id: "1", type: "info", message: "提示信息" }];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    const toast = document.querySelector(".toast-item.toast-info");
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("提示信息");
  });

  it("renders loading toast", () => {
    const toasts: Toast[] = [{ id: "1", type: "loading", message: "加载中" }];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    const toast = document.querySelector(".toast-item.toast-loading");
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("加载中");
  });

  it("renders nothing when toasts is empty", () => {
    const { container } = render(<ToastRegion toasts={[]} onDismiss={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("stacks multiple toasts", () => {
    const toasts: Toast[] = [
      { id: "1", type: "info", message: "第一条" },
      { id: "2", type: "success", message: "第二条" },
      { id: "3", type: "error", message: "第三条" },
    ];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    const items = document.querySelectorAll(".toast-item");
    expect(items.length).toBe(3);
    expect(items[0]?.textContent).toContain("第一条");
    expect(items[1]?.textContent).toContain("第二条");
    expect(items[2]?.textContent).toContain("第三条");
  });

  it("shows visible class after mounting", async () => {
    const toasts: Toast[] = [{ id: "1", type: "success", message: "可见" }];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    await waitFor(() => {
      const toast = document.querySelector(".toast-item");
      expect(toast?.className).toContain("is-visible");
    });
  });

  it("calls onDismiss when close button is clicked", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const toasts: Toast[] = [{ id: "1", type: "info", message: "可关闭" }];
    render(<ToastRegion toasts={toasts} onDismiss={onDismiss} />);
    const closeBtn = document.querySelector(".toast-item-close") as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    act(() => { vi.advanceTimersByTime(300); });
    expect(onDismiss).toHaveBeenCalledWith("1");
    vi.useRealTimers();
  });

  it("renders role status for accessibility", () => {
    const toasts: Toast[] = [{ id: "1", type: "info", message: "无障碍" }];
    render(<ToastRegion toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
