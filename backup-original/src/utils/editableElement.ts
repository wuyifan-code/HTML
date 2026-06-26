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

export const EDITABLE_SVG_TEXT_TAGS = ["text", "tspan"] as const;
export const EDITABLE_BLOCK_TAGS = ["section", "article", "aside", "div", "blockquote"] as const;
export const EDITABLE_MEDIA_TAGS = ["img", "svg", "image"] as const;

export const NON_EDITABLE_TAGS = [
  "html",
  "body",
  "head",
  "script",
  "style",
  "meta",
  "link",
  "title",
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
  "defs",
  "g",
  "clipPath",
  "mask",
  "filter",
  "linearGradient",
  "radialGradient",
  "pattern",
  "symbol",
  "use",
  "desc",
  "title",
  "metadata",
] as const;

const editableTagSet = createTagSet(EDITABLE_TEXT_TAGS);
const editableSvgTextTagSet = createTagSet(EDITABLE_SVG_TEXT_TAGS);
const editableBlockTagSet = createTagSet(EDITABLE_BLOCK_TAGS);
const editableMediaTagSet = createTagSet(EDITABLE_MEDIA_TAGS);
const nonEditableTagSet = createTagSet(NON_EDITABLE_TAGS);

export function isEditableElement(element: Element | null): element is HTMLElement | SVGElement {
  if (!element) return false;

  const tagName = getNormalizedTagName(element);
  if (nonEditableTagSet.has(tagName)) return false;
  if (editableMediaTagSet.has(tagName)) return true;

  const text = getElementText(element).trim();
  if (!text) return false;
  if (element instanceof SVGElement) return editableSvgTextTagSet.has(tagName);
  if (!(element instanceof HTMLElement)) return false;

  if (editableTagSet.has(tagName)) return true;
  if (editableBlockTagSet.has(tagName)) return hasDirectText(element);

  return false;
}

export function findEditableElement(start: Element | null): HTMLElement | SVGElement | null {
  let current: Element | null = start;

  while (current && current.tagName.toLowerCase() !== "body") {
    if (isEditableElement(current)) return current;
    current = current.parentElement;
  }

  return null;
}

export function isEditableSvgTextElement(element: Element | null): element is SVGElement {
  return element instanceof SVGElement && editableSvgTextTagSet.has(getNormalizedTagName(element));
}

export function isSvgImageElement(element: Element | null): element is SVGElement {
  return element instanceof SVGElement && getNormalizedTagName(element) === "image";
}

export function isRootSvgElement(element: Element | null): element is SVGSVGElement {
  if (!element) return false;
  return element instanceof SVGSVGElement || getNormalizedTagName(element) === "svg";
}

export function getNormalizedTagName(element: Element): string {
  return element.tagName.toLowerCase();
}

export function getElementClassName(element: Element): string {
  const className = (element as { className?: unknown }).className;
  if (typeof className === "string") return className;
  if (
    typeof className === "object" &&
    className !== null &&
    "baseVal" in className &&
    typeof (className as { baseVal?: unknown }).baseVal === "string"
  ) {
    return (className as { baseVal: string }).baseVal;
  }
  return element.getAttribute("class") ?? "";
}

export function getElementText(element: Element): string {
  return element.textContent ?? "";
}

export function hasDirectText(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0
  );
}

export function createEditableElementScriptConfig() {
  return {
    editableTags: EDITABLE_TEXT_TAGS,
    editableSvgTextTags: EDITABLE_SVG_TEXT_TAGS,
    editableBlockTags: EDITABLE_BLOCK_TAGS,
    editableMediaTags: EDITABLE_MEDIA_TAGS,
    nonEditableTags: NON_EDITABLE_TAGS,
    hftIdAttribute: HFT_ID_ATTRIBUTE,
    editableAttribute: HFT_EDITABLE_ATTRIBUTE,
    hoverAttribute: HFT_HOVER_ATTRIBUTE,
    selectedAttribute: HFT_SELECTED_ATTRIBUTE,
  };
}

function createTagSet(tags: readonly string[]): Set<string> {
  return new Set(tags.map((tag) => tag.toLowerCase()));
}
