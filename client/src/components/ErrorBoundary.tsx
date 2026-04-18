import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error", error, info);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="screen">
          <div className="panel hero-panel">
            <p className="eyebrow">Application Error</p>
            <h1>Something failed while rendering the calculator.</h1>
            <p className="muted">Refresh the page to retry.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
