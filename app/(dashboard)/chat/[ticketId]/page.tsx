import { notFound } from "next/navigation";
import { getTicketById, getChatMessages } from "@/app/actions";
import { ChatWindow } from "@/components/chat/ChatWindow";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ ticketId: string }>;
}

export default async function ChatDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId);
  const allMessages = await getChatMessages();
  const messages = allMessages.filter((m) => m.ticketId === ticketId);

  if (!ticket) return notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/chat" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-white">Chat — Ticket #{ticket.id}</h2>
          <p className="text-xs text-slate-400">{ticket.title}</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWindow ticketId={ticketId} initialMessages={messages} currentUser="Khaled Ben Nasr" />
      </div>
    </div>
  );
}
