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
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm font-semibold text-slate-800">FORS AGENT — Ticket #{ticketId}</span>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "User" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${msg.role === "AI" ? "bg-accent-blue" : "bg-accent-orange"
              }`}>
              {msg.role === "AI" ? (
                <Bot className="w-3.5 h-3.5 text-slate-800" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-800" />
              )}
            </div>
            <div className={`flex flex-col gap-0.5 max-w-[75%] ${msg.role === "User" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{msg.senderName}</span>
                <span className="text-[10px] text-slate-300">{formatTime(msg.createdAt)}</span>
              </div>
              <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === "AI"
                  ? "bg-gray-100 text-slate-800/90"
                  : "bg-accent-blue text-slate-800"
                }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={send}
          className="w-9 h-9 bg-accent-blue rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors shrink-0"
        >
          <Send className="w-4 h-4 text-slate-800" />
        </button>
      </div>
    </div>
  );
}
