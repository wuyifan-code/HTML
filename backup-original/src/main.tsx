import React from "react";
import ReactDOM from "react-dom/client";
import OptimizedUiApp from "./OptimizedUiApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <OptimizedUiApp />
    </ErrorBoundary>
  </React.StrictMode>
);
