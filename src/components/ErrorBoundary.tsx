import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LeadSnap Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[520px] bg-white p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 mb-4 max-w-[280px]">
            LeadSnap encountered an error. Your data is safe.
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                     text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Extension
          </button>
          {this.state.error && (
            <p className="mt-4 text-xs text-slate-400 font-mono">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
