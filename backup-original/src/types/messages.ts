/**
 * iframe ↔ 主应用消息协议
 *
 * 所有消息类型使用常量定义，禁止裸字符串。
 * 通过运行时类型守卫校验消息结构。
 */

import type { ElementQuickAction, SelectedElementSnapshot, ModalState } from "./editor";

// ─── 消息类型常量 ───────────────────────────────────────────

/** iframe → 主应用：元素被选中 */
export const MSG_ELEMENT_SELECTED = "HTML_FINETUNE_ELEMENT_SELECTED" as const;
/** iframe → 主应用：元素快捷操作 */
export const MSG_ELEMENT_ACTION = "HTML_FINETUNE_ELEMENT_ACTION" as const;
/** iframe → 主应用：预览就绪 & 内容尺寸 */
export const MSG_PREVIEW_READY = "HTML_FINETUNE_PREVIEW_READY" as const;
/** iframe → 主应用：弹窗状态变化 */
export const MSG_MODAL_STATE = "HTML_FINETUNE_MODAL_STATE" as const;
/** iframe → 主应用：选中文字元素被拖动并落点 */
export const MSG_DRAG_COMMIT = "HTML_FINETUNE_DRAG_COMMIT" as const;

/** 主应用 → iframe：增量更新元素 */
export const MSG_PATCH_ELEMENT = "HTML_FINETUNE_PATCH_ELEMENT" as const;
/** 主应用 → iframe：选中元素 */
export const MSG_SELECT_ELEMENT = "HTML_FINETUNE_SELECT_ELEMENT" as const;
/** 主应用 → iframe：弹窗命令 */
export const MSG_MODAL_COMMAND = "HTML_FINETUNE_MODAL_COMMAND" as const;

export const ALL_MESSAGE_TYPES = [
  MSG_ELEMENT_SELECTED,
  MSG_ELEMENT_ACTION,
  MSG_PREVIEW_READY,
  MSG_MODAL_STATE,
  MSG_DRAG_COMMIT,
  MSG_PATCH_ELEMENT,
  MSG_SELECT_ELEMENT,
  MSG_MODAL_COMMAND,
] as const;

export type MessageType = (typeof ALL_MESSAGE_TYPES)[number];

// ─── 主应用 → iframe 消息 ──────────────────────────────────

export interface PatchElementMessage {
  type: typeof MSG_PATCH_ELEMENT;
  hftId: string;
  patch: Record<string, unknown>;
  token: string;
}

export interface SelectElementMessage {
  type: typeof MSG_SELECT_ELEMENT;
  hftId: string;
  notify: boolean;
  token: string;
}

export interface ModalCommandMessage {
  type: typeof MSG_MODAL_COMMAND;
  action: "open" | "close";
  token: string;
}

export type HostToIframeMessage = PatchElementMessage | SelectElementMessage | ModalCommandMessage;

// ─── iframe → 主应用消息 ──────────────────────────────────

export interface ElementSelectedMessage {
  type: typeof MSG_ELEMENT_SELECTED;
  payload: SelectedElementSnapshot;
  token?: string;
}

export interface ElementActionMessage {
  type: typeof MSG_ELEMENT_ACTION;
  payload: {
    hftId: string;
    action: ElementQuickAction;
  };
  token?: string;
}

export interface PreviewReadyMessage {
  type: typeof MSG_PREVIEW_READY;
  payload?: {
    contentWidth: number;
    contentHeight: number;
  };
  token?: string;
}

export interface ModalStateMessage {
  type: typeof MSG_MODAL_STATE;
  payload: ModalState;
  token?: string;
}

export interface DragCommitMessage {
  type: typeof MSG_DRAG_COMMIT;
  payload: {
    hftId: string;
    position: string;
    top: string;
    left: string;
  };
  token?: string;
}

export type IframeToHostMessage =
  | ElementSelectedMessage
  | ElementActionMessage
  | PreviewReadyMessage
  | ModalStateMessage
  | DragCommitMessage;

// ─── 运行时类型守卫 ─────────────────────────────────────────

export function isValidBridgeToken(token: unknown): token is string {
  return typeof token === "string" && token.length > 0;
}

export function isValidHostToIframeMessage(data: unknown): data is HostToIframeMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  if (typeof msg.type !== "string") return false;
  return ALL_MESSAGE_TYPES.includes(msg.type as MessageType);
}

export function isValidIframeToHostMessage(data: unknown): data is IframeToHostMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  if (typeof msg.type !== "string") return false;
  const inboundTypes: readonly string[] = [
    MSG_ELEMENT_SELECTED,
    MSG_ELEMENT_ACTION,
    MSG_PREVIEW_READY,
    MSG_MODAL_STATE,
    MSG_DRAG_COMMIT,
  ];
  return inboundTypes.includes(msg.type as string);
}

/**
 * 校验消息是否来自可信任的 iframe（同源或 token 匹配）
 */
export function isTrustedMessage(
  event: MessageEvent,
  bridgeToken: string
): boolean {
  // 只接受同源、null origin（iframe srcDoc）消息
  if (event.origin !== window.location.origin && event.origin !== "null") {
    return false;
  }

  const data = event.data;
  if (!data || typeof data !== "object") return false;

  // token 匹配校验
  if ("token" in data && data.token !== undefined) {
    return data.token === bridgeToken;
  }

  return false;
}
