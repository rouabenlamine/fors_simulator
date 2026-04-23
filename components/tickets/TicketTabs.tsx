"use client";

import { clsx } from "clsx";
import type { TicketStatus } from "@/lib/types";

type TabKey = "all" | TicketStatus;

interface TicketTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  counts: Record<TabKey, number>;
}

const tabs: { key: TabKey; label: string; color?: string }[] = [
  { key: "all",          label: "All" },
  { key: "pending",      label: "Pending",      color: "#f97316" },
  { key: "canceled",     label: "Canceled",     color: "#6b7280" },
  { key: "closed",       label: "Closed",       color: "#22c55e" },
];

export function TicketTabs({ active, onChange, counts }: TicketTabsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tabs.map(({ key, label, color }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              isActive
                ? "text-white shadow-sm"
                : "bg-gray-100 text-slate-600 hover:bg-gray-200 hover:text-slate-800"
            )}
            style={isActive ? { backgroundColor: color ?? "#2563eb" } : {}}
          >
            {label}
            <span
              className={clsx(
                "px-1.5 py-0 rounded text-[10px] font-bold min-w-[18px] text-center",
                isActive ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-gray-200"
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
