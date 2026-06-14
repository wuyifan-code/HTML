import {
  HFT_EDITABLE_ATTRIBUTE,
  HFT_HOVER_ATTRIBUTE,
  HFT_ID_ATTRIBUTE,
  HFT_SELECTED_ATTRIBUTE,
} from "./editableElement";
import { serializeDocument } from "./domPath";
import { parseHtmlDocument } from "./injectEditableIds";

const INTERNAL_ATTRIBUTES = [
  HFT_ID_ATTRIBUTE,
  HFT_EDITABLE_ATTRIBUTE,
  HFT_HOVER_ATTRIBUTE,
  HFT_SELECTED_ATTRIBUTE,
  "data-html-finetune-clickable",
];

const INTERNAL_NODE_SELECTORS = ["#html-finetune-bridge-style"];

export function cleanHtmlForExport(html: string): string {
  const documentRef = parseHtmlDocument(html);

  INTERNAL_NODE_SELECTORS.forEach((selector) => {
    documentRef.querySelectorAll(selector).forEach((node) => node.remove());
  });

  documentRef.querySelectorAll("*").forEach((element) => {
    INTERNAL_ATTRIBUTES.forEach((attribute) => element.removeAttribute(attribute));
  });

  return serializeDocument(documentRef);
}
