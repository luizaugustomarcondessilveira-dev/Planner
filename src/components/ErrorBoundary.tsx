import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      window.location.href = window.location.origin;
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#150F0B] text-[#452414] dark:text-[#F6F1EC] flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-3xl p-8 shadow-xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Algo inesperado aconteceu
              </h2>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] leading-relaxed">
                Não se preocupe, seus dados locais continuam preservados. Você pode tentar recarregar o aplicativo para restabelecer a sessão com tranquilidade.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-[#F6F1EC] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] font-mono text-left overflow-auto max-h-24">
                {this.state.error.message || 'Erro desconhecido'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recarregar App</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4 text-[#B88E72]" />
                <span>Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

