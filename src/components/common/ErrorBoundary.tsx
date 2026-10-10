import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-white p-6 flex items-center justify-center">
          <div className="max-w-xl w-full rounded-2xl border border-red-800 bg-stone-900 p-5 space-y-3">
            <h1 className="text-lg font-bold text-red-400">
              Terjadi kesalahan pada aplikasi
            </h1>
            <p className="text-sm text-stone-300">
              Salin pesan di bawah ini dan kirimkan untuk diperiksa:
            </p>
            <pre className="whitespace-pre-wrap break-words text-xs bg-stone-950 p-3 rounded-lg">
              {this.state.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
