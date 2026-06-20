import React from "react";
import "./ErrorBoundary.css";

/**
 * App-wide error boundary.
 *
 * Catches render errors anywhere below it and shows a friendly fallback
 * instead of a blank screen. The fallback styling lives in
 * `ErrorBoundary.css` and falls back to literal colors so the screen
 * still renders even if the global design tokens never loaded.
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep this `console.error` even in production — it's the only signal
    // we get for boundary-level crashes. Vite strips ordinary `console.*`
    // in prod, but this lint pragma keeps it in the bundle.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => this.setState({ error: null });

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="eb-root">
        <div className="eb-card">
          <div className="eb-icon" aria-hidden="true">⚠️</div>
          <h1 className="eb-title">Something went wrong</h1>
          <p className="eb-msg">
            The page hit an unexpected error. You can try again or reload the app.
          </p>
          <div className="eb-actions">
            <button type="button" className="eb-btn eb-btn--ghost" onClick={this.handleReset}>
              Try again
            </button>
            <button type="button" className="eb-btn eb-btn--primary" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
