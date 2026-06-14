import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementQuickAction, ModalState, PreviewMessage, SelectedElementSnapshot } from "../types/editor";

export function useIframeSelection(
  onElementSelected: (element: SelectedElementSnapshot) => void,
  onModalStateChange?: (state: ModalState) => void,
  onElementAction?: (hftId: string, action: ElementQuickAction) => void
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  const markRendering = useCallback(() => {
    setIsReady(false);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === "HTML_FINETUNE_ELEMENT_SELECTED") {
        onElementSelected(event.data.payload);
      }

      if (event.data?.type === "HTML_FINETUNE_ELEMENT_ACTION") {
        onElementAction?.(event.data.payload.hftId, event.data.payload.action);
      }

      if (event.data?.type === "HTML_FINETUNE_PREVIEW_READY") {
        setIsReady(true);
      }

      if (event.data?.type === "HTML_FINETUNE_MODAL_STATE") {
        onModalStateChange?.(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementAction, onElementSelected, onModalStateChange]);

  return {
    iframeRef,
    isReady,
    markRendering,
  };
}
