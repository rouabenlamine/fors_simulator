"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, Hash } from "lucide-react";
import type { User } from "@/lib/types";
import { usePathname, useSearchParams } from "next/navigation";
import { chatWithGostAction } from "@/app/actions";

interface ChatBubbleProps {
  user?: User;
}

interface Message {
  sender: "user" | "gost" | "system";
  content: string;
  time: string;
}

const STORAGE_KEY = "gost_chat_state";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function extractIncidentNumber(text: string): string | null {
  const match = text.match(/\b(INC\d{4,})\b/i);
  return match ? match[1].toUpperCase() : null;
}

function loadPersistedState(): {
  messages: Message[];
  activeTicketId: string;
  detectedTicket: string | null;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistState(
  messages: Message[],
  activeTicketId: string,
  detectedTicket: string | null
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, activeTicketId, detectedTicket })
    );
  } catch {}
}

export function ChatBubble({ user }: ChatBubbleProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Derive ticket from URL
  const ticketIdFromPath = pathname?.match(/\/tickets\/(INC\d+)/)?.[1];
  const ticketIdFromQuery = pathname?.includes("/lab") ? searchParams?.get("id") : null;
  const pageTicketId = ticketIdFromPath || ticketIdFromQuery || null;

  // State — initialised to empty; hydrated from localStorage in useEffect
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string>("GENERAL");
  const [detectedTicket, setDetectedTicket] = useState<string | null>(null);

  // ── Hydrate from localStorage once on mount ──────────────────────────────
  useEffect(() => {
    const saved = loadPersistedState();
    if (saved && saved.messages.length > 0) {
      setMessages(saved.messages);
      setActiveTicketId(saved.activeTicketId);
      setDetectedTicket(saved.detectedTicket);
    } else {
      // First launch — seed a welcome message
      const welcome: Message = {
        sender: "gost",
        content: pageTicketId
          ? `Hello! Context loaded for Ticket ${pageTicketId}. How can I assist you?`
          : "Hello! I am the FORS AGENT. Mention an INC number to link a ticket, or ask me anything.",
        time: now(),
      };
      setMessages([welcome]);
      setActiveTicketId(pageTicketId || "GENERAL");
      setDetectedTicket(pageTicketId);
    }
    setHydrated(true);
  }, []); // run once only

  // ── Persist to localStorage whenever state changes (after hydration) ──────
  useEffect(() => {
    if (!hydrated) return;
    persistState(messages, activeTicketId, detectedTicket);
  }, [messages, activeTicketId, detectedTicket, hydrated]);

  // ── Handle page navigation — switch context WITHOUT wiping history ─────────
  const prevPageTicketId = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (!pageTicketId) return; // navigated to non-ticket page — keep context
    if (pageTicketId === prevPageTicketId.current) return; // same ticket, no change
    if (pageTicketId === activeTicketId) return; // already on this ticket

    prevPageTicketId.current = pageTicketId;
    setActiveTicketId(pageTicketId);
    setDetectedTicket(pageTicketId);

    // Add a system context-switch notice instead of clearing messages
    setMessages((prev) => [
      ...prev,
      {
        sender: "system",
        content: `— Context switched to Ticket ${pageTicketId} —`,
        time: now(),
      },
    ]);
  }, [pageTicketId, hydrated, activeTicketId]);

  // ── Scroll to bottom when messages change or chat opens ──────────────────
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, open]);

  const send = useCallback(async () => {
    if (!input.trim()) return;

    // Auto-detect INC mention and link conversation
    const mentionedInc = extractIncidentNumber(input);
    let resolvedTicketId = activeTicketId;

    if (mentionedInc && mentionedInc !== activeTicketId) {
      resolvedTicketId = mentionedInc;
      setActiveTicketId(mentionedInc);
      setDetectedTicket(mentionedInc);
      setMessages((prev) => [
        ...prev,
        {
          sender: "system",
          content: `— Ticket ${mentionedInc} detected. Conversation linked. —`,
          time: now(),
        },
      ]);
    }

    const userMsg: Message = { sender: "user", content: input, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const gHistory = messages
        .filter((m) => m.sender !== "system")
        .map((m) => ({
          role: m.sender === "gost" ? "assistant" : "user",
          content: m.content,
        }));
      const reply = await chatWithGostAction(resolvedTicketId, input, gHistory);
      setMessages((prev) => [...prev, { sender: "gost", content: reply, time: now() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "gost",
          content: "Service error. Please check if the AI service is running.",
          time: now(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }, [input, activeTicketId, messages]);

  const clearHistory = useCallback(() => {
    const fresh: Message = {
      sender: "gost",
      content: detectedTicket
        ? `New session started for Ticket ${detectedTicket}.`
        : "New session started. Mention an INC number to link a ticket.",
      time: now(),
    };
    setMessages([fresh]);
  }, [detectedTicket]);

  const senderInitials = user ? `${user.name[0]}${user.surname[0]}` : "U";

  // Don't render until hydrated (avoids SSR/CSR mismatch)
  if (!hydrated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
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
            <div className="flex items-center gap-2">
              {detectedTicket && (
                <span className="flex items-center gap-1 text-[9px] bg-emerald-600/80 text-white px-2 py-0.5 rounded-full font-bold">
                  <Hash className="w-2.5 h-2.5" />
                  {detectedTicket}
                </span>
              )}
              {/* Clear history button */}
              <button
                onClick={clearHistory}
                title="Clear conversation"
                className="text-blue-300/70 hover:text-white transition-colors text-[10px] font-semibold px-1.5 py-0.5 rounded hover:bg-white/10"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-blue-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 max-h-72 overflow-y-auto bg-slate-50">
            {messages.map((msg, i) => {
              if (msg.sender === "system") {
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">{msg.content}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className={`flex items-end gap-1.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "gost" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}
                    >
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 max-w-[78%]">
                    <div
                      className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-white border border-gray-200 text-slate-700 rounded-bl-sm shadow-sm"
                      }`}
                      style={
                        msg.sender === "user"
                          ? { background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" }
                          : {}
                      }
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
              );
            })}

            {typing && (
              <div className="flex items-end gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}
                >
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
              placeholder={
                detectedTicket
                  ? `Ask about ${detectedTicket}...`
                  : "Ask or type an INC number..."
              }
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

      {/* Floating button */}
      <div className="relative">
        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-ping-slow"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.35)" }}
          />
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${open ? "" : "animate-float"}`}
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}
        >
          <MessageSquare className="w-5 h-5 text-white" />
          {messages.filter((m) => m.sender === "gost").length > 1 && !open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {messages.filter((m) => m.sender === "gost").length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
