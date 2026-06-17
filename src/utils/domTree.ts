import type { DomTreeNode } from "../types/editor";
import { HFT_ID_ATTRIBUTE, isEditableElement } from "./editableElement";
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
        className: typeof element.className === "string" ? element.className : "",
        id: element.id || "",
      });
    }
  }

  Array.from(element.children).forEach((child) => {
    walkElement(child, depth + 1, nodes);
  });
}

function createNodeLabel(element: Element, text: string): string {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const className =
    typeof element.className === "string" && element.className.trim()
      ? `.${element.className.trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
  const preview = text ? ` ${truncate(text, MAX_LABEL_LENGTH)}` : "";

  return `${tagName}${id}${className}${preview}`;
}

function getNodeText(element: Element): string {
  if (element instanceof HTMLImageElement) {
    return normalizeText(element.getAttribute("alt") || element.getAttribute("src") || "图片");
  }

  return normalizeText(element.textContent ?? "");
}
