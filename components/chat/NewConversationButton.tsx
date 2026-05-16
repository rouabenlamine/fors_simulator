"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquarePlus, X, Ticket as TicketIcon, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewConversationButton({ userMatricule }: { userMatricule?: string }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [ticketId, setTicketId] = useState("INC");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showModal]);

  function handleStart() {
    const trimmed = ticketId.trim();
    if (!trimmed) {
      setError("Please enter an INC ticket number.");
      return;
    }
    setShowModal(false);
    setError("");
    const sidPrefix = userMatricule ? `/s/${userMatricule}` : "";
    router.push(`${sidPrefix}/chat/${trimmed}`);
  }

  function handleClose() {
    setShowModal(false);
    setTicketId("INC");
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
      >
        <MessageSquarePlus className="w-4 h-4" />
        New Conversation
      </button>

      {/* Professional Modal (Section 5) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <MessageSquarePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">New Conversation</h3>
                  <p className="text-xs text-slate-400">Start a conversation with FORS ASSISTANT</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  INC Ticket Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <TicketIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={inputRef}
                    value={ticketId}
                    onChange={(e) => {
                      setTicketId(e.target.value.toUpperCase());
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    placeholder="e.g. INC0012345"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter the incident reference number to link this conversation.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm shadow-blue-200 hover:shadow-lg hover:shadow-blue-300/50 transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation CSS */}
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: fadeScaleIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
