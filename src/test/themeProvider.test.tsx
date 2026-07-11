import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EditorProvider, useEditorStore } from "../hooks/useEditorStore";

function ThemeProbe() {
  const { theme, setTheme } = useEditorStore();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>dark</button>
      <button data-testid="set-light" onClick={() => setTheme("light")}>light</button>
    </div>
  );
}

describe("themeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("theme-dark", "theme-light");
  });

  it("defaults to light theme on first mount when nothing is persisted (jsdom has no prefers-color-scheme)", () => {
    render(
      <EditorProvider>
        <ThemeProbe />
      </EditorProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("reads persisted light theme synchronously during init (no flash)", () => {
    window.localStorage.setItem("html-finetune.theme", "light");
    render(
      <EditorProvider>
        <ThemeProbe />
      </EditorProvider>
    );
    // 初始 render 已是 light,无需等 effect 同步
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("setTheme persists to localStorage", () => {
    render(
      <EditorProvider>
        <ThemeProbe />
      </EditorProvider>
    );
    act(() => {
      fireEvent.click(screen.getByTestId("set-light"));
    });
    expect(window.localStorage.getItem("html-finetune.theme")).toBe("light");
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("does not throw when localStorage.setItem is unavailable (Safari private mode)", () => {
    const setItem = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });
    const getItem = vi.fn(() => null);
    const originalSet = window.localStorage.setItem;
    const originalGet = window.localStorage.getItem;
    window.localStorage.setItem = setItem;
    window.localStorage.getItem = getItem;

    try {
      expect(() =>
        render(
          <EditorProvider>
            <ThemeProbe />
          </EditorProvider>
        )
      ).not.toThrow();
      // 切换主题应静默失败,组件仍正常渲染
      expect(() =>
        act(() => {
          fireEvent.click(screen.getByTestId("set-light"));
        })
      ).not.toThrow();
      expect(screen.getByTestId("theme").textContent).toBe("light");
    } finally {
      window.localStorage.setItem = originalSet;
      window.localStorage.getItem = originalGet;
    }
  });

  it("ignores malformed values in storage", () => {
    window.localStorage.setItem("html-finetune.theme", "pumpkin");
    render(
      <EditorProvider>
        <ThemeProbe />
      </EditorProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});

describe("themeProvider geometry preservation", () => {
  it("default inspectorWidth is 320 (design contract)", () => {
    function InspectorProbe() {
      const { inspectorWidth } = useEditorStore();
      return <span data-testid="inspector-width">{inspectorWidth}</span>;
    }
    render(
      <EditorProvider>
        <InspectorProbe />
      </EditorProvider>
    );
    expect(screen.getByTestId("inspector-width").textContent).toBe("320");
  });

  it("default sourceWidth is 280 (design contract)", () => {
    function SourceProbe() {
      const { sourceWidth } = useEditorStore();
      return <span data-testid="source-width">{sourceWidth}</span>;
    }
    render(
      <EditorProvider>
        <SourceProbe />
      </EditorProvider>
    );
    expect(screen.getByTestId("source-width").textContent).toBe("280");
  });
});