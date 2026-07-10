import type { EditorDocumentState, HistorySummary } from "../types/editor";
import { HFT_ID_ATTRIBUTE } from "./editableElement";
import { parseHtmlReadOnly } from "./injectEditableIds";
import { normalizeText, truncate } from "./string";

export interface HistoryDisplayItem {
  index: number;
  title: string;
  detail: string;
  isCurrent: boolean;
  timestamp: number;
  category: string;
  timeLabel: string;
  dateLabel: string;
}

const categoryKeywords: [RegExp, string][] = [
  [/新增|删除/, "Content"],
  [/修改.*文本|文本.*修改/, "Text"],
  [/更新.*属性/, "Attributes"],
  [/调整.*样式|修改.*style/i, "Style"],
  [/更新 HTML|内容已改/, "Layout"],
  [/调整/, "Style"],
  [/文本/, "Text"],
];

function deriveCategory(title: string): string {
  for (const [pattern, cat] of categoryKeywords) {
    if (pattern.test(title)) return cat;
  }
  return "Edit";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
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
  currentIndex: number,
  timestamps: number[] = []
): HistoryDisplayItem[] {
  const now = Date.now();
  return timeline.map((state, index) => {
    const previous = timeline[index - 1];
    const summary = previous
      ? summarizeStateChange(previous, state)
      : { title: labels.initialTitle, detail: labels.initialDetail };
    const ts = timestamps[index] ?? now - (timeline.length - index) * 60000;

    return {
      index,
      title: summary.title,
      detail: summary.detail,
      isCurrent: index === currentIndex,
      timestamp: ts,
      category: deriveCategory(summary.title),
      timeLabel: formatTime(ts),
      dateLabel: formatDate(ts),
    };
  });
}

/**
 * 纯映射版本:summary 已在 commit 时随 HistoryEntry 永久存储,
 * 此处仅做展示拼接,不再解析 DOM。
 */
export function buildDisplayItemsFromSummaries(
  summaries: (HistorySummary | null)[],
  currentIndex: number,
  timestamps: number[] = []
): HistoryDisplayItem[] {
  const now = Date.now();
  return summaries.map((summary, index) => {
    const ts = timestamps[index] ?? now - (summaries.length - index) * 60000;
    const title = summary?.title ?? labels.initialTitle;
    return {
      index,
      title,
      detail: summary?.detail ?? labels.initialDetail,
      isCurrent: index === currentIndex,
      timestamp: ts,
      category: deriveCategory(title),
      timeLabel: formatTime(ts),
      dateLabel: formatDate(ts),
    };
  });
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
