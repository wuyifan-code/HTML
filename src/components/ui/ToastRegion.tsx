import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastRegionProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

const typeIcons: Record<ToastType, ReactNode> = {
  success: <CheckIcon />,
  error: <XIcon />,
  info: <InfoIcon />,
  loading: <LoaderIcon />,
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (toast.type === "loading") return;
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 200);
    }, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.type, onDismiss]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`toast-item toast-${toast.type}${visible ? " is-visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-item-icon">{typeIcons[toast.type]}</span>
      <span className="toast-item-message">{toast.message}</span>
      <button
        type="button"
        className="toast-item-close"
        onClick={handleClose}
        aria-label="关闭通知"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  if (typeof document === "undefined" || toasts.length === 0) return null;

  return createPortal(
    <div className="toast-region" aria-label="通知区域">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}
