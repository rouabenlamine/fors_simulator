"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  Ticket, MessageSquare, BarChart3, Activity,
  LogOut, Cpu, Database, FileText, Table, FlaskConical,
  LayoutDashboard, Users, Settings, ChevronRight,
  Search, X, Menu, ArrowRight, Layers, BookOpen, Settings2, ShieldCheck, User as UserIcon, RefreshCw,
} from "lucide-react";
import type { User, UserRole } from "@/lib/types";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getExplorerMenus,
  getExplorerTables,
} from "@/app/actions";
import { useViewPermissions } from "@/contexts/ViewPermissionsContext";
import type { ComponentId } from "@/lib/view-components";

// ─── Component ID mapping for nav items ─────────────────────────────────────
const NAV_COMPONENT_MAP: Record<string, ComponentId> = {
  "/tickets": "tickets_list",
  "/analysis": "incident_analysis",
  "/lab": "analysis_lab",
  "/chat": "chat_bubble",
  "/database": "fors_explorer",
  "/kpis": "kpi_widgets",
  "/activity": "activity_logs",
  "/report": "report_export",
  "/admin/dashboard": "admin_control_panel",
  "/superadmin/dashboard": "admin_control_panel",
  "/admin/users": "user_management",
  "/admin/audit": "audit_logs",
  "/admin/view-control": "view_permissions_management",
  "/admin/sql-console": "system_db_explorer",
  "/admin/kpi-config": "kpi_config",
  "/superadmin/integrations": "integration_hub",
  "/superadmin/database-explorer": "system_db_explorer",
};

// ─── Nav definitions ────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  componentId?: ComponentId;
  sub?: { href: string; label: string }[];
}

const IT_SUPPORT_NAV: NavItem[] = [
  { href: "/tickets", label: "Tickets", icon: Ticket, componentId: "tickets_list" },
  { href: "/analysis", label: "Analysis Workspace", icon: LayoutDashboard, componentId: "incident_analysis" },
  { href: "/lab", label: "Analysis Lab", icon: FlaskConical, componentId: "analysis_lab" },
  { href: "/chat", label: "Chat History", icon: MessageSquare, componentId: "chat_bubble" },
  {
    href: "/database",
    label: "Fors Explorer",
    icon: Layers,
    componentId: "fors_explorer",
    sub: [
      { href: "/database?view=menus", label: "Menus" },
      { href: "/database?view=transactions", label: "Transactions" },
      { href: "/database?view=tables", label: "Tables" },
      { href: "/database?view=fields", label: "Fields" },
      { href: "/database?view=indexes", label: "Indexes" },
    ],
  },
  { href: "/kpis", label: "KPIs & Statistics", icon: BarChart3, componentId: "kpi_widgets" },
  { href: "/activity", label: "Activity Log", icon: Activity, componentId: "activity_logs" },
];

const IT_REPORT_NAV: NavItem[] = [
  { href: "/report", label: "Overview", icon: LayoutDashboard },
  { href: "/kpis", label: "KPIs & Statistics", icon: FileText, componentId: "kpi_widgets" },
  { href: "/activity", label: "Activity Log", icon: Activity, componentId: "activity_logs" },
];

