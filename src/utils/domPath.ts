import type { ElementUpdate } from "../types/editor";
import { HFT_ID_ATTRIBUTE } from "./editableElement";

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
    element.textContent = update.text;
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

export function queryElementByHftId(documentRef: Document, hftId: string): HTMLElement | null {
  const element = documentRef.querySelector(`[${HFT_ID_ATTRIBUTE}="${cssEscape(hftId)}"]`);
  return element instanceof HTMLElement ? element : null;
}

export function hasElementWithHftId(html: string, hftId: string): boolean {
  const parser = new DOMParser();
  const documentRef = parser.parseFromString(html, "text/html");
  return Boolean(queryElementByHftId(documentRef, hftId));
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
    element.textContent = update.text;
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

  return serializeDocument(documentRef);
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

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(value);
  }

  return value.replace(/"/g, '\\"');
}
