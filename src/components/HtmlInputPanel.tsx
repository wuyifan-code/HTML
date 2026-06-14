import { Code2 } from "lucide-react";

interface HtmlInputPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function HtmlInputPanel({ value, onChange }: HtmlInputPanelProps) {
  return (
    <section className="panel source-panel" aria-label="HTML 源码编辑器">
      <div className="panel-header">
        <div className="panel-title">
          <Code2 size={18} strokeWidth={1.8} />
          <span>HTML 源码</span>
        </div>
      </div>
      <textarea
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="可编辑 HTML 源码"
      />
      <div className="panel-footer">
        <span>srcDoc 预览</span>
        <span>{value.length.toLocaleString()} 字符</span>
      </div>
    </section>
  );
}
