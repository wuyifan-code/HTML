import { memo } from "react";
import { History, RotateCcw, RotateCw, X } from "lucide-react";
import type { HistoryDisplayItem } from "../utils/historySummary";

interface HistoryPanelProps {
  items: HistoryDisplayItem[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpTo: (index: number) => void;
  onClose: () => void;
}

function HistoryPanelImpl({
  items,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpTo,
  onClose,
}: HistoryPanelProps) {
  return (
    <aside className="history-popover" aria-label="撤销历史面板">
      <div className="history-header">
        <div className="panel-title">
          <History size={17} strokeWidth={1.8} />
          <span>历史</span>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭历史面板" title="关闭">
          <X size={16} strokeWidth={1.9} />
        </button>
      </div>

      <div className="history-actions">
        <button className="ghost-button compact-action" type="button" onClick={onUndo} disabled={!canUndo}>
          <RotateCcw size={15} strokeWidth={1.9} />
          撤销
        </button>
        <button className="ghost-button compact-action" type="button" onClick={onRedo} disabled={!canRedo}>
          <RotateCw size={15} strokeWidth={1.9} />
          重做
        </button>
      </div>

      <div className="history-list">
        {items.length === 0 ? (
          <div className="history-empty">还没有历史记录</div>
        ) : (
          items.map((item) => (
            <button
              key={`${item.index}-${item.title}`}
              className={`history-item${item.isCurrent ? " history-item-current" : ""}`}
              type="button"
              onClick={() => onJumpTo(item.index)}
              aria-current={item.isCurrent ? "step" : undefined}
            >
              <span className="history-index">{item.index + 1}</span>
              <span className="history-copy">
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
              {item.isCurrent ? <span className="history-current-mark">当前</span> : null}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export const HistoryPanel = memo(HistoryPanelImpl);
