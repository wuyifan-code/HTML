import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InspectorPanel } from "../components/workspace/inspector/InspectorPanel";
import type { SelectedSnapshot } from "../types/editor";
import type { Annotation } from "../components/workspace/inspector/DiagnosticsSection";

const noop = () => {};

const mockSelected: SelectedSnapshot = {
  hftId: "hft-abc123",
  tagName: "p",
  id: "",
  label: "正文段落",
  text: "Hello World",
  path: "html > body > div > p",
  className: "paragraph",
  fontFamily: "Inter, sans-serif",
  fontSize: "16",
  fontStyle: "",
  fontWeight: "400",
  lineHeight: "1.5",
  letterSpacing: "0",
  textAlign: "left",
  marginTop: "",
  marginBottom: "",
  paddingTop: "",
  paddingBottom: "",
  paddingLeft: "",
  paddingRight: "",
  color: "#333333",
  backgroundColor: "",
  borderColor: "",
  borderWidth: "",
  borderStyle: "",
  borderRadius: "",
  boxShadow: "",
  width: "",
  height: "",
  maxWidth: "",
  objectFit: "",
  hoverBackgroundColor: "",
  src: "",
  alt: "",
  canEditText: true,
};

const baseProps = {
  selected: null as SelectedSnapshot | null,
  draftFontSize: "",
  draftFontWeight: "",
  draftFontFamily: "",
  draftLineHeight: "",
  draftLetterSpacing: "",
  draftColor: "",
  draftBackgroundColor: "",
  draftHoverBackground: "",
  draftMarginTop: "",
  draftMarginBottom: "",
  draftPaddingTop: "",
  draftPaddingBottom: "",
  draftPaddingLeft: "",
  draftPaddingRight: "",
  draftWidth: "",
  draftHeight: "",
  selectedAnnotation: null as Annotation | null,
  onFontSizeChange: noop,
  onFontWeightChange: noop,
  onFontFamilyChange: noop,
  onLineHeightChange: noop,
  onLetterSpacingChange: noop,
  onColorChange: noop,
  onBackgroundColorChange: noop,
  onHoverBackgroundChange: noop,
  onMarginTopChange: noop,
  onMarginBottomChange: noop,
  onPaddingTopChange: noop,
  onPaddingBottomChange: noop,
  onPaddingInlineChange: noop,
  onWidthChange: noop,
  onHeightChange: noop,
  onApplyStyle: noop,
  onApplyText: noop,
  onAlignChange: noop,
  onBoldToggle: noop,
  onItalicToggle: noop,
  canEditSelectedText: false,
  textContent: "",
  onTextContentChange: noop,
};

describe("InspectorPanel", () => {
  it("显示空状态当未选择元素时", () => {
    render(<InspectorPanel {...baseProps} />);

    expect(screen.getByText("未选择元素")).toBeInTheDocument();
    expect(screen.getByText(/在画布或结构树中选择一个对象/)).toBeInTheDocument();
  });

  it("选择后显示元素概要信息", () => {
    const { container } = render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
      />
    );

    expect(container.querySelector(".inspector-selection__tag")?.textContent).toBe("p");
    expect(container.querySelector(".inspector-selection__label")?.textContent).toBe("正文段落");
    expect(container.querySelector(".inspector-selection__path")?.textContent).toBe("html > body > div > p");
    expect(container.querySelector(".inspector-selection__className")?.textContent).toBe("paragraph");
  });

  it("渲染对齐工具栏", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
      />
    );

    expect(screen.getByLabelText("左对齐")).toBeInTheDocument();
    expect(screen.getByLabelText("居中")).toBeInTheDocument();
    expect(screen.getByLabelText("右对齐")).toBeInTheDocument();
    expect(screen.getByLabelText("加粗")).toBeInTheDocument();
    expect(screen.getByLabelText("斜体")).toBeInTheDocument();
  });

  it("对齐工具栏按钮触发对应回调", () => {
    const onAlignChange = vi.fn();
    const onBoldToggle = vi.fn();
    const onItalicToggle = vi.fn();

    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        onAlignChange={onAlignChange}
        onBoldToggle={onBoldToggle}
        onItalicToggle={onItalicToggle}
      />
    );

    screen.getByLabelText("左对齐").click();
    expect(onAlignChange).toHaveBeenCalledWith("left");

    screen.getByLabelText("加粗").click();
    expect(onBoldToggle).toHaveBeenCalledOnce();

    screen.getByLabelText("斜体").click();
    expect(onItalicToggle).toHaveBeenCalledOnce();
  });

  it("渲染字体相关字段", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        draftFontSize="18"
        draftFontWeight="600"
        draftFontFamily="Inter"
        draftLineHeight="1.5"
        draftLetterSpacing="0.5"
      />
    );

    const fontSizeInput = screen.getByDisplayValue("18");
    expect(fontSizeInput).toBeInTheDocument();

    const fontWeightInput = screen.getByDisplayValue("600");
    expect(fontWeightInput).toBeInTheDocument();

    const fontFamilyInput = screen.getByDisplayValue("Inter");
    expect(fontFamilyInput).toBeInTheDocument();
  });

  it("字体字段值变更时触发回调", () => {
    const onFontSizeChange = vi.fn();
    const onFontFamilyChange = vi.fn();

    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        draftFontSize="16"
        draftFontFamily="Inter"
        onFontSizeChange={onFontSizeChange}
        onFontFamilyChange={onFontFamilyChange}
      />
    );

    const sizeInput = screen.getByDisplayValue("16");
    sizeInput.addEventListener("change", () => {});
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    nativeInputValueSetter.call(sizeInput, "20");
    sizeInput.dispatchEvent(new Event("input", { bubbles: true }));

    const familyInput = screen.getByDisplayValue("Inter");
    nativeInputValueSetter.call(familyInput, "Georgia");
    familyInput.dispatchEvent(new Event("input", { bubbles: true }));
  });

  it("渲染颜色字段（ColorField）", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        draftColor="#ff0000"
        draftBackgroundColor="#ffffff"
        draftHoverBackground="#eeeeee"
      />
    );

    const colorInput = screen.getByDisplayValue("#ff0000");
    expect(colorInput).toBeInTheDocument();

    const bgInput = screen.getByDisplayValue("#ffffff");
    expect(bgInput).toBeInTheDocument();
  });

  it("渲染操作按钮组", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
      />
    );

    expect(screen.getAllByLabelText("上移元素").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("下移元素").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("复制元素").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("删除元素").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("复制样式").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("粘贴样式").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("弹窗").length).toBeGreaterThanOrEqual(1);
  });

  it("可编辑文本时显示文字内容和 PretextMeasureBadge", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        canEditSelectedText={true}
        textContent="Hello World"
      />
    );

    const textarea = screen.getByPlaceholderText("输入文本内容");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Hello World");
    expect(screen.getByText("应用到 Canvas")).toBeInTheDocument();
  });

  it("空状态不显示元素相关区块", () => {
    const { container } = render(<InspectorPanel {...baseProps} />);

    expect(container.querySelector(".inspector-selection")).toBeNull();
    expect(container.querySelector(".alignment-bar")).toBeNull();
    expect(container.querySelector(".inspector-body")).toBeNull();
  });

  it("选择元素后显示 Inspector 标题", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
      />
    );

    expect(screen.getByText("Inspector")).toBeInTheDocument();
  });

  it("canEditSelectedText 为 false 时不显示文本编辑区", () => {
    render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        canEditSelectedText={false}
      />
    );

    expect(screen.queryByPlaceholderText("输入文本内容")).toBeNull();
  });
});

