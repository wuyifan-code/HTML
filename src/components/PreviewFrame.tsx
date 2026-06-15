import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Eye, Maximize2, Minimize2, Monitor, Smartphone, Tablet } from "lucide-react";
import { useIframeSelection } from "../hooks/useIframeSelection";
import type {
  ElementQuickAction,
  ModalCommand,
  ModalState,
  PreviewViewportMode,
  SelectElementCommand,
  SelectedElementSnapshot,
} from "../types/editor";
import { createEditableElementScriptConfig } from "../utils/editableElement";

interface PreviewFrameProps {
  html: string;
  selectedId: string | null;
  modalCommand: ModalCommand | null;
  selectCommand: SelectElementCommand | null;
  viewportMode: PreviewViewportMode;
  isFocusPreview: boolean;
  onViewportModeChange: (mode: PreviewViewportMode) => void;
  onToggleFocusPreview: () => void;
  onElementSelected: (element: SelectedElementSnapshot) => void;
  onModalStateChange: (state: ModalState) => void;
  onElementAction: (hftId: string, action: ElementQuickAction) => void;
  onReadyChange: (isReady: boolean) => void;
}

export function PreviewFrame({
  html,
  selectedId,
  modalCommand,
  selectCommand,
  viewportMode,
  isFocusPreview,
  onViewportModeChange,
  onToggleFocusPreview,
  onElementSelected,
  onModalStateChange,
  onElementAction,
  onReadyChange,
}: PreviewFrameProps) {
  const { iframeRef, isReady, markRendering } = useIframeSelection(
    onElementSelected,
    onModalStateChange,
    onElementAction
  );
  const srcDoc = useMemo(() => buildPreviewDocument(html, selectedId), [html, selectedId]);

  useEffect(() => {
    markRendering();
    onReadyChange(false);
  }, [markRendering, onReadyChange, srcDoc]);

  useEffect(() => {
    onReadyChange(isReady);
  }, [isReady, onReadyChange]);

  useEffect(() => {
    if (!modalCommand || !isReady) return;

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "HTML_FINETUNE_MODAL_COMMAND",
        action: modalCommand.action,
      },
      "*"
    );
  }, [iframeRef, isReady, modalCommand]);

  useEffect(() => {
    if (!selectCommand || !isReady) return;

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "HTML_FINETUNE_SELECT_ELEMENT",
        hftId: selectCommand.hftId,
      },
      "*"
    );
  }, [iframeRef, isReady, selectCommand]);

  return (
    <section className="panel preview-panel" aria-label="HTML 实时预览">
      <div className="panel-header">
        <div className="panel-title">
          <Eye size={18} strokeWidth={1.8} />
          <span>实时预览</span>
        </div>
      </div>
      <div className={`iframe-shell iframe-shell-${viewportMode}`}>
        <div className="preview-floating-toolbar">
          <div className="segmented-control preview-mode-control" aria-label="预览宽度">
            <PreviewModeButton
              mode="desktop"
              activeMode={viewportMode}
              label="桌面"
              onClick={onViewportModeChange}
              icon={<Monitor size={15} strokeWidth={1.8} />}
            />
            <PreviewModeButton
              mode="tablet"
              activeMode={viewportMode}
              label="平板"
              onClick={onViewportModeChange}
              icon={<Tablet size={15} strokeWidth={1.8} />}
            />
            <PreviewModeButton
              mode="mobile"
              activeMode={viewportMode}
              label="手机"
              onClick={onViewportModeChange}
              icon={<Smartphone size={15} strokeWidth={1.8} />}
            />
          </div>
          <button
            className="ghost-button compact-action"
            type="button"
            onClick={onToggleFocusPreview}
            title={isFocusPreview ? "恢复三栏编辑器" : "隐藏编辑器，全屏预览"}
          >
            {isFocusPreview ? <Minimize2 size={15} strokeWidth={1.9} /> : <Maximize2 size={15} strokeWidth={1.9} />}
            {isFocusPreview ? "恢复" : "全屏"}
          </button>
        </div>
        <div className={`preview-viewport preview-viewport-${viewportMode}`}>
          <iframe
            ref={iframeRef}
            title="HTML FineTune 实时预览"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
          />
        </div>
      </div>
    </section>
  );
}

