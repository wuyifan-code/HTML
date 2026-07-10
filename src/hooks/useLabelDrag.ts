import { useCallback, useEffect, useMemo, useRef } from "react";

interface DragOptions {
  step?: number;
  min?: number;
  max?: number;
}

interface ActiveDrag {
  pointerId: number;
  startX: number;
  baseVal: number;
  unit: string;
  decimalPlaces: number;
  onChange: (nextValue: string) => void;
  min: number;
  max: number;
  step: number;
}

/**
 * 把标签左右拖拽事件转换为数值变化。
 *
 * 修复历史:
 * - listener 之前在 React handler 里直接挂 window,cleanup 依赖 pointerup;
 *   若被另一 React 组件 preventDefault 拦截就泄露,React 重渲还会多挂。
 * - NaN 输入未防护,会写入 onChange("NaNpx")。
 * - 单位保留被 NumericUnitField 提前剥掉,实际上传值是纯数字,em/% 都被退化为 px。
 * - releasePointerCapture 未 try/catch,别的元素偷走 capture 时会抛错。
 */
export function useLabelDrag(
  value: string,
  onChange: (nextValue: string) => void,
  options: DragOptions = {}
) {
  const step = options.step ?? 1;
  const min = options.min ?? 0;
  const max = options.max ?? 9999;
  const dragRef = useRef<ActiveDrag | null>(null);

  // 解析单位与精度;对 NaN 输入用 min 作为 base,避免写入 NaN
  const parsed = useMemo(() => parseValue(value), [value]);
  const decimalPlaces = useMemo(
    () => (step < 1 ? Math.max(0, (String(step).split(".")[1]?.length ?? 0)) : 0),
    [step]
  );

  // 监听器只挂一次,所有 handler 通过 ref 共享 drag 状态 ——
  // 避免 React 重渲染导致多挂 listener,也确保 cleanup 始终执行。
  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      // 每 3.5 像素一个 step
      const rawChange = (deltaX / 3.5) * drag.step;
      let nextNum = drag.baseVal + rawChange;
      nextNum = Math.max(drag.min, Math.min(drag.max, nextNum));
      // NaN 防御:任何不合法结果都退回 base
      if (!Number.isFinite(nextNum)) {
        nextNum = drag.baseVal;
      }
      const formatted = Number(nextNum.toFixed(drag.decimalPlaces));
      drag.onChange(`${formatted}${drag.unit}`);
    };

    const handleUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      // releasePointerCapture 可能因别的元素偷走 capture 而抛错 ——
      // try/catch 确保 cleanup 路径不会在错误路径上提前退出
      try {
        if (event.target instanceof Element) {
          (event.target as Element).releasePointerCapture?.(event.pointerId);
        }
      } catch {
        // ignore
      }
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      dragRef.current = null;
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore — capture 不是关键路径
      }
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        baseVal: Number.isFinite(parsed.num) ? parsed.num : min,
        unit: parsed.unit,
        decimalPlaces,
        onChange,
        min,
        max,
        step,
      };
    },
    [parsed.num, parsed.unit, decimalPlaces, onChange, min, max, step]
  );

  return { onPointerDown: handlePointerDown };
}

function parseValue(value: string): { num: number; unit: string } {
  const match = value.match(/^(-?\d*\.?\d+)([a-zA-Z%]*)$/);
  if (!match) return { num: NaN, unit: "" };
  const num = Number.parseFloat(match[1]);
  return { num: Number.isFinite(num) ? num : NaN, unit: match[2] ?? "" };
}