"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-glupp-accent mx-auto mb-3" />
            <h3 className="font-display font-bold text-glupp-cream text-sm mb-2">
              Oups, quelque chose a plante
            </h3>
            <p className="text-xs text-glupp-text-muted mb-4">
              {this.state.error?.message || "Erreur inconnue"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-glupp-accent text-white rounded-glupp text-xs font-medium hover:bg-glupp-accent/90 transition-colors"
            >
              <RefreshCw size={12} />
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
