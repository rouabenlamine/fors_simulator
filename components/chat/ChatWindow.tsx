"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { chatWithGostAction } from "@/app/actions";

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

      const replyContent = await chatWithGostAction(ticketId, input, gHistory);

      const gostReply: ChatMessage = {
        id: String(Date.now() + 1),
        conversationId: ticketId + "_conv",
        role: "AI",
        content: replyContent,
        createdAt: new Date().toISOString(),
        senderName: "FORS AGENT",
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
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-white/50 to-blue-50/30 pointer-events-none" />
      
      <div className="relative px-6 py-4 border-b border-white/60 flex items-center gap-3 bg-white/40">
        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        <span className="text-sm font-black text-slate-800 tracking-tight uppercase">Ticket #{ticketId}</span>
      </div>

      <div className="relative flex-1 p-6 space-y-6 overflow-y-auto scroll-smooth">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === "User" ? "flex-row-reverse" : "flex-row"}`}
            style={{ animationDelay: `${(idx % 10) * 50}ms` }}
          >
            <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300 ${msg.role === "AI" ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-200" : "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-emerald-200"
              }`}>
              {msg.role === "AI" ? (
                <Bot className="w-4.5 h-4.5 text-white" />
              ) : (
                <User className="w-4.5 h-4.5 text-white" />
              )}
            </div>
            <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === "User" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                <span className="text-[9px] font-bold text-slate-300">{formatTime(msg.createdAt)}</span>
              </div>
              <div className={`px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm backdrop-blur-md ${msg.role === "AI"
                ? "bg-white/90 border border-slate-100 text-slate-700 rounded-tl-sm hover:shadow-md transition-shadow"
                : "bg-indigo-600 border border-indigo-500 text-white rounded-tr-sm shadow-indigo-200/50 hover:shadow-indigo-300/50 hover:bg-indigo-500 transition-all"
                }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-200">
              <Bot className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col gap-1.5 items-start">
              <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/90 border border-slate-100 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative px-6 py-4 border-t border-white/60 bg-white/40 flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message FORS AGENT..."
          className="flex-1 bg-white/80 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
        />
        <button
          onClick={send}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
