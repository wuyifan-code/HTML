import { useState, type ReactNode } from "react";
import { IconChevronDown } from "../../Icons";

interface InspectorSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function InspectorSection({ title, icon, children, defaultOpen = true }: InspectorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="inspector-card">
      <button
        className="inspector-card__head"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="inspector-card__head-icon">{icon}</span>
        <span className="inspector-card__head-title">{title}</span>
        <span className={`inspector-card__head-arrow${isOpen ? " is-open" : ""}`}>
          <IconChevronDown />
        </span>
      </button>
      {isOpen && <div className="inspector-card__body">{children}</div>}
    </div>
  );
}
