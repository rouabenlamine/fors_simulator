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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">SQL Solution</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              <span>DBA approval required</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-[11px] flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <pre className="text-xs text-emerald-400 font-mono bg-gray-900 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap border border-gray-800 shadow-inner">
          {sql}
        </pre>
      </CardBody>
    </Card>
  );
}
