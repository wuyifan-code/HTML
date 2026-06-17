import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackRender?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender(this.state.error!, this.handleRetry);
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: 24,
            fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`,
            color: "#111827",
            background: "#f6f9f8",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#ff6f4f",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            !
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 740 }}>
            编辑器中发生错误
          </h2>
          <p
            style={{
              margin: "0 0 4px",
              color: "#667085",
              fontSize: 14,
              maxWidth: 420,
            }}
          >
            {this.state.error?.message || "未知错误"}
          </p>
          <p
            style={{
              margin: "0 0 20px",
              color: "#98a2b3",
              fontSize: 12,
            }}
          >
            请尝试重新加载，如果问题持续请检查 HTML 内容是否格式异常
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: "8px 20px",
              border: "1px solid #e2e8e6",
              borderRadius: 8,
              background: "#ffffff",
              color: "#344054",
              fontSize: 14,
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
