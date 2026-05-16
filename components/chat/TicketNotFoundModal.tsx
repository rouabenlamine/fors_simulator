"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function TicketNotFoundModal({ ticketId, userMatricule }: { ticketId: string, userMatricule?: string }) {
  const router = useRouter();
  const sidPrefix = userMatricule ? `/s/${userMatricule}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={() => router.push(`${sidPrefix}/chat`)} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Ticket Not Found</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
              We couldn't find a ticket with ID <span className="text-indigo-500">#{ticketId}</span>. It may have been deleted or the ID might be incorrect.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push(`${sidPrefix}/chat`)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Chat History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
