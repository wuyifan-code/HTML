import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [hasPendingHistory, setHasPendingHistory] = useState(false);
  const pendingBaseRef = useRef<EditorDocumentState | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const presentRef = useRef(present);
  const pastRef = useRef(past);
  const futureRef = useRef(future);

  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  useEffect(() => {
    pastRef.current = past;
  }, [past]);

  useEffect(() => {
    futureRef.current = future;
  }, [future]);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushDebouncedHistory = useCallback(() => {
    clearDebounce();

    const pendingBase = pendingBaseRef.current;
    if (!pendingBase) {
      setHasPendingHistory(false);
      return;
    }

    const current = presentRef.current;
    if (pendingBase.html !== current.html) {
      const nextPast = [...pastRef.current, pendingBase];
      pastRef.current = nextPast;
      futureRef.current = [];
      setPast(nextPast);
      setFuture([]);
    }
    pendingBaseRef.current = null;
    setHasPendingHistory(false);
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
          setHasPendingHistory(true);
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
      const nextPast = [...pastRef.current, current];
      pastRef.current = nextPast;
      futureRef.current = [];
      setPast(nextPast);
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
      setHasPendingHistory(false);
      setPresent(nextState);
      presentRef.current = nextState;
      pastRef.current = [];
      futureRef.current = [];
      setPast([]);
      setFuture([]);
    },
    [clearDebounce]
  );

  const undo = useCallback(() => {
    flushDebouncedHistory();
    const items = pastRef.current;
    if (!items.length) return;

    const previous = items[items.length - 1];
    const remaining = items.slice(0, -1);
    const current = presentRef.current;
    const nextFuture = [current, ...futureRef.current];

    pastRef.current = remaining;
    futureRef.current = nextFuture;
    setPast(remaining);
    setFuture(nextFuture);
    setPresent(previous);
    presentRef.current = previous;
  }, [flushDebouncedHistory]);

  const redo = useCallback(() => {
    flushDebouncedHistory();
    const items = futureRef.current;
    if (!items.length) return;

    const next = items[0];
    const remaining = items.slice(1);
    const current = presentRef.current;
    const nextPast = [...pastRef.current, current];

    pastRef.current = nextPast;
    futureRef.current = remaining;
    setPast(nextPast);
    setFuture(remaining);
    setPresent(next);
    presentRef.current = next;
  }, [flushDebouncedHistory]);

  const jumpToHistoryIndex = useCallback(
    (targetIndex: number) => {
      flushDebouncedHistory();
      const timeline = [...pastRef.current, presentRef.current, ...futureRef.current];
      if (targetIndex < 0 || targetIndex >= timeline.length) return;

      const target = timeline[targetIndex];
      const nextPast = timeline.slice(0, targetIndex);
      const nextFuture = timeline.slice(targetIndex + 1);
      pastRef.current = nextPast;
      futureRef.current = nextFuture;
      setPast(nextPast);
      setPresent(target);
      presentRef.current = target;
      setFuture(nextFuture);
    },
    [flushDebouncedHistory]
  );

  const timeline = useMemo(() => [...past, present, ...future], [future, past, present]);
  const currentIndex = past.length;
  const canUndo = past.length > 0 || hasPendingHistory;
  const canRedo = future.length > 0;

  return useMemo(
    () => ({
      state: present,
      commit,
      reset,
      undo,
      redo,
      jumpToHistoryIndex,
      timeline,
      currentIndex,
      canUndo,
      canRedo,
      flushDebouncedHistory,
    }),
    [
      canRedo,
      canUndo,
      commit,
      currentIndex,
      flushDebouncedHistory,
      jumpToHistoryIndex,
      present,
      redo,
      reset,
      timeline,
      undo,
    ]
  );
}
