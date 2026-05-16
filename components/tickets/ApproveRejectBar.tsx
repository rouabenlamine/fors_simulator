"use client";

import { useState } from "react";
import { CheckCircle, XCircle, MessageSquare, RefreshCw, ShieldCheck, ShieldAlert, Send, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { validateAnalysisAction, rejectAnalysisAction } from "@/app/actions";
import { clsx } from "clsx";

interface ApproveRejectBarProps {
  ticketId: string;
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
  onReanalyze?: () => void;
  /** Whether the current user is permitted to act on this ticket */
  canAct?: boolean;
  /** Human-readable reason why action is restricted (shown in tooltip / message) */
  restrictionReason?: string;
  /** Matricule of the assigned support user, for display purposes */
  assignedSupportMatricule?: string | null;
}

export function ApproveRejectBar({
  ticketId,
  status,
  onApprove,
  onReject,
  onReanalyze,
  canAct = true,
  restrictionReason,
  assignedSupportMatricule,
}: ApproveRejectBarProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | "reanalyze" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  async function handleConfirmReject() {
    if (!rejectReason.trim()) return;
    setLoading("reject");
    try {
      const res = await rejectAnalysisAction(ticketId, rejectReason.trim());
      if (res.success) {
        setShowRejectModal(false);
        setRejectReason("");
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
      <div className="bg-emerald-600 rounded-2xl p-4 shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full -mr-8 -mt-8 animate-pulse" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Protocol Finalized</p>
            <p className="text-[8px] text-emerald-100 font-bold opacity-80 uppercase tracking-tighter mt-1">Knowledge Base Synchronized</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected" || status === "Rejected") {
    return (
      <div className="bg-rose-600 rounded-2xl p-4 shadow-xl shadow-rose-600/20 relative overflow-hidden">
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Protocol Rejected</p>
              <p className="text-[8px] text-rose-100 font-bold opacity-80 uppercase tracking-tighter mt-1">Manual Override Required</p>
            </div>
          </div>
          <button
            onClick={onReanalyze}
            className="group w-full flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 text-white h-10 rounded-xl transition-all border border-white/10 backdrop-blur-md"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", loading === "reanalyze" && "animate-spin")} />
            <span className="text-[9px] font-black uppercase tracking-widest">{loading === "reanalyze" ? "Processing..." : "Initiate Re-Analysis"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Locked / Restricted State ───────────────────────────────────────────────
  if (!canAct) {
    return (
      <div className="bg-white rounded-3xl border border-amber-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center ring-1 ring-amber-200">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.1em]">Actions Restricted</h4>
            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Authorization Required</p>
          </div>
        </div>

        {/* Restriction message */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
            <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
              {restrictionReason || "Only the assigned IT support user can resolve this ticket."}
            </p>
          </div>

          {assignedSupportMatricule && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Assigned To</p>
                <p className="text-[10px] font-black text-indigo-700 font-mono">{assignedSupportMatricule}</p>
              </div>
            </div>
          )}

          {/* Disabled shadow buttons */}
          <div className="grid grid-cols-2 gap-2.5 opacity-40 pointer-events-none select-none">
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white h-10 px-3 rounded-xl cursor-not-allowed"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Approve</span>
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-rose-500 to-red-600 text-white h-10 px-3 rounded-xl cursor-not-allowed"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Reject</span>
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-blue-600 text-white h-10 px-3 rounded-xl cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Re-Analyze</span>
            </button>
            <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white h-10 px-3 rounded-xl cursor-not-allowed">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Support</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active / Permitted State ─────────────────────────────────────────────────
  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-5 transition-all duration-500 hover:shadow-indigo-500/10 hover:border-indigo-200 group/bar">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 ring-1 ring-white/20">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.1em]">Resolution Actions</h4>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Authority Decision</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Approve */}
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="group flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-10 px-3 rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5 text-white/80 group-hover:text-white transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Approve</span>
          </button>

          {/* Reject */}
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading !== null}
            className="group flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white h-10 px-3 rounded-xl transition-all shadow-md shadow-rose-500/10 active:scale-[0.98] disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5 text-white/80 group-hover:text-white transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Reject</span>
          </button>

          {/* Re-analyze */}
          <button
            onClick={onReanalyze}
            disabled={loading !== null}
            className="group flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white h-10 px-3 rounded-xl transition-all shadow-md shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5 text-white/80 group-hover:text-white transition-colors", loading === "reanalyze" && "animate-spin")} />
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Re-Analyze</span>
          </button>

          {/* Agent Assistance */}
          <Link href={`/chat/${ticketId}`} className="block flex-1">
            <button className="w-full group flex items-center justify-center gap-2 bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white h-10 px-3 rounded-xl transition-all shadow-md shadow-violet-500/10 active:scale-[0.98]">
              <MessageSquare className="w-3.5 h-3.5 text-white/80 group-hover:text-white transition-colors" />
              <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Support</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 left-64 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-all duration-300"
            onClick={() => setShowRejectModal(false)}
          />

          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative z-[1001] border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative h-28 bg-[#0A1628] p-6 flex items-end">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[200%] bg-rose-500/20 blur-[40px] rounded-full" />
              </div>

              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg ring-1 ring-white/20">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-rose-300 uppercase tracking-[0.3em]">Decision Protocol</span>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Rejection Report</h3>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Rejection Rationale *</label>
                <textarea
                  autoFocus
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Elaborate on the deficiencies in this analysis..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all min-h-[140px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 h-12 rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || loading === "reject"}
                  className="flex-[2] h-12 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading === "reject" ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
