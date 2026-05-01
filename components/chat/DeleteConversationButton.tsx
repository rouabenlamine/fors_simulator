"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { deleteConversationAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface DeleteConversationButtonProps {
  /** The primary key used by the SQL DELETE — targets Conversations.conversation_id */
  conversationId: string;
  /** Human-readable label shown in the confirmation dialog */
  ticketId: string;
}

export function DeleteConversationButton({ conversationId, ticketId }: DeleteConversationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleOpenModal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  }

  function handleClose() {
    if (deleting) return;
    setShowModal(false);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const result = await deleteConversationAction(conversationId);
      if (result.success) {
        setShowModal(false);
        router.push("/chat");
        router.refresh();
      } else {
        setShowModal(false);
        alert(result.error || "Failed to delete conversation");
      }
    } catch (err) {
      console.error("[DeleteConversation]", err);
      setShowModal(false);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpenModal}
        disabled={deleting}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        title="Delete Conversation"
      >
        <Trash2 className={`w-4 h-4 ${deleting ? "animate-pulse" : ""}`} />
      </button>

      {/* Modal - Rendered via Portal to escape CSS transform containing blocks */}
      {showModal && mounted && createPortal(
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Delete Conversation</h3>
                  <p className="text-xs text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={deleting}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Warning banner */}
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed">
                  You are about to permanently delete the conversation for{" "}
                  <span className="font-bold font-mono">Ticket #{ticketId}</span>.
                  All messages will be removed from the database and{" "}
                  <span className="font-semibold">cannot be recovered</span>.
                </p>
              </div>

              {/* Ticket reference card */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] font-black text-slate-600">INC</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversation</p>
                  <p className="text-sm font-bold text-slate-700 font-mono">{ticketId}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={handleClose}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm shadow-red-200 hover:shadow-lg hover:shadow-red-300/50 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Animation */}
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: fadeScaleIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
