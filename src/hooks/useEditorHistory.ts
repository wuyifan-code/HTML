import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorDocumentState } from "../types/editor";

interface CommitOptions {
  record?: boolean;
  debounce?: boolean;
}

const TEXT_DEBOUNCE_MS = 450;

export function useEditorHistory(initialState: EditorDocumentState) {
  const [present, setPresent] = useState(initialState);
  const [past, setPast] = useState<EditorDocumentState[]>([]);
  const [future, setFuture] = useState<EditorDocumentState[]>([]);
  const pendingBaseRef = useRef<EditorDocumentState | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const presentRef = useRef(present);

  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushDebouncedHistory = useCallback(() => {
    clearDebounce();

    const pendingBase = pendingBaseRef.current;
    if (!pendingBase) return;

    const current = presentRef.current;
    if (pendingBase.html !== current.html) {
      setPast((items) => [...items, pendingBase]);
      setFuture([]);
    }
    pendingBaseRef.current = null;
  }, [clearDebounce]);

  const commit = useCallback(
    (nextState: EditorDocumentState, options: CommitOptions = {}) => {
      const { record = true, debounce = false } = options;
      const current = presentRef.current;

      if (nextState.html === current.html && nextState.selectedId === current.selectedId) return;

      if (!record) {
        flushDebouncedHistory();
        setPresent(nextState);
        presentRef.current = nextState;
        return;
      }

      if (debounce) {
        if (!pendingBaseRef.current) {
          pendingBaseRef.current = current;
        }

        setPresent(nextState);
        presentRef.current = nextState;
        clearDebounce();
        debounceTimerRef.current = window.setTimeout(() => {
          flushDebouncedHistory();
        }, TEXT_DEBOUNCE_MS);
        return;
      }

      flushDebouncedHistory();
      setPast((items) => [...items, current]);
      setFuture([]);
      setPresent(nextState);
      presentRef.current = nextState;
    },
    [clearDebounce, flushDebouncedHistory]
  );

  const reset = useCallback(
    (nextState: EditorDocumentState) => {
      clearDebounce();
      pendingBaseRef.current = null;
      setPresent(nextState);
      presentRef.current = nextState;
      setPast([]);
      setFuture([]);
    },
    [clearDebounce]
  );

  const undo = useCallback(() => {
    flushDebouncedHistory();
    setPast((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      const remaining = items.slice(0, -1);
      const current = present;
      setFuture((futureItems) => [current, ...futureItems]);
      setPresent(previous);
      presentRef.current = previous;
      return remaining;
    });
  }, [flushDebouncedHistory, present]);

  const redo = useCallback(() => {
    flushDebouncedHistory();
    setFuture((items) => {
      if (!items.length) return items;
      const next = items[0];
      const remaining = items.slice(1);
      const current = present;
      setPast((pastItems) => [...pastItems, current]);
      setPresent(next);
      presentRef.current = next;
      return remaining;
    });
  }, [flushDebouncedHistory, present]);

  const jumpToHistoryIndex = useCallback(
    (targetIndex: number) => {
      flushDebouncedHistory();
      const timeline = [...past, presentRef.current, ...future];
      if (targetIndex < 0 || targetIndex >= timeline.length) return;

      const target = timeline[targetIndex];
      setPast(timeline.slice(0, targetIndex));
      setPresent(target);
      presentRef.current = target;
      setFuture(timeline.slice(targetIndex + 1));
    },
    [flushDebouncedHistory, future, past]
  );

  const timeline = [...past, present, ...future];
  const currentIndex = past.length;

  return {
    state: present,
    commit,
    reset,
    undo,
    redo,
    jumpToHistoryIndex,
    timeline,
    currentIndex,
    canUndo: past.length > 0 || pendingBaseRef.current !== null,
    canRedo: future.length > 0,
    flushDebouncedHistory,
  };
}
