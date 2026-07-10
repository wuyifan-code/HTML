import type { DomTreeNode } from "../types/editor";
import {
  HFT_ID_ATTRIBUTE,
  getElementClassName,
  getNormalizedTagName,
  isEditableElement,
  isEditableSvgTextElement,
  isRootSvgElement,
  isSvgImageElement,
} from "./editableElement";
import { parseHtmlReadOnly } from "./injectEditableIds";
import { normalizeText, truncate } from "./string";

const MAX_LABEL_LENGTH = 48;

export function buildEditableDomTree(html: string): DomTreeNode[] {
  const documentRef = parseHtmlReadOnly(html);
  const nodes: DomTreeNode[] = [];

  walkElement(documentRef.body, 0, nodes);

  return nodes;
}

function walkElement(element: Element, depth: number, nodes: DomTreeNode[]): void {
  if (isEditableElement(element)) {
    const hftId = element.getAttribute(HFT_ID_ATTRIBUTE);
    if (hftId) {
      const text = getNodeText(element);
      nodes.push({
        hftId,
        tagName: element.tagName.toLowerCase(),
        label: createNodeLabel(element, text),
        text,
        depth,
        className: getElementClassName(element),
        id: element.id || "",
      });
    }
  }

  Array.from(element.children).forEach((child) => {
    walkElement(child, depth + 1, nodes);
  });
}

function createNodeLabel(element: Element, text: string): string {
  const tagName = getNormalizedTagName(element);
  const id = element.id ? `#${element.id}` : "";
  const rawClassName = getElementClassName(element);
  const className =
    rawClassName.trim()
      ? `.${rawClassName.trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
  const preview = text ? ` ${truncate(text, MAX_LABEL_LENGTH)}` : "";

  return `${tagName}${id}${className}${preview}`;
}

function getNodeText(element: Element): string {
  if (element instanceof HTMLImageElement) {
    return normalizeText(element.getAttribute("alt") || element.getAttribute("src") || "图片");
  }
  if (isEditableSvgTextElement(element)) {
    return normalizeText(element.textContent ?? "");
  }
  if (isSvgImageElement(element)) {
    return normalizeText(
      element.getAttribute("href") ||
        element.getAttribute("xlink:href") ||
        element.getAttribute("aria-label") ||
        "svg image"
    );
  }
  if (isRootSvgElement(element)) {
    const svgTitle = element.querySelector("title")?.textContent;
    const ariaLabel = element.getAttribute("aria-label");
    const className = getElementClassName(element);
    return normalizeText(svgTitle || ariaLabel || `svg 图表${className ? ` · ${className}` : ""}`);
  }

  return normalizeText(element.textContent ?? "");
}

export function filterDomTree(nodes: DomTreeNode[], query: string): DomTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;
  return nodes.filter((node) =>
    [node.tagName, node.label, node.text, node.className, node.id]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export function filterCollapsedTree(nodes: DomTreeNode[], collapsedIds: Set<string>): DomTreeNode[] {
  if (collapsedIds.size === 0) return nodes;
  const visibleNodes: DomTreeNode[] = [];
  let collapsedDepth: number | null = null;
  for (const node of nodes) {
    if (collapsedDepth !== null) {
      if (node.depth > collapsedDepth) continue;
      collapsedDepth = null;
    }
    visibleNodes.push(node);
    if (collapsedIds.has(node.hftId)) {
      collapsedDepth = node.depth;
    }
  }
  return visibleNodes;
}

export function countTreeChildren(nodes: DomTreeNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  nodes.forEach((node, index) => {
    let childCount = 0;
    for (let cursor = index + 1; cursor < nodes.length; cursor += 1) {
      const candidate = nodes[cursor];
      if (candidate.depth <= node.depth) break;
      if (candidate.depth === node.depth + 1) childCount += 1;
    }
    counts[node.hftId] = childCount;
  });
  return counts;
}

export function getPreferredSelectedId(nodes: DomTreeNode[]): string | null {
  return (
    nodes.find((node) => /^h[1-6]$/.test(node.tagName)) ??
    nodes.find((node) => node.text.trim().length > 0 && !["div", "section", "article"].includes(node.tagName)) ??
    nodes[0] ??
    null
  )?.hftId ?? null;
}

export function toKindLabel(tagName: string): string {
  if (/^h[1-6]$/.test(tagName)) return "标题";
  if (tagName === "p") return "正文";
  if (tagName === "button") return "按钮";
  if (tagName === "a") return "链接";
  if (tagName === "img" || tagName === "svg" || tagName === "image") return "图片";
  if (tagName === "section" || tagName === "article" || tagName === "div") return "区块";
  return tagName;
}

export function toNodeIcon(tagName: string): string {
  if (/^h[1-6]$/.test(tagName)) return tagName.toUpperCase();
  if (tagName === "button") return "BTN";
  if (tagName === "a") return "A";
  if (tagName === "img" || tagName === "svg" || tagName === "image") return "IMG";
  return tagName.slice(0, 3).toUpperCase();
}
