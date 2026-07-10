import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EditorProvider } from "./hooks/useEditorStore";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <EditorProvider>
        <App />
      </EditorProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
