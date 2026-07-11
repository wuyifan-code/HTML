import { forwardRef, type PointerEvent } from "react";
import { ColorField } from "../../ColorField";
import { PretextMeasureBadge } from "../../PretextMeasureBadge";
import { DiagnosticsSection } from "./DiagnosticsSection";
import { InspectorSection } from "./InspectorSection";
import { ChevronRight } from "lucide-react";
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconBold,
  IconItalic,
  IconType,
  IconSpacing,
  IconRuler,
  IconPalette,
  IconBorder,
  IconActivity,
  IconMove,
  IconImport,
  IconDownload,
  IconMaximize,
} from "../../Icons";
import type { SelectedSnapshot } from "../../../types/editor";
import type { Annotation } from "./DiagnosticsSection";
import { ArrowUpFromLine, ArrowDownFromLine, Copy, ClipboardPaste, Trash2 } from "lucide-react";

export interface InspectorPanelProps {
  selected: SelectedSnapshot | null;
  draftFontSize: string;
  draftFontWeight: string;
  draftFontFamily: string;
  draftLineHeight: string;
  draftLetterSpacing: string;
  draftColor: string;
  draftBackgroundColor: string;
  draftHoverBackground: string;
  draftMarginTop: string;
  draftMarginBottom: string;
  draftPaddingTop: string;
  draftPaddingBottom: string;
  draftPaddingLeft: string;
  draftPaddingRight: string;
  draftWidth: string;
  draftHeight: string;
  selectedAnnotation: any;
  onFontSizeChange: (v: string) => void;
  onFontWeightChange: (v: string) => void;
  onFontFamilyChange: (v: string) => void;
  onLineHeightChange: (v: string) => void;
  onLetterSpacingChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onBackgroundColorChange: (v: string) => void;
  onHoverBackgroundChange: (v: string) => void;
  onMarginTopChange: (v: string) => void;
  onMarginBottomChange: (v: string) => void;
  onPaddingTopChange: (v: string) => void;
  onPaddingBottomChange: (v: string) => void;
  onPaddingInlineChange: (v: string) => void;
  onWidthChange: (v: string) => void;
  onHeightChange: (v: string) => void;
  onApplyStyle: () => void;
  onApplyText: () => void;
  onAlignChange: (align: "left" | "center" | "right") => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
  canEditSelectedText: boolean;
  textContent: string;
  onTextContentChange: (v: string) => void;

  // 快捷操作回调 (单测及 App 生产使用)
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCopyStyle?: () => void;
  onPasteStyle?: () => void;
  onModalCommand?: (cmd: "open" | "close") => void;
  hasCopiedStyle?: boolean;

  // 外层 aside 布局控制 props
  isCollapsed?: boolean;
  onResizeStart?: (event: PointerEvent<HTMLButtonElement>) => void;
  onCollapseToggle?: () => void;
}

