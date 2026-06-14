import { SlidersHorizontal } from "lucide-react";
import type { EditableStyleKey, SelectedElementSnapshot } from "../types/editor";

interface StyleEditorPanelProps {
  selectedElement: SelectedElementSnapshot | null;
  onTextChange: (text: string) => void;
  onStyleChange: (property: EditableStyleKey, value: string) => void;
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

export function StyleEditorPanel({
  selectedElement,
  onTextChange,
  onStyleChange,
}: StyleEditorPanelProps) {
  return (
    <aside className="panel inspector-panel" aria-label="样式检查器">
      <div className="panel-header">
        <div className="panel-title">
          <SlidersHorizontal size={18} strokeWidth={1.8} />
          <span>样式检查器</span>
        </div>
      </div>

      {!selectedElement ? (
        <div className="empty-state">
          <div className="empty-state-mark">Aa</div>
          <h2>请选择一个元素</h2>
          <p>在预览区选择一个文本元素，然后微调内容、字体和间距。</p>
        </div>
      ) : (
        <div className="inspector-content">
          <div className="selected-chip">
            已选择 <span>{selectedElement.location || selectedElement.tagName}</span>
          </div>

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
