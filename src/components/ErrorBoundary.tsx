import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FuelNest ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearCache = () => {
    try {
      this.setState({ hasError: false, error: null });
      window.location.href = window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0d162f] border border-blue-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">FuelNest ইন্টারফেস রিলোড প্রয়োজন</h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                ব্রাউজারের কোনো উপাদানে সাময়িক ত্রুটি ঘটেছে। আপনার সমস্ত সাবস্ক্রাইবার ও ডাটাবেস রেকর্ড নিরাপদে সংরক্ষিত রয়েছে।
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-black/40 border border-slate-800 rounded-xl text-left text-[11px] font-mono text-amber-300 overflow-x-auto max-h-32">
                  {typeof this.state.error === 'string'
                    ? this.state.error
                    : (this.state.error as any).message || (this.state.error as any).code || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পৃষ্ঠাটি রিলোড করুন (Reload)</span>
              </button>
              <button
                onClick={this.handleClearCache}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-blue-900/60 hover:bg-blue-950/40 text-slate-300 font-bold text-xs transition-colors"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>অ্যাপ রিস্টোর করুন</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
