import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementQuickAction, ModalState, PreviewMessage, SelectedElementSnapshot } from "../types/editor";

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

  useEffect(() => {
    onElementSelectedRef.current = onElementSelected;
    onModalStateChangeRef.current = onModalStateChange;
    onElementActionRef.current = onElementAction;
  }, [onElementAction, onElementSelected, onModalStateChange]);

  const markRendering = useCallback(() => {
    setIsReady(false);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.token !== bridgeToken) return;

      if (event.data?.type === "HTML_FINETUNE_ELEMENT_SELECTED") {
        onElementSelectedRef.current(event.data.payload);
      }

      if (event.data?.type === "HTML_FINETUNE_ELEMENT_ACTION") {
        onElementActionRef.current?.(event.data.payload.hftId, event.data.payload.action);
      }

      if (event.data?.type === "HTML_FINETUNE_PREVIEW_READY") {
        setIsReady(true);
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
    markRendering,
  };
}
