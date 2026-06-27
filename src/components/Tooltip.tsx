/**
 * 自定义 Tooltip — 取代原生 `title` 属性。
 *
 * 设计目标：
 *   - 统一的深色毛玻璃视觉风格（与设计系统一致）
 *   - 自动 flip（顶部优先，空间不足翻到对面）
 *   - viewport 边界避让
 *   - fade + translateY 微交互动画
 *   - ARIA: role="tooltip" + aria-describedby
 *   - 单 portal 容器（同一时刻只显示一个 tooltip）
 */

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FocusEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TooltipContextValue {
  show: (params: ShowParams) => void;
  hide: (id: string) => void;
}

interface ShowParams {
  id: string;
  anchor: HTMLElement;
  content: ReactNode;
  placement: TooltipPlacement;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShowParams | null>(null);

  const show = useCallback((params: ShowParams) => {
    setState(params);
  }, []);

  const hide = useCallback((id: string) => {
    setState((current) => (current?.id === id ? null : current));
  }, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {state ? <TooltipLayer {...state} onDismiss={() => hide(state.id)} /> : null}
    </TooltipContext.Provider>
  );
}

interface TooltipLayerProps extends ShowParams {
  onDismiss: () => void;
}

function TooltipLayer({ anchor, content, placement, onDismiss }: TooltipLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; actual: TooltipPlacement } | null>(null);
  const [visible, setVisible] = useState(false);

  const computePosition = useCallback(() => {
    const rect = anchor.getBoundingClientRect();
    const tip = ref.current;
    if (!tip) return;

    const tipRect = tip.getBoundingClientRect();
    const margin = 6; // 按钮边缘到 tooltip 的间距
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 默认 placement，flip 策略：空间不够则翻到对面
    let actual = placement;
    if (placement === "top" && rect.top - tipRect.height - margin < 4) actual = "bottom";
    if (placement === "bottom" && rect.bottom + tipRect.height + margin > vh - 4) actual = "top";
    if (placement === "left" && rect.left - tipRect.width - margin < 4) actual = "right";
    if (placement === "right" && rect.right + tipRect.width + margin > vw - 4) actual = "left";

    let top = 0;
    let left = 0;
    switch (actual) {
      case "top":
        top = rect.top - tipRect.height - margin;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.left - tipRect.width - margin;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.right + margin;
        break;
    }

    // 横向/纵向边界避让：超出视口则夹紧到视口内
    const pad = 4;
    left = Math.max(pad, Math.min(left, vw - tipRect.width - pad));
    top = Math.max(pad, Math.min(top, vh - tipRect.height - pad));

    setCoords({ top, left, actual });
  }, [anchor, placement]);

  useEffect(() => {
    computePosition();
    setVisible(true);
    const handle = () => computePosition();
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [computePosition]);

  // 点击空白处关闭
  useEffect(() => {
    const handle = (event: globalThis.MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      if (anchor.contains(event.target as Node)) return;
      onDismiss();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [anchor, onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      data-placement={coords?.actual ?? placement}
      className={`ds-tooltip${visible ? " is-visible" : ""}`}
      style={{
        position: "fixed",
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        visibility: visible ? "visible" : "hidden",
      }}
    >
      {content}
    </div>,
    document.body,
  );
}

interface TooltipProps {
  content: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  children: ReactElement;
}

type ChildProps = {
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onBlur?: FocusEventHandler<HTMLElement>;
  "aria-describedby"?: string;
};

export function Tooltip({
  content,
  placement = "top",
  delay = 120,
  disabled = false,
  children,
}: TooltipProps) {
  const ctx = useContext(TooltipContext);
  const id = useId();
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showFor = useCallback(
    (anchor: HTMLElement) => {
      if (!ctx) return;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        ctx.show({ id, anchor, content, placement });
      }, delay);
    },
    [ctx, clearTimer, id, content, placement, delay],
  );

  const hide = useCallback(() => {
    clearTimer();
    ctx?.hide(id);
  }, [clearTimer, ctx, id]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const child = Children.only(children);
  if (!isValidElement(child)) return child;

  const describedBy = "tooltip-" + id;
  const childProps = child.props as ChildProps;

  const onMouseEnter: MouseEventHandler<HTMLElement> = (event: MouseEvent<HTMLElement>) => {
    if (!disabled) showFor(event.currentTarget);
    childProps.onMouseEnter?.(event);
  };
  const onMouseLeave: MouseEventHandler<HTMLElement> = (event: MouseEvent<HTMLElement>) => {
    hide();
    childProps.onMouseLeave?.(event);
  };
  const onFocus: FocusEventHandler<HTMLElement> = (event: FocusEvent<HTMLElement>) => {
    if (!disabled) showFor(event.currentTarget);
    childProps.onFocus?.(event);
  };
  const onBlur: FocusEventHandler<HTMLElement> = (event: FocusEvent<HTMLElement>) => {
    hide();
    childProps.onBlur?.(event);
  };

  const enhanced = cloneElement(child as ReactElement<ChildProps>, {
    "aria-describedby": disabled ? undefined : describedBy,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  });

  return (
    <>
      {enhanced}
      {!disabled && (
        <span id={describedBy} style={{ display: "none" }}>
          {typeof content === "string" ? content : ""}
        </span>
      )}
    </>
  );
}
