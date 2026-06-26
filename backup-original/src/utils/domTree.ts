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
