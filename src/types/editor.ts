export type EditableStyleKey =
  | "fontFamily"
  | "fontSize"
  | "color"
  | "fontWeight"
  | "lineHeight"
  | "letterSpacing"
  | "textAlign"
  | "backgroundColor"
  | "borderColor"
  | "borderWidth"
  | "borderStyle"
  | "borderRadius"
  | "boxShadow"
  | "width"
  | "height"
  | "maxWidth"
  | "objectFit"
  | "paddingLeft"
  | "paddingRight"
  | "marginTop"
  | "marginBottom"
  | "paddingTop"
  | "paddingBottom";

export type EditableStyles = Record<EditableStyleKey, string>;

/**
 * 允许写入的"位置/几何"样式。
 * 当前不由 Inspector 暴露,但拖拽落点会写入这些键。
 */
export type GeometryStyleKey = "position" | "top" | "left" | "right" | "bottom";

export interface EditableEffects {
  hoverBackgroundColor: string;
}

export interface EditableAttributes {
  src: string;
  alt: string;
}

export interface SelectedElementSnapshot {
  hftId: string;
  path: string;
  tagName: string;
  id: string;
  className: string;
  text: string;
  styles: EditableStyles;
  effects: EditableEffects;
  attributes: EditableAttributes;
  location: string;
  hasInlineStyle: boolean;
  canEditText: boolean;
}

/**
 * ElementUpdate.styles 同时接受 Inspector 可编辑样式与几何样式(position/top/left/...)
 * 因为 updateHtmlElementByHftId 底层对 styles 做"原样写入",只需保证 value 是字符串即可。
 */
export interface ElementUpdate {
  text?: string;
  styles?: Partial<EditableStyles & Record<GeometryStyleKey, string>>;
  effects?: Partial<EditableEffects>;
  attributes?: Partial<EditableAttributes>;
}

export interface PreviewElementMessage {
  type: "HTML_FINETUNE_ELEMENT_SELECTED";
  payload: SelectedElementSnapshot;
  token?: string;
}

export type ElementQuickAction = "move-up" | "move-down" | "duplicate" | "copy-style" | "paste-style" | "delete";

export interface PreviewElementActionMessage {
  type: "HTML_FINETUNE_ELEMENT_ACTION";
  payload: {
    hftId: string;
    action: ElementQuickAction;
  };
  token?: string;
}

export interface PreviewReadyMessage {
  type: "HTML_FINETUNE_PREVIEW_READY";
  payload?: {
    contentWidth: number;
    contentHeight: number;
  };
  token?: string;
}

export interface DomTreeNode {
  hftId: string;
  tagName: string;
  label: string;
  text: string;
  depth: number;
  className: string;
  id: string;
}

export interface AiTreeAnnotation {
  hftId: string;
  label: string;
  role: string;
  issues: string[];
  suggestion: string;
  confidence: number;
}

export type AiAnalysisStatus = "idle" | "running" | "ready" | "error";

export interface ModalState {
  found: boolean;
  open: boolean;
  label: string;
}

export interface PreviewModalStateMessage {
  type: "HTML_FINETUNE_MODAL_STATE";
  payload: ModalState;
  token?: string;
}

export type ModalCommandAction = "open" | "close";

export interface ModalCommand {
  id: number;
  action: ModalCommandAction;
}

export interface SelectElementCommand {
  id: number;
  hftId: string;
}

export type PreviewViewportMode = "desktop" | "wide" | "tablet" | "mobile" | "fit";

export type SourcePanelPlacement = "side" | "bottom";

export type PreviewMessage =
  | PreviewElementMessage
  | PreviewElementActionMessage
  | PreviewReadyMessage
  | PreviewModalStateMessage;

export interface EditorDocumentState {
  html: string;
  selectedId: string | null;
}

export interface PatchCommand {
  id: number;
  hftId: string;
  patch: ElementUpdate;
}

export interface HistorySummary {
  title: string;
  detail: string;
}

export interface HistoryEntry {
  state: EditorDocumentState;
  summary: HistorySummary | null;
}