export const InspectorPanel = forwardRef<HTMLElement, InspectorPanelProps>(({
  selected,
  draftFontSize,
  draftFontWeight,
  draftFontFamily,
  draftLineHeight,
  draftLetterSpacing,
  draftColor,
  draftBackgroundColor,
  draftHoverBackground,
  draftMarginTop,
  draftMarginBottom,
  draftPaddingTop,
  draftPaddingBottom,
  draftPaddingLeft,
  draftPaddingRight,
  draftWidth,
  draftHeight,
  selectedAnnotation,
  onFontSizeChange,
  onFontWeightChange,
  onFontFamilyChange,
  onLineHeightChange,
  onLetterSpacingChange,
  onColorChange,
  onBackgroundColorChange,
  onHoverBackgroundChange,
  onMarginTopChange,
  onMarginBottomChange,
  onPaddingTopChange,
  onPaddingBottomChange,
  onPaddingInlineChange,
  onWidthChange,
  onHeightChange,
  onApplyStyle,
  onApplyText,
  onAlignChange,
  onBoldToggle,
  onItalicToggle,
  canEditSelectedText,
  textContent,
  onTextContentChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onCopyStyle,
  onPasteStyle,
  onModalCommand,
  hasCopiedStyle,
  isCollapsed = false,
  onResizeStart,
  onCollapseToggle,
}, ref) => {
  const annotations: any[] = selectedAnnotation ? [selectedAnnotation] : [];
  const pretextFont = `${draftFontWeight || ""} ${parseFloat(draftFontSize) || 16}px ${draftFontFamily || "Inter, sans-serif"}`;

  return (
    <aside
      id="inspector-panel"
      ref={ref}
      className={[
        "nw-right-panel",
        "panel",
        "inspector",
        isCollapsed ? "is-collapsed" : "",
      ].filter(Boolean).join(" ")}
      aria-label="属性面板"
      data-dom-id="panel-inspector"
    >
      {!isCollapsed && (
        <button
          className="panel-resizer panel-resizer-inspector"
          type="button"
          aria-label="拖拽调整属性面板宽度"
          onPointerDown={onResizeStart}
        />
      )}
      <div className="inspector-tabs-wrap">
        <span className="nw-inspector-title">Inspector</span>
        {!isCollapsed && (
          <button
            className="panel-collapse-btn"
            type="button"
            aria-label="收起样式检查器"
            aria-controls="inspector-panel"
            aria-expanded="true"
            title="收起侧边栏"
            onClick={onCollapseToggle}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        selected ? (
          <>
            <div className="inspector-selection" data-dom-id="inspector-selection">
              <div className="inspector-selection__row1">
                <span className="inspector-selection__tag">{selected.tagName.toLowerCase()}</span>
                {selected.label && <span className="inspector-selection__label">{selected.label}</span>}
                <span className="inspector-selection__path" title={selected.path}>
                  {selected.path}
                </span>
                {selected.className && <span className="inspector-selection__className">{selected.className}</span>}
              </div>
              <div className="inspector-selection__metrics">
                <span>{selected.width || "auto"} × {selected.height || "auto"} px</span>
                <span>{selected.fontSize || "—"} / {selected.lineHeight || "—"}</span>
                <span>{selected.fontWeight || "—"}</span>
              </div>
            </div>
            <div className="inspector-body">
              {selectedAnnotation ? (
                <p className="meta ai-selected-note">
                  AI：{selectedAnnotation.label} · {selectedAnnotation.role}
                  {selectedAnnotation.issues.length ? " · " + selectedAnnotation.issues.join(" / ") : ""}
                </p>
              ) : null}

              <section className="property-card inspector-card" data-dom-id="alignment-bar">
                <div className="inspector-card__head">
                  <IconAlignCenter />
                  <span className="inspector-card__title">对齐</span>
                </div>
                <div className="alignment-bar">
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.textAlign === "left" ? " is-on" : "")}
                    title="左对齐"
                    aria-label="左对齐"
                    aria-pressed={selected.textAlign === "left"}
                    onClick={() => onAlignChange("left")}
                  >
                    <IconAlignLeft />
                  </button>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.textAlign === "center" ? " is-on" : "")}
                    title="居中"
                    aria-label="居中"
                    aria-pressed={selected.textAlign === "center"}
                    onClick={() => onAlignChange("center")}
                  >
                    <IconAlignCenter />
                  </button>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.textAlign === "right" ? " is-on" : "")}
                    title="右对齐"
                    aria-label="右对齐"
                    aria-pressed={selected.textAlign === "right"}
                    onClick={() => onAlignChange("right")}
                  >
                    <IconAlignRight />
                  </button>
                  <span className="alignment-bar__sep" aria-hidden="true"></span>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.fontWeight === "bold" || selected.fontWeight === "700" ? " is-on" : "")}
                    title="加粗"
                    aria-label="加粗"
                    aria-pressed={selected.fontWeight === "bold" || selected.fontWeight === "700"}
                    onClick={onBoldToggle}
                  >
                    <IconBold />
                  </button>
                  <button
                    type="button"
                    className={"ds-btn ds-btn--secondary ds-btn--sm ds-btn--icon" + (selected.fontStyle === "italic" ? " is-on" : "")}
                    title="斜体"
                    aria-label="斜体"
                    aria-pressed={selected.fontStyle === "italic"}
                    onClick={onItalicToggle}
                  >
                    <IconItalic />
                  </button>
                </div>
              </section>

              {canEditSelectedText && (
                <div className="property-card">
                  <label className="field field-full">
                    <span>文字内容</span>
                    <textarea
                      id="contentInput"
                      className="text-field compact-textarea"
                      value={textContent}
                      placeholder="输入文本内容"
                      onChange={(event) => onTextContentChange(event.target.value)}
                    />
                  </label>
                  <PretextMeasureBadge
                    text={textContent}
                    font={pretextFont}
                    maxWidth={parseFloat(draftWidth) || 320}
                    lineHeight={parseFloat(draftLineHeight) || 22}
                  />
                  <button
                    className="inspector-apply-btn"
                    type="button"
                    onClick={onApplyText}
                  >
                    应用到 Canvas
                  </button>
                </div>
              )}

              <InspectorSection title="字体" icon={<IconType />}>
                <div className="field-grid two-col">
                  <label className="field">
                    <span>字号</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="16"
                      value={draftFontSize}
                      onChange={(event) => onFontSizeChange(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>字重</span>
                    <input
                      type="text"
                      placeholder="400"
                      value={draftFontWeight}
                      onChange={(event) => onFontWeightChange(event.target.value)}
                    />
                  </label>
                </div>
                <label className="field field-full">
                  <span>字体</span>
                  <input
                    type="text"
                    placeholder="Inter, sans-serif"
                    value={draftFontFamily}
                    onChange={(event) => onFontFamilyChange(event.target.value)}
                  />
                </label>
                <div className="field-grid two-col">
                  <label className="field">
                    <span>行高</span>
                    <input
                      type="text"
                      placeholder="1.5"
                      value={draftLineHeight}
                      onChange={(event) => onLineHeightChange(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>字距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftLetterSpacing}
                      onChange={(event) => onLetterSpacingChange(event.target.value)}
                    />
                  </label>
                </div>
              </InspectorSection>

              <InspectorSection title="间距" icon={<IconSpacing />}>
                <div className="field-grid two-col">
                  <label className="field">
                    <span>上外边距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftMarginTop}
                      onChange={(event) => onMarginTopChange(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>下外边距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftMarginBottom}
                      onChange={(event) => onMarginBottomChange(event.target.value)}
                    />
                  </label>
                </div>
                <div className="field-grid two-col">
                  <label className="field">
                    <span>上内边距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftPaddingTop}
                      onChange={(event) => onPaddingTopChange(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>下内边距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftPaddingBottom}
                      onChange={(event) => onPaddingBottomChange(event.target.value)}
                    />
                  </label>
                </div>
                <div className="field-grid two-col">
                  <label className="field">
                    <span>左内边距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftPaddingLeft}
                      onChange={(event) => onPaddingInlineChange(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>右内边距</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftPaddingRight}
                      onChange={(event) => onPaddingInlineChange(event.target.value)}
                    />
                  </label>
                </div>
                <label className="field field-full">
                  <span>行内填充</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    onChange={(event) => onPaddingInlineChange(event.target.value)}
                  />
                </label>
              </InspectorSection>

              <InspectorSection title="颜色" icon={<IconPalette />}>
                <ColorField
                  label="文字色"
                  value={draftColor}
                  onChange={onColorChange}
                  full
                />
                <ColorField
                  label="背景色"
                  value={draftBackgroundColor}
                  onChange={onBackgroundColorChange}
                  full
                />
                <ColorField
                  label="Hover 背景"
                  value={draftHoverBackground}
                  onChange={onHoverBackgroundChange}
                  full
                />
              </InspectorSection>

              <InspectorSection title="尺寸" icon={<IconRuler />}>
                <div className="field-grid two-col">
                  <label className="field">
                    <span>宽度</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="auto"
                      value={draftWidth}
                      onChange={(event) => onWidthChange(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>高度</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="auto"
                      value={draftHeight}
                      onChange={(event) => onHeightChange(event.target.value)}
                    />
                  </label>
                </div>
              </InspectorSection>

              <InspectorSection title="边框" icon={<IconBorder />} defaultOpen={false}>
                <p className="meta">边框设置将在后续版本中提供。</p>
              </InspectorSection>

              <InspectorSection title="诊断" icon={<IconActivity />}>
                <DiagnosticsSection
                  selected={selected}
                  annotations={annotations as any}
                  onLocateIssue={(field) => {
                    const annotation = annotations.find((a) => a.field === field);
                    if (annotation) onLocateAnnotation(annotation);
                  }}
                />
              </InspectorSection>
            </div>
            <div className="quick-actions" aria-label="元素操作" style={{margin: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"}}>
              <button className="btn" type="button" aria-label="上移元素" onClick={onMoveUp} disabled={!selected}>上移</button>
              <button className="btn" type="button" aria-label="下移元素" onClick={onMoveDown} disabled={!selected}>下移</button>
              <button className="btn" type="button" aria-label="复制元素" onClick={onDuplicate} disabled={!selected}>复制元素</button>
              <button className="btn" type="button" aria-label="删除元素" onClick={onDelete} disabled={!selected}>删除</button>
              <button className="btn" type="button" aria-label="复制样式" onClick={onCopyStyle} disabled={!selected}>复制样式</button>
              <button className="btn" type="button" aria-label="粘贴样式" onClick={onPasteStyle} disabled={!selected || !hasCopiedStyle}>粘贴样式</button>
              <button className="btn" type="button" aria-label="弹窗" onClick={() => onModalCommand?.("open")} disabled={!selected}>打开弹窗</button>
            </div>
            <button className="inspector-apply-btn" type="button" onClick={onApplyStyle} style={{margin: "12px", width: "calc(100% - 24px)"}}>
              应用样式到 Canvas
            </button>
          </>
        ) : (
          <section className="property-card inspector-empty" aria-label="选择提示">
            <strong>未选择元素</strong>
            <p className="meta">在画布或结构树中选择一个对象，在此处编辑内容、样式和属性。</p>
            <p className="meta">提示：按 <kbd>?</kbd> 查看全部快捷键。</p>
          </section>
        )
      )}
    </aside>
  );

  function onLocateAnnotation(annotation: Annotation) {
    switch (annotation.field) {
      case "fontSize":
        onFontSizeChange(annotation.suggestion);
        break;
      case "fontWeight":
        onFontWeightChange(annotation.suggestion);
        break;
      case "fontFamily":
        onFontFamilyChange(annotation.suggestion);
        break;
      case "lineHeight":
        onLineHeightChange(annotation.suggestion);
        break;
      case "letterSpacing":
        onLetterSpacingChange(annotation.suggestion);
        break;
      case "color":
        onColorChange(annotation.suggestion);
        break;
      case "backgroundColor":
        onBackgroundColorChange(annotation.suggestion);
        break;
      case "marginTop":
        onMarginTopChange(annotation.suggestion);
        break;
      case "marginBottom":
        onMarginBottomChange(annotation.suggestion);
        break;
      case "paddingTop":
        onPaddingTopChange(annotation.suggestion);
        break;
      case "paddingBottom":
        onPaddingBottomChange(annotation.suggestion);
        break;
      case "paddingLeft":
        onPaddingInlineChange(annotation.suggestion);
        break;
      case "paddingRight":
        onPaddingInlineChange(annotation.suggestion);
        break;
      case "width":
        onWidthChange(annotation.suggestion);
        break;
      case "height":
        onHeightChange(annotation.suggestion);
        break;
    }
  }
});

InspectorPanel.displayName = "InspectorPanel";
