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

export interface ElementUpdate {
  text?: string;
  styles?: Partial<EditableStyles>;
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
