import React from 'react';

interface EBProps {
  children: React.ReactNode;
}

interface EbState {
  error: Error | null;
}

// Top-level error boundary. React requires error boundaries to be class
// components with getDerivedStateFromError/componentDidCatch, so this must be
// a class. It prevents an uncaught render exception from collapsing the whole
// SPA into a blank white screen, showing a recoverable message instead.
export class ErrorBoundary extends React.Component<EBProps, EbState> {
  // NOTE: this tsconfig resolves React as untyped (no @types/react installed),
  // so the inherited Component members are not typed. We declare the fields we
  // use so the class methods typecheck, and avoid calling inherited untyped
  // methods where possible.
  state: EbState = { error: null };
  props: EBProps;

  constructor(props: EBProps) {
    super(props);
    this.props = props as EBProps;
  }

  static getDerivedStateFromError(error: Error): EbState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  private clear() {
    this.state = { error: null };
  }

  render() {
    const error = this.state.error;
    if (error) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-sm w-full text-center">
            <div className="text-2xl font-bold text-gray-900">Something went wrong</div>
            <p className="text-xs text-gray-500 mt-2">
              The page hit an unexpected error. Reloading usually fixes it.
            </p>
            <pre className="mt-3 text-left text-[11px] font-mono text-red-600 bg-red-50 border border-red-100 rounded p-2.5 overflow-auto max-h-28">
              {(error.message || 'Unknown error').toString()}
            </pre>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
              >
                Reload
              </button>
              <button
                onClick={this.clear}
                className="px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Try again
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