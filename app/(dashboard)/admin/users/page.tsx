"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  Users, UserPlus, Shield, Pencil, Trash2, Power, X,
  Search, Check, AlertTriangle, Download, RefreshCcw,
  ChevronLeft, ChevronRight, Mail, Key, Hash, Activity, ChevronDown, Loader2, Lock, Unlock
} from "lucide-react";
import {
  getAdminUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  toggleUserActiveAction,
  getMyRoleAction,
} from "@/app/actions/admin-actions";
import { ROLE_OPTIONS } from "@/lib/constants";

type DBUser = {
  matricule: string; name: string; surname: string; username: string;
  email: string; role: string; is_active: number; created_at: string;
};

const ROLES = ROLE_OPTIONS;

export default function AdminUsersPage() {
  const [myRole, setMyRole] = useState<string>("user");
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [form, setForm] = useState({ matricule: "", name: "", surname: "", username: "", email: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([getAdminUsersAction(), getMyRoleAction()]);
      setUsers(u);
      setMyRole(r);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.matricule.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.surname?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openCreate() {
    setEditUser(null);
    setForm({ matricule: "", name: "", surname: "", username: "", email: "", password: "", role: "it_support" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: DBUser) {
    setEditUser(u);
    setForm({ matricule: u.matricule, name: u.name, surname: u.surname || "", username: u.username || "", email: u.email || "", password: "", role: u.role });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      if (editUser) {
        await updateUserAction(editUser.matricule, {
          name: form.name, surname: form.surname, username: form.username,
          email: form.email, role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        if (!form.matricule || !form.name || !form.password) { setError("Matricule, Name, and Password are required."); setSaving(false); return; }
        await createUserAction({ matricule: form.matricule, name: form.name, surname: form.surname, username: form.username, email: form.email, password: form.password, role: form.role });
      }
      setShowModal(false);
      await load();
    } catch (e: any) { setError(e.message || "Failed."); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteUserAction(deleteTarget); setDeleteTarget(null); await load(); } catch (e: any) { alert(e.message); }
    setDeleting(false);
  }

  async function handleToggle(matricule: string) {
    try { await toggleUserActiveAction(matricule); await load(); } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="w-full space-y-6 py-6 px-8 animate-in fade-in duration-500">

      {/* Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight">
              User <span className="text-indigo-500">Management</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control access and accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-violet-500 text-white px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-violet-700 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", val: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Active Now", val: users.filter(u => u.is_active).length, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Internal Admin", val: users.filter(u => ["admin", "superadmin"].includes(u.role)).length, icon: Shield, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Deactivated", val: users.filter(u => !u.is_active).length, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
        ].map((s, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
              <s.icon className={clsx("w-4 h-4", s.color)} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <span className="text-xl font-black text-slate-800 tracking-tighter">{s.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-50/40 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/60 overflow-hidden">

        {/* Filters Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {["all", ...ROLES.filter(r => myRole === "superadmin" || !["admin", "superadmin"].includes(r))].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={clsx(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border whitespace-nowrap",
                  roleFilter === r
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200"
                )}
              >
                {r === "all" ? "All Accounts" : r.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search directory..."
              className="bg-slate-50/50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all w-full xl:w-72"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-16">No</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Matricule</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-[9px] animate-pulse">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[9px]">No matching profiles found</td></tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr
                    key={user.matricule}
                    className="group hover:bg-indigo-50/50 even:bg-slate-50/50 transition-all cursor-pointer"
                    onClick={() => openEdit(user)}
                  >
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-300">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-tight">
                        {user.matricule}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[180px]">
                        <p className="text-[11px] font-black text-slate-800 whitespace-normal leading-tight group-hover:text-indigo-600 transition-colors">{user.name} {user.surname}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 lowercase">@{user.username || "unset"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-bold lowercase">{user.email || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <span className={clsx(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                          user.is_active
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {user.is_active ? "Active" : "Deactivated"}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200 shadow-sm"
                            title="Edit Profile"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(user.matricule); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 shadow-sm"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="w-8 h-8 flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggle(user.matricule); }}
                              className={clsx(
                                "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shadow-sm",
                                user.is_active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-300 hover:bg-slate-400"
                              )}
                              title={user.is_active ? "Deactivate User" : "Activate User"}
                            >
                              <span
                                className={clsx(
                                  "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                  user.is_active ? "translate-x-3" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


      </div>

      {/* Create/Edit User Modal */}
      {showModal && mounted && createPortal(
        <div
          className="fixed inset-0 left-64 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/40 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                  {editUser ? <Pencil className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">
                    {editUser ? "Update Profile" : "Create Account"}
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all active:scale-90 group">
                <X className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Shield className="w-2.5 h-2.5 text-indigo-500" /> Matricule
                  </label>
                  <input value={form.matricule} onChange={e => setForm({ ...form, matricule: e.target.value })} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Shield className="w-2.5 h-2.5 text-indigo-500" /> Role
                  </label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none appearance-none cursor-pointer">
                    {["it_support", "it_report", "it_manager", "admin", "superadmin"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                  <input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserPlus className="w-2.5 h-2.5 text-indigo-500" /> Username
                  </label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail className="w-2.5 h-2.5 text-indigo-500" /> Email
                  </label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Key className="w-2.5 h-2.5 text-indigo-500" /> Password
                </label>
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" placeholder="••••••••" className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
                {editUser && <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 ml-1">Leave blank to retain current key</p>}
              </div>

              {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl flex items-center gap-2 animate-in shake duration-300"><AlertTriangle className="w-3 h-3 shrink-0" /> {error}</div>}
            </div>

            <div className="p-5 flex items-center justify-end gap-4 bg-slate-50/50 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? "Processing..." : editUser ? "Update Profile" : "Finalize Account"}
              </button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal")!
      )}

      {/* Delete Alert (Full Page Blur) */}
      {deleteTarget && mounted && createPortal(
        <div
          className="fixed inset-0 left-64 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 overflow-hidden border border-white/60 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security Alert</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed px-4">
              Permanent removal of <span className="text-rose-600">#{deleteTarget}</span> from system records.
            </p>
            <div className="flex flex-col gap-2 mt-8">
              <button onClick={handleDelete} disabled={deleting} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-100">
                {deleting ? "Purging Records..." : "Confirm Removal"}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal")!
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>
    </div>
  );
}
