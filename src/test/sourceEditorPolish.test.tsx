import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../App";
import { EditorProvider } from "../hooks/useEditorStore";

function renderSourceEditor() {
  const utils = render(
    <EditorProvider>
      <App />
    </EditorProvider>
  );
  const sourceTab = document.querySelector('[data-dom-id="tab-source"]') as HTMLButtonElement;
  expect(sourceTab).not.toBeNull();
  act(() => {
    fireEvent.click(sourceTab);
  });
  return utils;
}

describe("Source editor polish", () => {
  it("renders a synced status strip and accessible source textarea", { timeout: 30000 }, () => {
    renderSourceEditor();

    const status = document.querySelector(".source-editor-status");
    expect(status).not.toBeNull();
    expect(status).toHaveAttribute("data-state", "synced");
    expect(status).toHaveTextContent("源码已同步");

    const textarea = screen.getByLabelText("HTML 源码");
    expect(textarea).toHaveAttribute("aria-describedby", "source-editor-status");
  });

  it("shows empty search state when the query has no source matches", { timeout: 30000 }, () => {
    renderSourceEditor();

    act(() => {
      fireEvent.change(screen.getByLabelText("搜索源码"), { target: { value: "__not_found__" } });
    });

    expect(document.querySelector(".source-search-field")).toHaveAttribute("data-state", "empty");
    expect(document.querySelector(".source-search-count")).toHaveAttribute("data-state", "empty");
    expect(document.querySelector(".source-search-count")).toHaveTextContent("0 项");
  });

  it("shows dirty status after editing source draft", { timeout: 30000 }, () => {
    renderSourceEditor();
    const textarea = screen.getByLabelText("HTML 源码");

    act(() => {
      fireEvent.change(textarea, { target: { value: `${(textarea as HTMLTextAreaElement).value}\n<!-- draft -->` } });
    });

    expect(document.querySelector(".source-editor-status")).toHaveAttribute("data-state", "dirty");
    expect(document.querySelector(".source-editor-status")).toHaveTextContent("草稿未应用");
    expect(screen.getByRole("button", { name: /应用源码/ })).not.toBeDisabled();
  });
});
