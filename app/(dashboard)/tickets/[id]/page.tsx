"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTicketById, getTicketAnalysisAction, updateTicketStatusAction, addTicketCommentAction, getTicketAuthContextAction } from "@/app/actions";
import type { Ticket, TicketAnalysis as TAnalysis, TicketEventLog } from "@/lib/types";
import { TicketAnalysis } from "@/components/tickets/TicketAnalysis";
import { SQLProposal } from "@/components/tickets/SQLProposal";
import { ApproveRejectBar } from "@/components/tickets/ApproveRejectBar";
import { STATUS_LABELS } from "@/lib/constants";
import { ArrowLeft, Zap, RefreshCw, MessageSquare, CheckCircle, Bot, Database, Activity, Shield, Hash, Layers, User, Clock, Terminal, Send, Lock } from "lucide-react";
import Link from "next/link";
import { executeSqlPreviewAction, getEventLogsForTicketAction, updateTicketSapModuleAction, getSimilarAssigneesAction } from "@/app/actions";
import { clsx } from "clsx";

const SAP_MODULES = [
  { value: "", label: "Auto-Detect / Select Module", group: "default" },
  { value: "MM", label: "MM - Materials Management", group: "Logistics" },
  { value: "PP", label: "PP - Production Planning", group: "Logistics" },
  { value: "SD", label: "SD - Sales and Distribution", group: "Logistics" },
  { value: "FI", label: "FI - Financial Accounting", group: "Finance" },
  { value: "CO", label: "CO - Controlling", group: "Finance" },
  { value: "QM", label: "QM - Quality Management", group: "Quality" },
  { value: "PM", label: "PM - Plant Maintenance", group: "Maintenance" },
];

