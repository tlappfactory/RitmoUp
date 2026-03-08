import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    readonly props: Props;

    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center bg-surface-dark text-white min-h-screen flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Algo deu errado.</h1>
                    <p className="text-gray-300 mb-4">Ocorreu um erro ao renderizar este componente.</p>
                    <pre className="bg-black/50 p-4 rounded text-left text-xs text-red-300 overflow-auto max-w-2xl border border-red-900/50">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button
                        className="mt-6 px-4 py-2 bg-primary text-black font-bold rounded hover:bg-primary-hover"
                        onClick={() => window.location.reload()}
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
