import Link from "next/link";
import { getConversationsWithMeta } from "@/app/actions";
import { MessageSquare, Clock, Bot, ChevronRight } from "lucide-react";
import { DeleteConversationButton } from "@/components/chat/DeleteConversationButton";
import { NewConversationButton } from "@/components/chat/NewConversationButton";

const chatColors = [
  { from: "#2563eb", to: "#3b82f6" },
  { from: "#7c3aed", to: "#8b5cf6" },
  { from: "#0891b2", to: "#06b6d4" },
  { from: "#059669", to: "#10b981" },
  { from: "#d97706", to: "#f59e0b" },
];

export default async function ChatPage() {
  // Single query fetches all conversations with last-message metadata
  const conversations = await getConversationsWithMeta();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-200/50">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Chat History</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">AI-assisted conversation history and analysis logs</p>
          </div>
        </div>
        <NewConversationButton />
      </div>

      <div className="space-y-3">
        {conversations.map((conv: any, i: number) => {
          const colors = chatColors[i % chatColors.length];
          const msgCount = Number(conv.messageCount) || 0;
          const lastSender = conv.lastMessageRole === "AI" ? "FORS AGENT" : (conv.userMatricule || "Agent");
          const lastContent = conv.lastMessageContent || null;
          const lastTime = conv.lastMessageAt
            ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—";

          return (
            <Link key={conv.conversationId} href={`/chat/${conv.ticketId}`}>
              <div
                className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${(i % 10) * 50}ms` }}
              >
                {/* Subtle background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500" style={{ background: `linear-gradient(to right, ${colors.from}, ${colors.to})` }} />

                <div className="flex items-center gap-5 p-5 relative z-10">
                  {/* Colored avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
                    style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                  >
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-black text-slate-800 tracking-tight">Ticket #{conv.ticketId}</span>
                      {conv.title && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white shadow-sm"
                          style={{ backgroundColor: colors.from }}
                        >
                          {conv.title}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      Conv ID: {conv.conversationId}
                    </p>
                    {lastContent && (
                      <p className="text-xs text-slate-500 truncate mt-1">
                        <span className="font-bold text-slate-700">{lastSender}:</span> {lastContent}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
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
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] font-black px-2.5 py-1 rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: colors.from }}
                      >
                        {msgCount} msgs
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom progress accent */}
                <div
                  className="h-1 opacity-80"
                  style={{ background: `linear-gradient(90deg, ${colors.from}, ${colors.to})` }}
                />
              </div>
            </Link>
          );
        })}

        {conversations.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No chat conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
