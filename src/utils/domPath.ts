import type { ElementUpdate } from "../types/editor";
import { HFT_ID_ATTRIBUTE, isEditableSvgTextElement, isRootSvgElement, isSvgImageElement } from "./editableElement";
import { syncRemoteFontLibraryLinks } from "./fontLibrary";
import { parseHtmlDocument } from "./injectEditableIds";

const HOVER_STYLE_ATTRIBUTE = "data-html-finetune-hover-rules";

export function getDomPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const tag = current.tagName.toLowerCase();

    if (tag === "html") {
      segments.unshift("html");
      break;
    }

    const index = getElementIndex(current);
    segments.unshift(`${tag}:nth-of-type(${index})`);
    current = current.parentElement;
  }

  return segments.join(" > ");
}

export function queryElementByPath(documentRef: Document, path: string): HTMLElement | null {
  try {
    const element = documentRef.querySelector(path);
    return element instanceof HTMLElement ? element : null;
  } catch {
    return null;
  }
}

export function updateHtmlElement(html: string, path: string, update: ElementUpdate): string {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  const element = queryElementByPath(documentRef, path);

  if (!element) {
    return html;
  }

  if (typeof update.text === "string") {
    updateTextOnlyElement(element, update.text);
  }

  if (update.attributes) {
    applyAttributeUpdates(element, update.attributes);
  }

  if (update.styles) {
    Object.entries(update.styles).forEach(([property, value]) => {
      if (typeof value === "string") {
        element.style.setProperty(toKebabCase(property), value);
      }
    });
  }

  return serializeDocument(documentRef);
}

export function queryElementByHftId(documentRef: Document, hftId: string): HTMLElement | SVGElement | null {
  const element = documentRef.querySelector(`[${HFT_ID_ATTRIBUTE}="${cssEscape(hftId)}"]`);
  if (!element) return null;
  return element instanceof HTMLElement || element instanceof SVGElement ? element : null;
}

export function hasElementWithHftId(html: string, hftId: string): boolean {
  // 轻量正则查询，避免 DOMParser 完整解析
  const escapedId = cssEscape(hftId);
  const pattern = new RegExp(`${HFT_ID_ATTRIBUTE}="${escapedId}"`);
  return pattern.test(html);
}

export function updateHtmlElementByHftId(
  html: string,
  hftId: string,
  update: ElementUpdate
): string {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  const element = queryElementByHftId(documentRef, hftId);

  if (!element) {
    return html;
  }

  if (typeof update.text === "string") {
    updateTextOnlyElement(element, update.text);
  }

  if (update.attributes) {
    applyAttributeUpdates(element, update.attributes);
  }

  if (update.styles) {
    Object.entries(update.styles).forEach(([property, value]) => {
      if (typeof value === "string") {
        if (value.trim()) {
          element.style.setProperty(toKebabCase(property), value);
        } else {
          element.style.removeProperty(toKebabCase(property));
        }
      }
    });
  }

  if (update.effects?.hoverBackgroundColor !== undefined) {
    updateHoverBackgroundRule(documentRef, hftId, update.effects.hoverBackgroundColor);
  }

  syncRemoteFontLibraryLinks(documentRef);

  return serializeDocument(documentRef);
}

export function duplicateHtmlElementByHftId(html: string, hftId: string): string {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  const element = queryElementByHftId(documentRef, hftId);

  if (!element || !element.parentElement) {
    return html;
  }

  const clone = element.cloneNode(true);
  if (clone instanceof Element) {
    clone.removeAttribute(HFT_ID_ATTRIBUTE);
    clone.querySelectorAll(`[${HFT_ID_ATTRIBUTE}]`).forEach((child) => child.removeAttribute(HFT_ID_ATTRIBUTE));
  }

  element.insertAdjacentElement("afterend", clone as Element);
  syncRemoteFontLibraryLinks(documentRef);
  return serializeDocument(documentRef);
}

export function deleteHtmlElementByHftId(html: string, hftId: string): string {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  const element = queryElementByHftId(documentRef, hftId);

  if (!element) {
    return html;
  }

  element.remove();
  syncRemoteFontLibraryLinks(documentRef);
  return serializeDocument(documentRef);
}

