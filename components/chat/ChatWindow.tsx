"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { chatWithAgentAction } from "@/app/actions";

interface ChatWindowProps {
  ticketId: string;
  initialMessages: ChatMessage[];
  currentUser?: string;
}

export function ChatWindow({ ticketId, initialMessages, currentUser = "You" }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function send() {
    if (!input.trim() || isTyping) return;
    const now = new Date().toISOString();

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      conversationId: ticketId + "_conv",
      role: "User",
      content: input,
      createdAt: now,
      senderName: currentUser,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const gHistory = messages.map(m => ({ role: m.role === 'AI' ? 'assistant' : 'user', content: m.content }));
      const replyContent = await chatWithAgentAction(ticketId, input, gHistory);

      const gostReply: ChatMessage = {
        id: String(Date.now() + 1),
        conversationId: ticketId + "_conv",
        role: "AI",
        content: replyContent,
        createdAt: new Date().toISOString(),
        senderName: "FORS Agent",
      };

      setMessages((prev) => [...prev, gostReply]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        conversationId: ticketId + "_conv",
        role: "AI",
        content: "Error: Unable to connect to the AI service. Please check if Ollama is running.",
        createdAt: new Date().toISOString(),
        senderName: "System",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800 tracking-tight">FORS Agent</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active · Ticket #{ticketId}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 space-y-5 overflow-y-auto bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">Start a conversation with FORS Agent</p>
            <p className="text-xs text-slate-400 max-w-xs">Ask about the incident, request analysis, or discuss resolution steps.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "User" ? "flex-row-reverse" : "flex-row"}`}
            style={{ animationDelay: `${(idx % 6) * 30}ms` }}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
              msg.role === "AI"
                ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                : "bg-gradient-to-br from-slate-600 to-slate-700"
            }`}>
              {msg.role === "AI"
                ? <Bot className="w-4 h-4 text-white" />
                : <User className="w-4 h-4 text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "User" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                <span className="text-[9px] text-slate-300 font-medium">{formatTime(msg.createdAt)}</span>
              </div>
              <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium ${
                msg.role === "AI"
                  ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                  : "bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-200/60"
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3.5 border-t border-slate-100 bg-white flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message FORS Agent…"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <button
          onClick={send}
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 active:scale-95 transition-all shrink-0 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:hover:bg-indigo-600"
        >
          {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
