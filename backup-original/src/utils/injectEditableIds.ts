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
  const documentRef = parser.parseFromString(source, "text/html");

  // 检查 DOMParser 是否返回了 <parsererror>（畸形 HTML）
  const parserError = documentRef.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      `HTML 解析错误: ${parserError.textContent?.slice(0, 120) ?? "未知错误"}`
    );
  }

  return documentRef;
}

// 单条目解析缓存：读操作频繁且 html 字符串在短时间内不变，缓存可避免重复解析。
// 写操作（updateHtmlElementByHftId）会生成新 html 字符串，自动失效。
let cachedParseHtml: string | null = null;
let cachedParseDoc: Document | null = null;

/** 读取操作用缓存解析，html 不变时复用上次 Document 对象。 */
export function parseHtmlReadOnly(html: string): Document {
  if (cachedParseHtml === html && cachedParseDoc) {
    // 克隆以避免外部意外修改影响缓存
    return cachedParseDoc.cloneNode(true) as Document;
  }
  cachedParseHtml = html;
  cachedParseDoc = parseHtmlDocument(html);
  return cachedParseDoc.cloneNode(true) as Document;
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
