import { useEffect, useRef, type RefObject } from "react";
import { X, Sparkles, CheckCircle, AlertCircle, Loader } from "lucide-react";

interface AiScanPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  onScan: () => void;
  onOpenSettings?: () => void;
  status: "idle" | "scanning" | "done" | "error";
  resultCount: number;
  errorMessage?: string;
}

export function AiScanPopover({
  isOpen,
  onClose,
  triggerRef,
  onScan,
  onOpenSettings,
  status,
  resultCount,
  errorMessage,
}: AiScanPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  useEffect(() => {
    if (isOpen) {
      popoverRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerRect = triggerRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = triggerRect
    ? {
        top: triggerRect.bottom + 6,
        left: Math.max(8, triggerRect.left),
      }
    : { top: 0, left: 0 };

  return (
    <div
      ref={popoverRef}
      className="ai-scan-popover"
      role="dialog"
      aria-label="AI 扫描结果"
      tabIndex={-1}
      style={style}
    >
      <div className="ai-scan-popover-header">
        <span>
          <Sparkles size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
          AI 扫描
        </span>
        <button
          className="ai-scan-popover-close"
          type="button"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      </div>

      <div className="ai-scan-popover-body">
        {status === "idle" ? (
          <>
            <button
              className="ai-scan-start-btn"
              type="button"
              onClick={onScan}
            >
              <Sparkles size={13} />
              开始扫描
            </button>
            {onOpenSettings ? (
              <button className="ai-scan-settings-link" type="button" onClick={onOpenSettings}>
                配置供应商与模型 →
              </button>
            ) : null}
          </>
        ) : status === "scanning" ? (
          <span>
            <Loader size={13} style={{ marginRight: 4, verticalAlign: "middle", animation: "spin 1s linear infinite" }} />
            扫描中...
          </span>
        ) : status === "done" ? (
          <span>
            <CheckCircle size={13} style={{ marginRight: 4, verticalAlign: "middle", color: "var(--n-success)" }} />
            <span className="ai-scan-result-count">{resultCount}</span> 个问题发现
          </span>
        ) : status === "error" ? (
          <span className="ai-scan-error">
            <AlertCircle size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {errorMessage || "扫描失败"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
