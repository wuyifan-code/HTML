import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Copy, MousePointerClick, PanelRightClose, PanelRightOpen, SlidersHorizontal, Type } from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import type { EditableAttributes, EditableEffects, EditableStyleKey, SelectedElementSnapshot } from "../types/editor";
import { FONT_SELECT_OPTIONS, normalizeFontValue } from "../utils/fontLibrary";

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
        <button
          className="collapse-rail-button"
          type="button"
          onClick={onToggleCollapse}
          aria-label="展开样式检查器"
          title="展开样式检查器"
        >
          <PanelRightOpen size={18} strokeWidth={1.75} />
          <span>展开检查器</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel inspector-panel" aria-label="样式检查器">
      <div className="panel-header">
        <div className="panel-title">
          <SlidersHorizontal size={18} strokeWidth={1.75} />
          <span>Inspector</span>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onToggleCollapse}
          aria-label="收起样式检查器"
          title="收起样式检查器"
        >
          <PanelRightClose size={18} strokeWidth={1.75} />
        </button>
      </div>
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
      ) : inspectorTab === "computed" ? (
        <ComputedInspector selectedElement={selectedElement} />
      ) : inspectorTab === "events" ? (
        <EventInspector selectedElement={selectedElement} />
      ) : (
        <div className="inspector-content">
          <div className="selected-element-bar">
            <div>
              <small>Selected</small>
              <span>{selectedElement.location || selectedElement.tagName}</span>
            </div>
            <button
              className="icon-button subtle-icon-button"
              type="button"
              title="复制选择器"
              aria-label="复制选择器"
              onClick={() => {
                void navigator.clipboard?.writeText(selectedElement.location || selectedElement.tagName);
              }}
            >
              <Copy size={15} strokeWidth={1.75} />
            </button>
          </div>

          {selectedElement.canEditText ? (
            <fieldset className="inspector-group">
              <legend>内容</legend>
              <label className="field field-full">
                <span>文本</span>
                <textarea
                  className="text-field compact-textarea"
                  value={selectedElement.text}
                  placeholder="输入文本内容"
                  onChange={(event) => onTextChange(event.target.value)}
                />
              </label>
            </fieldset>
          ) : null}

          {!isImageElement(selectedElement) ? (
            <fieldset className="inspector-group">
              <legend>排版</legend>
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
                <input
                  type="text"
                  placeholder="normal 或 1.5"
                  value={selectedElement.styles.lineHeight || ""}
                  onChange={(event) => onStyleChange("lineHeight", event.target.value)}
                />
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
          ) : null}

          {isImageElement(selectedElement) ? (
            <fieldset className="inspector-group">
              <legend>图片</legend>
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
          ) : null}

          <fieldset className="inspector-group">
            <legend>盒模型 / 间距</legend>
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

          {isButtonLikeElement(selectedElement) ? (
            <fieldset className="inspector-group">
              <legend>按钮样式</legend>
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
                <NumericUnitField
                  label="边框宽度"
                  value={selectedElement.styles.borderWidth}
                  min={0}
                  onChange={(value) => onStyleChange("borderWidth", toPx(value))}
                />
              </div>
              <div className="field-grid two-col">
                <NumericUnitField
                  label="圆角"
                  value={selectedElement.styles.borderRadius}
                  min={0}
                  onChange={(value) => onStyleChange("borderRadius", toPx(value))}
                />
                <label className="field">
                  <span>边框样式</span>
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
          ) : null}

          {isBlockLikeElement(selectedElement) ? (
            <fieldset className="inspector-group">
              <legend>卡片 / 区块</legend>
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
                <NumericUnitField
                  label="边框宽度"
                  value={selectedElement.styles.borderWidth}
                  min={0}
                  onChange={(value) => onStyleChange("borderWidth", toPx(value))}
                />
                <NumericUnitField
                  label="圆角"
                  value={selectedElement.styles.borderRadius}
                  min={0}
                  onChange={(value) => onStyleChange("borderRadius", toPx(value))}
                />
              </div>
              <div className="field-grid two-col">
                <label className="field">
                  <span>边框样式</span>
                  <CustomSelect
                    value={selectedElement.styles.borderStyle}
                    options={borderStyleSelectOptions}
                    matchValue={(opt, current) => normalizeBorderStyle(current) === opt.value}
                    onChange={(val) => onStyleChange("borderStyle", val)}
                  />
                </label>
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
            </fieldset>
          ) : null}

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
  return (
    <div className="inspector-content inspector-readout">
      <div className="selected-element-bar">
        <div>
          <small>Computed</small>
          <span>{selectedElement.location || selectedElement.tagName}</span>
        </div>
      </div>
      <fieldset className="inspector-group info-group">
        <legend>Typography</legend>
        <dl>
          <InfoRow label="字体" value={selectedElement.styles.fontFamily || "inherit"} />
          <InfoRow label="字号" value={selectedElement.styles.fontSize || "inherit"} />
          <InfoRow label="字重" value={selectedElement.styles.fontWeight || "normal"} />
          <InfoRow label="行高" value={selectedElement.styles.lineHeight || "normal"} />
          <InfoRow label="对齐" value={selectedElement.styles.textAlign || "start"} />
        </dl>
      </fieldset>
      <fieldset className="inspector-group info-group">
        <legend>Box</legend>
        <dl>
          <InfoRow label="宽度" value={selectedElement.styles.width || "auto"} />
          <InfoRow label="高度" value={selectedElement.styles.height || "auto"} />
          <InfoRow label="上外边距" value={selectedElement.styles.marginTop || "0px"} />
          <InfoRow label="下外边距" value={selectedElement.styles.marginBottom || "0px"} />
          <InfoRow label="圆角" value={selectedElement.styles.borderRadius || "0px"} />
        </dl>
      </fieldset>
      <fieldset className="inspector-group info-group">
        <legend>Paint</legend>
        <dl>
          <InfoRow label="文字色" value={selectedElement.styles.color || "inherit"} />
          <InfoRow label="背景色" value={selectedElement.styles.backgroundColor || "transparent"} />
          <InfoRow label="边框色" value={selectedElement.styles.borderColor || "transparent"} />
          <InfoRow label="阴影" value={selectedElement.styles.boxShadow || "none"} />
        </dl>
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
  return (
    <label className="field">
      <span>{label}</span>
      <div className="unit-input">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder="0"
          value={parseNumber(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        <small>px</small>
      </div>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}

const colorPopoverMetrics = {
  width: 280,
  height: 292,
  gap: 8,
  margin: 10,
};

function ColorField({ label, value, onChange, full = false }: ColorFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedValue = normalizeHexColor(value);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>();
  const [picker, setPicker] = useState<HsvColor>(() => hexToHsv(normalizedValue));
  const pickerHex = useMemo(() => hsvToHex(picker), [picker]);
  const rgb = useMemo(() => hexToRgb(pickerHex), [pickerHex]);

  useEffect(() => {
    if (isValidHexColor(value)) {
      setPicker(hexToHsv(normalizeHexColor(value)));
    }
  }, [value]);

  const updatePopoverPosition = () => {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const { width, height, gap, margin } = colorPopoverMetrics;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const hasRoomBelow = rect.bottom + gap + height <= window.innerHeight - margin;
    const preferredTop = hasRoomBelow ? rect.bottom + gap : rect.top - height - gap;

    setPopoverStyle({
      left: Math.round(clampNumber(rect.left, margin, maxLeft)),
      top: Math.round(clampNumber(preferredTop, margin, maxTop)),
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isOpen]);

  const commitPicker = (nextPicker: HsvColor) => {
    setPicker(nextPicker);
    onChange(hsvToHex(nextPicker));
  };

  const updateMapPosition = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = clampNumber(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = clampNumber((1 - (event.clientY - rect.top) / rect.height) * 100, 0, 100);
    commitPicker({ ...picker, s: saturation, v: brightness });
  };

  return (
    <div className={`field color-field${full ? " field-full" : ""}`} ref={rootRef}>
      <span>{label}</span>
      <div className="color-row">
        <button
          className="color-swatch-button"
          type="button"
          aria-label={`选择${label}`}
          aria-expanded={isOpen}
          onClick={() => {
            if (!isOpen) updatePopoverPosition();
            setIsOpen((current) => !current);
          }}
        >
          <span style={{ backgroundColor: normalizedValue }} />
        </button>
        <input
          type="text"
          placeholder="#c96442"
          value={value || ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            if (isValidHexColor(nextValue)) {
              setPicker(hexToHsv(normalizeHexColor(nextValue)));
            }
          }}
        />
        {isOpen ? (
          <div
            className="color-popover"
            style={popoverStyle}
            role="dialog"
            aria-label={`${label}颜色选择器`}
          >
            <div
              className="color-map"
              style={{ "--picker-hue": `hsl(${picker.h} 100% 50%)` } as CSSProperties}
              role="slider"
              aria-label="饱和度与明度"
              aria-valuetext={`${Math.round(picker.s)}% / ${Math.round(picker.v)}%`}
              tabIndex={0}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                updateMapPosition(event);
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) updateMapPosition(event);
              }}
            >
              <span
                className="color-map-thumb"
                style={{ left: `${picker.s}%`, top: `${100 - picker.v}%` }}
              />
            </div>
            <div className="color-controls">
              <span className="color-current" style={{ backgroundColor: pickerHex }} />
              <input
                className="color-hue-slider"
                type="range"
                min="0"
                max="360"
                value={Math.round(picker.h)}
                aria-label="色相"
                onChange={(event) => {
                  commitPicker({ ...picker, h: Number(event.target.value) });
                }}
              />
            </div>
            <div className="color-rgb-grid">
              <ColorChannelInput label="R" value={rgb.r} onChange={(next) => commitPicker(hexToHsv(rgbToHex({ ...rgb, r: next })))} />
              <ColorChannelInput label="G" value={rgb.g} onChange={(next) => commitPicker(hexToHsv(rgbToHex({ ...rgb, g: next })))} />
              <ColorChannelInput label="B" value={rgb.b} onChange={(next) => commitPicker(hexToHsv(rgbToHex({ ...rgb, b: next })))} />
            </div>
            <div className="color-preset-row" aria-label="主题色快捷选择">
              {colorPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`选择 ${preset}`}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  onClick={() => {
                    const nextPicker = hexToHsv(preset);
                    setPicker(nextPicker);
                    onChange(preset);
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ColorChannelInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="color-channel">
      <input
        type="number"
        min={0}
        max={255}
        value={value}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), 0, 255))}
      />
      <span>{label}</span>
    </label>
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

const colorPresets = ["#141413", "#53615e", "#6b6a64", "#19a997", "#0f766e", "#ff6f4f", "#f8fbfa"];

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HsvColor {
  h: number;
  s: number;
  v: number;
}

function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split("")
      .map((part) => part + part)
      .join("")}`.toLowerCase();
  }
  return "#141413";
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value.trim());
}

function hexToRgb(hex: string): RgbColor {
  const normalized = normalizeHexColor(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(rgb: RgbColor): string {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => Math.round(clampNumber(channel, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToHsv(hex: string): HsvColor {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta > 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    if (max === green) hue = 60 * ((blue - red) / delta + 2);
    if (max === blue) hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;

  return {
    h: hue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function hsvToHex(hsv: HsvColor): string {
  const saturation = clampNumber(hsv.s, 0, 100) / 100;
  const value = clampNumber(hsv.v, 0, 100) / 100;
  const chroma = value * saturation;
  const hue = ((hsv.h % 360) + 360) % 360;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = value - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) [red, green, blue] = [chroma, x, 0];
  else if (hue < 120) [red, green, blue] = [x, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, x];
  else if (hue < 240) [red, green, blue] = [0, x, chroma];
  else if (hue < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return rgbToHex({
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  });
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
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
  return element.tagName === "img";
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
