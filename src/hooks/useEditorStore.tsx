import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ZoomMode } from "../types/editor";

export interface ViewportSize {
  width: number;
  height: number;
}

type ThemeMode = "dark" | "light";
const THEME_STORAGE_KEY = "html-finetune.theme";

/* ── Notion-style theme switching: pure CSS transition, no JS interpolation ── */

function readSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage disabled — fall through
  }
  // Follow OS preference when no manual choice
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function persistTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // quota exceeded / privacy mode — silently discard
  }
}

interface EditorContextProps {
  sourceWidth: number;
  setSourceWidth: (w: number) => void;
  inspectorWidth: number;
  setInspectorWidth: (w: number) => void;
  isSourceCollapsed: boolean;
  setIsSourceCollapsed: (c: boolean) => void;
  isInspectorCollapsed: boolean;
  setIsInspectorCollapsed: (c: boolean) => void;
  zoomMode: ZoomMode;
  setZoomMode: (mode: ZoomMode) => void;
  viewportSize: ViewportSize;
  setViewportSize: (size: ViewportSize | ((prev: ViewportSize) => ViewportSize)) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

const EditorContext = createContext<EditorContextProps | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [sourceWidth, setSourceWidth] = useState(280);
  const [inspectorWidth, setInspectorWidth] = useState(360);
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit");
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 1200,
    height: 800,
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  // 初始化时同步从 localStorage 读 + 同步 className,避免挂载后 effect 覆盖造成的"先闪后稳"双渲染
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const t = readSavedTheme();
    if (typeof document !== "undefined") {
      if (t === "dark") {
        document.documentElement.classList.add("theme-dark");
        document.documentElement.classList.remove("theme-light");
      } else {
        document.documentElement.classList.add("theme-light");
        document.documentElement.classList.remove("theme-dark");
      }
    }
    return t;
  });

  useEffect(() => {
    // 初始挂载时 state init 已经同步设了 className,这里不重复。
    // 仅当 setTheme 触发后续变更时,走 applyThemeTransition(包含遮罩过渡)。
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    persistTheme(nextTheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (nextTheme === "dark") {
        root.classList.add("theme-dark");
        root.classList.remove("theme-light");
      } else {
        root.classList.add("theme-light");
        root.classList.remove("theme-dark");
      }
    }
  }, []);

  useEffect(() => {
    // Follow OS color-scheme changes only when the user hasn't made a manual choice.
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    try {
      if (window.localStorage.getItem(THEME_STORAGE_KEY)) return; // user already chose
    } catch { return; }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? "dark" : "light");
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add("theme-dark");
        root.classList.remove("theme-light");
      } else {
        root.classList.add("theme-light");
        root.classList.remove("theme-dark");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <EditorContext.Provider
      value={useMemo(
        () => ({
          sourceWidth,
          setSourceWidth,
          inspectorWidth,
          setInspectorWidth,
          isSourceCollapsed,
          setIsSourceCollapsed,
          isInspectorCollapsed,
          setIsInspectorCollapsed,
          zoomMode,
          setZoomMode,
          viewportSize,
          setViewportSize,
          isHistoryOpen,
          setIsHistoryOpen,
          isFocusMode,
          setIsFocusMode,
          theme,
          setTheme,
        }),
        [
          sourceWidth,
          inspectorWidth,
          isSourceCollapsed,
          isInspectorCollapsed,
          zoomMode,
          viewportSize,
          isHistoryOpen,
          isFocusMode,
          theme,
          setTheme,
        ]
      )}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorStore() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorStore must be used within an EditorProvider");
  }
  return context;
}
