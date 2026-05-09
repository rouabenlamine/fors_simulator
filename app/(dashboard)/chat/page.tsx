import Link from "next/link";
import { getConversationsWithMeta } from "@/app/actions";
import { MessageSquare, Clock, Bot, ChevronRight, Plus, Sparkles } from "lucide-react";
import { DeleteConversationButton } from "@/components/chat/DeleteConversationButton";
import { NewConversationButton } from "@/components/chat/NewConversationButton";

// Pastel color palette for conversation avatars
const PASTEL_PALETTES = [
  { bg: "bg-indigo-100", text: "text-indigo-600", dot: "bg-indigo-400",  bar: "bg-indigo-400"  },
  { bg: "bg-violet-100", text: "text-violet-600", dot: "bg-violet-400",  bar: "bg-violet-400"  },
  { bg: "bg-sky-100",    text: "text-sky-600",    dot: "bg-sky-400",     bar: "bg-sky-400"     },
  { bg: "bg-emerald-100",text: "text-emerald-600",dot: "bg-emerald-400", bar: "bg-emerald-400" },
  { bg: "bg-amber-100",  text: "text-amber-600",  dot: "bg-amber-400",   bar: "bg-amber-400"   },
];

export default async function ChatPage() {
  const conversations = await getConversationsWithMeta();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Chat <span className="text-indigo-500">History</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              AI-assisted conversation logs per ticket
            </p>
          </div>
        </div>
        <NewConversationButton />
      </div>

      {/* ── Conversation List ─────────────────────────────────────── */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center gap-3 shadow-sm">
          <Sparkles className="w-8 h-8 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">No chat sessions yet</p>
          <p className="text-xs text-slate-300">Start a conversation from any ticket detail page</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {conversations.map((conv: any, i: number) => {
            const palette = PASTEL_PALETTES[i % PASTEL_PALETTES.length];
            const msgCount = Number(conv.messageCount) || 0;
            const lastSender = conv.lastMessageRole === "AI" ? "FORS Agent" : (conv.userMatricule || "Agent");
            const lastContent = conv.lastMessageContent || null;
            const lastTime = conv.lastMessageAt
              ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—";

            return (
              <Link key={conv.conversationId} href={`/chat/${conv.ticketId}`}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden group cursor-pointer">
                  <div className="flex items-center gap-4 p-4">

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl ${palette.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                      <MessageSquare className={`w-5 h-5 ${palette.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">
                          Ticket #{conv.ticketId}
                        </span>
                        {conv.title && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${palette.bg} ${palette.text} ring-1 ring-inset ring-black/5`}>
                            {conv.title}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 hidden sm:block">
                          {conv.conversationId}
                        </span>
                      </div>
                      {lastContent && (
                        <p className="text-xs text-slate-500 truncate">
                          <span className="font-bold text-slate-600">{lastSender}:</span>{" "}
                          {lastContent}
                        </p>
                      )}
                    </div>

                    {/* Right meta */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                          <Clock className="w-3 h-3" />
                          {lastTime}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DeleteConversationButton
                            conversationId={conv.conversationId}
                            ticketId={conv.ticketId}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ring-1 ring-inset ring-black/5 ${palette.bg} ${palette.text}`}>
                          {msgCount} msg{msgCount !== 1 ? "s" : ""}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className={`h-0.5 ${palette.bar} opacity-40 group-hover:opacity-80 transition-opacity`} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
