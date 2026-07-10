import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import App from "../App";
import { EditorProvider } from "../hooks/useEditorStore";

describe("Source editor polish — empty workspace", () => {
  it("renders empty workspace when no document is loaded", () => {
    render(
      <EditorProvider>
        <App />
      </EditorProvider>
    );
    expect(document.querySelector(".empty-workspace")).not.toBeNull();
  });
});
