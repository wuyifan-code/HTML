import { HFT_ID_ATTRIBUTE, isEditableElement } from "./editableElement";
import { serializeDocument } from "./domPath";

interface InjectEditableIdsResult {
  html: string;
  ids: string[];
}

export function injectEditableIds(html: string): InjectEditableIdsResult {
  const documentRef = parseHtmlDocument(html);
  const usedIds = new Set<string>();
  const editableIds: string[] = [];
  let nextIndex = 1;

  documentRef.body.querySelectorAll("*").forEach((element) => {
    if (!isEditableElement(element)) return;

    const currentId = element.getAttribute(HFT_ID_ATTRIBUTE);
    const hftId = currentId && !usedIds.has(currentId) ? currentId : createUniqueHftId(usedIds, nextIndex);
    nextIndex += 1;

    element.setAttribute(HFT_ID_ATTRIBUTE, hftId);
    usedIds.add(hftId);
    editableIds.push(hftId);
  });

  return {
    html: serializeDocument(documentRef),
    ids: editableIds,
  };
}

export function parseHtmlDocument(html: string): Document {
  const parser = new DOMParser();
  const hasHtmlShell = /<html[\s>]/i.test(html);
  const source = hasHtmlShell ? html : wrapFragment(html);
  return parser.parseFromString(source, "text/html");
}

function createHftId(index: number): string {
  return `hft-${String(index).padStart(4, "0")}`;
}

function createUniqueHftId(usedIds: Set<string>, startIndex: number): string {
  let index = startIndex;
  let id = createHftId(index);

  while (usedIds.has(id)) {
    index += 1;
    id = createHftId(index);
  }

  return id;
}

function wrapFragment(fragment: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${fragment}</body></html>`;
}
