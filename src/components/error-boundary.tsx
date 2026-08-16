import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catch render-time crashes and show the actual error instead of a blank
 * screen. TEMP DEBUG: includes error.message and a reload button so we can
 * read the real failure when re-logging claims a black screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[purple-world] render crash:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-4 p-6"
          style={{ background: "hsl(264 45% 99%)", color: "hsl(230 30% 10%)" }}
        >
          <p className="text-lg font-bold">Something crashed while rendering.</p>
          <pre className="max-w-2xl overflow-auto whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {err.name}: {err.message}
            {"\n\n"}
            {err.stack}
          </pre>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}