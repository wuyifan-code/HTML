/**
 * 导出 HTML 验证工具
 *
 * 在导出前检查 HTML 是否包含编辑器内部残留，
 * 确保导出的文件干净、完整、可用。
 */

import { HFT_ID_ATTRIBUTE } from "./editableElement";

export interface ExportWarning {
  type: "internal-attribute" | "internal-element" | "empty-html" | "missing-doctype" | "general";
  message: string;
}

const INTERNAL_ATTRIBUTE_PATTERNS = [
  /data-html-finetune-/i,
  /data-hft-id/i,
];

const EMPTY_HTML_PATTERNS = [
  /^<html>\s*<head>\s*<\/head>\s*<body>\s*<\/body>\s*<\/html>$/i,
  /^(\s|<!--.*?-->)*$/s,
];

/**
 * 验证导出的 HTML，返回警告列表
 */
export function getExportWarnings(html: string): ExportWarning[] {
  const warnings: ExportWarning[] = [];

  // 1. 检查是否为空
  if (!html || html.trim().length === 0) {
    warnings.push({ type: "empty-html", message: "导出的 HTML 为空" });
    return warnings;
  }

  if (EMPTY_HTML_PATTERNS.some((p) => p.test(html.trim()))) {
    warnings.push({ type: "empty-html", message: "导出的 HTML 结构为空，仅包含空文档框架" });
  }

  // 2. 检查是否包含内部属性
  for (const pattern of INTERNAL_ATTRIBUTE_PATTERNS) {
    if (pattern.test(html)) {
      warnings.push({
        type: "internal-attribute",
        message: `导出的 HTML 中仍包含编辑器内部属性（匹配: ${pattern.source}），请检查 cleanHtmlForExport`,
      });
      break;
    }
  }

  // 3. 检查是否包含编辑器内部元素 ID
  if (/html-finetune-bridge-style/i.test(html)) {
    warnings.push({
      type: "internal-element",
      message: "导出的 HTML 中仍包含编辑器内部 style 元素 (#html-finetune-bridge-style)",
    });
  }

  // 4. 检查 doctype
  if (!/^<!doctype\s+html/i.test(html.trim())) {
    warnings.push({
      type: "missing-doctype",
      message: "导出的 HTML 缺少 <!doctype html> 声明",
    });
  }

  return warnings;
}

/**
 * 开发环境下断言导出 HTML 是否干净
 */
export function assertCleanExport(html: string): void {
  if (process.env.NODE_ENV === "development") {
    const warnings = getExportWarnings(html);
    for (const w of warnings) {
      console.warn(`[ExportWarning] ${w.message}`);
    }
  }
}

/**
 * 检查 HTML 中是否还有残留的 hft-id
 */
export function hasResidualHftIds(html: string): boolean {
  const pattern = new RegExp(`${HFT_ID_ATTRIBUTE}=["']`, "i");
  return pattern.test(html);
}
