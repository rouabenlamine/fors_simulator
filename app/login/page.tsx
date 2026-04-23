"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Hash, Lock, Eye, EyeOff, Users, ShieldAlert, BarChart3 } from "lucide-react";
import type { UserRole } from "@/lib/types";

const ROLE_REDIRECT: Record<string, string> = {
  agent: "/tickets",
  reporter: "/report",
  manager: "/activity",
};

// Only IT roles are allowed on this login page
const ALLOWED_ROLES = ["agent", "reporter", "manager", "it_support", "it_report", "it_manager"];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("agent");
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/fors/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
      } else {
        const userRole: string = data.user?.role;

        // Block admin/superadmin from using this login page
        if (!ALLOWED_ROLES.includes(userRole)) {
          setError("Access denied. Administrative accounts must use the secure admin portal.");
          await fetch("/fors/auth/logout", { method: "POST" });
          return;
        }

        if (userRole !== selectedRole) {
          setError("Invalid role selection.");
          await fetch("/fors/auth/logout", { method: "POST" });
          return;
        }
        router.push(ROLE_REDIRECT[userRole] ?? "/tickets");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const roleTabs = [
    { id: "agent", label: "IT Support", icon: Users },
    { id: "manager", label: "IT Manager", icon: ShieldAlert },
    { id: "reporter", label: "IT Reporter", icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#001e3d] overflow-hidden">

      {/* 1. CUSTOM BACKGROUND IMAGE */}
      <div className="absolute inset-0 pointer-events-none opacity-60 select-none z-0">
        <Image
          src="/world-map.png"
          alt="World Map"
          fill
          priority
          unoptimized
          className="object-contain"
        />
      </div>

      {/* 2. ALIGNED LOGOS & BRANDING LOCKUP */}
      <div className="relative z-20 flex items-center justify-center gap-6 md:gap-12 mb-8 mt-4 w-full">
        {/* IT Hub Logo (Color Restored, Size Matched) */}
        <Image
          src="/it_hub_tunisia.png"
          alt="LEONI IT HUB Tunisia"
          width={170}
          height={120}
          unoptimized
          className="h-10 md:h-[120px] w-auto object-contain"
        />

        {/* Divider (Optional visual separation, transparent) */}
        <div className="h-8 border-l border-white/20 hidden md:block"></div>


        {/* LEONI Word (Size Matched) */}
        <h1 className="text-3xl md:text-[42px] leading-none font-black text-white tracking-tighter select-none flex items-center h-10 md:h-[48px]">
          LEONI
        </h1>



        {/* Divider */}
        <div className="h-8 border-l border-white/20 hidden md:block"></div>
        {/* FORS Abstract Logo (Size Matched) */}
        <Image
          src="/fors_abstract.jpg.png"
          alt="FORS Logo"
          width={100}
          height={100}
          unoptimized
          className="h-10 md:h-[100px] w-auto object-contain rounded-xl "
        />
      </div>


      {/* 3. CENTERED LOGOTYPE */}
      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-white text-xl font-italic uppercase tracking-[0.3em] mb-2 opacity-80">
            FORS Simulator
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-white">
            <span className="bg-[#F26522] px-5 py-3 rounded-full">
              Empowering
            </span>
            <span className="tracking-tight"> connections.</span>
          </div>
        </div>
      </div>

      {/* 5. LOGIN CARD */}
      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20">

        {/* Role Selector Tabs */}
        <div className="flex p-1.5 bg-slate-50/50">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedRole(tab.id as UserRole);
                  setError("");
                }}
                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all duration-300 ${isActive
                  ? "bg-white text-[#001e3d] shadow-md border-b-2 border-[#F26522]"
                  : "text-slate-400 hover:text-slate-500"
                  }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-[#F26522]" : "text-slate-300"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                User Matricule
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  placeholder="ID NUMBER"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-[#F26522]/20 focus:border-[#F26522] outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Access Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-[#F26522]/20 focus:border-[#F26522] outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[11px] font-bold text-red-500 bg-red-50 p-3.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#001e3d] hover:bg-[#00112b] text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs h-[56px]"
            >
              {loading ? "AUTHENTICATING..." : "SECURE LOGIN"}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-10 text-white/20 text-[9px] font-medium uppercase tracking-[0.5em] select-none">
        FORS MODULE &bull; LEONI GROUP &bull; 2026
      </p>
    </div>
  );
}