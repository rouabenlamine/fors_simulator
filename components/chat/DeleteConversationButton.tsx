"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteConversationAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface DeleteConversationButtonProps {
  /** The primary key used by the SQL DELETE — targets Conversations.conversation_id */
  conversationId: string;
  /** Human-readable label shown in the confirmation dialog */
  ticketId: string;
}

export function DeleteConversationButton({ conversationId, ticketId }: DeleteConversationButtonProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete conversation for Ticket #${ticketId}?\n\nThis will permanently remove all messages from the database.`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteConversationAction(conversationId);
      if (result.success) {
        // Navigate back to the chat history list so the deleted entry disappears
        router.push("/chat");
        router.refresh();
      } else {
        alert(result.error || "Failed to delete conversation");
      }
    } catch (err) {
      console.error("[DeleteConversation]", err);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      title="Delete Conversation"
    >
      <Trash2 className={`w-4 h-4 ${deleting ? "animate-pulse" : ""}`} />
    </button>
  );
}
