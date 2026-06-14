import { useEffect, useMemo } from "react";
import { Eye, Loader2 } from "lucide-react";
import { useIframeSelection } from "../hooks/useIframeSelection";
import type { SelectedElementSnapshot } from "../types/editor";
import { createEditableElementScriptConfig } from "../utils/editableElement";

interface PreviewFrameProps {
  html: string;
  selectedId: string | null;
  onElementSelected: (element: SelectedElementSnapshot) => void;
}

export function PreviewFrame({ html, selectedId, onElementSelected }: PreviewFrameProps) {
  const { iframeRef, isReady, markRendering } = useIframeSelection(onElementSelected);
  const srcDoc = useMemo(() => buildPreviewDocument(html, selectedId), [html, selectedId]);

  useEffect(() => {
    markRendering();
  }, [markRendering, srcDoc]);

  return (
    <section className="panel preview-panel" aria-label="HTML 实时预览">
      <div className="panel-header">
        <div className="panel-title">
          <Eye size={18} strokeWidth={1.8} />
          <span>实时预览</span>
        </div>
        <div className="preview-status" aria-live="polite">
          {!isReady ? <Loader2 className="spin" size={15} /> : <span className="status-dot" />}
          {isReady ? "已就绪" : "渲染中"}
        </div>
      </div>
      <div className="iframe-shell">
        <iframe
          ref={iframeRef}
          title="HTML FineTune 实时预览"
          sandbox="allow-scripts allow-same-origin"
          srcDoc={srcDoc}
        />
      </div>
    </section>
  );
}

function buildPreviewDocument(html: string, selectedId: string | null): string {
  const script = createBridgeScript(selectedId);
  const style = `<style id="html-finetune-bridge-style">
    [data-html-finetune-editable="true"] {
      cursor: text !important;
    }
    [data-html-finetune-hovered="true"]:not([data-html-finetune-selected="true"]) {
      outline: 1.5px dashed #d97757 !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 5px rgba(217, 119, 87, 0.08) !important;
      border-radius: 0 !important;
    }
    [data-html-finetune-selected="true"] {
      outline: 2.5px solid #d97757 !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 7px rgba(217, 119, 87, 0.13) !important;
      border-radius: 0 !important;
    }
  </style>`;

  const hasHtmlShell = /<html[\s>]/i.test(html);
  const withStyle = insertBeforeClosingTag(hasHtmlShell ? html : wrapFragment(html), "head", style);
  return insertBeforeClosingTag(withStyle, "body", script);
}

function wrapFragment(fragment: string): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${fragment}</body></html>`;
}

function insertBeforeClosingTag(html: string, tag: "head" | "body", content: string): string {
  const pattern = new RegExp(`</${tag}>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `${content}</${tag}>`);
  }

  return `${html}${content}`;
}

function createBridgeScript(selectedId: string | null): string {
  const config = createEditableElementScriptConfig();

  return `<script>
    (() => {
      const selectedId = ${JSON.stringify(selectedId)};
      const config = ${JSON.stringify(config)};
      const editableTags = new Set(config.editableTags.map((tag) => tag.toUpperCase()));
      const nonEditableTags = new Set(config.nonEditableTags.map((tag) => tag.toUpperCase()));

      function hasDirectText(element) {
        return Array.from(element.childNodes).some((node) => {
          return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim().length > 0;
        });
      }

      function isEditableElement(element) {
        if (!element || !(element instanceof HTMLElement)) return false;
        if (nonEditableTags.has(element.tagName)) return false;
        const text = (element.textContent || "").trim();
        if (!text) return false;
        if (editableTags.has(element.tagName)) return true;
        return element.tagName === "DIV" && hasDirectText(element);
      }

      function findEditableElement(start) {
        let current = start;
        while (current && current !== document.body) {
          if (isEditableElement(current)) return current;
          current = current.parentElement;
        }
        return null;
      }

      function getElementIndex(element) {
        let index = 1;
        let sibling = element.previousElementSibling;
        while (sibling) {
          if (sibling.tagName === element.tagName) index += 1;
          sibling = sibling.previousElementSibling;
        }
        return index;
      }

      function getDomPath(element) {
        const segments = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          const tag = current.tagName.toLowerCase();
          if (tag === "html") {
            segments.unshift("html");
            break;
          }
          segments.unshift(tag + ":nth-of-type(" + getElementIndex(current) + ")");
          current = current.parentElement;
        }
        return segments.join(" > ");
      }

      function colorToHex(color) {
        const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
        if (match) {
          return "#" + [match[1], match[2], match[3]]
            .map((part) => Number(part).toString(16).padStart(2, "0"))
            .join("");
        }
        if (/^#[0-9a-f]{6}$/i.test(color)) return color;
        return "#2f2a25";
      }

      function describeLocation(element) {
        const classes = element.className && typeof element.className === "string"
          ? "." + element.className.trim().split(/\\s+/).filter(Boolean).join(".")
          : "";
        const id = element.id ? "#" + element.id : "";
        return element.tagName.toLowerCase() + id + classes;
      }

      function clearSelection() {
        document.querySelectorAll("[" + config.selectedAttribute + "='true']").forEach((element) => {
          element.removeAttribute(config.selectedAttribute);
        });
      }

      function clearHover() {
        document.querySelectorAll("[" + config.hoverAttribute + "='true']").forEach((element) => {
          element.removeAttribute(config.hoverAttribute);
        });
      }

      function markEditableElements() {
        document.querySelectorAll("body *").forEach((element) => {
          if (isEditableElement(element)) {
            element.setAttribute(config.editableAttribute, "true");
          }
        });
      }

      function makePayload(element) {
        const computed = window.getComputedStyle(element);
        return {
          hftId: element.getAttribute(config.hftIdAttribute) || "",
          path: getDomPath(element),
          tagName: element.tagName.toLowerCase(),
          id: element.id || "",
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent || "",
          styles: {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            color: colorToHex(computed.color),
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing === "normal" ? "0px" : computed.letterSpacing,
            textAlign: computed.textAlign,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom,
            paddingTop: computed.paddingTop,
            paddingBottom: computed.paddingBottom
          },
          location: describeLocation(element),
          hasInlineStyle: Boolean(element.getAttribute("style"))
        };
      }

      function selectElement(element, shouldNotify = true) {
        clearSelection();
        clearHover();
        element.setAttribute(config.selectedAttribute, "true");
        if (shouldNotify) {
          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_SELECTED",
            payload: makePayload(element)
          }, "*");
        }
      }

      document.addEventListener("mouseover", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        clearHover();
        if (element && element.getAttribute(config.selectedAttribute) !== "true") {
          element.setAttribute(config.hoverAttribute, "true");
        }
      }, true);

      document.addEventListener("mouseout", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        if (element) {
          element.removeAttribute(config.hoverAttribute);
        }
      }, true);

      document.addEventListener("click", (event) => {
        const target = event.target;
        const element = target instanceof Element ? findEditableElement(target) : null;
        if (!element) return;
        event.preventDefault();
        event.stopPropagation();
        selectElement(element, true);
      }, true);

      document.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      markEditableElements();
      if (selectedId) {
        const selected = document.querySelector("[" + config.hftIdAttribute + "='" + selectedId.replace(/'/g, "\\\\'") + "']");
        if (selected && isEditableElement(selected)) {
          selectElement(selected, true);
        }
      }
      window.parent.postMessage({ type: "HTML_FINETUNE_PREVIEW_READY" }, "*");
    })();
  </script>`;
}