const IT_MANAGER_NAV: NavItem[] = [
  { href: "/activity", label: "Team Activity", icon: Activity, componentId: "activity_logs" },
  { href: "/kpis", label: "Team Performance", icon: BarChart3, componentId: "kpi_widgets" },
  { href: "/users", label: "Team Management", icon: Users, componentId: "user_management" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Control Panel", icon: LayoutDashboard, componentId: "admin_control_panel" },
  { href: "/admin/users", label: "User Management", icon: Users, componentId: "user_management" },
  { href: "/admin/kpi-config", label: "KPI Configuration", icon: Settings2, componentId: "kpi_config" },
  { href: "/admin/audit", label: "Audit Logs", icon: Activity, componentId: "audit_logs" },
  {
    href: "/database",
    label: "Fors Explorer",
    icon: Layers,
    componentId: "fors_explorer",
    sub: [
      { href: "/database?view=menus", label: "Menus" },
      { href: "/database?view=transactions", label: "Transactions" },
      { href: "/database?view=tables", label: "Tables" },
      { href: "/database?view=fields", label: "Fields" },
      { href: "/database?view=indexes", label: "Indexes" },
    ],
  },
  { href: "/admin/view-control", label: "View Permissions", icon: ShieldCheck, componentId: "view_permissions_management" },
  { href: "/superadmin/database-explorer", label: "Database Explorer", icon: Database, componentId: "system_db_explorer" },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/superadmin/dashboard", label: "Control Panel", icon: LayoutDashboard, componentId: "admin_control_panel" },
  { href: "/admin/users", label: "User Management", icon: Users, componentId: "user_management" },
  { href: "/superadmin/integrations", label: "Integration Hub", icon: Cpu, componentId: "integration_hub" },
  { href: "/admin/kpi-config", label: "KPI Configuration", icon: Settings2, componentId: "kpi_config" },
  { href: "/admin/audit", label: "Audit Logs", icon: Activity, componentId: "audit_logs" },
  {
    href: "/database",
    label: "Fors Explorer",
    icon: Database,
    componentId: "fors_explorer",
    sub: [
      { href: "/database?view=menus", label: "Menus" },
      { href: "/database?view=transactions", label: "Transactions" },
      { href: "/database?view=tables", label: "Tables" },
      { href: "/database?view=fields", label: "Fields" },
      { href: "/database?view=indexes", label: "Indexes" },
    ],
  },
  { href: "/admin/view-control", label: "View Permissions", icon: ShieldCheck, componentId: "view_permissions_management" },
  { href: "/superadmin/database-explorer", label: "Database Explorer", icon: Database, componentId: "system_db_explorer" },
];

const ROLE_META: Record<UserRole, { label: string; subtitle: string; accent: string; textAccent: string }> = {
  admin: { label: "LEONI", subtitle: "Admin", accent: "bg-indigo-100", textAccent: "text-indigo-600" },
  superadmin: { label: "LEONI", subtitle: "Superadmin", accent: "bg-rose-100", textAccent: "text-rose-600" },
  user: { label: "LEONI", subtitle: "User", accent: "bg-slate-100", textAccent: "text-slate-600" },
  it_support: { label: "LEONI", subtitle: "IT Support", accent: "bg-blue-100", textAccent: "text-blue-600" },
  it_report: { label: "LEONI", subtitle: "IT Report", accent: "bg-emerald-100", textAccent: "text-emerald-600" },
  it_manager: { label: "LEONI", subtitle: "IT Manager", accent: "bg-violet-100", textAccent: "text-violet-600" },
};

function getNav(role?: string): NavItem[] {
  if (role === "it_report" || role === "user") return IT_REPORT_NAV;
  if (role === "it_manager") return IT_MANAGER_NAV;
  if (role === "admin") return ADMIN_NAV;
  if (role === "superadmin") return SUPER_ADMIN_NAV;
  return IT_SUPPORT_NAV;
}

// ─── Search result type ──────────────────────────────────────────────────────

type SearchResult = {
  type: "menu" | "table" | "transaction" | "field";
  label: string;
  sublabel?: string;
  href: string;
};

// ─── Main Sidebar ────────────────────────────────────────────────────────────

export function Sidebar({ user }: { user?: User }) {
  const role = user?.role;
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const allNavItems = getNav(role);
  const meta = ROLE_META[role as UserRole] ?? ROLE_META["it_support"];
  const { permissions } = useViewPermissions();

  // Filter nav items based on view permissions
  const isSuperadmin = role === "superadmin";
  const navItems = isSuperadmin
    ? allNavItems
    : allNavItems.filter((item) => {
      if (!item.componentId) return true;
      if (!permissions) return true;
      return permissions[item.componentId] !== false;
    });

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Explorer expanded state
  const [explorerOpen, setExplorerOpen] = useState(false);
  useEffect(() => {
    setExplorerOpen(pathname?.startsWith("/database") ?? false);
  }, [pathname]);

  // Pre-fetched data for search
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Close popups on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Lazy-load explorer data when search is first opened
  const ensureData = useCallback(async () => {
    if (dataLoaded) return;
    setSearchLoading(true);
    try {
      const [menus, tables] = await Promise.all([getExplorerMenus(), getExplorerTables()]);
      setAllMenus(menus);
      setAllTables(tables);
      setDataLoaded(true);
    } catch (e) {
      console.error("Search data load failed", e);
    } finally {
      setSearchLoading(false);
    }
  }, [dataLoaded]);

  // Run live search whenever query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    allMenus.forEach((m) => {
      if (m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)) {
        results.push({
          type: "menu",
          label: m.title,
          sublabel: m.description || undefined,
          href: `/database?view=menus&id=${m.id}`,
        });
      }
    });

    allTables.forEach((t) => {
      if (t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        results.push({
          type: "table",
          label: t.name,
          sublabel: t.description || undefined,
          href: `/database?view=tables&table=${encodeURIComponent(t.name)}`,
        });
      }
    });

    setSearchResults(results.slice(0, 12));
  }, [searchQuery, allMenus, allTables]);

  function handleSearchFocus() {
    setSearchOpen(true);
    ensureData();
  }

  function handleResultClick(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  async function handleLogout() {
    const isAdmin = role === "admin" || role === "superadmin";
    try {
      await fetch("/fors/auth/logout", { method: "POST", redirect: "manual" });
    } catch { /* ignore */ }
    window.location.href = isAdmin ? "/admin/login" : "/login";
  }

  const typeIcon: Record<SearchResult["type"], React.ReactNode> = {
    menu: <BookOpen className="w-3.5 h-3.5 text-indigo-400" />,
    table: <Database className="w-3.5 h-3.5 text-emerald-400" />,
    transaction: <Layers className="w-3.5 h-3.5 text-violet-400" />,
    field: <Menu className="w-3.5 h-3.5 text-amber-400" />,
  };

  function NavGroup({ section, items }: { section: string; items: NavItem[] }) {
    return (
      <div>
        <p className="px-3 mb-1.5 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{section}</p>
        <nav className="space-y-0.5">
          {items.map(({ href, label, icon: Icon, sub }) => {
            const pathBase = href.split("?")[0];
            const isPathActive = pathname
              ? pathname === pathBase || pathname.startsWith(pathBase + "/")
              : false;
            const isOpen = href.includes("database") ? (explorerOpen || isPathActive) : false;

            return (
              <div key={href}>
                <div
                  className={clsx(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer group relative",
                    isPathActive
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  )}
                  onClick={() =>
                    href.includes("database") && sub
                      ? setExplorerOpen(!explorerOpen)
                      : router.push(href)
                  }
                >
                  {isPathActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-400" />
                  )}
                  <span className={clsx(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isPathActive ? "bg-white/15" : "bg-transparent group-hover:bg-white/10"
                  )}>
                    <Icon className={clsx(
                      "w-3.5 h-3.5",
                      isPathActive ? "text-indigo-300" : "text-white/40 group-hover:text-white/70"
                    )} />
                  </span>
                  <span className="flex-1 truncate">{label}</span>
                  {sub && (
                    <ChevronRight className={clsx(
                      "w-3 h-3 text-white/20 transition-transform duration-200 shrink-0",
                      isOpen && "rotate-90"
                    )} />
                  )}
                </div>

                {/* Sub items */}
                {isOpen && sub && (
                  <div className="ml-[2.375rem] mt-0.5 mb-1 space-y-0.5 pl-3 border-l-2 border-white/10">
                    {sub.map((s) => {
                      const subView = s.href.split("view=")[1]?.split("&")[0];
                      const isSubActive = !!(
                        subView &&
                        searchParamsHook?.get("view") === subView &&
                        pathname?.startsWith("/database")
                      );
                      return (
                        <Link
                          key={s.href}
                          href={s.href}
                          className={clsx(
                            "block py-1.5 px-2 text-xs font-semibold rounded-lg transition-all",
                            isSubActive
                              ? "text-indigo-300 bg-white/10"
                              : "text-white/30 hover:text-white/70 hover:bg-white/5"
                          )}
                        >
                          {s.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    );
  }

  const dbItems = navItems.filter(i => i.href.includes("database") || i.componentId === "system_db_explorer");
  const adminItems = navItems.filter(i => !dbItems.includes(i) && (i.href.includes("admin") || i.href.includes("superadmin")));
  const mainItems = navItems.filter(i => !dbItems.includes(i) && !adminItems.includes(i));


  return (
    <aside
      className="w-64 flex flex-col h-screen fixed left-0 top-0 z-30 overflow-hidden border-r border-white/10 shadow-2xl"
      style={{ background: "#060D18" }}
    >
      {/* ─── High-Visibility Abstract Wave Pattern ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full opacity-40"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-20,0 Q10,25 40,50 T120,100"
            stroke="url(#wave-vibrant)"
            strokeWidth="1.5"
            className="animate-[pulse_6s_ease-in-out_infinite]"
          />
          <path
            d="M-10,0 Q20,25 50,50 T130,100"
            stroke="url(#wave-vibrant)"
            strokeWidth="1.2"
            className="animate-[pulse_8s_ease-in-out_infinite] opacity-70"
          />
          <path
            d="M0,0 Q30,25 60,50 T140,100"
            stroke="url(#wave-vibrant)"
            strokeWidth="1"
            className="animate-[pulse_10s_ease-in-out_infinite] opacity-50"
          />

          <defs>
            <linearGradient id="wave-vibrant" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <radialGradient id="corner-glow" cx="0" cy="0" r="1">
              <stop stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#corner-glow)" />
        </svg>

        {/* Additional Glow Overlays */}
        <div className="absolute top-0 left-0 w-full h-64 bg-indigo-500/10 blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-violet-500/10 blur-[80px]" />
      </div>

      {/* Top accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500 via-violet-400 to-transparent z-10" />

      {/* ── Brand Section ────────────────────────────────────────── */}
      <div className="relative px-5 pt-6 pb-5 flex items-center gap-3 border-b border-white/5">
        <img
          src="/purpleFors.png"
          alt="FORS Logo"
          className="w-14 h-14 object-contain rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] shrink-0 transition-transform duration-500 hover:scale-105"
        />
        <div>
          <h1 className="text-[15px] font-black text-white tracking-tight leading-none">
            FORS <span className="text-indigo-400">Simulator</span>
          </h1>
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] mt-0.5">
            Enterprise Solution
          </p>
        </div>
      </div>

      {/* ── Global Search ────────────────────────────────────────── */}
      <div className="relative px-4 py-3 border-b border-white/5" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            placeholder="Search system…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-7 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:bg-white/8 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {searchOpen && (searchQuery.trim() || searchLoading) && (
          <div className="absolute left-4 right-4 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            {searchLoading && !dataLoaded ? (
              <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Indexing components…
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="px-4 py-3 text-xs text-slate-400">
                No matches for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleResultClick(r.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                      {typeIcon[r.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {r.label}
                      </p>
                      {r.sublabel && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.sublabel}</p>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Nav Section ──────────────────────────────────────────── */}
      <div className="relative flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {mainItems.length > 0 && (
          <NavGroup section="Main Console" items={mainItems} />
        )}
        {dbItems.length > 0 && (
          <NavGroup section="Exploration" items={dbItems} />
        )}
        {adminItems.length > 0 && (
          <NavGroup section="System Admin" items={adminItems} />
        )}
      </div>

      {/* ── Footer / User Section ────────────────────────────────── */}
      <div className="relative px-3 py-3 border-t border-white/5">
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 hover:bg-white/10 hover:border-white/15 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0 bg-gradient-to-br from-indigo-400 to-violet-500">
                {user.name?.[0]}{user.surname?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white/90 truncate">
                  {user.name} {user.surname}
                </p>
                <p className={clsx("text-[9px] font-black uppercase tracking-widest", meta.textAccent)}>
                  {meta.subtitle}
                </p>
              </div>
              <ChevronRight className={clsx(
                "w-3.5 h-3.5 text-white/25 transition-transform shrink-0",
                profileOpen && "rotate-90"
              )} />
            </button>

            {/* Profile Dropdown — full user data */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-[#0D1F38] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                    {user.name?.[0]}{user.surname?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-white truncate">{user.name} {user.surname}</p>
                    <p className={clsx("text-[9px] font-black uppercase tracking-widest", meta.textAccent)}>{meta.subtitle}</p>
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  {/* Matricule */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest w-16 shrink-0">Matricule</span>
                    <span className="text-[11px] font-mono font-bold text-white/80 truncate">{user.matricule || "—"}</span>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest w-16 shrink-0">Email</span>
                    <span className="text-[11px] font-bold text-white/80 truncate">{user.email || "—"}</span>
                  </div>
                  {/* Role */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest w-16 shrink-0">Role</span>
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">{user.role || "—"}</span>
                  </div>
                  {/* Site */}
                  {(user as any).site && (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest w-16 shrink-0">Site</span>
                      <span className="text-[11px] font-bold text-white/80 truncate">{(user as any).site}</span>
                    </div>
                  )}

                  <div className="pt-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.14); }
      `}</style>
    </aside>
  );
}
