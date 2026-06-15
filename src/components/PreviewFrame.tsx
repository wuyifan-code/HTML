import { memo, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Eye, Maximize2, Minimize2, Monitor, Smartphone, Tablet } from "lucide-react";
import { useIframeSelection } from "../hooks/useIframeSelection";
import type {
  ElementQuickAction,
  ModalCommand,
  ModalState,
  PatchCommand,
  PreviewViewportMode,
  SelectElementCommand,
  SelectedElementSnapshot,
} from "../types/editor";
import { createEditableElementScriptConfig } from "../utils/editableElement";

interface PreviewFrameProps {
  html: string;
  selectedId: string | null;
  reloadNonce: number;
  patchCommand: PatchCommand | null;
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

function PreviewFrameComponent({
  html,
  selectedId,
  reloadNonce,
  patchCommand,
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
  const bridgeTokenRef = useRef(createBridgeToken());
  const { iframeRef, isReady, markRendering } = useIframeSelection(
    bridgeTokenRef.current,
    onElementSelected,
    onModalStateChange,
    onElementAction
  );
  // srcDoc 仅在结构性变更(reloadNonce)时重建;文本/样式编辑通过 patchCommand 增量下发。
  const srcDoc = useMemo(
    () => buildPreviewDocument(html, bridgeTokenRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadNonce]
  );

  useEffect(() => {
    markRendering();
    onReadyChange(false);
  }, [markRendering, onReadyChange, srcDoc]);

  useEffect(() => {
    onReadyChange(isReady);
  }, [isReady, onReadyChange]);

  // 增量补丁:文本/样式/属性就地应用到 iframe,不触发整文档重建。
  useEffect(() => {
    if (!patchCommand || !isReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "HTML_FINETUNE_PATCH_ELEMENT",
        hftId: patchCommand.hftId,
        patch: patchCommand.patch,
        token: bridgeTokenRef.current,
      },
      "*"
    );
  }, [iframeRef, isReady, patchCommand]);

  useEffect(() => {
    if (!modalCommand || !isReady) return;

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "HTML_FINETUNE_MODAL_COMMAND",
        action: modalCommand.action,
        token: bridgeTokenRef.current,
      },
      "*"
    );
  }, [iframeRef, isReady, modalCommand]);

  useEffect(() => {
    const hftId = selectCommand?.hftId || selectedId;
    if (!hftId || !isReady) return;

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "HTML_FINETUNE_SELECT_ELEMENT",
        hftId,
        token: bridgeTokenRef.current,
      },
      "*"
    );
  }, [iframeRef, isReady, selectCommand, selectedId]);

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

export const PreviewFrame = memo(PreviewFrameComponent);

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

function buildPreviewDocument(html: string, bridgeToken: string): string {
  const script = createBridgeScript(bridgeToken);
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

function createBridgeScript(bridgeToken: string): string {
  const config = createEditableElementScriptConfig();

  return `<script>
    (() => {
      const bridgeToken = ${JSON.stringify(bridgeToken)};
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
        if (editableBlockTags.has(element.tagName)) return hasDirectText(element);
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
          hasInlineStyle: Boolean(element.getAttribute("style")),
          canEditText: !(element instanceof HTMLImageElement) && !element.querySelector("*")
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
            token: bridgeToken,
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
            token: bridgeToken,
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

      let cachedFrameBounds = null;
      function invalidateFrameBounds() {
        cachedFrameBounds = null;
      }

      function getVisibleFrameBounds() {
        if (cachedFrameBounds) return cachedFrameBounds;
        const fallback = { width: window.innerWidth, height: window.innerHeight };
        try {
          if (!window.frameElement || !window.parent) return fallback;
          const frameRect = window.frameElement.getBoundingClientRect();
          const parentWidth = window.parent.innerWidth || fallback.width;
          const parentHeight = window.parent.innerHeight || fallback.height;
          const bounds = {
            width: Math.max(120, Math.min(fallback.width, parentWidth - frameRect.left - 8)),
            height: Math.max(80, Math.min(fallback.height, parentHeight - frameRect.top - 8))
          };
          cachedFrameBounds = bounds;
          return bounds;
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

      // 增量补丁:文本/样式/属性就地应用,避免整文档重建。
      function patchElement(hftId, patch) {
        const element = queryByHftId(hftId);
        if (!element || !(element instanceof HTMLElement)) return;

        if (typeof patch.text === "string" && element.children.length === 0) {
          element.textContent = patch.text;
        }

        if (patch.attributes) {
          Object.keys(patch.attributes).forEach((attribute) => {
            const value = patch.attributes[attribute];
            if (typeof value !== "string") return;
            if (attribute === "alt") {
              element.setAttribute(attribute, value);
              return;
            }
            if (value.trim()) {
              element.setAttribute(attribute, value);
            } else {
              element.removeAttribute(attribute);
            }
          });
        }

        if (patch.styles) {
          Object.keys(patch.styles).forEach((property) => {
            const value = patch.styles[property];
            if (typeof value !== "string") return;
            const kebab = property.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
            if (value.trim()) {
              element.style.setProperty(kebab, value);
            } else {
              element.style.removeProperty(kebab);
            }
          });
        }

        if (patch.effects && typeof patch.effects.hoverBackgroundColor !== "undefined") {
          updateHoverBackgroundRule(element, patch.effects.hoverBackgroundColor);
        }

        if (element.getAttribute(config.selectedAttribute) === "true") {
          positionFloatingToolbar(element);
        }
      }

      function updateHoverBackgroundRule(element, color) {
        const styleId = "html-finetune-hover-rules";
        let styleElement = document.getElementById(styleId);
        const rules = [];
        if (styleElement && styleElement.textContent) {
          const pattern = new RegExp(
            "\\[" + config.hftIdAttribute + "=\"([^\"]+)\"\\]:hover\\s*\\{[^}]*background-color\\s*:\\s*([^;]+);?[^}]*\\}",
            "gi"
          );
          for (const match of styleElement.textContent.matchAll(pattern)) {
            rules.push({ hftId: match[1], color: match[2].trim() });
          }
        }

        const hftId = element.getAttribute(config.hftIdAttribute) || "";
        const filtered = rules.filter((rule) => rule.hftId !== hftId);
        if (color.trim()) {
          filtered.push({ hftId, color: color.trim() });
        }

        if (filtered.length === 0) {
          if (styleElement) styleElement.remove();
          return;
        }

        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = "\\n" + filtered
          .map((rule) => "[" + config.hftIdAttribute + "=\"" + rule.hftId + "\"]:hover { background-color: " + rule.color + "; }")
          .join("\\n") + "\\n";
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
          token: bridgeToken,
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
        if (data.token !== bridgeToken) return;
        if (data.type === "HTML_FINETUNE_SELECT_ELEMENT") {
          selectElementByHftId(data.hftId);
          return;
        }

        if (data.type === "HTML_FINETUNE_PATCH_ELEMENT") {
          patchElement(data.hftId, data.patch || {});
          return;
        }

        if (data.type !== "HTML_FINETUNE_MODAL_COMMAND") return;

        if (data.action === "open") openModal();
        if (data.action === "close") closeModal();
      });

      window.addEventListener("scroll", () => {
        invalidateFrameBounds();
        repositionFloatingToolbar();
      }, true);
      window.addEventListener("resize", () => {
        invalidateFrameBounds();
        repositionFloatingToolbar();
      });

      markEditableElements();
      postModalState();
      window.parent.postMessage({ type: "HTML_FINETUNE_PREVIEW_READY", token: bridgeToken }, "*");
    })();
  </script>`;
}

function createBridgeToken(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `hft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
