/**
 * PretextMeasureBadge — 基于 Pretext 的文本尺寸指示器
 *
 * 核心技术：Pretext prepare/layout 分离模式
 *   在 text/font 不变时跳过 prepare（预计算），
 *   在 width/lineHeight 变化时仅做纯算术 layout。
 *
 * 零 DOM 回流：
 *   传统方案需要渲染到 DOM/getComputedStyle 才能知道文本高度，
 *   Pretext 直接使用 Canvas 测量字形宽度，纯 JS 计算。
 */
import { memo, useMemo } from "react";
import { Ruler } from "lucide-react";
import { usePretextMeasure } from "../hooks/usePretextMeasure";

interface PretextMeasureBadgeProps {
  text: string;
  font: string;
  maxWidth: number;
  lineHeight: number;
}

function PretextMeasureBadgeComponent({
  text,
  font,
  maxWidth,
  lineHeight,
}: PretextMeasureBadgeProps) {
  const { height, lineCount, maxLineWidth } = usePretextMeasure(
    text,
    font,
    maxWidth,
    lineHeight
  );

  // 空文本或无效则不显示
  if (!text.trim() || !font || maxWidth <= 0) return null;

  return (
    <div className="pretext-badge" title="Pretext 预计算文本尺寸（零 DOM 回流）">
      <Ruler size={13} strokeWidth={1.75} />
      <span>
        <strong>{lineCount}</strong> 行 · <strong>{Math.round(height)}</strong> px
        {maxLineWidth > maxWidth && (
          <span className="pretext-badge-warn" title={`最宽行 ${Math.round(maxLineWidth)}px 超出容器 ${maxWidth}px`}>
            {" "}⚠️ {Math.round(maxLineWidth)}px
          </span>
        )}
      </span>
    </div>
  );
}

export const PretextMeasureBadge = memo(PretextMeasureBadgeComponent);
