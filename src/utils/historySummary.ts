import type { EditorDocumentState, HistorySummary } from "../types/editor";
import { HFT_ID_ATTRIBUTE } from "./editableElement";
import { parseHtmlReadOnly } from "./injectEditableIds";

export interface HistoryDisplayItem {
  index: number;
  title: string;
  detail: string;
  isCurrent: boolean;
}

const labels = {
  initialTitle: "\u521d\u59cb\u7248\u672c",
  initialDetail: "\u8f7d\u5165\u5f53\u524d HTML",
  added: "\u65b0\u589e",
  removed: "\u5220\u9664",
  elementCount: "\u4e2a\u5143\u7d20",
  changedText: "\u4fee\u6539",
  text: "\u6587\u672c",
  updated: "\u66f4\u65b0",
  attributes: "\u5c5e\u6027",
  adjusted: "\u8c03\u6574",
  style: "\u6837\u5f0f",
  changedDocumentText: "\u4fee\u6539\u6587\u672c",
  updatedHtml: "\u66f4\u65b0 HTML",
  contentChanged: "\u5185\u5bb9\u5df2\u6539\u53d8",
  chars: "\u5b57\u7b26",
  unknownElement: "\u672a\u77e5\u5143\u7d20",
  clearedText: "\u6587\u672c\u5df2\u6e05\u7a7a",
} as const;

export function buildHistoryDisplayItems(
  timeline: EditorDocumentState[],
  currentIndex: number
): HistoryDisplayItem[] {
  return timeline.map((state, index) => {
    const previous = timeline[index - 1];
    const summary = previous
      ? summarizeStateChange(previous, state)
      : { title: labels.initialTitle, detail: labels.initialDetail };

    return {
      index,
      title: summary.title,
      detail: summary.detail,
      isCurrent: index === currentIndex,
    };
  });
}

/**
 * 纯映射版本:summary 已在 commit 时随 HistoryEntry 永久存储,
 * 此处仅做展示拼接,不再解析 DOM。
 */
export function buildDisplayItemsFromSummaries(
  summaries: (HistorySummary | null)[],
  currentIndex: number
): HistoryDisplayItem[] {
  return summaries.map((summary, index) => ({
    index,
    title: summary?.title ?? labels.initialTitle,
    detail: summary?.detail ?? labels.initialDetail,
    isCurrent: index === currentIndex,
  }));
}

export function summarizeStateChange(
  previous: EditorDocumentState,
  next: EditorDocumentState
): HistorySummary {
  const previousDocument = parseHtmlReadOnly(previous.html);
  const nextDocument = parseHtmlReadOnly(next.html);
  const previousElements = getEditableElementMap(previousDocument);
  const nextElements = getEditableElementMap(nextDocument);
  const added = [...nextElements.keys()].filter((id) => !previousElements.has(id));
  const removed = [...previousElements.keys()].filter((id) => !nextElements.has(id));

  if (added.length > 0 && removed.length === 0) {
    return {
      title: `${labels.added} ${added.length} ${labels.elementCount}`,
      detail: describeElement(nextElements.get(added[0])),
    };
  }

  if (removed.length > 0 && added.length === 0) {
    return {
      title: `${labels.removed} ${removed.length} ${labels.elementCount}`,
      detail: describeElement(previousElements.get(removed[0])),
    };
  }

  const selectedChangedId =
    next.selectedId && previousElements.has(next.selectedId) && nextElements.has(next.selectedId)
      ? next.selectedId
      : null;
  const changedId = selectedChangedId || findChangedElementId(previousElements, nextElements);
  const previousElement = changedId ? previousElements.get(changedId) : null;
  const nextElement = changedId ? nextElements.get(changedId) : null;

  if (previousElement && nextElement) {
    const previousText = normalizeText(previousElement.textContent ?? "");
    const nextText = normalizeText(nextElement.textContent ?? "");
    const styleChanged = (previousElement.getAttribute("style") || "") !== (nextElement.getAttribute("style") || "");
    const attributeChanged =
      previousElement.getAttribute("src") !== nextElement.getAttribute("src") ||
      previousElement.getAttribute("alt") !== nextElement.getAttribute("alt");

    if (previousText !== nextText) {
      return {
        title: `${labels.changedText} ${nextElement.tagName.toLowerCase()} ${labels.text}`,
        detail: truncate(nextText || describeElement(nextElement), 54),
      };
    }

    if (attributeChanged) {
      return {
        title: `${labels.updated} ${nextElement.tagName.toLowerCase()} ${labels.attributes}`,
        detail: describeElement(nextElement),
      };
    }

    if (styleChanged) {
      return {
        title: `${labels.adjusted} ${nextElement.tagName.toLowerCase()} ${labels.style}`,
        detail: describeElement(nextElement),
      };
    }
  }

  const previousBodyText = normalizeText(previousDocument.body.textContent ?? "");
  const nextBodyText = normalizeText(nextDocument.body.textContent ?? "");
  if (previousBodyText !== nextBodyText) {
    return {
      title: labels.changedDocumentText,
      detail: getTextChangeSnippet(previousBodyText, nextBodyText),
    };
  }

  const delta = next.html.length - previous.html.length;
  return {
    title: labels.updatedHtml,
    detail: delta === 0 ? labels.contentChanged : `${delta > 0 ? "+" : ""}${delta.toLocaleString()} ${labels.chars}`,
  };
}

function getEditableElementMap(documentRef: Document): Map<string, Element> {
  const map = new Map<string, Element>();
  documentRef.querySelectorAll(`[${HFT_ID_ATTRIBUTE}]`).forEach((element) => {
    const hftId = element.getAttribute(HFT_ID_ATTRIBUTE);
    if (hftId) map.set(hftId, element);
  });
  return map;
}

function findChangedElementId(previousElements: Map<string, Element>, nextElements: Map<string, Element>): string | null {
  for (const [id, nextElement] of nextElements) {
    const previousElement = previousElements.get(id);
    if (!previousElement) continue;
    if (previousElement.outerHTML !== nextElement.outerHTML) return id;
  }

  return null;
}

function describeElement(element?: Element | null): string {
  if (!element) return labels.unknownElement;

  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const className =
    typeof element.className === "string" && element.className.trim()
      ? `.${element.className.trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
  const text = normalizeText(element.textContent ?? "");
  return truncate(`${tag}${id}${className}${text ? ` - ${text}` : ""}`, 72);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function getTextChangeSnippet(previousText: string, nextText: string): string {
  if (!nextText) return labels.clearedText;

  let start = 0;
  while (start < previousText.length && start < nextText.length && previousText[start] === nextText[start]) {
    start += 1;
  }

  let previousEnd = previousText.length - 1;
  let nextEnd = nextText.length - 1;
  while (previousEnd >= start && nextEnd >= start && previousText[previousEnd] === nextText[nextEnd]) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  const snippetStart = Math.max(0, start - 12);
  const snippetEnd = Math.min(nextText.length, nextEnd + 13);
  return truncate(nextText.slice(snippetStart, snippetEnd).trim() || nextText, 72);
}