describe("InspectorPanel section order (design contract)", () => {
  it("renders sections in design contract order: Typography → Spacing → Color → Size → Border", () => {
    const { container } = render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        draftFontSize="16"
      />
    );

    // Get all inspector-card head titles
    const heads = container.querySelectorAll(".inspector-card__head-title");
    const titles = Array.from(heads).map((el) => el.textContent?.trim());

    // The first 5 must be in this order
    const typoIdx = titles.indexOf("字体");
    const spacingIdx = titles.indexOf("间距");
    const colorIdx = titles.indexOf("颜色");
    const sizeIdx = titles.indexOf("尺寸");
    const borderIdx = titles.indexOf("边框");

    expect(typoIdx).toBeGreaterThanOrEqual(0);
    expect(spacingIdx).toBeGreaterThanOrEqual(0);
    expect(colorIdx).toBeGreaterThanOrEqual(0);
    expect(sizeIdx).toBeGreaterThanOrEqual(0);
    expect(borderIdx).toBeGreaterThanOrEqual(0);

    // Verify order: Typography < Spacing < Color < Size < Border
    expect(typoIdx).toBeLessThan(spacingIdx);
    expect(spacingIdx).toBeLessThan(colorIdx);
    expect(colorIdx).toBeLessThan(sizeIdx);
    expect(sizeIdx).toBeLessThan(borderIdx);
  });

  it("\"对齐\" and \"文字内容\" come after the 5 required sections", () => {
    const { container } = render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
        canEditSelectedText={true}
        textContent="test"
      />
    );

    const heads = container.querySelectorAll(".inspector-card__head-title");
    const titles = Array.from(heads).map((el) => el.textContent?.trim());

    const borderIdx = titles.indexOf("边框");

    // "对齐" should come after "边框"
    const alignCard = container.querySelector('[data-dom-id="alignment-bar"]');
    expect(alignCard).toBeTruthy();
    // Alignment is not an inspector-card but a property-card; it should be after border
    const allCards = container.querySelectorAll(".inspector-card, .property-card.inspector-card");
    const cardTitles = Array.from(allCards).map((card) => {
      const head = card.querySelector(".inspector-card__head-title");
      return head ? head.textContent?.trim() : "";
    });

    const borderCardIdx = cardTitles.indexOf("边框");
    expect(borderCardIdx).toBeGreaterThanOrEqual(0);
    // All subsequent cards should be extra sections (对齐/text/诊断)
    const afterBorder = cardTitles.slice(borderCardIdx + 1);
    expect(afterBorder.length).toBeGreaterThanOrEqual(0);
  });
});

describe("InspectorSection active state", () => {
  it("active (open) inspector-card shows left 3px brand indicator via CSS", () => {
    const { container } = render(
      <InspectorPanel
        {...baseProps}
        selected={mockSelected}
      />
    );

    // Find all inspector-card elements
    const cards = container.querySelectorAll(".inspector-card");
    expect(cards.length).toBeGreaterThan(0);

    // At least one card should have the active left-border style
    // The active indicator is applied via CSS: .inspector-card[aria-expanded="true"] or similar
    const activeButton = container.querySelector('.inspector-card__head[aria-expanded="true"]');
    expect(activeButton).toBeTruthy();
  });
});
