import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  viewName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ViewErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in view ${this.props.viewName}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border border-red-100 dark:border-red-900/30">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-50 mb-2">
            Fehler beim Laden von {this.props.viewName}
          </h2>
          <p className="text-sm text-stone-500 dark:text-zinc-400 max-w-sm mb-6">
            Dieser Bereich konnte nicht geladen werden. Bitte versuche es erneut.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
