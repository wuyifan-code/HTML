import { ColorField } from "../../ColorField";
import { PretextMeasureBadge } from "../../PretextMeasureBadge";
import { DiagnosticsSection } from "./DiagnosticsSection";
import { InspectorSection } from "./InspectorSection";
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
  selectedAnnotation: Annotation | null;
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
}

export function InspectorPanel({
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
}: InspectorPanelProps) {
  const annotations: Annotation[] = selectedAnnotation ? [selectedAnnotation] : [];

  if (!selected) {
    return (
      <div className="nw-right-panel" role="tabpanel" aria-label="检查器">
        <div className="inspector-empty">
          <strong>未选择元素</strong>
          <p className="meta">在画布或结构树中选择一个对象以查看和编辑其样式属性。</p>
        </div>
      </div>
    );
  }

  const pretextFont = `${draftFontWeight || ""} ${Number.parseFloat(draftFontSize) || 16}px ${draftFontFamily || "Inter, sans-serif"}`;

  return (
    <div className="nw-right-panel" role="tabpanel" aria-label="检查器">
      <div className="nw-inspector-title">Inspector</div>

      <div className="inspector-selection">
        <span className="inspector-selection__tag">{selected.tagName}</span>
        <span className="inspector-selection__label">{selected.label}</span>
        <span className="inspector-selection__path">{selected.path}</span>
        {selected.className && (
          <span className="inspector-selection__className">{selected.className}</span>
        )}
      </div>

      <div className="inspector-body">
        <div className="alignment-bar" role="toolbar" aria-label="对齐工具栏">
          <button type="button" onClick={() => onAlignChange("left")} aria-label="左对齐">
            <IconAlignLeft />
          </button>
          <button type="button" onClick={() => onAlignChange("center")} aria-label="居中">
            <IconAlignCenter />
          </button>
          <button type="button" onClick={() => onAlignChange("right")} aria-label="右对齐">
            <IconAlignRight />
          </button>
          <span className="alignment-bar__divider" />
          <button type="button" onClick={onBoldToggle} aria-label="加粗">
            <IconBold />
          </button>
          <button type="button" onClick={onItalicToggle} aria-label="斜体">
            <IconItalic />
          </button>
        </div>

        {canEditSelectedText && (
          <div className="property-card">
            <label className="field field-full">
              <span>文字内容</span>
              <textarea
                className="text-field compact-textarea"
                value={textContent}
                placeholder="输入文本内容"
                onChange={(event) => onTextContentChange(event.target.value)}
              />
            </label>
            <PretextMeasureBadge
              text={textContent}
              font={pretextFont}
              maxWidth={Number.parseFloat(draftWidth) || 320}
              lineHeight={Number.parseFloat(draftLineHeight) || 22}
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

        <div className="quick-actions" role="toolbar" aria-label="快速操作">
          <button type="button" title="上移元素" aria-label="上移元素"><ArrowUpFromLine size={14} strokeWidth={1.75} /></button>
          <button type="button" title="下移元素" aria-label="下移元素"><ArrowDownFromLine size={14} strokeWidth={1.75} /></button>
          <button type="button" title="复制元素" aria-label="复制元素"><Copy size={14} strokeWidth={1.75} /></button>
          <button type="button" title="删除元素" aria-label="删除元素"><Trash2 size={14} strokeWidth={1.75} /></button>
          <span className="quick-actions__divider" />
          <button type="button" title="复制样式" aria-label="复制样式"><IconImport /></button>
          <button type="button" title="粘贴样式" aria-label="粘贴样式"><IconDownload /></button>
          <button type="button" title="弹窗" aria-label="弹窗"><IconMaximize /></button>
        </div>

        <InspectorSection title="快速样式" icon={<IconType />} defaultOpen={false}>
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
        </InspectorSection>

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

        <InspectorSection title="边框" icon={<IconBorder />} defaultOpen={false}>
          <p className="meta">边框设置将在后续版本中提供。</p>
        </InspectorSection>

        <InspectorSection title="诊断" icon={<IconActivity />}>
          <DiagnosticsSection
            selected={selected}
            annotations={annotations}
            onLocateIssue={(field) => {
              const annotation = annotations.find((a) => a.field === field);
              if (annotation) onLocateAnnotation(annotation);
            }}
          />
        </InspectorSection>

        <div className="quick-actions" role="toolbar" aria-label="元素操作">
          <button type="button" title="上移元素" aria-label="上移元素"><ArrowUpFromLine size={14} strokeWidth={1.75} /></button>
          <button type="button" title="下移元素" aria-label="下移元素"><ArrowDownFromLine size={14} strokeWidth={1.75} /></button>
          <button type="button" title="复制元素" aria-label="复制元素"><Copy size={14} strokeWidth={1.75} /></button>
          <button type="button" title="删除元素" aria-label="删除元素"><Trash2 size={14} strokeWidth={1.75} /></button>
          <span className="quick-actions__divider" />
          <button type="button" title="复制样式" aria-label="复制样式"><IconImport /></button>
          <button type="button" title="粘贴样式" aria-label="粘贴样式"><IconDownload /></button>
          <button type="button" title="弹窗" aria-label="弹窗"><IconMaximize /></button>
        </div>
      </div>
    </div>
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
}
