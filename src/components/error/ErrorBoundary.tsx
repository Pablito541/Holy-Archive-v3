import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-zinc-50 mb-2">
            Ein unerwarteter Fehler ist aufgetreten
          </h1>
          <p className="text-stone-500 dark:text-zinc-400 max-w-md mb-8">
            Das tut uns leid. Bitte lade die Seite neu oder kehre zur Startseite zurück.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} variant="primary">
              Seite neu laden
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="secondary" className="flex items-center gap-2">
              <Home className="w-4 h-4" /> Startseite
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
