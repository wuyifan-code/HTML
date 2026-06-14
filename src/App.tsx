import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { HtmlInputPanel } from "./components/HtmlInputPanel";
import { PreviewFrame } from "./components/PreviewFrame";
import { StyleEditorPanel } from "./components/StyleEditorPanel";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { sampleHtml } from "./sampleHtml";
import type { EditableStyleKey, SelectedElementSnapshot } from "./types/editor";
import { cleanHtmlForExport } from "./utils/cleanHtmlForExport";
import { copyHtmlToClipboard } from "./utils/clipboard";
import { hasElementWithHftId, updateHtmlElementByHftId } from "./utils/domPath";
import { exportHtml } from "./utils/exportHtml";
import { injectEditableIds } from "./utils/injectEditableIds";

const initialHtml = injectEditableIds(sampleHtml).html;

export default function App() {
  const history = useEditorHistory({ html: initialHtml, selectedId: null });
  const { state } = history;
  const latestHtmlRef = useRef(state.html);
  const [selectedElement, setSelectedElement] = useState<SelectedElementSnapshot | null>(null);
  const [statusMessage, setStatusMessage] = useState("仅本地运行 · iframe srcDoc · postMessage 通信");

  useEffect(() => {
    latestHtmlRef.current = state.html;
  }, [state.html]);

  const updateSelectedElement = useCallback(
    (nextElement: SelectedElementSnapshot) => {
      setSelectedElement(nextElement);
      history.commit(
        {
          html: latestHtmlRef.current,
          selectedId: nextElement.hftId,
        },
        { record: false }
      );
    },
    [history]
  );

  const applyTextUpdate = useCallback(
    (text: string) => {
      if (!selectedElement) return;
      const nextHtml = updateHtmlElementByHftId(state.html, selectedElement.hftId, { text });
      history.commit(
        {
          html: nextHtml,
          selectedId: selectedElement.hftId,
        },
        { debounce: true }
      );
      setSelectedElement({ ...selectedElement, text });
    },
    [history, selectedElement, state.html]
  );

  const applyStyleUpdate = useCallback(
    (property: EditableStyleKey, value: string) => {
      if (!selectedElement) return;
      const nextHtml = updateHtmlElementByHftId(state.html, selectedElement.hftId, {
        styles: { [property]: value },
      });
      history.commit({
        html: nextHtml,
        selectedId: selectedElement.hftId,
      });
      setSelectedElement({
        ...selectedElement,
        styles: {
          ...selectedElement.styles,
          [property]: value,
        },
        hasInlineStyle: true,
      });
    },
    [history, selectedElement, state.html]
  );

  const handleHtmlChange = useCallback(
    (value: string) => {
      const nextHtml = injectEditableIds(value).html;
      history.commit(
        {
          html: nextHtml,
          selectedId: null,
        },
        { debounce: true }
      );
      setSelectedElement(null);
    },
    [history]
  );

  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const nextHtml = injectEditableIds(String(reader.result ?? "")).html;
        history.reset({
          html: nextHtml,
          selectedId: null,
        });
        setSelectedElement(null);
        setStatusMessage(`已导入 ${file.name}`);
      };
      reader.readAsText(file);
    },
    [history]
  );

  const handleCopy = useCallback(async () => {
    const cleanHtml = cleanHtmlForExport(state.html);
    await copyHtmlToClipboard(cleanHtml);
    setStatusMessage("已复制干净 HTML 到剪贴板");
  }, [state.html]);

  const handleExport = useCallback(() => {
    exportHtml(cleanHtmlForExport(state.html));
    setStatusMessage("已导出干净 HTML");
  }, [state.html]);

  const handleUndo = useCallback(() => {
    history.undo();
    setStatusMessage("已撤销上一步编辑");
  }, [history]);

  const handleRedo = useCallback(() => {
    history.redo();
    setStatusMessage("已重做编辑");
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;

      event.preventDefault();
      if ((key === "z" && event.shiftKey) || key === "y") {
        handleRedo();
      } else {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleRedo, handleUndo]);

  useEffect(() => {
    if (!state.selectedId) {
      setSelectedElement(null);
      return;
    }

    if (!hasElementWithHftId(state.html, state.selectedId)) {
      history.commit(
        {
          html: state.html,
          selectedId: null,
        },
        { record: false }
      );
      setSelectedElement(null);
    }
  }, [history, state.html, state.selectedId]);

  const editorStatus = useMemo(() => {
    if (!selectedElement) return "未选择元素";
    return `已选择 ${selectedElement.tagName.toUpperCase()} · ${selectedElement.hftId}`;
  }, [selectedElement]);

  return (
    <div className="app-shell">
      <Header
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onImport={handleImport}
        onCopy={handleCopy}
        onExport={handleExport}
      />
      <main className="workspace" aria-label="HTML FineTune 编辑工作区">
        <HtmlInputPanel value={state.html} onChange={handleHtmlChange} />
        <PreviewFrame
          html={state.html}
          selectedId={state.selectedId}
          onElementSelected={updateSelectedElement}
        />
        <StyleEditorPanel
          selectedElement={selectedElement}
          onTextChange={applyTextUpdate}
          onStyleChange={applyStyleUpdate}
        />
      </main>
      <footer className="status-bar" aria-live="polite">
        <span>{editorStatus}</span>
        <span>{statusMessage}</span>
      </footer>
    </div>
  );
}
