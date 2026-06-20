/**
 * 拖拽相关的纯函数(无 DOM 副作用),便于单元测试和复用
 */

/** 拖动手势激活阈值:超过这个距离才视为"在拖动"而不是"在抖动" */
export const DRAG_ACTIVATION_PX = 4;

/** 简单 clamp */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 判断当前 pointermove 是否应该激活拖动态
 * @param dx 累计横向位移
 * @param dy 累计纵向位移
 */
export function shouldActivateDrag(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) >= DRAG_ACTIVATION_PX;
}

export interface DragClampInput {
  /** 拖动开始时的元素矩形 */
  startLeft: number;
  startTop: number;
  /** 当前 pointermove 累计的位移 */
  dx: number;
  dy: number;
  /** 元素尺寸 */
  elementWidth: number;
  elementHeight: number;
  /** 父级可视区域 */
  frameWidth: number;
  frameHeight: number;
}

export interface DragClampResult {
  left: number;
  top: number;
}

/**
 * 根据拖动状态计算元素的下一帧 top/left,完全夹紧在可视范围内。
 * 元素右/下边不能超过 frameWidth/frameHeight;左/上边不能小于 0。
 */
export function computeDragPosition(input: DragClampInput): DragClampResult {
  const maxLeft = Math.max(0, input.frameWidth - input.elementWidth);
  const maxTop = Math.max(0, input.frameHeight - input.elementHeight);
  return {
    left: clamp(input.startLeft + input.dx, 0, maxLeft),
    top: clamp(input.startTop + input.dy, 0, maxTop),
  };
}