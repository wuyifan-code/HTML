import { memo, useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { X, Trash2 } from "lucide-react";
import type { HistoryDisplayItem } from "../utils/historySummary";

export interface HistoryDrawerProps {
  items: HistoryDisplayItem[];
  onJumpTo: (index: number) => void;
  onClose: () => void;
  onClearAll: () => void;
}

function HistoryDrawerImpl({
  items,
  onJumpTo,
  onClose,
  onClearAll,
}: HistoryDrawerProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [onClose]);

  return (
    <section
      ref={dialogRef}
      id="history-drawer"
      className="history-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
      aria-describedby="history-drawer-subtitle"
      onKeyDown={handleKeyDown}
    >
      <div className="history-drawer-head">
        <div>
          <div className="history-drawer-head__top">
            <span id="history-drawer-title">History</span>
            <button
              ref={closeButtonRef}
              className="history-drawer-close"
              type="button"
              onClick={onClose}
              aria-label="关闭历史记录"
            >
              <X size={16} />
            </button>
          </div>
          <span id="history-drawer-subtitle" className="history-drawer-head__sub">最近</span>
        </div>
      </div>

      <div className="history-drawer-body">
        {items.length === 0 ? (
          <div className="history-drawer-empty">还没有历史记录</div>
        ) : (
          items.map((item) => (
            <HistoryRow
              key={`${item.index}-${item.title}`}
              item={item}
              onSelect={onJumpTo}
            />
          ))
        )}
      </div>

      {items.length > 1 && (
        <div className="history-drawer-footer">
          <button
            className="history-drawer-clear-btn"
            type="button"
            onClick={onClearAll}
          >
            <Trash2 size={12} />
            Clear all history
          </button>
        </div>
      )}
    </section>
  );
}

interface HistoryRowProps {
  item: HistoryDisplayItem;
  onSelect: (index: number) => void;
}

const HistoryRow = memo(function HistoryRow({ item, onSelect }: HistoryRowProps) {
  const handleClick = useCallback(() => {
    onSelect(item.index);
  }, [onSelect, item.index]);

  return (
    <button
      className={`history-drawer-row${item.isCurrent ? " is-current" : ""}`}
      type="button"
      onClick={handleClick}
      aria-current={item.isCurrent ? "step" : undefined}
      aria-label={`${item.timeLabel} ${item.dateLabel} ${item.title} ${item.category}${item.isCurrent ? " 当前版本" : ""}`}
      title={item.detail || item.title}
    >
      <span className="history-drawer-row__indicator" />
      <div className="history-drawer-row__time">
        <span className="history-drawer-row__time-value">{item.timeLabel}</span>
        <span className="history-drawer-row__date">{item.dateLabel}</span>
      </div>
      <span className="history-drawer-row__desc">{item.title}</span>
      <span className="history-drawer-row__badge">
        {item.category}
      </span>
    </button>
  );
});

export const HistoryDrawer = memo(HistoryDrawerImpl);