function getSapModuleColor(module: string) {
  if (!module) return "text-slate-400 bg-slate-50 border-slate-100";
  const m = SAP_MODULES.find(sm => sm.value === module);
  if (m?.group === "Logistics") return "text-blue-600 bg-blue-50 border-blue-100";
  if (m?.group === "Finance") return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (m?.group === "Quality") return "text-amber-600 bg-amber-50 border-amber-100";
  if (m?.group === "Maintenance") return "text-rose-600 bg-rose-50 border-rose-100";
  return "text-indigo-600 bg-indigo-50 border-indigo-100";
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [analysis, setAnalysis] = useState<TAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventLogs, setEventLogs] = useState<TicketEventLog[]>([]);
  const [eventLogsLoading, setEventLogsLoading] = useState(false);
  const [sqlPreview, setSqlPreview] = useState<{ success: boolean; rows: any[]; columns: string[]; error?: string | null } | null>(null);
  const [sqlPreviewLoading, setSqlPreviewLoading] = useState(false);
  const [sapModule, setSapModule] = useState("");
  const [sapModuleLoading, setSapModuleLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [ticketAuth, setTicketAuth] = useState<{
    canAct: boolean;
    reason?: string;
    assignedSupportMatricule: string | null;
    userMatricule: string | null;
    userRole: string | null;
  } | null>(null);
  const [similarAssignees, setSimilarAssignees] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTicketData();
      fetchEventLogs(id as string);
      fetchSimilarAssignees(id as string);
    }
  }, [id]);

  async function fetchSimilarAssignees(ticketId: string) {
    setSimilarLoading(true);
    try {
      const res = await getSimilarAssigneesAction(ticketId);
      setSimilarAssignees(res.assignees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSimilarLoading(false);
    }
  }

  async function fetchTicketData() {
    setLoading(true);
    try {
      const ticketData = await getTicketById(id as string);
      if (ticketData) {
        setTicket(ticketData);
        setSapModule((ticketData as any).sapModule || "");
        if (ticketData.status === "validated" || ticketData.status === "analysis_pending" || ticketData.status === "sql_proposed") {
          const analysisRes = await getTicketAnalysisAction(id as string);
          if (analysisRes.success && analysisRes.analysis) {
            setAnalysis(analysisRes.analysis);
          }
        }
      }
      // Fetch auth context for this ticket (role-based ownership check)
      const authCtx = await getTicketAuthContextAction(id as string);
      setTicketAuth(authCtx);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEventLogs(ticketId: string) {
    setEventLogsLoading(true);
    try {
      const res = await getEventLogsForTicketAction(ticketId);
      if (res) {
        setEventLogs(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEventLogsLoading(false);
    }
  }

  async function handleRunSqlPreview() {
    if (!analysis?.sqlProposal || !ticket?.id) return;
    setSqlPreviewLoading(true);
    try {
      const res = await executeSqlPreviewAction(ticket.id, analysis.sqlProposal);
      setSqlPreview(res);
    } catch (err) {
      console.error(err);
      setSqlPreview({ success: false, rows: [], columns: [], error: "Execution failed" });
    } finally {
      setSqlPreviewLoading(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !ticket?.id) return;
    setCommentLoading(true);
    try {
      const res = await addTicketCommentAction(ticket.id, newComment.trim());
      if (res.success) {
        setNewComment("");
        fetchTicketData();
        fetchEventLogs(ticket.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleReanalyze() {
    if (!ticket?.id) return;
    try {
      const { analyzeTicketAction } = await import("@/app/actions");
      await analyzeTicketAction(ticket.id, ticket.title, ticket.description || "");
      fetchTicketData();
      fetchEventLogs(ticket.id);
    } catch (err) {
      console.error("Re-analysis failed:", err);
      alert("Re-analysis failed. Please check the logs.");
    }
  }

  async function handleSapModuleChange(newModule: string) {
    setSapModule(newModule);
    setSapModuleLoading(true);
    try {
      await updateTicketSapModuleAction(id as string, newModule);
      fetchEventLogs(id as string);
    } catch (err) {
      console.error(err);
    } finally {
      setSapModuleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-600/20 rounded-full animate-spin border-t-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Secure Records...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h2 className="text-xl font-black text-slate-900">Incident Not Found</h2>
        <p className="text-slate-500 mt-2">The requested incident ID does not exist in the system.</p>
        <Link href="/tickets">
          <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Return to Dashboard</button>
        </Link>
      </div>
    );
  }

  const isValidated = ticket.status === "validated";
  const parsedValidation = isValidated && ticket.closeNotes ? JSON.parse(ticket.closeNotes) : null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500 p-3 sm:p-4">
      {/* ─── Premium Header ─── */}
      <div className="bg-[#0A1628] rounded-2xl shadow-xl overflow-hidden border border-white/5 ring-1 ring-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[120%] bg-indigo-500/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[150%] bg-violet-600/10 blur-[150px] rounded-full" />
        </div>

        <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[8px] font-black text-indigo-300 uppercase tracking-[0.2em] hover:text-white transition-all group px-2 py-0.5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10"
            >
              <ArrowLeft className="w-2.5 h-2.5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/20">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">{ticket.id}</h1>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${ticket.status === 'validated' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    ticket.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      ticket.status === 'analysis_pending' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        ticket.status === 'sql_proposed' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                          ticket.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            'bg-white/10 text-slate-300 border-white/20'
                    }`}>
                    {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-1 text-[9px] font-black text-white/40 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Layers className="w-2.5 h-2.5 text-indigo-400" />{ticket.team}</span>
                  <span className="opacity-10 text-white">|</span>
                  <span className="flex items-center gap-1"><User className="w-2.5 h-2.5 text-violet-400" />{ticket.openedBy || "Agent"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-xl">
            <div className="flex flex-col items-end gap-0 px-2">
              <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Priority</span>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ticket.priority?.includes('1') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                ticket.priority?.includes('2') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  ticket.priority?.includes('3') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    'bg-white/5 text-slate-400 border-white/10'
                }`}>{ticket.priority}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2.5 px-2">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">FORS CONFIDENCE</span>
                <span className="text-lg font-black text-white leading-none mt-0">{ticket.aiConfidence || 0}%</span>
              </div>
              <div className="relative w-10 h-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-white/5" strokeWidth="4" stroke="currentColor" fill="transparent" r="16" cx="20" cy="20" />
                  <circle
                    className="text-indigo-500 transition-all duration-1000"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - (ticket.aiConfidence || 0) / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="16" cx="20" cy="20"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── Primary Incident Intelligence ─── */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="w-20 h-20 text-indigo-900" />
            </div>

            <div className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shadow-inner">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Incident</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-black text-slate-900 mb-3 leading-tight tracking-tight">{ticket.title}</h4>
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full" />
                    <div className="pl-4">
                      <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                        &quot;{ticket.description}&quot;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-inner">
                  <div className="space-y-3">
                    <h5 className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.25em] flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Metadata
                    </h5>
                    <div className="grid gap-2">
                      <DetailItem label="Originator" value={ticket.openedBy || ""} icon={<User className="w-3 h-3 text-indigo-400" />} />
                      <DetailItem label="Timestamp" value={ticket.openedAt || ""} icon={<Clock className="w-3 h-3 text-indigo-400" />} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-[8px] font-black text-violet-600 uppercase tracking-[0.25em] flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Operations
                    </h5>
                    <div className="grid gap-2">
                      <DetailItem label="Team" value={ticket.team || ""} icon={<Layers className="w-3 h-3 text-violet-400" />} />
                      <DetailItem label="Assignee" value={ticket.assignedTo || ""} icon={<User className="w-3 h-3 text-violet-400" />} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">Functional Routing</h5>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">SAP Environment</p>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {sapModule && (
                      <div className={clsx(
                        "px-3 py-1.5 rounded-lg border text-[10px] font-black shadow-sm flex items-center gap-1.5",
                        getSapModuleColor(sapModule)
                      )}>
                        <Bot className="w-3.5 h-3.5" />
                        SAP {sapModule}
                      </div>
                    )}
                    <select
                      value={sapModule}
                      onChange={(e) => handleSapModuleChange(e.target.value)}
                      disabled={sapModuleLoading}
                      className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer"
                    >
                      {SAP_MODULES.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ─── Similar Ticket Assignees ─── */}
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none mb-3 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    Similar Ticket Assignees
                  </h5>
                  {similarLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 p-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span className="text-[10px] font-bold">Finding experts...</span>
                    </div>
                  ) : similarAssignees.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-bold text-slate-400">No similar ticket assignees found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                      {similarAssignees.map((assignee, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:border-indigo-200 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-indigo-600">{assignee.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{assignee.name}</p>
                            <p className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">
                              {assignee.matricule} &bull; <span className="text-indigo-600 font-bold">#{assignee.similar_ticket_number}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ─── Internal Comments & Collaboration ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden group">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Comments</h3>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Ticket Discussion</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {ticket.comments && (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 shadow-inner relative group-hover:bg-white transition-colors">
                    <p className="text-[12px] font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {ticket.comments.replace(/\\n/g, '\n').replace(/GHOST RESPONSE/g, 'FORS ASSISTANT RESPONSE')}
                    </p>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter comments..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all min-h-[80px] resize-none shadow-inner"
                  />
                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={handleAddComment}
                      disabled={commentLoading || !newComment.trim()}
                      className="px-4 py-2 bg-[#0A1628] text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-95 ring-1 ring-white/10"
                    >
                      {commentLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Post-Resolution Report (Validated Only) ─── */}
          {isValidated && parsedValidation && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl overflow-hidden group">
              <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-full bg-white/10 -skew-x-12 translate-x-10" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg ring-1 ring-white/30">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Resolution Report</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {parsedValidation.rootCause && (
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Root Cause</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700 leading-relaxed text-sm shadow-inner">
                      {parsedValidation.rootCause}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Query Simulation Environment ─── */}
          {analysis?.sqlProposal && (
            <div className="space-y-4">
              <SQLProposal sql={analysis.sqlProposal} />

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl group/lab">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0A1628] rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10">
                      <Terminal className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Simulation Lab</span>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">S4/HANA Sandbox Environment</p>
                    </div>
                  </div>
                  {ticketAuth?.canAct ? (
                    <button
                      onClick={handleRunSqlPreview}
                      disabled={sqlPreviewLoading}
                      className="group bg-[#0A1628] hover:bg-indigo-600 text-white text-[9px] px-5 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2 ring-1 ring-white/10"
                    >
                      <RefreshCw className={clsx("w-3 h-3", sqlPreviewLoading && "animate-spin")} />
                      {sqlPreviewLoading ? "Simulating..." : "Initiate Execution"}
                    </button>
                  ) : (
                    <div
                      title={ticketAuth?.reason || "Only the assigned support user can run SQL simulation"}
                      className="flex items-center gap-2 bg-slate-100 text-slate-400 text-[9px] px-4 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] cursor-not-allowed border border-slate-200"
                    >
                      <Lock className="w-3 h-3" />
                      Restricted
                    </div>
                  )}
                </div>

                {sqlPreview ? (
                  <div className="p-5">
                    {sqlPreview.success ? (
                      sqlPreview.rows.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-inner">
                          <table className="w-full text-left text-[11px] bg-white">
                            <thead className="bg-slate-900 text-white border-b border-slate-800">
                              <tr>
                                {sqlPreview.columns.map(col => (
                                  <th key={col} className="px-3 py-3 font-black uppercase tracking-[0.2em] text-[9px]">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {sqlPreview.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                  {sqlPreview.columns.map(col => (
                                    <td key={col} className="px-3 py-3 text-slate-600 font-mono font-medium">
                                      {row[col]?.toString() ?? 'NULL'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 border-dashed">
                          <Activity className="w-7 h-7 text-slate-300 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No record modifications detected.</p>
                        </div>
                      )
                    ) : (
                      <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[11px] font-bold flex items-center gap-2.5">
                        <Activity className="w-4 h-4" />
                        {sqlPreview.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center gap-3 group/ready">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover/ready:scale-110 transition-transform duration-500 shadow-inner">
                      <Database className="w-6 h-6 text-slate-200" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Ready</p>
                      <p className="text-[9px] font-bold text-slate-300">Awaiting simulation trigger on target schema.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Command Sidebar (AI & Auditing) ─── */}
        <div className="lg:col-span-4 space-y-4">
          {analysis && <TicketAnalysis analysis={analysis} />}

          {/* ─── Audit Stream Section ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden group hover:border-indigo-400 transition-all duration-500">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A1628] rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">Audit Stream</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Logs</p>
                </div>
              </div>
              <button
                onClick={() => fetchEventLogs(ticket.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
              >
                <RefreshCw className={clsx("w-3.5 h-3.5", eventLogsLoading && 'animate-spin')} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
              {eventLogs.length > 0 ? eventLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 group/log">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md transition-transform" />
                    {idx < eventLogs.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-2 min-h-[30px] group-hover/log:bg-indigo-100 transition-colors" />}
                  </div>
                  <div className="pb-3 flex-1 border-b border-slate-50 last:border-0">
                    <p className="text-[11px] font-black text-slate-700 leading-snug group-hover/log:text-indigo-900 transition-colors">
                      {log.message.replace(/GHOST/g, 'FORS Assistant')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-1 rounded-lg font-black uppercase tracking-[0.2em] border border-indigo-100">{log.attribution}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <Activity className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Events</p>
                </div>
              )}
            </div>
          </div>

          <ApproveRejectBar
            ticketId={ticket.id}
            status={ticket.status}
            onApprove={fetchTicketData}
            onReject={fetchTicketData}
            onReanalyze={handleReanalyze}
            canAct={ticketAuth?.canAct ?? true}
            restrictionReason={ticketAuth?.reason}
            assignedSupportMatricule={ticketAuth?.assignedSupportMatricule}
          />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 group/item">
      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
        {icon}
        {label}
      </label>
      <p className="text-[11px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
        {value || "Not Specified"}
      </p>
    </div>
  );
}
