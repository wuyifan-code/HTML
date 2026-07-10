import type { SelectedSnapshot } from "../types/editor";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
    </>
  );
}

function interactionLabel(selected: SelectedSnapshot): string {
  if (selected.tagName === "button") return "按钮";
  if (selected.tagName === "a") return selected.src ? "链接" : "锚点";
  if (["input", "textarea", "select"].includes(selected.tagName)) return "表单控件";
  if (selected.src) return "媒体资源";
  return selected.canEditText ? "可编辑文本" : "结构容器";
}

function hasInlineStyleSnapshot(selected: SelectedSnapshot): boolean {
  return [
    selected.fontFamily,
    selected.fontSize,
    selected.fontWeight,
    selected.lineHeight,
    selected.letterSpacing,
    selected.textAlign,
    selected.marginTop,
    selected.marginBottom,
    selected.paddingTop,
    selected.paddingBottom,
    selected.paddingLeft,
    selected.paddingRight,
    selected.color,
    selected.backgroundColor,
    selected.borderColor,
    selected.borderWidth,
    selected.borderStyle,
    selected.borderRadius,
    selected.boxShadow,
    selected.width,
    selected.height,
    selected.maxWidth,
    selected.objectFit,
  ].some((value) => value.trim().length > 0);
}

export function InspectorDiagnostics({ selected }: { selected: SelectedSnapshot | null }) {
  if (!selected) {
    return (
      <div className="inspector-diagnostics">
        <div className="diagnostic-card">
          <h4>Computed / Events</h4>
          <p className="meta">未选择元素。请在画布或结构树中选择一个对象查看只读诊断信息。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-diagnostics" aria-label="元素诊断信息">
      <div className="diagnostic-card">
        <div className="diagnostic-head">
          <span>Computed</span>
          <strong>{selected.tagName}</strong>
        </div>
        <h4>Typography</h4>
        <dl className="diagnostic-list">
          <InfoRow label="字体" value={selected.fontFamily || "inherit"} />
          <InfoRow label="字号" value={selected.fontSize || "inherit"} />
          <InfoRow label="字重" value={selected.fontWeight || "normal"} />
          <InfoRow label="行高" value={selected.lineHeight || "normal"} />
          <InfoRow label="对齐" value={selected.textAlign || "start"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <h4>Box</h4>
        <dl className="diagnostic-list">
          <InfoRow label="宽度" value={selected.width || "auto"} />
          <InfoRow label="高度" value={selected.height || "auto"} />
          <InfoRow label="最大宽度" value={selected.maxWidth || "none"} />
          <InfoRow label="上外边距" value={selected.marginTop || "0px"} />
          <InfoRow label="下外边距" value={selected.marginBottom || "0px"} />
          <InfoRow label="圆角" value={selected.borderRadius || "0px"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <h4>Paint</h4>
        <dl className="diagnostic-list">
          <InfoRow label="文字色" value={selected.color || "inherit"} />
          <InfoRow label="背景色" value={selected.backgroundColor || "transparent"} />
          <InfoRow label="边框色" value={selected.borderColor || "transparent"} />
          <InfoRow label="阴影" value={selected.boxShadow || "none"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <div className="diagnostic-head">
          <span>Events</span>
          <strong>{selected.tagName}</strong>
        </div>
        <h4>Element State</h4>
        <dl className="diagnostic-list">
          <InfoRow label="点击语义" value={interactionLabel(selected)} />
          <InfoRow label="文本编辑" value={selected.canEditText ? "可编辑" : "继承子元素"} />
          <InfoRow label="Hover 背景" value={selected.hoverBackgroundColor || "未设置"} />
          <InfoRow label="行内样式" value={hasInlineStyleSnapshot(selected) ? "已设置" : "未设置"} />
        </dl>
      </div>
      <div className="diagnostic-card">
        <h4>Attributes</h4>
        <dl className="diagnostic-list">
          <InfoRow label="标签" value={selected.tagName} />
          <InfoRow label="ID" value={selected.id || "无"} />
          <InfoRow label="类名" value={selected.className || "无"} />
          <InfoRow label="HFT ID" value={selected.hftId} />
        </dl>
      </div>
    </div>
  );
}
