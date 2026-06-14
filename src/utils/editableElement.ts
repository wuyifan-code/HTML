export const HFT_ID_ATTRIBUTE = "data-hft-id";
export const HFT_EDITABLE_ATTRIBUTE = "data-html-finetune-editable";
export const HFT_HOVER_ATTRIBUTE = "data-html-finetune-hovered";
export const HFT_SELECTED_ATTRIBUTE = "data-html-finetune-selected";

export const EDITABLE_TEXT_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "button",
  "li",
  "blockquote",
  "small",
  "strong",
  "em",
] as const;

export const NON_EDITABLE_TAGS = [
  "html",
  "body",
  "head",
  "script",
  "style",
  "meta",
  "link",
  "title",
  "svg",
  "path",
  "img",
  "video",
  "canvas",
  "audio",
  "source",
  "picture",
  "iframe",
  "noscript",
  "template",
  "br",
  "hr",
] as const;

const editableTagSet = new Set<string>(EDITABLE_TEXT_TAGS);
const nonEditableTagSet = new Set<string>(NON_EDITABLE_TAGS);

export function isEditableElement(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;

  const tagName = element.tagName.toLowerCase();
  if (nonEditableTagSet.has(tagName)) return false;
  if (!getElementText(element).trim()) return false;
  if (editableTagSet.has(tagName)) return true;

  return tagName === "div" && hasDirectText(element);
}

export function findEditableElement(start: Element | null): HTMLElement | null {
  let current: Element | null = start;

  while (current && current.tagName.toLowerCase() !== "body") {
    if (isEditableElement(current)) return current;
    current = current.parentElement;
  }

  return null;
}

export function getElementText(element: HTMLElement): string {
  return element.textContent ?? "";
}

export function hasDirectText(element: HTMLElement): boolean {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0
  );
}

export function createEditableElementScriptConfig() {
  return {
    editableTags: EDITABLE_TEXT_TAGS,
    nonEditableTags: NON_EDITABLE_TAGS,
    hftIdAttribute: HFT_ID_ATTRIBUTE,
    editableAttribute: HFT_EDITABLE_ATTRIBUTE,
    hoverAttribute: HFT_HOVER_ATTRIBUTE,
    selectedAttribute: HFT_SELECTED_ATTRIBUTE,
  };
}
