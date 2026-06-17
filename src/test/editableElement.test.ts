import { describe, it, expect } from "vitest";
import { isEditableElement, HFT_ID_ATTRIBUTE } from "../utils/editableElement";

describe("isEditableElement", () => {
  it("returns false for null", () => {
    expect(isEditableElement(null)).toBe(false);
  });

  it("returns true for editable text tags with text content", () => {
    const el = document.createElement("p");
    el.textContent = "Hello world";
    expect(isEditableElement(el)).toBe(true);
  });

  it("returns false for non-editable tags", () => {
    const el = document.createElement("script");
    el.textContent = "alert(1)";
    expect(isEditableElement(el)).toBe(false);
  });

  it("returns true for img tags regardless of text content", () => {
    const el = document.createElement("img");
    el.setAttribute("src", "test.jpg");
    expect(isEditableElement(el)).toBe(true);
  });

  it("returns false for elements with no text content", () => {
    const el = document.createElement("div");
    expect(isEditableElement(el)).toBe(false);
  });

  it("returns true for block tags with direct text content", () => {
    const el = document.createElement("section");
    el.textContent = "Some section text";
    expect(isEditableElement(el)).toBe(true);
  });
});
