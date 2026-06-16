import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  /** Optional custom matcher if value stored differs from option.value */
  matchValue?: (option: CustomSelectOption, currentValue: string) => boolean;
}

export function CustomSelect({ value, options, onChange, matchValue }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(-1);

  const selectedIndex = options.findIndex((opt) =>
    matchValue ? matchValue(opt, value) : opt.value === value
  );
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : value;

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (opt: CustomSelectOption) => {
      onChange(opt.value);
      setIsOpen(false);
    },
    [onChange]
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Delay to avoid same-event toggle conflict
    const timer = setTimeout(() => document.addEventListener("click", handleClick, true), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          activeIndexRef.current = selectedIndex >= 0 ? selectedIndex : 0;
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          activeIndexRef.current = Math.min(activeIndexRef.current + 1, options.length - 1);
          scrollToIndex(activeIndexRef.current);
          break;
        case "ArrowUp":
          e.preventDefault();
          activeIndexRef.current = Math.max(activeIndexRef.current - 1, 0);
          scrollToIndex(activeIndexRef.current);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndexRef.current >= 0 && activeIndexRef.current < options.length) {
            handleSelect(options[activeIndexRef.current]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, options, handleSelect, selectedIndex]
  );

  function scrollToIndex(index: number) {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }

  return (
    <div
      className="custom-select"
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className="custom-select-trigger"
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={handleToggle}
      >
        <span className="custom-select-value">{selectedLabel}</span>
        <ChevronDown size={14} strokeWidth={1.75} className={`custom-select-chevron${isOpen ? " custom-select-chevron-open" : ""}`} />
      </button>
      {isOpen && (
        <div className="custom-select-dropdown" role="listbox" ref={listRef}>
          {options.map((opt, index) => {
            const isActive = index === activeIndexRef.current;
            const isSelected = (matchValue ? matchValue(opt, value) : opt.value === value);
            return (
              <button
                key={opt.value}
                className={`custom-select-option${isSelected ? " custom-select-option-selected" : ""}${isActive ? " custom-select-option-active" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => { activeIndexRef.current = index; }}
                onMouseDown={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
