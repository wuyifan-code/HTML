import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
  divider?: boolean;
  header?: boolean;
  footer?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  onSelect: (key: string) => void;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}

export function Menu({ items, onSelect, onClose, triggerRef }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [open, setOpen] = useState(false);

  const enabledItems = items.filter((item) => !item.divider && !item.disabled && !item.header && !item.footer);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left });
    requestAnimationFrame(() => setOpen(true));
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= enabledItems.length ? 0 : next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? enabledItems.length - 1 : next;
          });
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < enabledItems.length) {
            onSelect(enabledItems[activeIndex].key);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    },
    [activeIndex, enabledItems, onSelect, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const handleTriggerKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        trigger?.focus();
      }
    };
    document.addEventListener("keydown", handleTriggerKeyDown);
    return () => document.removeEventListener("keydown", handleTriggerKeyDown);
  }, [open, onClose, triggerRef]);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  if (typeof document === "undefined" || !coords) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={`menu${open ? " is-open" : ""}`}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
      }}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={item.key} className="menu-divider" />;
        }
        if (item.header) {
          return <div key={item.key} className="menu-header">{item.label}</div>;
        }
        if (item.footer) {
          return <div key={item.key} className="menu-footer">{item.label}</div>;
        }

        const itemIndex = enabledItems.indexOf(item);
        const isActive = itemIndex === activeIndex;
        const dangerClass = item.danger ? " menu-item-danger" : "";
        const checkedClass = item.checked ? " menu-item-checked" : "";

        return (
          <button
            key={item.key}
            role="menuitem"
            className={`menu-item${isActive ? " menu-item-active" : ""}${item.disabled ? " menu-item-disabled" : ""}${dangerClass}${checkedClass}`}
            disabled={item.disabled}
            aria-checked={item.checked}
            onClick={() => {
              if (!item.disabled) {
                onSelect(item.key);
                onClose();
              }
            }}
            onMouseEnter={() => setActiveIndex(itemIndex)}
          >
            {item.checked && <span className="menu-item-check" aria-hidden="true">✓</span>}
            {item.icon && <span className="menu-item-icon">{item.icon}</span>}
            <span className="menu-item-label">{item.label}</span>
            {item.description && <span className="menu-item-desc">{item.description}</span>}
            {item.shortcut && <span className="menu-item-shortcut">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
