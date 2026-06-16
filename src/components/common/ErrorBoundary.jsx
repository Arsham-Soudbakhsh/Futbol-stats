import React from "react";

/**
 * App-wide error boundary. Catches render errors in any subtree and shows
 * a friendly fallback instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "var(--bg, #0A0E0B)",
          color: "var(--text, #F2F6F0)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary, #B3BFB5)", marginBottom: 20 }}>
            The page hit an unexpected error. You can try again or reload the app.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid var(--border, #232C25)",
                background: "var(--surface, #141B16)",
                color: "var(--text, #F2F6F0)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "var(--primary, #1F7A4D)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
