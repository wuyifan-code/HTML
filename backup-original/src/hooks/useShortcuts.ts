import { useEffect } from "react";

export interface ShortcutBinding {
  /** Comma-separated combos. Examples: "mod+z", "mod+shift+z", "delete", "esc", "mod+1". */
  combo: string;
  handler: (event: KeyboardEvent) => void;
  /** When true, the shortcut also fires while focus is inside inputs / textareas / contenteditable. */
  allowInInputs?: boolean;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (INPUT_TAGS.has(target.tagName)) {
    // 排除 type=checkbox/radio 等纯开关控件 — 它们有自己的键盘语义
    if (
      target instanceof HTMLInputElement &&
      !["text", "search", "url", "email", "tel", "password", "number"].includes(target.type)
    ) {
      return false;
    }
    return true;
  }
  return target.isContentEditable;
}

function eventMatchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const requiresMod = parts.includes("mod");
  const requiresShift = parts.includes("shift");
  const requiresAlt = parts.includes("alt");
  const keyPart = parts[parts.length - 1];

  const hasMod = event.ctrlKey || event.metaKey;
  if (requiresMod !== hasMod) return false;
  if (requiresShift !== event.shiftKey) return false;
  if (requiresAlt !== event.altKey) return false;

  const targetKey = keyPart === "mod" ? "" : keyPart;
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  return eventKey === targetKey;
}

/**
 * Registers a global keyboard shortcut listener.
 *
 * Bindings:
 *  - `combo`: use `mod` for Cmd on macOS / Ctrl elsewhere
 *  - `allowInInputs`: when true, the shortcut also fires while typing in form fields
 *  - All other shortcuts are skipped while focus is inside an input/textarea/contenteditable
 *
 * The hook cleans up its listener on unmount.
 */
export function useShortcuts(bindings: ShortcutBinding[]): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const inEditable = isEditableTarget(event.target);
      for (const binding of bindings) {
        if (inEditable && !binding.allowInInputs) continue;
        if (eventMatchesCombo(event, binding.combo)) {
          event.preventDefault();
          binding.handler(event);
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindings]);
}