import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackRender?: (error: Error, retry: () => void) => ReactNode;
  /** Max automatic retries before locking the error screen. Default: 3 */
  maxRetries?: number;
  /** Cooldown window (ms) during which a repeat of the same error is suppressed. Default: 5000 */
  lockoutMs?: number;
  /** Optional hook for external logging (Sentry, etc.) */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetCount: number;
  locked: boolean;
  errorFingerprint: string | null;
  caughtAt: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_LOCKOUT_MS = 5000;

function fingerprintOf(error: Error): string {
  // Use name + message + first meaningful stack frame.
  // This stays stable across line-number-only refactors but changes
  // when the underlying failure actually changes.
  const firstFrame = (error.stack ?? "").split("\n").find((l) => l.trim().length > 0) ?? "";
  return `${error.name}|${error.message}|${firstFrame.trim()}`;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      resetCount: 0,
      locked: false,
      errorFingerprint: null,
      caughtAt: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { maxRetries = DEFAULT_MAX_RETRIES, lockoutMs = DEFAULT_LOCKOUT_MS, onError } = this.props;
    const fingerprint = fingerprintOf(error);
    const now = Date.now();

    // Suppress repeat of the same error within the cooldown window.
    // Prevents the ErrorBoundary from re-rendering the error page
    // (and React from re-running the broken subtree) in a tight loop.
    if (
      this.state.errorFingerprint === fingerprint &&
      now - this.state.caughtAt < lockoutMs &&
      this.state.resetCount >= maxRetries
    ) {
      console.warn(
        "[ErrorBoundary] repeat error suppressed (cooldown)",
        fingerprint,
      );
      return;
    }

    console.error("[ErrorBoundary]", error, info.componentStack);
    onError?.(error, info);

    this.setState({
      errorFingerprint: fingerprint,
      caughtAt: now,
    });
  }

  handleRetry = () => {
    const { maxRetries = DEFAULT_MAX_RETRIES } = this.props;

    if (this.state.resetCount >= maxRetries) {
      this.setState({ locked: true });
      return;
    }

    this.setState((prev) => ({
      hasError: false,
      error: null,
      resetCount: prev.resetCount + 1,
      // Keep errorFingerprint + caughtAt so a fresh re-throw within
      // the cooldown window is still caught by the suppression check.
    }));
  };

  handleReloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.locked) {
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
              background: "#475467",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            ⏸
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 740 }}>
            已停止自动重试
          </h2>
          <p
            style={{
              margin: "0 0 20px",
              color: "#667085",
              fontSize: 14,
              maxWidth: 420,
            }}
          >
            同一个错误连续触发了 {this.state.resetCount} 次。请刷新页面恢复，或检查代码改动。
          </p>
          <button
            onClick={this.handleReloadPage}
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
            刷新页面
          </button>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender(this.state.error!, this.handleRetry);
      }

      const remaining = (this.props.maxRetries ?? DEFAULT_MAX_RETRIES) - this.state.resetCount;

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
            剩余重试次数：{remaining}（重复错误会自动停止重建组件树）
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
