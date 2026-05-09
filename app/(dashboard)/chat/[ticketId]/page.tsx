import { notFound } from "next/navigation";
import { getTicketById, getChatMessages } from "@/app/actions";
import { ChatWindow } from "@/components/chat/ChatWindow";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Clock, Users, Hash } from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";

interface Props {
  params: Promise<{ ticketId: string }>;
}

const STATUS_PASTEL: Record<string, { bg: string; text: string; ring: string }> = {
  pending:          { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200"  },
  analysis_pending: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  sql_proposed:     { bg: "bg-sky-50",    text: "text-sky-700",    ring: "ring-sky-200"    },
  validated:        { bg: "bg-emerald-50",text: "text-emerald-700",ring: "ring-emerald-200"},
  rejected:         { bg: "bg-rose-50",   text: "text-rose-700",   ring: "ring-rose-200"   },
  closed:           { bg: "bg-green-50",  text: "text-green-700",  ring: "ring-green-200"  },
  canceled:         { bg: "bg-slate-100", text: "text-slate-500",  ring: "ring-slate-200"  },
};

export default async function ChatDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId);
  const allMessages = await getChatMessages();
  const messages = allMessages.filter((m) => m.ticketId === ticketId);

  if (!ticket) return notFound();

  const statusStyle = STATUS_PASTEL[ticket.status] ?? { bg: "bg-slate-100", text: "text-slate-500", ring: "ring-slate-200" };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-[calc(100vh-56px)] flex flex-col gap-4">

      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Back + Identity */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/chat"
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg ring-1 ring-inset ring-indigo-100">
                  #{ticket.id}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ring-1 ring-inset ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring}`}>
                  {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700 truncate mt-0.5">{ticket.title}</p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500">
              <Users className="w-3 h-3 text-slate-400" />
              {ticket.team}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date(ticket.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              {messages.length} msgs
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400" />
      </div>

      {/* ── Chat Window ── */}
      <div className="flex-1 min-h-0">
        <ChatWindow ticketId={ticketId} initialMessages={messages} currentUser="Agent" />
      </div>
    </div>
  );
}
