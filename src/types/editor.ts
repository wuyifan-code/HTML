export type EditableStyleKey =
  | "fontFamily"
  | "fontSize"
  | "color"
  | "fontWeight"
  | "lineHeight"
  | "letterSpacing"
  | "textAlign"
  | "marginTop"
  | "marginBottom"
  | "paddingTop"
  | "paddingBottom";

export type EditableStyles = Record<EditableStyleKey, string>;

export interface SelectedElementSnapshot {
  hftId: string;
  path: string;
  tagName: string;
  id: string;
  className: string;
  text: string;
  styles: EditableStyles;
  location: string;
  hasInlineStyle: boolean;
}

export interface ElementUpdate {
  text?: string;
  styles?: Partial<EditableStyles>;
}

export interface PreviewElementMessage {
  type: "HTML_FINETUNE_ELEMENT_SELECTED";
  payload: SelectedElementSnapshot;
}

export interface PreviewReadyMessage {
  type: "HTML_FINETUNE_PREVIEW_READY";
}

export type PreviewMessage = PreviewElementMessage | PreviewReadyMessage;

export interface EditorDocumentState {
  html: string;
  selectedId: string | null;
}
