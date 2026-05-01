"use client";

import { Code2, Shield, Copy } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { useState } from "react";

interface SQLProposalProps {
  sql: string;
}

export function SQLProposal({ sql }: SQLProposalProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl rounded-[1.5rem] border border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-black text-white tracking-tight">SQL Solution</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              <span>DBA approval required</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
      <div className="p-5 relative z-10">
        <pre className="text-[13px] text-indigo-200 font-mono font-medium bg-slate-950/50 rounded-xl p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner">
          {sql}
        </pre>
      </div>
    </div>
  );
}
