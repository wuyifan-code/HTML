import type { EditorDocumentState } from "../types/editor";

export const DOCUMENT_STORAGE_KEY = "html-finetune.document.v1";
// Keep synchronous localStorage work bounded. Large imported decks should remain
// responsive even when the browser cannot persist them in the small localStorage quota.
export const MAX_PERSISTED_HTML_LENGTH = 3_500_000;

export interface PersistedDocument {
  version: 1;
  html: string;
  selectedId: string | null;
  documentName: string;
  updatedAt: number;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPersistedDocument(): PersistedDocument | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DOCUMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDocument>;
    if (parsed.version !== 1 || typeof parsed.html !== "string" || !parsed.html.trim()) return null;
    return {
      version: 1,
      html: parsed.html,
      selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : null,
      documentName: typeof parsed.documentName === "string" && parsed.documentName.trim()
        ? parsed.documentName
        : "Untitled",
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function savePersistedDocument(
  state: EditorDocumentState,
  documentName: string,
): "saved" | "unavailable" {
  if (!canUseStorage()) return "unavailable";
  if (state.html.length > MAX_PERSISTED_HTML_LENGTH) return "unavailable";
  const payload: PersistedDocument = {
    version: 1,
    html: state.html,
    selectedId: state.selectedId,
    documentName: documentName.trim() || "Untitled",
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(payload));
    return "saved";
  } catch {
    // 大文档或隐私模式可能触发配额异常；调用方会给出可恢复提示。
    return "unavailable";
  }
}

export function clearPersistedDocument(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(DOCUMENT_STORAGE_KEY);
  } catch {
    // 隐私模式下 localStorage 可能不可写，忽略即可。
  }
}
