import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorDocumentState, HistoryEntry, HistorySummary } from "../types/editor";
import { summarizeStateChange } from "../utils/historySummary";

interface CommitOptions {
  record?: boolean;
  debounce?: boolean;
}

const TEXT_DEBOUNCE_MS = 450;
export const MAX_HISTORY_ENTRIES = 100;

export function useEditorHistory(initialState: EditorDocumentState) {
  const [present, setPresent] = useState<HistoryEntry>({ state: initialState, summary: null, timestamp: Date.now() });
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const [hasPendingHistory, setHasPendingHistory] = useState(false);
  const pendingBaseRef = useRef<HistoryEntry | null>(null);
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

  // 组件卸载时清理防抖计时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const flushDebouncedHistory = useCallback(() => {
    clearDebounce();

    const pendingBase = pendingBaseRef.current;
    if (!pendingBase) {
      setHasPendingHistory(false);
      return;
    }

    const current = presentRef.current;
    if (pendingBase.state.html !== current.state.html) {
      const summary = summarizeStateChange(pendingBase.state, current.state);
      const nextPast = [...pastRef.current, pendingBase].slice(-MAX_HISTORY_ENTRIES);
      const currentWithSummary: HistoryEntry = { ...current, summary };
      pastRef.current = nextPast;
      futureRef.current = [];
      presentRef.current = currentWithSummary;
      setPast(nextPast);
      setFuture([]);
      setPresent(currentWithSummary);
    }
    pendingBaseRef.current = null;
    setHasPendingHistory(false);
  }, [clearDebounce]);

  const commit = useCallback(
    (nextState: EditorDocumentState, options: CommitOptions = {}) => {
      const { record = true, debounce = false } = options;
      const current = presentRef.current;

      if (nextState.html === current.state.html && nextState.selectedId === current.state.selectedId) return;

      if (!record) {
        flushDebouncedHistory();
        const currentAfterFlush = presentRef.current;
        const nextEntry: HistoryEntry = { ...currentAfterFlush, state: nextState };
        setPresent(nextEntry);
        presentRef.current = nextEntry;
        return;
      }

      if (debounce) {
        if (!pendingBaseRef.current) {
          pendingBaseRef.current = current;
          setHasPendingHistory(true);
        }

        const nextEntry: HistoryEntry = { state: nextState, summary: null, timestamp: Date.now() };
        setPresent(nextEntry);
        presentRef.current = nextEntry;
        clearDebounce();
        debounceTimerRef.current = window.setTimeout(() => {
          flushDebouncedHistory();
        }, TEXT_DEBOUNCE_MS);
        return;
      }

      flushDebouncedHistory();
      const currentAfterFlush = presentRef.current;
      const summary = summarizeStateChange(currentAfterFlush.state, nextState);
      const nextEntry: HistoryEntry = { state: nextState, summary, timestamp: Date.now() };
      const nextPast = [...pastRef.current, currentAfterFlush].slice(-MAX_HISTORY_ENTRIES);
      pastRef.current = nextPast;
      futureRef.current = [];
      setPast(nextPast);
      setFuture([]);
      setPresent(nextEntry);
      presentRef.current = nextEntry;
    },
    [clearDebounce, flushDebouncedHistory]
  );

  const reset = useCallback(
    (nextState: EditorDocumentState) => {
      clearDebounce();
      pendingBaseRef.current = null;
      setHasPendingHistory(false);
      const nextEntry: HistoryEntry = { state: nextState, summary: null, timestamp: Date.now() };
      setPresent(nextEntry);
      presentRef.current = nextEntry;
      pastRef.current = [];
      futureRef.current = [];
      setPast([]);
      setFuture([]);
    },
    [clearDebounce]
  );

  const clearHistory = useCallback(() => {
    flushDebouncedHistory();
    reset(presentRef.current.state);
  }, [flushDebouncedHistory, reset]);

  const undo = useCallback(() => {
    flushDebouncedHistory();
    const items = pastRef.current;
    if (!items.length) return;

    const previous = items[items.length - 1];
    const remaining = items.slice(0, -1);
    const current = presentRef.current;
    const nextFuture = [current, ...futureRef.current].slice(0, MAX_HISTORY_ENTRIES);

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
    const nextPast = [...pastRef.current, current].slice(-MAX_HISTORY_ENTRIES);

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

  const timeline = useMemo(
    () => [...past, present, ...future].map((entry) => entry.state),
    [future, past, present]
  );
  const summaries = useMemo(
    () => [...past, present, ...future].map((entry) => entry.summary),
    [future, past, present]
  );
  const allEntries = useMemo(
    () => [...past, present, ...future],
    [future, past, present]
  );
  const currentIndex = past.length;
  const canUndo = past.length > 0 || hasPendingHistory;
  const canRedo = future.length > 0;

  return useMemo(
    () => ({
      state: present.state,
      commit,
      reset,
      undo,
      redo,
      jumpToHistoryIndex,
      clearHistory,
      timeline,
      summaries,
      allEntries,
      currentIndex,
      canUndo,
      canRedo,
      flushDebouncedHistory,
    }),
    [
      canRedo,
      canUndo,
      clearHistory,
      commit,
      currentIndex,
      flushDebouncedHistory,
      jumpToHistoryIndex,
      present.state,
      redo,
      reset,
      summaries,
      timeline,
      allEntries,
      undo,
    ]
  );
}
