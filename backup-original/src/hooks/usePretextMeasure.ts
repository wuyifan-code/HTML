/**
 * usePretextMeasure — React Hook
 *
 * 利用 Pretext 技术在不触发 DOM 回流的前提下测量文本尺寸。
 *
 * 设计遵循 Pretext 的 prepare/layout 分离原则:
 *   prepare（预计算）在 text/font 不变时跳过
 *   layout（热路径）在 width/lineHeight 变化时纯算术计算
 *
 * 应用场景:
 *   1. 大文档编辑时预估文本高度，避免 iframe 回流
 *   2. 在 Inspector 面板实时显示行数/高度预测
 *   3. 未来可用于虚拟滚动策略
 */
import { useMemo } from "react";
import { layout, measureLineStats, layoutWithLines } from "@chenglou/pretext";
import { cachedPrepare, cachedPrepareWithSegments } from "../utils/pretextMeasure";
import type { LayoutLine } from "@chenglou/pretext";

interface PretextMeasureResult {
  /** 文本总高度（px） */
  height: number;
  /** 总行数 */
  lineCount: number;
  /** 最宽行宽度 */
  maxLineWidth: number;
  /** 各行详情（懒计算，仅 getLines 时填充） */
  lines: LayoutLine[];
}

/**
 * 核心 Hook: 测量文本在不触发 DOM 回流时的渲染尺寸
 *
 * @param text      要测量的文本
 * @param font      CSS font 简写，如 "16px Inter"
 * @param maxWidth  容器最大宽度（px）
 * @param lineHeight 行高（px）
 * @param getLines  是否同时获取各行详情（默认 false）
 */
export function usePretextMeasure(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  getLines = false
): PretextMeasureResult {
  // ========== Prepare 阶段（text/font 不变时跳过） ==========
  const prepared = useMemo(() => {
    if (!text.trim() || !font) return null;
    return cachedPrepare(text, font);
  }, [text, font]);

  const preparedSegments = useMemo(() => {
    if (!text.trim() || !font) return null;
    return cachedPrepareWithSegments(text, font);
  }, [text, font]);

  // ========== Layout 阶段（纯算术热路径） ==========
  return useMemo((): PretextMeasureResult => {
    if (!prepared || maxWidth <= 0) {
      return { height: 0, lineCount: 0, maxLineWidth: 0, lines: [] };
    }

    // 高度计算（热路径，纯算术）
    const { height, lineCount } = layout(prepared, maxWidth, lineHeight || 22);

    let lines: LayoutLine[] = [];
    let maxLineWidth = 0;

    if (getLines && preparedSegments) {
      try {
        const result = layoutWithLines(preparedSegments, maxWidth, lineHeight || 22);
        lines = result.lines;
        maxLineWidth = lines.length > 0
          ? Math.max(...lines.map((l) => l.width), 0)
          : 0;
      } catch {
        // 降级
      }
    } else if (preparedSegments) {
      try {
        const stats = measureLineStats(preparedSegments, maxWidth);
        maxLineWidth = stats.maxLineWidth;
      } catch {
        // 降级
      }
    }

    return { height, lineCount, maxLineWidth, lines };
  }, [prepared, preparedSegments, maxWidth, lineHeight, getLines]);
}

/**
 * 简化版: 只测量高度
 */
export function usePretextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): number {
  return usePretextMeasure(text, font, maxWidth, lineHeight).height;
}

/**
 * 简化版: 只测量行数
 */
export function usePretextLineCount(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): number {
  return usePretextMeasure(text, font, maxWidth, lineHeight).lineCount;
}
