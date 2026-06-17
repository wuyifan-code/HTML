/**
 * iframe 消息发送/接收工具
 *
 * 统一管理 postMessage 通信，提供：
 * 1. 安全发送（校验 targetOrigin，默认当前 origin）
 * 2. 安全接收（校验 origin + token）
 * 3. 运行时类型守卫
 */
import type { HostToIframeMessage } from "../types/messages";

/**
 * 向 iframe 发送消息
 *
 * @param iframe  iframe 元素引用
 * @param message 消息体（type 必须为已定义的消息类型）
 * @param targetOrigin 目标 origin，默认当前窗口 origin
 */
export function sendMessageToIframe(
  iframe: HTMLIFrameElement | null,
  message: HostToIframeMessage,
  targetOrigin: string = window.location.origin
): void {
  if (!iframe?.contentWindow) return;

  try {
    iframe.contentWindow.postMessage(message, targetOrigin);
  } catch {
    // 序列化失败时静默忽略
  }
}

/**
 * 向 iframe 发送消息（宽松模式，targetOrigin: "*"）
 * 用于 srcDoc 等特殊场景
 */
export function sendMessageToIframeLax(
  iframe: HTMLIFrameElement | null,
  message: HostToIframeMessage
): void {
  if (!iframe?.contentWindow) return;

  try {
    iframe.contentWindow.postMessage(message, "*");
  } catch {
    // 序列化失败时静默忽略
  }
}

/**
 * 创建 selectElement 消息
 */
export function createSelectElementMessage(
  hftId: string,
  notify: boolean,
  token: string
): HostToIframeMessage {
  return {
    type: "HTML_FINETUNE_SELECT_ELEMENT",
    hftId,
    notify,
    token,
  };
}

/**
 * 创建 patchElement 消息
 */
export function createPatchElementMessage(
  hftId: string,
  patch: Record<string, unknown>,
  token: string
): HostToIframeMessage {
  return {
    type: "HTML_FINETUNE_PATCH_ELEMENT",
    hftId,
    patch,
    token,
  };
}

/**
 * 创建 modalCommand 消息
 */
export function createModalCommandMessage(
  action: "open" | "close",
  token: string
): HostToIframeMessage {
  return {
    type: "HTML_FINETUNE_MODAL_COMMAND",
    action,
    token,
  };
}
