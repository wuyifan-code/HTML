import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementQuickAction, ModalState, PreviewMessage, SelectedElementSnapshot } from "../types/editor";

export interface ContentDimensions {
  contentWidth: number;
  contentHeight: number;
}

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

  useEffect(() => {
    onElementSelectedRef.current = onElementSelected;
    onModalStateChangeRef.current = onModalStateChange;
    onElementActionRef.current = onElementAction;
  }, [onElementAction, onElementSelected, onModalStateChange]);

  const markRendering = useCallback(() => {
    setIsReady(false);
    setContentDimensions(null);
  }, []);

  const markReady = useCallback(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      if (!event.data?.type?.startsWith("HTML_FINETUNE_")) return;
      if (event.data?.token !== bridgeToken) return;

      if (event.data?.type === "HTML_FINETUNE_ELEMENT_SELECTED") {
        onElementSelectedRef.current(event.data.payload);
      }

      if (event.data?.type === "HTML_FINETUNE_ELEMENT_ACTION") {
        onElementActionRef.current?.(event.data.payload.hftId, event.data.payload.action);
      }

      if (event.data?.type === "HTML_FINETUNE_PREVIEW_READY") {
        setIsReady(true);
        if (event.data.payload?.contentWidth && event.data.payload?.contentHeight) {
          setContentDimensions({
            contentWidth: event.data.payload.contentWidth,
            contentHeight: event.data.payload.contentHeight,
          });
        }
      }

      if (event.data?.type === "HTML_FINETUNE_MODAL_STATE") {
        onModalStateChangeRef.current?.(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [bridgeToken]);

  return {
    iframeRef,
    isReady,
    contentDimensions,
    markReady,
    markRendering,
  };
}
