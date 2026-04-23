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
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Chat History</h2>
            <p className="text-sm text-slate-400">All FORS Agent conversations by ticket</p>
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="flex items-center gap-4 p-4">
                  {/* Colored avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                  >
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-800">Ticket #{conv.ticketId}</span>
                      {conv.title && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: colors.from }}
                        >
                          {conv.title}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate">
                      Conversation: {conv.conversationId}
                    </p>
                    {lastContent && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        <span className="font-medium">{lastSender}:</span> {lastContent}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {lastTime}
                      </span>
                      <DeleteConversationButton
                        conversationId={conv.conversationId}
                        ticketId={conv.ticketId}
                      />
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: colors.from }}
                    >
                      {msgCount} msgs
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
                {/* Bottom progress accent */}
                <div
                  className="h-0.5"
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
