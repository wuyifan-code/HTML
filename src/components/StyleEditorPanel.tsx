import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { MousePointerClick, PanelRightOpen, Type } from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { Tooltip } from "./Tooltip";
import { ColorField } from "./ColorField";
import type { EditableAttributes, EditableEffects, EditableStyleKey, SelectedElementSnapshot } from "../types/editor";
import { FONT_SELECT_OPTIONS, normalizeFontValue } from "../utils/fontLibrary";
import { PretextMeasureBadge } from "./PretextMeasureBadge";
import { useLabelDrag } from "../hooks/useLabelDrag";

interface StyleEditorPanelProps {
  selectedElement: SelectedElementSnapshot | null;
  onTextChange: (text: string) => void;
  onStyleChange: (property: EditableStyleKey, value: string) => void;
  onEffectChange: (property: keyof EditableEffects, value: string) => void;
  onAttributeChange: (property: keyof EditableAttributes, value: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const fontSelectOptions = FONT_SELECT_OPTIONS.map(({ value, label }) => ({ value, label }));
const weightOptions = ["300", "400", "500", "600", "700", "800"];
const weightSelectOptions = weightOptions.map((w) => ({ value: w, label: w }));
const textAlignOptions = ["left", "center", "right", "justify", "start"];
const textAlignSelectOptions = textAlignOptions.map((a) => ({ value: a, label: textAlignLabel(a) }));
const borderStyleOptions = ["solid", "dashed", "none"] as const;
const borderStyleSelectOptions = borderStyleOptions.map((s) => ({ value: s, label: s }));
const objectFitOptions = ["cover", "contain", "fill", "none", "scale-down"];
const objectFitSelectOptions = objectFitOptions.map((f) => ({ value: f, label: f }));

export function StyleEditorPanelImpl({
  selectedElement,
  onTextChange,
  onStyleChange,
  onEffectChange,
  onAttributeChange,
  isCollapsed,
  onToggleCollapse,
}: StyleEditorPanelProps) {
  const [inspectorTab, setInspectorTab] = useState<"style" | "computed" | "events">("style");

  if (isCollapsed) {
    return (
      <aside className="panel collapsed-panel collapsed-inspector-panel" aria-label="样式检查器已收起">
        <Tooltip content="展开样式检查器" placement="left">
          <button
            className="collapse-rail-button"
            type="button"
            onClick={onToggleCollapse}
            aria-label="展开样式检查器"
          >
            <PanelRightOpen size={18} strokeWidth={1.75} />
            <span>展开检查器</span>
          </button>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="panel inspector-panel" aria-label="样式检查器">
      <div className="inspector-tabs" role="tablist" aria-label="检查器视图">
        <button
          className={inspectorTab === "style" ? "inspector-tab-active" : ""}
          type="button"
          role="tab"
          aria-selected={inspectorTab === "style"}
          onClick={() => setInspectorTab("style")}
        >
          样式
        </button>
        <button
          className={inspectorTab === "computed" ? "inspector-tab-active" : ""}
          type="button"
          role="tab"
          aria-selected={inspectorTab === "computed"}
          onClick={() => setInspectorTab("computed")}
        >
          计算样式
        </button>
        <button
          className={inspectorTab === "events" ? "inspector-tab-active" : ""}
          type="button"
          role="tab"
          aria-selected={inspectorTab === "events"}
          onClick={() => setInspectorTab("events")}
        >
          事件
        </button>
      </div>

      {!selectedElement ? (
        <>
          <div className="nw-inspector-header">
            <span className="nw-inspector-title">Inspector</span>
          </div>
          <div className="empty-state">
            <div className="empty-state-illustration" aria-hidden="true">
              <div className="empty-doc">
                <Type size={20} strokeWidth={1.75} />
                <span />
                <span />
              </div>
              <div className="empty-arrow" />
              <div className="empty-controls">
                <MousePointerClick size={18} strokeWidth={1.75} />
                <span />
                <span />
              </div>
            </div>
            <h2>请选择一个元素</h2>
            <ol>
              <li>在预览区点击任意文字元素</li>
              <li>在右侧面板调整内容和样式</li>
              <li>实时查看修改效果</li>
            </ol>
          </div>
        </>
      ) : inspectorTab === "computed" ? (
        <ComputedInspector selectedElement={selectedElement} />
      ) : inspectorTab === "events" ? (
        <EventInspector selectedElement={selectedElement} />
      ) : (
        <div className="inspector-content">

          {selectedElement.canEditText ? (
            <div className="nw-card nw-card-brand">
              <div className="nw-card-title">内容</div>
              <div className="nw-card-rows">
                <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                  <label className="field field-full">
                    <span>文本</span>
                    <textarea
                      className="text-field compact-textarea"
                      value={selectedElement.text}
                      placeholder="输入文本内容"
                      onChange={(event) => onTextChange(event.target.value)}
                    />
                  </label>
                  <PretextMeasureBadge
                    text={selectedElement.text}
                    font={buildPretextFont(selectedElement.styles)}
                    maxWidth={parseIntValue(selectedElement.styles.width) || 320}
                    lineHeight={parseIntValue(selectedElement.styles.lineHeight) || 22}
                  />
                </fieldset>
              </div>
            </div>
          ) : null}

          {!isMediaElement(selectedElement) ? (
            <div className="nw-card nw-card-brand" style={{borderLeft:'3px solid var(--n-brand)'}}>
              <div className="nw-card-title">排版</div>
              <div style={{fontSize:'var(--n-text-xs)', color:'var(--n-fg-tertiary)', padding:'0 12px 6px', fontFamily:'var(--n-font-sans)'}}>字体 / 字号 / 字重 / 行高 / 字间距 / 对齐</div>
              <div className="nw-card-rows">
                <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                  <label className="field field-full">
                    <span>字体</span>
                    <CustomSelect
                      value={selectedElement.styles.fontFamily}
                      options={fontSelectOptions}
                      matchValue={(opt, current) => normalizeFontValue(current) === opt.value}
                      onChange={(val) => onStyleChange("fontFamily", val)}
                    />
                  </label>

                  <div className="field-grid two-col">
                    <NumericUnitField
                      label="字号"
                      value={selectedElement.styles.fontSize}
                      min={8}
                      max={180}
                      onChange={(value) => onStyleChange("fontSize", toPx(value))}
                    />
                    <label className="field">
                      <span>字重</span>
                      <CustomSelect
                        value={selectedElement.styles.fontWeight || "400"}
                        options={weightSelectOptions}
                        onChange={(val) => onStyleChange("fontWeight", val)}
                      />
                    </label>
                  </div>

                  <div className="field-grid two-col">
                    <label className="field">
                      <span>行高</span>
                      <div className="unit-input">
                        <input
                          type="text"
                          placeholder="normal 或 1.5"
                          className={!selectedElement.styles.lineHeight ? "line-height-input" : undefined}
                          value={selectedElement.styles.lineHeight || ""}
                          onChange={(event) => onStyleChange("lineHeight", event.target.value)}
                        />
                        <small>px</small>
                      </div>
                    </label>
                    <NumericUnitField
                      label="字间距"
                      value={selectedElement.styles.letterSpacing}
                      step={0.1}
                      onChange={(value) => onStyleChange("letterSpacing", toPx(value))}
                    />
                  </div>

                  <label className="field field-full">
                    <span>文本对齐</span>
                    <CustomSelect
                      value={selectedElement.styles.textAlign}
                      options={textAlignSelectOptions}
                      matchValue={(opt, current) => normalizeTextAlign(current) === opt.value}
                      onChange={(val) => onStyleChange("textAlign", val)}
                    />
                  </label>

                  <ColorField
                    label="颜色"
                    value={selectedElement.styles.color}
                    onChange={(value) => onStyleChange("color", value)}
                    full
                  />
                </fieldset>
              </div>
            </div>
          ) : null}

          {isImageElement(selectedElement) ? (
            <div className="nw-card">
              <div className="nw-card-title">图片</div>
              <div className="nw-card-rows">
                <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                  <label className="field field-full">
                    <span>图片链接</span>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={selectedElement.attributes.src}
                      onChange={(event) => onAttributeChange("src", event.target.value)}
                    />
                  </label>
                  <label className="field field-full">
                    <span>替代文本</span>
                    <input
                      type="text"
                      placeholder="描述这张图片"
                      value={selectedElement.attributes.alt}
                      onChange={(event) => onAttributeChange("alt", event.target.value)}
                    />
                  </label>
                  <div className="field-grid two-col">
                    <NumericUnitField
                      label="宽度"
                      value={selectedElement.styles.width}
                      min={0}
                      onChange={(value) => onStyleChange("width", toPx(value))}
                    />
                    <NumericUnitField
                      label="高度"
                      value={selectedElement.styles.height}
                      min={0}
                      onChange={(value) => onStyleChange("height", toPx(value))}
                    />
                  </div>
                  <label className="field field-full">
                    <span>填充方式</span>
                    <CustomSelect
                      value={selectedElement.styles.objectFit}
                      options={objectFitSelectOptions}
                      matchValue={(opt, current) => normalizeObjectFit(current) === opt.value}
                      onChange={(val) => onStyleChange("objectFit", val)}
                    />
                  </label>
                </fieldset>
              </div>
            </div>
          ) : isSvgElement(selectedElement) ? (
            <div className="nw-card">
              <div className="nw-card-title">SVG 图表</div>
              <div className="nw-card-rows">
                <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                  <label className="field field-full">
                    <span>viewBox</span>
                    <input
                      type="text"
                      placeholder="0 0 540 380"
                      value={selectedElement.attributes.src}
                      onChange={(event) => onAttributeChange("src", event.target.value)}
                    />
                  </label>
                  <label className="field field-full">
                    <span>描述标签</span>
                    <input
                      type="text"
                      placeholder="图表描述（aria-label）"
                      value={selectedElement.attributes.alt}
                      onChange={(event) => onAttributeChange("alt", event.target.value)}
                    />
                  </label>
                  <div className="field-grid two-col">
                    <NumericUnitField
                      label="宽度"
                      value={selectedElement.styles.width}
                      min={0}
                      onChange={(value) => onStyleChange("width", toPx(value))}
                    />
                    <NumericUnitField
                      label="高度"
                      value={selectedElement.styles.height}
                      min={0}
                      onChange={(value) => onStyleChange("height", toPx(value))}
                    />
                  </div>
                </fieldset>
              </div>
            </div>
          ) : null}

          <div className="nw-card">
            <div className="nw-card-title">间距</div>
            <div className="nw-card-rows">
              <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={{ display: "none" }}>盒模型 / 间距</legend>
                <div className="field-grid two-col">
                  <NumericUnitField
                    label="上外边距"
                    value={selectedElement.styles.marginTop}
                    onChange={(value) => onStyleChange("marginTop", toPx(value))}
                  />
                  <NumericUnitField
                    label="下外边距"
                    value={selectedElement.styles.marginBottom}
                    onChange={(value) => onStyleChange("marginBottom", toPx(value))}
                  />
                </div>
                <div className="field-grid two-col">
                  <NumericUnitField
                    label="上内边距"
                    value={selectedElement.styles.paddingTop}
                    onChange={(value) => onStyleChange("paddingTop", toPx(value))}
                  />
                  <NumericUnitField
                    label="下内边距"
                    value={selectedElement.styles.paddingBottom}
                    onChange={(value) => onStyleChange("paddingBottom", toPx(value))}
                  />
                </div>
              </fieldset>
            </div>
          </div>

          {isButtonLikeElement(selectedElement) ? (
            <>
              <div className="nw-card">
                <div className="nw-card-title">颜色</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>按钮样式 - 颜色</legend>
                    <div className="field-grid two-col">
                      <ColorField
                        label="背景色"
                        value={selectedElement.styles.backgroundColor}
                        onChange={(value) => onStyleChange("backgroundColor", value)}
                      />
                      <ColorField
                        label="Hover 色"
                        value={selectedElement.effects.hoverBackgroundColor || selectedElement.styles.backgroundColor}
                        onChange={(value) => onEffectChange("hoverBackgroundColor", value)}
                      />
                    </div>
                    <div className="field-grid two-col">
                      <ColorField
                        label="边框色"
                        value={selectedElement.styles.borderColor}
                        onChange={(value) => onStyleChange("borderColor", value)}
                      />
                      <ColorField
                        label="品牌色"
                        value={selectedElement.styles.color}
                        onChange={(value) => onStyleChange("color", value)}
                      />
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="nw-card">
                <div className="nw-card-title">尺寸</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>按钮样式 - 尺寸</legend>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="宽度"
                        value={selectedElement.styles.width}
                        min={0}
                        onChange={(value) => onStyleChange("width", toPx(value))}
                      />
                      <NumericUnitField
                        label="最大宽度"
                        value={selectedElement.styles.maxWidth}
                        min={0}
                        onChange={(value) => onStyleChange("maxWidth", toPx(value))}
                      />
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="最小高度"
                        value={selectedElement.styles.height}
                        min={0}
                        onChange={(value) => onStyleChange("height", toPx(value))}
                      />
                      <label className="field">
                        <span>填充方式</span>
                        <CustomSelect
                          value={selectedElement.styles.objectFit}
                          options={objectFitSelectOptions}
                          matchValue={(opt, current) => normalizeObjectFit(current) === opt.value}
                          onChange={(val) => onStyleChange("objectFit", val)}
                        />
                      </label>
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="左内边距"
                        value={selectedElement.styles.paddingLeft}
                        min={0}
                        onChange={(value) => onStyleChange("paddingLeft", toPx(value))}
                      />
                      <NumericUnitField
                        label="右内边距"
                        value={selectedElement.styles.paddingRight}
                        min={0}
                        onChange={(value) => onStyleChange("paddingRight", toPx(value))}
                      />
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="nw-card">
                <div className="nw-card-title">边框</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>按钮样式 - 边框</legend>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="圆角"
                        value={selectedElement.styles.borderRadius}
                        min={0}
                        onChange={(value) => onStyleChange("borderRadius", toPx(value))}
                      />
                      <label className="field">
                        <span>样式</span>
                        <CustomSelect
                          value={selectedElement.styles.borderStyle}
                          options={borderStyleSelectOptions}
                          matchValue={(opt, current) => normalizeBorderStyle(current) === opt.value}
                          onChange={(val) => onStyleChange("borderStyle", val)}
                        />
                      </label>
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="宽度"
                        value={selectedElement.styles.borderWidth}
                        min={0}
                        onChange={(value) => onStyleChange("borderWidth", toPx(value))}
                      />
                      <label className="field">
                        <span>阴影</span>
                        <input
                          type="text"
                          placeholder="0 18px 50px rgba(67,55,42,.12)"
                          value={selectedElement.styles.boxShadow || ""}
                          onChange={(event) => onStyleChange("boxShadow", event.target.value)}
                        />
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            </>
          ) : isBlockLikeElement(selectedElement) ? (
            <>
              <div className="nw-card">
                <div className="nw-card-title">颜色</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>卡片 / 区块 - 颜色</legend>
                    <div className="field-grid two-col">
                      <ColorField
                        label="背景色"
                        value={selectedElement.styles.backgroundColor}
                        onChange={(value) => onStyleChange("backgroundColor", value)}
                      />
                      <ColorField
                        label="边框色"
                        value={selectedElement.styles.borderColor}
                        onChange={(value) => onStyleChange("borderColor", value)}
                      />
                    </div>
                    <div className="field-grid two-col">
                      <ColorField
                        label="品牌色"
                        value={selectedElement.styles.color}
                        onChange={(value) => onStyleChange("color", value)}
                      />
                      <ColorField
                        label="主文字"
                        value={selectedElement.styles.color}
                        onChange={(value) => onStyleChange("color", value)}
                      />
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="nw-card">
                <div className="nw-card-title">尺寸</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>卡片 / 区块 - 尺寸</legend>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="宽度"
                        value={selectedElement.styles.width}
                        min={0}
                        onChange={(value) => onStyleChange("width", toPx(value))}
                      />
                      <NumericUnitField
                        label="最大宽度"
                        value={selectedElement.styles.maxWidth}
                        min={0}
                        onChange={(value) => onStyleChange("maxWidth", toPx(value))}
                      />
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="最小高度"
                        value={selectedElement.styles.height}
                        min={0}
                        onChange={(value) => onStyleChange("height", toPx(value))}
                      />
                      <label className="field">
                        <span>填充方式</span>
                        <CustomSelect
                          value={selectedElement.styles.objectFit}
                          options={objectFitSelectOptions}
                          matchValue={(opt, current) => normalizeObjectFit(current) === opt.value}
                          onChange={(val) => onStyleChange("objectFit", val)}
                        />
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="nw-card">
                <div className="nw-card-title">边框</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>卡片 / 区块 - 边框</legend>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="圆角"
                        value={selectedElement.styles.borderRadius}
                        min={0}
                        onChange={(value) => onStyleChange("borderRadius", toPx(value))}
                      />
                      <label className="field">
                        <span>样式</span>
                        <CustomSelect
                          value={selectedElement.styles.borderStyle}
                          options={borderStyleSelectOptions}
                          matchValue={(opt, current) => normalizeBorderStyle(current) === opt.value}
                          onChange={(val) => onStyleChange("borderStyle", val)}
                        />
                      </label>
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="宽度"
                        value={selectedElement.styles.borderWidth}
                        min={0}
                        onChange={(value) => onStyleChange("borderWidth", toPx(value))}
                      />
                      <label className="field">
                        <span>阴影</span>
                        <input
                          type="text"
                          placeholder="0 18px 50px rgba(67,55,42,.12)"
                          value={selectedElement.styles.boxShadow || ""}
                          onChange={(event) => onStyleChange("boxShadow", event.target.value)}
                        />
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="nw-card">
                <div className="nw-card-title">颜色</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>默认 - 颜色</legend>
                    <div className="field-grid two-col">
                      <ColorField
                        label="背景色"
                        value={selectedElement.styles.backgroundColor}
                        onChange={(value) => onStyleChange("backgroundColor", value)}
                      />
                      <ColorField
                        label="主文字"
                        value={selectedElement.styles.color}
                        onChange={(value) => onStyleChange("color", value)}
                      />
                    </div>
                    <div className="field-grid two-col">
                      <ColorField
                        label="品牌色"
                        value={selectedElement.styles.color}
                        onChange={(value) => onStyleChange("color", value)}
                      />
                      <ColorField
                        label="边框色"
                        value={selectedElement.styles.borderColor}
                        onChange={(value) => onStyleChange("borderColor", value)}
                      />
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="nw-card">
                <div className="nw-card-title">尺寸</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>默认 - 尺寸</legend>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="宽度"
                        value={selectedElement.styles.width}
                        min={0}
                        onChange={(value) => onStyleChange("width", toPx(value))}
                      />
                      <NumericUnitField
                        label="最大宽度"
                        value={selectedElement.styles.maxWidth}
                        min={0}
                        onChange={(value) => onStyleChange("maxWidth", toPx(value))}
                      />
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="最小高度"
                        value={selectedElement.styles.height}
                        min={0}
                        onChange={(value) => onStyleChange("height", toPx(value))}
                      />
                      <label className="field">
                        <span>填充方式</span>
                        <CustomSelect
                          value={selectedElement.styles.objectFit}
                          options={objectFitSelectOptions}
                          matchValue={(opt, current) => normalizeObjectFit(current) === opt.value}
                          onChange={(val) => onStyleChange("objectFit", val)}
                        />
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="nw-card">
                <div className="nw-card-title">边框</div>
                <div className="nw-card-rows">
                  <fieldset className="inspector-group" style={{ border: "none", padding: 0, margin: 0 }}>
                    <legend style={{ display: "none" }}>默认 - 边框</legend>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="圆角"
                        value={selectedElement.styles.borderRadius}
                        min={0}
                        onChange={(value) => onStyleChange("borderRadius", toPx(value))}
                      />
                      <label className="field">
                        <span>样式</span>
                        <CustomSelect
                          value={selectedElement.styles.borderStyle}
                          options={borderStyleSelectOptions}
                          matchValue={(opt, current) => normalizeBorderStyle(current) === opt.value}
                          onChange={(val) => onStyleChange("borderStyle", val)}
                        />
                      </label>
                    </div>
                    <div className="field-grid two-col">
                      <NumericUnitField
                        label="宽度"
                        value={selectedElement.styles.borderWidth}
                        min={0}
                        onChange={(value) => onStyleChange("borderWidth", toPx(value))}
                      />
                      <label className="field">
                        <span>阴影</span>
                        <input
                          type="text"
                          placeholder="0 18px 50px rgba(67,55,42,.12)"
                          value={selectedElement.styles.boxShadow || ""}
                          onChange={(event) => onStyleChange("boxShadow", event.target.value)}
                        />
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            </>
          )}

          <fieldset className="inspector-group info-group">
            <legend>元素信息</legend>
            <dl>
              <InfoRow label="标签" value={selectedElement.tagName} />
              <InfoRow label="HFT ID" value={selectedElement.hftId} />
              <InfoRow label="类名" value={selectedElement.className || "无"} />
              <InfoRow label="行内" value={selectedElement.hasInlineStyle ? "是" : "否"} />
            </dl>
          </fieldset>
        </div>
      )}
    </aside>
  );
}

export const StyleEditorPanel = memo(StyleEditorPanelImpl);

function ComputedInspector({ selectedElement }: { selectedElement: SelectedElementSnapshot }) {
  const [expandedGroups, setExpandedGroups] = useState({
    typography: true,
    box: true,
    paint: true,
  });

  const toggleGroup = (group: "typography" | "box" | "paint") => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <div className="inspector-content inspector-readout">
      <div className="selected-element-bar">
        <div>
          <small>Computed</small>
          <span>{selectedElement.location || selectedElement.tagName}</span>
        </div>
      </div>
      
      <fieldset className={`inspector-group info-group collapsible-group${expandedGroups.typography ? "" : " is-collapsed"}`}>
        <legend onClick={() => toggleGroup("typography")}>
          <span className="collapsible-group__arrow">›</span>
          <span>Typography</span>
        </legend>
        <div className="collapsible-group__content">
          <dl>
            <InfoRow label="字体" value={selectedElement.styles.fontFamily || "inherit"} />
            <InfoRow label="字号" value={selectedElement.styles.fontSize || "inherit"} />
            <InfoRow label="字重" value={selectedElement.styles.fontWeight || "normal"} />
            <InfoRow label="行高" value={selectedElement.styles.lineHeight || "normal"} />
            <InfoRow label="对齐" value={selectedElement.styles.textAlign || "start"} />
          </dl>
        </div>
      </fieldset>
      
      <fieldset className={`inspector-group info-group collapsible-group${expandedGroups.box ? "" : " is-collapsed"}`}>
        <legend onClick={() => toggleGroup("box")}>
          <span className="collapsible-group__arrow">›</span>
          <span>Box</span>
        </legend>
        <div className="collapsible-group__content">
          <dl>
            <InfoRow label="宽度" value={selectedElement.styles.width || "auto"} />
            <InfoRow label="高度" value={selectedElement.styles.height || "auto"} />
            <InfoRow label="上外边距" value={selectedElement.styles.marginTop || "0px"} />
            <InfoRow label="下外边距" value={selectedElement.styles.marginBottom || "0px"} />
            <InfoRow label="圆角" value={selectedElement.styles.borderRadius || "0px"} />
          </dl>
        </div>
      </fieldset>
      
      <fieldset className={`inspector-group info-group collapsible-group${expandedGroups.paint ? "" : " is-collapsed"}`}>
        <legend onClick={() => toggleGroup("paint")}>
          <span className="collapsible-group__arrow">›</span>
          <span>Paint</span>
        </legend>
        <div className="collapsible-group__content">
          <dl>
            <InfoRow label="文字色" value={selectedElement.styles.color || "inherit"} />
            <InfoRow label="背景色" value={selectedElement.styles.backgroundColor || "transparent"} />
            <InfoRow label="边框色" value={selectedElement.styles.borderColor || "transparent"} />
            <InfoRow label="阴影" value={selectedElement.styles.boxShadow || "none"} />
          </dl>
        </div>
      </fieldset>
    </div>
  );
}

function EventInspector({ selectedElement }: { selectedElement: SelectedElementSnapshot }) {
  return (
    <div className="inspector-content inspector-readout">
      <div className="selected-element-bar">
        <div>
          <small>Events</small>
          <span>{selectedElement.location || selectedElement.tagName}</span>
        </div>
      </div>
      <fieldset className="inspector-group info-group">
        <legend>Element State</legend>
        <dl>
          <InfoRow label="点击语义" value={interactionLabel(selectedElement)} />
          <InfoRow label="文本编辑" value={selectedElement.canEditText ? "可编辑" : "继承子元素"} />
          <InfoRow label="Hover 背景" value={selectedElement.effects.hoverBackgroundColor || "未设置"} />
          <InfoRow label="行内样式" value={selectedElement.hasInlineStyle ? "已设置" : "未设置"} />
        </dl>
      </fieldset>
      <fieldset className="inspector-group info-group">
        <legend>Attributes</legend>
        <dl>
          <InfoRow label="标签" value={selectedElement.tagName} />
          <InfoRow label="类名" value={selectedElement.className || "无"} />
          <InfoRow label="HFT ID" value={selectedElement.hftId} />
        </dl>
      </fieldset>
    </div>
  );
}

interface NumericUnitFieldProps {
  label: string;
  value: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: string) => void;
}

function NumericUnitField({ label, value, min, max, step = 1, onChange }: NumericUnitFieldProps) {
  // 区分"未设置"(空/自动继承)与"显式 0"两类状态。
  // 用 text + 数字过滤,避免 number input 在 placeholder 上行为不一致。
  const trimmed = (value ?? "").trim();
  const isAuto = !trimmed;
  const display = isAuto ? "" : parseNumber(value);

  // 把含单位的原始值传给 useLabelDrag,保留 em/%/rem 等单位
  const dragValue = isAuto ? "0" : (value ?? "").trim();
  const dragHandlers = useLabelDrag(dragValue, (nextVal) => {
    onChange(nextVal);
  }, { step, min, max });

  return (
    <label className="field">
      <span className="draggable-label" {...dragHandlers} title="按住标签左右拖拽可快捷微调数值">{label}</span>
      <div className="unit-input">
        <input
          type="text"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          placeholder="自动"
          className={isAuto ? "unit-input-empty" : undefined}
          value={display}
          onChange={(event) => {
            const next = event.target.value;
            // 允许清空 (用户按删除键),允许正负小数
            if (next === "" || /^-?\d*\.?\d*$/.test(next)) {
              onChange(next);
            }
          }}
        />
        <small>px</small>
      </div>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value || value === "无" || value === "未设置" || value === "transparent" || value === "none") return;
    
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    });
  };

  return (
    <div 
      className={`info-row-item${copied ? " is-copied-flash" : ""}`} 
      onClick={handleCopy}
      title={value && value !== "无" && value !== "未设置" ? `点击复制属性值: ${value}` : undefined}
      style={{ cursor: value && value !== "无" && value !== "未设置" ? "pointer" : "default", position: "relative" }}
    >
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
      {copied && <span className="info-row-item__copied-tag">已复制!</span>}
    </div>
  );
}

