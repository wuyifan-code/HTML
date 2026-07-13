import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../App";
import { EditorProvider } from "../hooks/useEditorStore";

// 跳过 useEditorHistory 等 hook 需要的 iframe/postMessage 设置 ——
// App 渲染时只测 cheatsheet 状态机的可达性,
// 不验证 iframe 通信。

// App 调用 useEditorStore(),所以测试需要包裹 EditorProvider。
function renderApp() {
  return render(
    <EditorProvider>
      <App />
    </EditorProvider>
  );
}

describe("Cheatsheet overlay (App)", () => {
  it("默认不显示 cheatsheet", { timeout: 30000 }, () => {
    renderApp();
    expect(document.querySelector(".cheatsheet")).toBeNull();
    expect(document.querySelector(".cheatsheet-backdrop")).toBeNull();
  });

  it("点击 ? 按钮打开 cheatsheet,显示至少 8 条快捷键", { timeout: 30000 }, () => {
    renderApp();
    const trigger = screen.getByRole("button", { name: /快捷键/ });
    act(() => {
      fireEvent.click(trigger);
    });
    const cheatsheet = document.querySelector(".cheatsheet");
    expect(cheatsheet).not.toBeNull();
    const rows = cheatsheet?.querySelectorAll(".cheatsheet-row") ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(8);
  });

  it("cheatsheet 包含 <kbd> 元素显示快捷键文本", () => {
    renderApp();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /快捷键/ }));
    });
    const kbds = document.querySelectorAll(".cheatsheet kbd");
    expect(kbds.length).toBeGreaterThan(0);
    const allText = Array.from(kbds).map((k) => k.textContent).join(" ");
    expect(allText).toMatch(/Z/);
    expect(allText).toMatch(/Esc|F|Ctrl/);
  });

  it("uses labelled dialog semantics and a definition list for shortcut rows", () => {
    renderApp();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /快捷键/ }));
    });
    const dialog = screen.getByRole("dialog", { name: "快捷键" });
    expect(dialog.getAttribute("aria-labelledby")).toBe("shortcuts-dialog-title");
    expect(dialog.getAttribute("aria-describedby")).toBe("shortcuts-dialog-description");
    expect(dialog.querySelector("dl")).not.toBeNull();
  });

  it("focuses the close control on open and restores focus to the trigger", () => {
    renderApp();
    const trigger = screen.getByRole("button", { name: /快捷键/ });
    act(() => {
      fireEvent.click(trigger);
    });
    const closeButton = screen.getByRole("button", { name: "关闭快捷键" });
    expect(document.activeElement).toBe(closeButton);

    act(() => {
      fireEvent.click(closeButton);
    });
    expect(document.activeElement).toBe(trigger);
  });

  it("点击 backdrop 关闭 cheatsheet", () => {
    renderApp();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /快捷键/ }));
    });
    expect(document.querySelector(".cheatsheet")).not.toBeNull();
    const backdrop = document.querySelector(".cheatsheet-backdrop");
    expect(backdrop).not.toBeNull();
    act(() => {
      fireEvent.click(backdrop as HTMLElement);
    });
    expect(document.querySelector(".cheatsheet")).toBeNull();
  });

  it("点击 cheatsheet 头部关闭按钮关闭面板", () => {
    renderApp();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /快捷键/ }));
    });
    const closeBtn = document.querySelector(".cheatsheet-head .icon-btn") as HTMLElement;
    expect(closeBtn).not.toBeNull();
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(document.querySelector(".cheatsheet")).toBeNull();
  });

  it("Esc 键关闭 cheatsheet", () => {
    renderApp();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /快捷键/ }));
    });
    expect(document.querySelector(".cheatsheet")).not.toBeNull();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(document.querySelector(".cheatsheet")).toBeNull();
  });

  it("点击 cheatsheet 内部不冒泡到 backdrop(不会被误关)", () => {
    renderApp();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /快捷键/ }));
    });
    const cheatsheet = document.querySelector(".cheatsheet") as HTMLElement;
    act(() => {
      fireEvent.click(cheatsheet);
    });
    expect(document.querySelector(".cheatsheet")).not.toBeNull();
  });
});
