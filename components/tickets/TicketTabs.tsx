"use client";

import { clsx } from "clsx";
import type { TicketStatus } from "@/lib/types";

type TabKey = "all" | TicketStatus;

interface TicketTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  counts: Record<TabKey, number>;
}

const tabs: { key: TabKey; label: string; dot: string; activeBg: string; activeText: string; activeBadge: string }[] = [
  { key: "all",               label: "All",              dot: "bg-indigo-500",  activeBg: "bg-indigo-50",  activeText: "text-indigo-700",  activeBadge: "bg-indigo-600 text-white"  },
  { key: "pending",          label: "Pending",          dot: "bg-amber-400",   activeBg: "bg-amber-50",   activeText: "text-amber-700",   activeBadge: "bg-amber-500 text-white"   },
  { key: "analysis_pending", label: "Pending Analysis", dot: "bg-indigo-400",  activeBg: "bg-indigo-50",  activeText: "text-indigo-700",  activeBadge: "bg-indigo-500 text-white"  },
  { key: "validated",        label: "Validated",        dot: "bg-emerald-400", activeBg: "bg-emerald-50", activeText: "text-emerald-700", activeBadge: "bg-emerald-500 text-white" },
  { key: "rejected",         label: "Rejected",         dot: "bg-rose-400",    activeBg: "bg-rose-50",    activeText: "text-rose-700",    activeBadge: "bg-rose-500 text-white"    },
  { key: "closed",           label: "Closed",           dot: "bg-green-400",   activeBg: "bg-green-50",   activeText: "text-green-700",   activeBadge: "bg-green-500 text-white"   },
  { key: "canceled",         label: "Canceled",         dot: "bg-slate-300",   activeBg: "bg-slate-50",   activeText: "text-slate-500",   activeBadge: "bg-slate-400 text-white"   },
];

export function TicketTabs({ active, onChange, counts }: TicketTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
      {tabs.map(({ key, label, dot, activeBg, activeText, activeBadge }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
              isActive
                ? `${activeBg} ${activeText} shadow-sm ring-1 ring-inset ring-black/5`
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/80"
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", isActive ? dot : "bg-slate-300")} />
            {label}
            <span
              className={clsx(
                "px-1.5 py-0.5 rounded-md text-[9px] font-black transition-colors min-w-[18px] text-center",
                isActive ? activeBadge : "bg-slate-100 text-slate-400"
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
