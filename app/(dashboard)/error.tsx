"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, LogIn } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FORS dashboard] error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Page error</h3>
        <p className="text-xs text-slate-400 mb-5">
          {error.message || "An unexpected error occurred on this page."}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
          <a
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <LogIn className="w-3 h-3" />
            Re-login
          </a>
        </div>
      </div>
    </div>
  );
}
