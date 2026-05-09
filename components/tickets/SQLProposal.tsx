"use client";

import { Terminal, Shield, Copy, Check, Code2 } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

interface SQLProposalProps {
  sql: string;
}

export function SQLProposal({ sql }: SQLProposalProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-[#0A1628] rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Code2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em]">Script_Output.sql</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className={clsx(
              "text-[8px] font-black uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border",
              copied
                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30"
                : "bg-white/5 text-indigo-300 hover:text-white border-white/10 hover:border-white/20 shadow-lg"
            )}
          >
            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            {copied ? "COPIED" : "CLONE"}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="relative group/code">
          <div className="absolute top-2.5 left-3 flex gap-1 opacity-30 group-hover/code:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <pre className="text-[11px] text-indigo-100 font-mono font-bold bg-black/40 rounded-xl p-6 pt-8 overflow-x-auto leading-relaxed border border-white/5 shadow-inner custom-scrollbar min-h-[80px] selection:bg-indigo-500/30">
            {sql}
          </pre>
        </div>
      </div>
    </div>
  );
}