function parseNumber(value: string): string {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function toPx(value: string): string {
  if (!value.trim()) return "";
  return `${value}px`;
}

function normalizeTextAlign(value: string): string {
  return textAlignOptions.includes(value) ? value : "left";
}

function normalizeBorderStyle(value: string): string {
  if (["solid", "dashed", "none"].includes(value)) return value;
  return "solid";
}

function normalizeObjectFit(value: string): string {
  if (["cover", "contain", "fill", "none", "scale-down"].includes(value)) return value;
  return "cover";
}

function isButtonLikeElement(element: SelectedElementSnapshot): boolean {
  if (element.tagName === "button") return true;
  if (element.tagName === "a" && /button|btn|cta|action/i.test(element.className)) return true;
  return false;
}

function isBlockLikeElement(element: SelectedElementSnapshot): boolean {
  return ["section", "article", "aside", "div", "blockquote"].includes(element.tagName);
}

function isImageElement(element: SelectedElementSnapshot): boolean {
  return element.tagName === "img" || element.tagName === "image";
}

function isSvgElement(element: SelectedElementSnapshot): boolean {
  return element.tagName === "svg";
}

function isMediaElement(element: SelectedElementSnapshot): boolean {
  return isImageElement(element) || isSvgElement(element);
}

function interactionLabel(element: SelectedElementSnapshot): string {
  if (element.tagName === "button") return "button";
  if (element.tagName === "a") return "link";
  if (element.tagName === "dialog") return "dialog";
  if (/modal|dialog|popup/i.test(element.className)) return "modal";
  return "none";
}

function textAlignLabel(value: string): string {
  const labels: Record<string, string> = {
    left: "左对齐",
    center: "居中",
    right: "右对齐",
    justify: "两端对齐",
    start: "起始对齐",
  };
  return labels[value] ?? value;
}

/**
 * 从样式表中构建 Pretext font 简写字符串
 * 用于零 DOM 回流的文本测量
 */
function buildPretextFont(styles: SelectedElementSnapshot["styles"]): string {
  const size = parseIntValue(styles.fontSize) || 16;
  const family = styles.fontFamily || "Inter, sans-serif";
  const weight = styles.fontWeight && styles.fontWeight !== "400" ? styles.fontWeight + " " : "";
  return `${weight}${size}px ${family}`;
}

function parseIntValue(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
