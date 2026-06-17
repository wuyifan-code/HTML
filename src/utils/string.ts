/**
 * 共享字符串工具函数
 *
 * 从 domTree.ts / historySummary.ts 提取，消除重复。
 */

/** 归一化空白：多个空白符合并为单个空格，去除首尾 */
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** 截断文本至最大长度 */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
