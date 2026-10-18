import React from 'react';

/** Keeps a failed Advanced/API panel from wiping the whole studio. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('UI error boundary:', error);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="panel p-4" role="alert">
            <p className="text-sm font-semibold text-[color:var(--ink-text)]">
              Dieser Bereich konnte nicht geladen werden
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              {this.state.error?.message || 'Unbekannter Fehler'}
            </p>
            <button
              type="button"
              className="chip-button mt-3"
              onClick={() => this.setState({ error: null })}
            >
              Erneut versuchen
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
