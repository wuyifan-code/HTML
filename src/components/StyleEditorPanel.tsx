import { memo } from "react";
import { MousePointerClick, PanelRightClose, PanelRightOpen, SlidersHorizontal, Type } from "lucide-react";
import type { EditableAttributes, EditableEffects, EditableStyleKey, SelectedElementSnapshot } from "../types/editor";

interface StyleEditorPanelProps {
  selectedElement: SelectedElementSnapshot | null;
  onTextChange: (text: string) => void;
  onStyleChange: (property: EditableStyleKey, value: string) => void;
  onEffectChange: (property: keyof EditableEffects, value: string) => void;
  onAttributeChange: (property: keyof EditableAttributes, value: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const fontOptions = [
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'Georgia, "Times New Roman", serif',
  '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  'Arial, Helvetica, sans-serif',
  '"Times New Roman", Times, serif',
];

const fontLabels = ["系统无衬线", "编辑感衬线", "等宽字体", "Arial", "Times New Roman"];
const weightOptions = ["300", "400", "500", "600", "700", "800"];
const textAlignOptions = ["left", "center", "right", "justify", "start"];

export function StyleEditorPanelImpl({
  selectedElement,
  onTextChange,
  onStyleChange,
  onEffectChange,
  onAttributeChange,
  isCollapsed,
  onToggleCollapse,
}: StyleEditorPanelProps) {
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
          <PanelRightOpen size={18} strokeWidth={1.8} />
          <span>展开检查器</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel inspector-panel" aria-label="样式检查器">
      <div className="panel-header">
        <div className="panel-title">
          <SlidersHorizontal size={18} strokeWidth={1.8} />
          <span>样式检查器</span>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onToggleCollapse}
          aria-label="收起样式检查器"
          title="收起样式检查器"
        >
          <PanelRightClose size={18} strokeWidth={1.8} />
        </button>
      </div>

      {!selectedElement ? (
        <div className="empty-state">
          <div className="empty-state-illustration" aria-hidden="true">
            <div className="empty-doc">
              <Type size={20} strokeWidth={1.8} />
              <span />
              <span />
            </div>
            <div className="empty-arrow" />
            <div className="empty-controls">
              <MousePointerClick size={18} strokeWidth={1.8} />
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
      ) : (
        <div className="inspector-content">
          <div className="selected-chip">
            已选择 <span>{selectedElement.location || selectedElement.tagName}</span>
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
                <select
                  value={normalizeFontValue(selectedElement.styles.fontFamily)}
                  onChange={(event) => onStyleChange("fontFamily", event.target.value)}
                >
                  {fontOptions.map((font, index) => (
                    <option key={font} value={font}>
                      {fontLabels[index]}
                    </option>
                  ))}
                </select>
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
                <select
                  value={selectedElement.styles.fontWeight || "400"}
                  onChange={(event) => onStyleChange("fontWeight", event.target.value)}
                >
                  {weightOptions.map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
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
              <select
                value={normalizeTextAlign(selectedElement.styles.textAlign)}
                onChange={(event) => onStyleChange("textAlign", event.target.value)}
              >
                {textAlignOptions.map((align) => (
                  <option key={align} value={align}>
                    {textAlignLabel(align)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-full">
              <span>颜色</span>
              <div className="color-row">
                <input
                  type="color"
                  value={normalizeHexColor(selectedElement.styles.color)}
                  onChange={(event) => onStyleChange("color", event.target.value)}
                />
                <input
                  type="text"
                  placeholder="#2f2a25"
                  value={selectedElement.styles.color || ""}
                  onChange={(event) => onStyleChange("color", event.target.value)}
                />
              </div>
            </label>
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
                <select
                  value={normalizeObjectFit(selectedElement.styles.objectFit)}
                  onChange={(event) => onStyleChange("objectFit", event.target.value)}
                >
                  <option value="cover">cover</option>
                  <option value="contain">contain</option>
                  <option value="fill">fill</option>
                  <option value="none">none</option>
                  <option value="scale-down">scale-down</option>
                </select>
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
                  <select
                    value={normalizeBorderStyle(selectedElement.styles.borderStyle)}
                    onChange={(event) => onStyleChange("borderStyle", event.target.value)}
                  >
                    <option value="solid">solid</option>
                    <option value="dashed">dashed</option>
                    <option value="none">none</option>
                  </select>
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
                  <select
                    value={normalizeBorderStyle(selectedElement.styles.borderStyle)}
                    onChange={(event) => onStyleChange("borderStyle", event.target.value)}
                  >
                    <option value="solid">solid</option>
                    <option value="dashed">dashed</option>
                    <option value="none">none</option>
                  </select>
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const normalizedValue = normalizeHexColor(value);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="color-row">
        <input type="color" value={normalizedValue} onChange={(event) => onChange(event.target.value)} />
        <input
          type="text"
          placeholder="#c96f4a"
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
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

function normalizeFontValue(fontFamily: string): string {
  const lower = fontFamily.toLowerCase();
  if (lower.includes("georgia") || lower.includes("times")) return fontOptions[1];
  if (lower.includes("consolas") || lower.includes("monospace") || lower.includes("menlo")) {
    return fontOptions[2];
  }
  if (lower.includes("arial")) return fontOptions[3];
  return fontOptions[0];
}

function normalizeHexColor(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#2f2a25";
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
