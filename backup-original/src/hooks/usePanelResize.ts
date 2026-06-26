import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface UsePanelResizeOptions {
  /** 工作区 DOM 引用 */
  workspaceRef: React.RefObject<HTMLElement | null>;
  /** 当前源码区宽度 */
  sourceWidth: number;
  /** 当前检查器宽度 */
  inspectorWidth: number;
  /** 设置源码区宽度 */
  setSourceWidth: (width: number) => void;
  /** 设置检查器宽度 */
  setInspectorWidth: (width: number) => void;
  /** 源码面板放置位置 */
  sourcePanelPlacement: "side" | "bottom";
}

const RESIZER_WIDTH = 12;
const MIN_SOURCE_WIDTH = 280;
const MIN_INSPECTOR_WIDTH = 286;
const MIN_PREVIEW_WIDTH = 520;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 面板拖拽缩放 Hook
 *
 * 从 App.tsx 提取，封装 source/inspector 面板的 PointerEvent 拖拽逻辑。
 */
export function usePanelResize({
  workspaceRef,
  sourceWidth,
  inspectorWidth,
  setSourceWidth,
  setInspectorWidth,
  sourcePanelPlacement,
}: UsePanelResizeOptions) {
  const startSourceWidthRef = useRef(sourceWidth);
  const startInspectorWidthRef = useRef(inspectorWidth);

  const startPanelResize = useCallback(
    (panel: "source" | "inspector") => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (sourcePanelPlacement !== "side") return;
      const workspace = workspaceRef.current;
      if (!workspace) return;

      event.preventDefault();
      const rect = workspace.getBoundingClientRect();
      startSourceWidthRef.current = sourceWidth;
      startInspectorWidthRef.current = inspectorWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const availableWidth = rect.width - RESIZER_WIDTH * 2;

        if (panel === "source") {
          const nextWidth = clamp(
            moveEvent.clientX - rect.left,
            MIN_SOURCE_WIDTH,
            Math.max(MIN_SOURCE_WIDTH, availableWidth - startInspectorWidthRef.current - MIN_PREVIEW_WIDTH)
          );
          setSourceWidth(nextWidth);
          return;
        }

        const nextWidth = clamp(
          rect.right - moveEvent.clientX,
          MIN_INSPECTOR_WIDTH,
          Math.max(MIN_INSPECTOR_WIDTH, availableWidth - startSourceWidthRef.current - MIN_PREVIEW_WIDTH)
        );
        setInspectorWidth(nextWidth);
      };

      const handlePointerUp = () => {
        document.body.classList.remove("is-resizing-panels");
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      document.body.classList.add("is-resizing-panels");
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [workspaceRef, sourceWidth, inspectorWidth, setSourceWidth, setInspectorWidth, sourcePanelPlacement]
  );

  return { startPanelResize };
}
