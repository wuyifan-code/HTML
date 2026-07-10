import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEditorHistory } from "../hooks/useEditorHistory";

const initialState = { html: "<main><p>第一版</p></main>", selectedId: null };
const changedState = { html: "<main><p>第二版</p></main>", selectedId: null };

describe("useEditorHistory", () => {
  it("attaches a change summary to the state produced by that change", () => {
    const { result } = renderHook(() => useEditorHistory(initialState));

    act(() => result.current.commit(changedState));

    expect(result.current.allEntries).toHaveLength(2);
    expect(result.current.summaries[0]).toBeNull();
    expect(result.current.summaries[1]?.title).toBe("修改文本");
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.state).toEqual(changedState);
  });

  it("jumps to an older version and keeps the newer version available for redo", () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    act(() => result.current.commit(changedState));

    act(() => result.current.jumpToHistoryIndex(0));
    expect(result.current.state).toEqual(initialState);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.state).toEqual(changedState);
  });

  it("clears the timeline without reverting the current document", () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    act(() => result.current.commit(changedState));

    act(() => result.current.clearHistory());

    expect(result.current.state).toEqual(changedState);
    expect(result.current.allEntries).toHaveLength(1);
    expect(result.current.summaries).toEqual([null]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("flushes a debounced edit into the same destination-summary model", () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    act(() => result.current.commit(changedState, { debounce: true }));
    act(() => result.current.flushDebouncedHistory());

    expect(result.current.allEntries).toHaveLength(2);
    expect(result.current.summaries[0]).toBeNull();
    expect(result.current.summaries[1]?.title).toBe("修改文本");
  });
});
