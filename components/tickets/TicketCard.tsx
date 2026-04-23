"use client";

import Link from "next/link";
import { ChevronRight, Database } from "lucide-react";
import type { Ticket } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

interface TicketCardProps {
  ticket: Ticket;
  selected?: boolean;
}

export function TicketCard({ ticket, selected }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card
        className={`mb-2 hover:border-blue-200 hover:shadow-sm transition-all ${
          selected ? "border-blue-300 bg-blue-50/50" : ""
        }`}
      >
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">#{ticket.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">{ticket.title}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Database className="w-2.5 h-2.5" />
                  {ticket.category}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-slate-400">{ticket.team}</span>
              {ticket.aiConfidence !== undefined && (
                <span className="text-[10px] text-blue-600 font-medium">{ticket.aiConfidence}%</span>
              )}
              <ChevronRight className="w-3 h-3 text-slate-300 mt-1" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
