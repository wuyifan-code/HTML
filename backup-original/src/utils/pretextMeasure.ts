/**
 * Pretext 文本测量工具
 *
 * 核心思想（Pretext 技术）:
 *   prepare() — 一次性昂贵工作：归一化文本、分词、用 Canvas 测量字形宽度
 *   layout()  — 廉价热路径：利用缓存的宽度做纯算术计算
 *
 * 对比传统方式:
 *   传统: getComputedStyle / getBoundingClientRect → 触发 layout reflow
 *   Pretext: prepare 预计算 → 热路径仅算术运算，零回流
 *
 * 在本项目中的价值:
 *   1. 大文档编辑时避免 iframe 回流测量文本尺寸
 *   2. 在面板中实时显示文本高度/行数预测
 *   3. 为虚拟化/懒惰渲染提供精确的行高数据
 */
import { prepare, layout, prepareWithSegments, layoutWithLines, measureLineStats, type LayoutLine } from "@chenglou/pretext";

/** 预计算文本句柄缓存 */
const prepareCache = new Map<string, ReturnType<typeof prepare>>();
const prepareSegmentsCache = new Map<string, ReturnType<typeof prepareWithSegments>>();
const MAX_CACHE_ENTRIES = 200;

function cacheKey(text: string, font: string, options?: string): string {
  return `${font}|${options ?? ""}|${text}`;
}

function getCached<K, V>(cache: Map<K, V>, key: K): V | undefined {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

function setCached<K, V>(cache: Map<K, V>, key: K, value: V): void {
  cache.set(key, value);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

/**
 * prepare 的包装版本，带缓存
 * 同 text + font 组合只做一次昂贵测量，后续复用
 */
export function cachedPrepare(
  text: string,
  font: string,
  options?: { whiteSpace?: "normal" | "pre-wrap"; wordBreak?: "normal" | "keep-all"; letterSpacing?: number }
): ReturnType<typeof prepare> {
  const key = cacheKey(text, font, JSON.stringify(options));
  const existing = getCached(prepareCache, key);
  if (existing) return existing;

  const result = prepare(text, font, options);
  setCached(prepareCache, key, result);
  return result;
}

/**
 * prepareWithSegments 的包装版本，带缓存
 */
export function cachedPrepareWithSegments(
  text: string,
  font: string,
  options?: { whiteSpace?: "normal" | "pre-wrap"; wordBreak?: "normal" | "keep-all"; letterSpacing?: number }
): ReturnType<typeof prepareWithSegments> {
  const key = cacheKey(text, font, JSON.stringify(options));
  const existing = getCached(prepareSegmentsCache, key);
  if (existing) return existing;

  const result = prepareWithSegments(text, font, options);
  setCached(prepareSegmentsCache, key, result);
  return result;
}

/** 测量文本高度（核心 API） */
export function measureTextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): { height: number; lineCount: number } {
  const prepared = cachedPrepare(text, font);
  return layout(prepared, maxWidth, lineHeight);
}

/** 测量文本宽度（最宽行） */
export function measureTextMaxWidth(
  text: string,
  font: string,
  maxWidth: number
): { lineCount: number; maxLineWidth: number } {
  const prepared = cachedPrepareWithSegments(text, font);
  return measureLineStats(prepared, maxWidth);
}

/** 获取文本的所有行 */
export function getTextLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): { lines: LayoutLine[]; height: number; lineCount: number } {
  const prepared = cachedPrepareWithSegments(text, font);
  return layoutWithLines(prepared, maxWidth, lineHeight);
}

/**
 * 清除缓存（字体或文本大量变化时调用）
 */
export function clearPretextCache(): void {
  prepareCache.clear();
  prepareSegmentsCache.clear();
}

export function getPretextCacheStats(): { prepareEntries: number; prepareWithSegmentsEntries: number } {
  return {
    prepareEntries: prepareCache.size,
    prepareWithSegmentsEntries: prepareSegmentsCache.size,
  };
}
