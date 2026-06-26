import {
  HFT_EDITABLE_ATTRIBUTE,
  HFT_HOVER_ATTRIBUTE,
  HFT_ID_ATTRIBUTE,
  HFT_SELECTED_ATTRIBUTE,
} from "./editableElement";
import { serializeDocument, parseHoverRules, cssEscape } from "./domPath";
import { FONT_LIBRARY_ATTRIBUTE, syncRemoteFontLibraryLinks } from "./fontLibrary";
import { parseHtmlDocument } from "./injectEditableIds";

const INTERNAL_ATTRIBUTES = [
  HFT_ID_ATTRIBUTE,
  HFT_EDITABLE_ATTRIBUTE,
  HFT_HOVER_ATTRIBUTE,
  HFT_SELECTED_ATTRIBUTE,
  "data-html-finetune-clickable",
  "data-html-finetune-modal-open",
];

const INTERNAL_NODE_SELECTORS = ["#html-finetune-bridge-style"];
const HOVER_STYLE_SELECTOR = "style[data-html-finetune-hover-rules]";

export function cleanHtmlForExport(html: string): string {
  const documentRef = parseHtmlDocument(html);

  convertHoverRulesForExport(documentRef);

  INTERNAL_NODE_SELECTORS.forEach((selector) => {
    documentRef.querySelectorAll(selector).forEach((node) => node.remove());
  });

  // 移除文档脚本 — 它们在导出用的 srcdoc iframe 里会污染 document.title、
  // 访问 history API 等,容易触发 unhandled errors 把 html-to-image 截断。
  // 脚本对视觉截图无贡献。
  documentRef.querySelectorAll("script").forEach((node) => node.remove());

  documentRef.querySelectorAll("*").forEach((element) => {
    INTERNAL_ATTRIBUTES.forEach((attribute) => element.removeAttribute(attribute));
  });

  syncRemoteFontLibraryLinks(documentRef);
  documentRef.querySelectorAll(`[${FONT_LIBRARY_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute(FONT_LIBRARY_ATTRIBUTE);
  });

  return serializeDocument(documentRef);
}

function convertHoverRulesForExport(documentRef: Document): void {
  const styleElement = documentRef.querySelector(HOVER_STYLE_SELECTOR);
  if (!(styleElement instanceof HTMLStyleElement) || !styleElement.textContent) return;

  const rules = parseHoverRules(styleElement.textContent);
  if (rules.length === 0) {
    styleElement.remove();
    return;
  }

  const exportedRules: string[] = [];

  rules.forEach((rule) => {
    const element = documentRef.querySelector(`[${HFT_ID_ATTRIBUTE}="${cssEscape(rule.hftId)}"]`);
    if (!(element instanceof HTMLElement)) return;

    const className = `hft-hover-${rule.hftId}`;
    element.classList.add(className);
    exportedRules.push(`.${className}:hover { background-color: ${rule.color}; }`);
  });

  if (exportedRules.length === 0) {
    styleElement.remove();
    return;
  }

  styleElement.removeAttribute("data-html-finetune-hover-rules");
  styleElement.textContent = `\n${exportedRules.join("\n")}\n`;
}
