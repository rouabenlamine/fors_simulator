"use client";

import { useState } from "react";
import { CheckCircle, XCircle, MessageSquare, ArrowUpRight, Edit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { validateAnalysisAction, rejectAnalysisAction } from "@/app/actions";

interface ApproveRejectBarProps {
  ticketId: string;
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
  onReanalyze?: () => void;
}

export function ApproveRejectBar({ ticketId, status, onApprove, onReject, onReanalyze }: ApproveRejectBarProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | "reanalyze" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      const res = await validateAnalysisAction(ticketId);
      if (res.success) {
        onApprove?.();
      } else {
        alert(res.error || "Failed to validate analysis");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    try {
      const res = await rejectAnalysisAction(ticketId);
      if (res.success) {
        onReject?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  if (status === "approved" || status === "validated") {
    return (
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-900 uppercase">Solution base updated</p>
            <p className="text-[10px] text-emerald-600 font-medium">Validated & stored in Knowledge Base</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected" || status === "Rejected") {
    return (
      <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
            <XCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-rose-900 uppercase">Analysis Rejected</p>
            <p className="text-[10px] text-rose-600 font-medium italic">Pending manual resolution or retry</p>
          </div>
        </div>
        <button 
           onClick={onReanalyze}
           className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 rounded-xl text-[10px] font-black text-rose-600 hover:bg-rose-50 transition-all uppercase tracking-wider shadow-sm"
        >
          <RefreshCw className="w-3 h-3" />
          {loading === "reanalyze" ? "Working..." : "Retry Analysis"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Agent Decisions</p>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="success"
          size="sm"
          onClick={handleApprove}
          disabled={loading !== null}
          className="rounded-xl px-5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {loading === "approve" ? "Approving..." : "Approve Solution"}
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={handleReject}
          disabled={loading !== null}
          className="rounded-xl px-5"
        >
          <XCircle className="w-3.5 h-3.5" />
          {loading === "reject" ? "Rejecting..." : "Reject Solution"}
        </Button>

        <div className="w-px h-6 bg-slate-100 mx-1" />

        <button 
          onClick={onReanalyze}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 transition-all uppercase tracking-wider border border-slate-100 shadow-sm"
        >
          <RefreshCw className="w-3 h-3" />
          Re-analyze
        </button>

        <Link href={`/chat/${ticketId}`} className="ml-auto">
          <Button variant="secondary" size="sm" className="rounded-xl">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            Discuss AI
          </Button>
        </Link>
      </div>
    </div>
  );
}