interface PreviewModeButtonProps {
  mode: PreviewViewportMode;
  activeMode: PreviewViewportMode;
  label: string;
  icon: ReactNode;
  onClick: (mode: PreviewViewportMode) => void;
}

function PreviewModeButton({ mode, activeMode, label, icon, onClick }: PreviewModeButtonProps) {
  const isActive = mode === activeMode;

  return (
    <button
      className={`segmented-button${isActive ? " segmented-button-active" : ""}`}
      type="button"
      aria-pressed={isActive}
      title={`${label}预览`}
      onClick={() => onClick(mode)}
    >
      {icon}
      <span>{label}</span>
    </button>
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
      outline-offset: 2px !important;
      box-shadow: 0 0 0 5px rgba(217, 119, 87, 0.08) !important;
      border-radius: 0 !important;
    }
    [data-html-finetune-selected="true"] {
      outline: 2px solid #c96f4a !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(201, 111, 74, 0.13) !important;
      border-radius: 0 !important;
    }
    #html-finetune-floating-toolbar {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center !important;
      gap: 0 !important;
      border: 1px solid #d8c4b3 !important;
      background: #fffdf8 !important;
      box-shadow: 0 12px 32px rgba(47, 42, 37, 0.18) !important;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    }
    #html-finetune-floating-toolbar button {
      min-width: 48px !important;
      height: 32px !important;
      border: 0 !important;
      border-right: 1px solid #e7e2d8 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: #6f665d !important;
      font: inherit !important;
      font-size: 12px !important;
      cursor: pointer !important;
    }
    #html-finetune-floating-toolbar button:last-child {
      border-right: 0 !important;
    }
    #html-finetune-floating-toolbar button:hover {
      color: #c96442 !important;
      background: #fff4ec !important;
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
      const editableBlockTags = new Set(config.editableBlockTags.map((tag) => tag.toUpperCase()));
      const editableMediaTags = new Set(config.editableMediaTags.map((tag) => tag.toUpperCase()));
      const nonEditableTags = new Set(config.nonEditableTags.map((tag) => tag.toUpperCase()));
      const modalSelectors = [
        "dialog",
        "[role='dialog']",
        "[aria-modal='true']",
        "[data-hft-modal]",
        "[data-modal]",
        ".modal",
        ".dialog",
        ".popup"
      ];

      function hasDirectText(element) {
        return Array.from(element.childNodes).some((node) => {
          return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim().length > 0;
        });
      }

      function isEditableElement(element) {
        if (!element || !(element instanceof HTMLElement)) return false;
        if (element.closest("[data-html-finetune-ui='true']")) return false;
        if (nonEditableTags.has(element.tagName)) return false;
        if (editableMediaTags.has(element.tagName)) return true;
        const text = (element.textContent || "").trim();
        if (!text) return false;
        if (editableTags.has(element.tagName)) return true;
        if (editableBlockTags.has(element.tagName)) return true;
        return false;
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
            backgroundColor: colorToHex(computed.backgroundColor),
            borderColor: colorToHex(computed.borderColor),
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow === "none" ? "" : computed.boxShadow,
            width: computed.width,
            height: computed.height,
            maxWidth: computed.maxWidth === "none" ? "" : computed.maxWidth,
            objectFit: computed.objectFit,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom,
            paddingTop: computed.paddingTop,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight
          },
          effects: {
            hoverBackgroundColor: ""
          },
          attributes: {
            src: element instanceof HTMLImageElement ? element.getAttribute("src") || "" : "",
            alt: element instanceof HTMLImageElement ? element.getAttribute("alt") || "" : ""
          },
          location: describeLocation(element),
          hasInlineStyle: Boolean(element.getAttribute("style"))
        };
      }

      function selectElement(element, shouldNotify = true) {
        clearSelection();
        clearHover();
        element.setAttribute(config.selectedAttribute, "true");
        positionFloatingToolbar(element);
        if (shouldNotify) {
          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_SELECTED",
            payload: makePayload(element)
          }, "*");
        }
      }

      function ensureFloatingToolbar() {
        const existing = document.getElementById("html-finetune-floating-toolbar");
        if (existing) return existing;

        const toolbar = document.createElement("div");
        toolbar.id = "html-finetune-floating-toolbar";
        toolbar.setAttribute("data-html-finetune-ui", "true");
        toolbar.setAttribute("role", "toolbar");
        toolbar.setAttribute("aria-label", "HTML FineTune 快捷工具");
        toolbar.innerHTML = [
          '<button type="button" data-action="duplicate" title="复制元素">复制</button>',
          '<button type="button" data-action="delete" title="删除元素">删除</button>'
        ].join("");

        toolbar.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        }, true);

        toolbar.addEventListener("click", (event) => {
          const button = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
          if (!button) return;
          event.preventDefault();
          event.stopPropagation();
          const hftId = toolbar.getAttribute("data-hft-id") || "";
          const action = button.getAttribute("data-action") || "";
          if (!hftId || !action) return;

          window.parent.postMessage({
            type: "HTML_FINETUNE_ELEMENT_ACTION",
            payload: { hftId, action }
          }, "*");
        }, true);

        document.body.appendChild(toolbar);
        return toolbar;
      }

      function hideFloatingToolbar() {
        const toolbar = document.getElementById("html-finetune-floating-toolbar");
        if (!toolbar) return;
        toolbar.style.display = "none";
        toolbar.removeAttribute("data-hft-id");
      }

      function positionFloatingToolbar(element) {
        const toolbar = ensureFloatingToolbar();
        const rect = element.getBoundingClientRect();
        toolbar.setAttribute("data-hft-id", element.getAttribute(config.hftIdAttribute) || "");
        toolbar.style.display = "flex";

        const toolbarWidth = toolbar.offsetWidth || 104;
        const toolbarHeight = toolbar.offsetHeight || 34;
        const visibleBounds = getVisibleFrameBounds();
        const preferredTop = rect.top - 42;
        const maxTop = Math.max(8, visibleBounds.height - toolbarHeight - 8);
        const top = Math.max(8, Math.min(preferredTop, maxTop));
        const maxLeft = Math.max(8, visibleBounds.width - toolbarWidth - 8);
        const left = Math.max(8, Math.min(rect.left, maxLeft));

        toolbar.style.top = top + "px";
        toolbar.style.left = left + "px";
      }

      function getVisibleFrameBounds() {
        const fallback = { width: window.innerWidth, height: window.innerHeight };
        try {
          if (!window.frameElement || !window.parent) return fallback;
          const frameRect = window.frameElement.getBoundingClientRect();
          const parentWidth = window.parent.innerWidth || fallback.width;
          const parentHeight = window.parent.innerHeight || fallback.height;
          return {
            width: Math.max(120, Math.min(fallback.width, parentWidth - frameRect.left - 8)),
            height: Math.max(80, Math.min(fallback.height, parentHeight - frameRect.top - 8))
          };
        } catch {
          return fallback;
        }
      }

      function repositionFloatingToolbar() {
        const selected = document.querySelector("[" + config.selectedAttribute + "='true']");
        if (selected && selected instanceof HTMLElement) {
          positionFloatingToolbar(selected);
        } else {
          hideFloatingToolbar();
        }
      }

      function queryByHftId(hftId) {
        if (!hftId) return null;
        return Array.from(document.querySelectorAll("[" + config.hftIdAttribute + "]")).find((element) => {
          return element.getAttribute(config.hftIdAttribute) === hftId;
        }) || null;
      }

      function getModalElements() {
        return Array.from(document.querySelectorAll(modalSelectors.join(","))).filter((element) => {
          return element instanceof HTMLElement;
        });
      }

      function isNativeDialog(element) {
        return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement;
      }

      function isModalOpen(element) {
        if (isNativeDialog(element)) return element.open;
        if (element.hasAttribute("hidden")) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;
        if (element.getAttribute("data-html-finetune-modal-open") === "true") return true;

        const computed = window.getComputedStyle(element);
        if (computed.display === "none" || computed.visibility === "hidden") return false;

        return element.classList.contains("open") ||
          element.classList.contains("is-open") ||
          element.classList.contains("active") ||
          element.classList.contains("show") ||
          element.hasAttribute("open");
      }

      function getModalLabel(element) {
        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel;

        const labelledBy = element.getAttribute("aria-labelledby");
        if (labelledBy) {
          const labelElement = document.getElementById(labelledBy);
          if (labelElement?.textContent?.trim()) return labelElement.textContent.trim();
        }

        if (element.id) return "#" + element.id;
        if (typeof element.className === "string" && element.className.trim()) {
          return "." + element.className.trim().split(/\\s+/).join(".");
        }

        return element.tagName.toLowerCase();
      }

      function findPrimaryModal() {
        const modals = getModalElements();
        return modals.find(isModalOpen) || modals[0] || null;
      }

      function postModalState() {
        const modal = findPrimaryModal();
        window.parent.postMessage({
          type: "HTML_FINETUNE_MODAL_STATE",
          payload: {
            found: Boolean(modal),
            open: modal ? isModalOpen(modal) : false,
            label: modal ? getModalLabel(modal) : ""
          }
        }, "*");
      }

      function openModal() {
        const modal = findPrimaryModal();
        if (!modal) {
          postModalState();
          return;
        }

        if (isNativeDialog(modal)) {
          try {
            if (!modal.open) modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.setAttribute("data-html-finetune-modal-open", "true");
          const computed = window.getComputedStyle(modal);
          if (computed.display === "none") modal.style.display = "block";
          if (computed.visibility === "hidden") modal.style.visibility = "visible";
          modal.style.pointerEvents = "auto";
        }

        postModalState();
      }

      function closeModal() {
        const modal = getModalElements().find(isModalOpen) || findPrimaryModal();
        if (!modal) {
          postModalState();
          return;
        }

        if (isNativeDialog(modal)) {
          if (modal.open) modal.close();
          modal.removeAttribute("open");
        } else {
          modal.setAttribute("hidden", "");
          modal.setAttribute("aria-hidden", "true");
          modal.setAttribute("data-html-finetune-modal-open", "false");
          modal.style.display = "none";
        }

        postModalState();
      }

      function openContainingModal(element) {
        const modal = element.closest(modalSelectors.join(","));
        if (!modal || isModalOpen(modal)) return;

        if (isNativeDialog(modal)) {
          try {
            modal.showModal();
          } catch {
            modal.setAttribute("open", "");
          }
        } else {
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
          modal.setAttribute("data-html-finetune-modal-open", "true");
          if (window.getComputedStyle(modal).display === "none") modal.style.display = "block";
          modal.style.pointerEvents = "auto";
        }

        postModalState();
      }

      function selectElementByHftId(hftId) {
        if (!hftId) return;
        const element = queryByHftId(hftId);
        if (!element || !isEditableElement(element)) return;

        openContainingModal(element);
        element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        selectElement(element, true);
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
        if (target instanceof Element && target.closest("[data-html-finetune-ui='true']")) {
          return;
        }

        const element = target instanceof Element ? findEditableElement(target) : null;

        if (element) {
          event.preventDefault();
          event.stopPropagation();
          selectElement(element, true);
          return;
        }

        const actionElement = target instanceof Element
          ? target.closest("[data-hft-open-modal], [data-open-modal], [data-modal-open], [data-hft-close-modal], [data-close-modal], [data-modal-close], .modal-close")
          : null;

        if (actionElement) {
          event.preventDefault();
          event.stopPropagation();
          if (
            actionElement.matches("[data-hft-close-modal], [data-close-modal], [data-modal-close], .modal-close")
          ) {
            closeModal();
          } else {
            openModal();
          }
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      }, true);

      document.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      window.addEventListener("message", (event) => {
        const data = event.data || {};
        if (data.type === "HTML_FINETUNE_SELECT_ELEMENT") {
          selectElementByHftId(data.hftId);
          return;
        }

        if (data.type !== "HTML_FINETUNE_MODAL_COMMAND") return;

        if (data.action === "open") openModal();
        if (data.action === "close") closeModal();
      });

      window.addEventListener("scroll", repositionFloatingToolbar, true);
      window.addEventListener("resize", repositionFloatingToolbar);

      markEditableElements();
      if (selectedId) {
        const selected = queryByHftId(selectedId);
        if (selected && isEditableElement(selected)) {
          selectElement(selected, true);
        }
      }
      postModalState();
      window.parent.postMessage({ type: "HTML_FINETUNE_PREVIEW_READY" }, "*");
    })();
  </script>`;
}
