import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementQuickAction, ModalState, SelectedElementSnapshot } from "../types/editor";
import {
  MSG_ELEMENT_SELECTED,
  MSG_ELEMENT_ACTION,
  MSG_PREVIEW_READY,
  MSG_MODAL_STATE,
  isTrustedMessage,
} from "../types/messages";

export interface ContentDimensions {
  contentWidth: number;
  contentHeight: number;
}

const IFRAME_TIMEOUT_MS = 15000;

export function useIframeSelection(
  bridgeToken: string,
  onElementSelected: (element: SelectedElementSnapshot) => void,
  onModalStateChange?: (state: ModalState) => void,
  onElementAction?: (hftId: string, action: ElementQuickAction) => void
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onElementSelectedRef = useRef(onElementSelected);
  const onModalStateChangeRef = useRef(onModalStateChange);
  const onElementActionRef = useRef(onElementAction);
  const [isReady, setIsReady] = useState(false);
  const [contentDimensions, setContentDimensions] = useState<ContentDimensions | null>(null);
  const [hasIframeError, setHasIframeError] = useState(false);
  const readyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onElementSelectedRef.current = onElementSelected;
    onModalStateChangeRef.current = onModalStateChange;
    onElementActionRef.current = onElementAction;
  }, [onElementAction, onElementSelected, onModalStateChange]);

  const clearReadyTimeout = useCallback(() => {
    if (readyTimeoutRef.current !== null) {
      window.clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  }, []);

  const startReadyTimeout = useCallback(() => {
    clearReadyTimeout();
    readyTimeoutRef.current = window.setTimeout(() => {
      setHasIframeError(true);
      window.dispatchEvent(new CustomEvent("hft-status", { detail: "预览加载超时，请检查 HTML 内容" }));
    }, IFRAME_TIMEOUT_MS);
  }, [clearReadyTimeout]);

  const markRendering = useCallback(() => {
    setIsReady(false);
    setContentDimensions(null);
    setHasIframeError(false);
    startReadyTimeout();
  }, [startReadyTimeout]);

  const markReady = useCallback(() => {
    setHasIframeError(false);
    setIsReady(true);
    clearReadyTimeout();
  }, [clearReadyTimeout]);

  useEffect(() => clearReadyTimeout, [clearReadyTimeout]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 通过 token + origin 校验来源
      if (!isTrustedMessage(event, bridgeToken)) {
        // 连 type 前缀都不匹配的，直接忽略
        if (typeof event.data?.type !== "string" || !event.data.type.startsWith("HTML_FINETUNE_")) return;
        return;
      }

      const data = event.data;

      switch (data.type) {
        case MSG_ELEMENT_SELECTED:
          onElementSelectedRef.current(data.payload);
          break;

        case MSG_ELEMENT_ACTION:
          onElementActionRef.current?.(data.payload.hftId, data.payload.action);
          break;

        case MSG_PREVIEW_READY:
          setHasIframeError(false);
          setIsReady(true);
          clearReadyTimeout();
          if (data.payload?.contentWidth && data.payload?.contentHeight) {
            setContentDimensions({
              contentWidth: data.payload.contentWidth,
              contentHeight: data.payload.contentHeight,
            });
          }
          break;

        case MSG_MODAL_STATE:
          onModalStateChangeRef.current?.(data.payload);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [bridgeToken, clearReadyTimeout]);

  return {
    iframeRef,
    isReady,
    contentDimensions,
    hasIframeError,
    markReady,
    markRendering,
  };
}
