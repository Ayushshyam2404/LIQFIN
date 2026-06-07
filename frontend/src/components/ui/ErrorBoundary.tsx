import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-surface text-brand-on-surface flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
          {/* Neo-brutalist decorative background elements */}
          <div className="absolute top-12 left-12 w-24 h-24 bg-brand-primary opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-16 right-16 w-32 h-32 bg-brand-secondary opacity-10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="max-w-md w-full text-center space-y-8 z-10">
            {/* Stylized Sticker */}
            <div className="inline-flex items-center gap-2 bg-brand-primary-fixed border-2 border-brand-on-surface px-4 py-1.5 shadow-[3px_3px_0px_0px_var(--border-color)] sticker-rotate-left font-mono text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-brand-primary animate-pulse" />
              <span>System Error 500: Core Crash</span>
            </div>

            {/* Big styled Header */}
            <div className="relative inline-block">
              <h1 className="text-9xl font-black font-sans leading-none tracking-tighter text-brand-on-surface pr-2">
                500
              </h1>
              <div className="absolute -bottom-2 -right-2 bg-brand-secondary-fixed border-4 border-brand-on-surface px-3 py-1 font-mono text-xs font-black uppercase neo-shadow-sm sticker-rotate-right">
                CRITICAL_FAILURE
              </div>
            </div>

            {/* Description */}
            <div className="bg-brand-surface-lowest border-4 border-brand-on-surface p-6 neo-shadow-sm space-y-3">
              <p className="font-mono text-xs font-bold uppercase text-brand-outline">
                An unexpected exception halted the UI runtime.
              </p>
              <p className="text-sm text-brand-on-surface/80 leading-relaxed font-sans text-left break-words max-h-32 overflow-y-auto font-mono text-[11px] p-2 bg-brand-surface border border-brand-on-surface/20">
                {this.state.error?.toString() || 'Unknown runtime error.'}
              </p>
            </div>

            {/* Action */}
            <div className="flex justify-center">
              <button
                onClick={this.handleReset}
                aria-label="Reload and restart application state"
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
