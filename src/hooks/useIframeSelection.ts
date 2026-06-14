import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewMessage, SelectedElementSnapshot } from "../types/editor";

export function useIframeSelection(
  onElementSelected: (element: SelectedElementSnapshot) => void
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

      if (event.data?.type === "HTML_FINETUNE_PREVIEW_READY") {
        setIsReady(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementSelected]);

  return {
    iframeRef,
    isReady,
    markRendering,
  };
}
