"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, User as UserIcon, ExternalLink } from "lucide-react";
import type { User } from "@/lib/types";
import type { RolePermissions } from "@/lib/view-components";
import { getNotificationsAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  user?: User;
  viewPermissions?: RolePermissions | null;
}

const notifIcon = {
  alert: <AlertCircle className="w-4 h-4 text-red-500" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
  warning: <Clock className="w-4 h-4 text-amber-500" />,
};

export function Header({ title, user, viewPermissions }: HeaderProps) {
  const router = useRouter();
  // Notifications ONLY for IT Support / Agent roles
  const showNotifications = Boolean(user && (user.role === "agent" || user.role === "it_support"));

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<any>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!showNotifications) return;

    async function fetchNotifs() {
      try {
        const data = await getNotificationsAction();
        // Format relative time
        const enriched = data.map((n: any) => ({
          ...n,
          id: n.linkId + n.timestamp + n.type, // Unique key
          read: false, // For now keep it simple
          time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        setNotifications(enriched);

        // Toast logic for brand new notification
        if (enriched.length > 0) {
          const latest = enriched[0];
          if (lastNotifId && latest.id !== lastNotifId) {
            setShowToast(latest);
            setTimeout(() => setShowToast(null), 5000);
          }
          setLastNotifId(latest.id);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000); // 20s polling
    return () => clearInterval(interval);
  }, [showNotifications, lastNotifId]);

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
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const initials = user ? `${user.name?.[0] || ""}${user.surname?.[0] || ""}`.toUpperCase() || "U" : "?";
  const displayName = user ? `${user.name} ${user.surname || ""}`.trim() : null;
  const displayRole = user ? user.role.replace("_", " ") : null;

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
      {/* Page title — only shown when explicitly provided */}
      {title ? (
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      ) : (
        <div /> /* spacer so right-side controls stay right-aligned */
      )}

      <div className="flex items-center gap-3">
        {/* Notification Bell — conditionally shown via agent role */}
        {showNotifications && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-slate-800">IT Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">No new tickets or updates.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          router.push(`/tickets/${n.linkId}`);
                          setNotifOpen(false);
                        }}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${n.type === 'alert' ? 'border-red-500' : 'border-blue-500'
                          } ${!n.read ? "bg-blue-50/20" : ""}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notifIcon[n.type as keyof typeof notifIcon]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs font-bold truncate ${!n.read ? "text-slate-800" : "text-slate-600"}`}>
                              {n.title}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              className="shrink-0 text-slate-300 hover:text-slate-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">{n.message}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[10px] text-slate-400 font-medium">{n.time}</p>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                              View <ExternalLink className="w-2 h-2" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Info with Profile Dropdown */}
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-2.5 pl-3 border-l border-gray-100 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shadow-lg shadow-blue-500/20 shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">{displayName}</p>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{displayRole}</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">My Profile</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matricule</span>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{user.matricule}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</span>
                    <span className="text-xs font-bold text-slate-800">{user.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Surname</span>
                    <span className="text-xs font-bold text-slate-800">{user.surname || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[12px] font-bold text-slate-400">
              ?
            </div>
          </div>
        )}
      </div>

      {/* Global Toast for new items */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-300"
          onClick={() => {
            router.push(`/tickets/${showToast.linkId}`);
            setShowToast(null);
          }}
        >
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-white/10 flex items-start gap-4 max-w-xs cursor-pointer hover:scale-105 transition-transform group">
            <div className={`mt-1 p-2 rounded-xl ${showToast.type === 'alert' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
              {notifIcon[showToast.type as keyof typeof notifIcon]}
            </div>
            <div className="flex-1 pr-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">New Event Detected</p>
              <h4 className="text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{showToast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{showToast.message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowToast(null); }}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
