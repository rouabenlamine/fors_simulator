"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell, X, CheckCircle, AlertCircle, Info, Clock,
  ExternalLink, Sparkles, CheckCheck,
} from "lucide-react";
import type { User } from "@/lib/types";
import type { RolePermissions } from "@/lib/view-components";
import { getNotificationsAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface HeaderProps {
  title?: string;
  user?: User;
  viewPermissions?: RolePermissions | null;
}

const notifConfig = {
  alert:   { icon: AlertCircle,   color: "text-rose-500",   bg: "bg-rose-50",   bar: "bg-rose-400",   ring: "ring-rose-100"   },
  success: { icon: CheckCircle,   color: "text-emerald-500",bg: "bg-emerald-50",bar: "bg-emerald-400",ring: "ring-emerald-100"},
  info:    { icon: Info,          color: "text-sky-500",    bg: "bg-sky-50",    bar: "bg-sky-400",    ring: "ring-sky-100"    },
  warning: { icon: Clock,         color: "text-amber-500",  bg: "bg-amber-50",  bar: "bg-amber-400",  ring: "ring-amber-100"  },
};

export function Header({ title, user, viewPermissions }: HeaderProps) {
  const router = useRouter();
  const showNotifications = Boolean(user && user.role === "it_support");

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<any>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dismissed_notifications");
      if (stored) setDismissedIds(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    async function fetchNotifs() {
      try {
        const data = await getNotificationsAction();
        const allFetched = data.map((n: any) => ({
          ...n,
          id: n.linkId + n.timestamp + n.type,
          read: false,
          time: new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));

        const filtered = allFetched.filter((n: any) => !dismissedIds.includes(n.id));

        if (allFetched.length > 0) {
          const absoluteLatest = allFetched[0];
          if (lastNotifId && absoluteLatest.id !== lastNotifId && !dismissedIds.includes(absoluteLatest.id)) {
            setShowToast(absoluteLatest);
            setTimeout(() => setShowToast(null), 8000);
          }
          setLastNotifId(absoluteLatest.id);
        }

        setNotifications(filtered);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3000); // 3s for "real-time" feel
    return () => clearInterval(interval);
  }, [showNotifications, lastNotifId, dismissedIds]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <header className="absolute top-0 right-0 h-16 flex items-center justify-end px-6 z-30 pointer-events-none">
      {showNotifications && (
        <div className="flex items-center gap-3 pointer-events-auto">

          {/* ── Notification Bell ──────────────────────────────── */}
          <div className="relative" ref={notifRef}>
            <button
              id="notification-bell"
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className={clsx(
                "relative w-10 h-10 flex items-center justify-center rounded-2xl border transition-all duration-200 shadow-sm group",
                notifOpen
                  ? "bg-indigo-600 border-indigo-600 shadow-indigo-200"
                  : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
              )}
              title="Notifications"
            >
              <Bell className={clsx(
                "w-4 h-4 transition-all",
                notifOpen ? "text-white" : "text-slate-500 group-hover:text-indigo-500"
              )} />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center ring-2 ring-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {/* Pulse ring for new items */}
              {unreadCount > 0 && !notifOpen && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 opacity-40 animate-ping" />
              )}
            </button>

            {/* ── Dropdown Panel ─────────────────────────────── */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-sm font-black text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-600">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center gap-2">
                      <Sparkles className="w-6 h-6 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">All caught up!</p>
                      <p className="text-xs text-slate-300">No pending notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const cfg = notifConfig[n.type as keyof typeof notifConfig] ?? notifConfig.info;
                      const NotifIcon = cfg.icon;
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            router.push(`/tickets/${n.linkId}`);
                            setNotifOpen(false);
                          }}
                          className={clsx(
                            "px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative",
                            !n.read && "bg-indigo-50/30"
                          )}
                        >
                          {/* Left color bar */}
                          <span className={clsx("absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full", cfg.bar)} />

                          {/* Icon */}
                          <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset",
                            cfg.bg, cfg.ring
                          )}>
                            <NotifIcon className={clsx("w-4 h-4", cfg.color)} />
                          </div>

                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={clsx(
                                "text-xs font-bold truncate",
                                !n.read ? "text-slate-800" : "text-slate-600"
                              )}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                                className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                                View ticket <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      LIVE Sync Active · n8n Real-time
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Global Toast ─────────────────────────────────────────── */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-8 duration-300 pointer-events-auto"
          onClick={() => {
            router.push(`/tickets/${showToast.linkId}`);
            setShowToast(null);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 p-4 flex items-start gap-3 max-w-xs cursor-pointer hover:shadow-indigo-100 hover:border-indigo-200 transition-all group">
            {(() => {
              const cfg = notifConfig[showToast.type as keyof typeof notifConfig] ?? notifConfig.info;
              const NotifIcon = cfg.icon;
              return (
                <>
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <NotifIcon className={clsx("w-4.5 h-4.5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      New Event Detected
                    </p>
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {showToast.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {showToast.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowToast(null); }}
                    className="text-slate-300 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </header>
  );
}
