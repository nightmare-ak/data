import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-6 text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30 shadow-xl shadow-red-900/20">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">System Critical Failure</h2>
                            <p className="text-red-400 font-mono text-xs bg-black/40 p-4 rounded-xl text-left overflow-auto max-h-32 border border-red-500/10">
                                {this.state.error?.message || "Unknown Error"}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-white text-slate-900 font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Reboot System
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
