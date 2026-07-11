import { useMemo } from "react";
import { Search, X, Copy, Check } from "lucide-react";
import { IconSearch } from "../../Icons";
import { Tooltip } from "../../Tooltip";
import { useState } from "react";

interface SourceCodeViewProps {
  value: string;
  onChange: (newValue: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lineCount: number;
  isSynced: boolean;
  onApplyDraft: (newHtml: string) => void;
  onCancelDraft: () => void;
  onCopy: () => void;
}

export function SourceCodeView({
  value,
  onChange,
  searchQuery,
  onSearchChange,
  lineCount,
  isSynced,
  onApplyDraft,
  onCancelDraft,
  onCopy,
}: SourceCodeViewProps) {
  const [copied, setCopied] = useState(false);

  const hasSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return true;
    return value.toLowerCase().includes(searchQuery.toLowerCase());
  }, [value, searchQuery]);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  };

  return (
    <div className="source-code-view">
      <div className="source-search-bar">
        <div className="source-search-field">
          <IconSearch />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索源码..."
            aria-label="搜索源码"
          />
          {searchQuery ? (
            <button
              className="source-search-clear"
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="清除搜索"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
        <span className="source-search-count">{lineCount} 行</span>
      </div>

      <textarea
        className="source-code-textarea"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="HTML 源码"
      />

      {searchQuery && !hasSearchResults ? (
        <div className="source-search-empty">未找到匹配内容</div>
      ) : null}

      <div className="source-editor-actions">
        <span className="source-editor-status" data-state={isSynced ? "synced" : "dirty"}>
          <span className="source-status-dot" data-state={isSynced ? "synced" : "dirty"} />
          {isSynced ? "已同步" : "未保存"}
        </span>

        <Tooltip content="复制源码" placement="top">
          <button
            className="source-editor-btn-copy"
            type="button"
            onClick={handleCopy}
            aria-label="复制源码"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </Tooltip>

        <div className="source-editor-draft-group">
          <button
            type="button"
            onClick={() => {
              onCancelDraft();
            }}
          >
            取消
          </button>
          <button
            className="source-editor-btn-primary"
            type="button"
            onClick={() => onApplyDraft(value)}
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
}
