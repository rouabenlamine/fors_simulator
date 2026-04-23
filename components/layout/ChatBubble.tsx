"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import type { User } from "@/lib/types";
import { usePathname, useSearchParams } from "next/navigation";
import { chatWithGostAction } from "@/app/actions";

interface ChatBubbleProps {
  user?: User;
}

interface Message {
  sender: "user" | "gost";
  content: string;
  time: string;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ user }: ChatBubbleProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Try to determine ticket ID from current page
  const ticketIdFromPath = pathname?.match(/\/tickets\/(INC\d+)/)?.[1];
  const ticketIdFromQuery = pathname?.includes("/lab") ? searchParams?.get("id") : null;
  const currentTicketId = ticketIdFromPath || ticketIdFromQuery || "GENERAL";

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Reset messages when ticket id changes
    setMessages([{
      sender: "gost",
      content: currentTicketId !== "GENERAL"
        ? `Hello! I am the FORS AGENT. Context loaded for Ticket ${currentTicketId}. How can I assist you with this incident?`
        : "Hello! I am the FORS AGENT. How can I assist you today?",
      time: now(),
    }]);
  }, [currentTicketId]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, open]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { sender: "user", content: input, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const gHistory = messages.map(m => ({ role: m.sender === 'gost' ? 'assistant' : 'user', content: m.content }));
      const reply = await chatWithGostAction(currentTicketId, input, gHistory);
      setMessages((prev) => [
        ...prev,
        { sender: "gost", content: reply, time: now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "gost", content: "Service error. Please check if the AI service is running or try again.", time: now() },
      ]);
    } finally {
      setTyping(false);
    }
  }

  const senderInitials = user ? `${user.name[0]}${user.surname[0]}` : "U";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header with gradient */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
              </div>
              <Bot className="w-4 h-4 text-blue-200" />
              <span className="text-sm font-semibold text-white">FORS Agent</span>
              <span className="text-[10px] bg-blue-700/50 text-blue-200 px-1.5 py-0.5 rounded-full ml-1">AI</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 max-h-72 overflow-y-auto bg-slate-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-1.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "gost" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5 max-w-[78%]">
                  <div
                    className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.sender === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-slate-700 rounded-bl-sm shadow-sm"
                      }`}
                    style={msg.sender === "user" ? { background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" } : {}}
                  >
                    {msg.content}
                  </div>
                  <p className={`text-[9px] text-slate-400 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.time}
                  </p>
                </div>
                {msg.sender === "user" && (
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 mb-0.5 text-[8px] font-bold text-white">
                    {senderInitials}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center h-3">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask FORS AGENT anything..."
              className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating action button with bounce + ping ring */}
      <div className="relative">
        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-ping-slow"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.35)" }}
          />
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`relative w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${open ? "" : "animate-float"
            }`}
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}
        >
          <MessageSquare className="w-5 h-5 text-white" />
          {messages.length > 1 && !open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {messages.filter(m => m.sender === "gost").length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