export function moveHtmlElementByHftId(html: string, hftId: string, direction: "up" | "down"): string {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  const element = queryElementByHftId(documentRef, hftId);

  if (!element || !element.parentElement) {
    return html;
  }

  const sibling = direction === "up" ? element.previousElementSibling : element.nextElementSibling;
  if (!sibling) {
    return html;
  }

  if (direction === "up") {
    sibling.insertAdjacentElement("beforebegin", element);
  } else {
    sibling.insertAdjacentElement("afterend", element);
  }

  syncRemoteFontLibraryLinks(documentRef);
  return serializeDocument(documentRef);
}

export function getHoverBackgroundColor(html: string, hftId: string): string {
  const escapedId = escapeRegExp(hftId);
  const pattern = new RegExp(
    `\\[${HFT_ID_ATTRIBUTE}="${escapedId}"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}`,
    "i"
  );
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

export function serializeDocument(documentRef: Document): string {
  return `<!doctype html>\n${documentRef.documentElement.outerHTML}`;
}

function getElementIndex(element: Element): number {
  let index = 1;
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index += 1;
    }
    sibling = sibling.previousElementSibling;
  }

  return index;
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function applyAttributeUpdates(element: Element, attributes: NonNullable<ElementUpdate["attributes"]>): void {
  Object.entries(attributes).forEach(([attribute, value]) => {
    if (typeof value !== "string") return;

    let resolvedAttribute = attribute;
    if (isRootSvgElement(element)) {
      if (attribute === "src") resolvedAttribute = "viewBox";
      else if (attribute === "alt") resolvedAttribute = "aria-label";
    } else if (isSvgImageElement(element)) {
      if (attribute === "src") resolvedAttribute = "href";
      else if (attribute === "alt") resolvedAttribute = "aria-label";
    }

    if (value.trim()) {
      element.setAttribute(resolvedAttribute, value);
    } else {
      element.removeAttribute(resolvedAttribute);
    }
  });
}

function updateTextOnlyElement(element: Element, text: string): void {
  if (isEditableSvgTextElement(element)) {
    if (element.children.length === 0) element.textContent = text;
    return;
  }
  if (element instanceof SVGElement) return;
  if (element.children.length > 0) return;
  element.textContent = text;
}

function updateHoverBackgroundRule(documentRef: Document, hftId: string, color: string): void {
  const styleElement = getHoverStyleElement(documentRef, color.trim().length > 0);
  if (!styleElement) return;

  const rules = parseHoverRules(styleElement.textContent ?? "");
  const filteredRules = rules.filter((rule) => rule.hftId !== hftId);

  if (color.trim()) {
    filteredRules.push({ hftId, color: color.trim() });
  }

  if (filteredRules.length === 0) {
    styleElement.remove();
    return;
  }

  styleElement.textContent = `\n${filteredRules
    .map((rule) => `[${HFT_ID_ATTRIBUTE}="${rule.hftId}"]:hover { background-color: ${rule.color}; }`)
    .join("\n")}\n`;
}

function getHoverStyleElement(documentRef: Document, shouldCreate: boolean): HTMLStyleElement | null {
  const existing = documentRef.querySelector(`style[${HOVER_STYLE_ATTRIBUTE}]`);
  if (existing instanceof HTMLStyleElement) return existing;
  if (!shouldCreate) return null;

  const styleElement = documentRef.createElement("style");
  styleElement.setAttribute(HOVER_STYLE_ATTRIBUTE, "true");
  documentRef.head.appendChild(styleElement);
  return styleElement;
}

export function parseHoverRules(cssText: string): Array<{ hftId: string; color: string }> {
  const rules: Array<{ hftId: string; color: string }> = [];
  const pattern = new RegExp(
    `\\[${HFT_ID_ATTRIBUTE}="([^"]+)"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}`,
    "gi"
  );

  for (const match of cssText.matchAll(pattern)) {
    rules.push({ hftId: match[1], color: match[2].trim() });
  }

  return rules;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(value);
  }

  return value.replace(/"/g, '\\"');
}
