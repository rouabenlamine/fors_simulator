"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, UserPlus, Shield, Pencil, Trash2, Power, X, 
  Search, Check, AlertTriangle, Download, RefreshCcw,
  ChevronLeft, ChevronRight, Mail, Key, Hash
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
  matricule: string; name: string; prenom: string; username: string;
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
  const [form, setForm] = useState({ matricule: "", name: "", prenom: "", username: "", email: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    const matchSearch = !q || u.matricule.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openCreate() {
    setEditUser(null);
    setForm({ matricule: "", name: "", prenom: "", username: "", email: "", password: "", role: "it_support" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: DBUser) {
    setEditUser(u);
    setForm({ matricule: u.matricule, name: u.name, prenom: u.prenom || "", username: u.username || "", email: u.email || "", password: "", role: u.role });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      if (editUser) {
        await updateUserAction(editUser.matricule, {
          name: form.name, prenom: form.prenom, username: form.username,
          email: form.email, role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        if (!form.matricule || !form.name || !form.password) { setError("Matricule, Name, and Password are required."); setSaving(false); return; }
        await createUserAction({ matricule: form.matricule, name: form.name, prenom: form.prenom, username: form.username, email: form.email, password: form.password, role: form.role });
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
    <div className="min-h-screen bg-[#EBF2F7] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2C4E5E] tracking-tight">Team Directory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage network access, administrative roles, and user permissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Directory
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 bg-[#2C4E5E] text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-[#3d6b81] transition-all active:scale-[0.98]">
              <UserPlus className="w-4 h-4" />
              Add New User
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Accounts", val: users.length, color: "text-[#2C4E5E]", bg: "bg-white" },
            { label: "Active Now", val: users.filter(u => u.is_active).length, color: "text-emerald-500", bg: "bg-white" },
            { label: "Internal Admin", val: users.filter(u => ["admin", "superadmin"].includes(u.role)).length, color: "text-indigo-500", bg: "bg-white" },
            { label: "Suspended", val: users.filter(u => !u.is_active).length, color: "text-rose-500", bg: "bg-white" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-1`}>
              <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
          
          {/* Filters Bar */}
          <div className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            {/* Role Tabs */}
            <div className="flex items-center gap-2 border-b xl:border-b-0 border-slate-100 pb-4 xl:pb-0 overflow-x-auto no-scrollbar">
              {["all", ...ROLES.filter(r => myRole === "superadmin" || !["admin", "superadmin"].includes(r))].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 text-sm font-bold transition-all relative whitespace-nowrap ${
                    roleFilter === r ? "text-[#2C4E5E]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {r === "all" ? "All Accounts" : r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  {roleFilter === r && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C4E5E] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Inline Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#2C4E5E]" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by name, email or matricule..." 
                className="bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-100 transition-all w-full xl:w-72" 
              />
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">S No</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matricule</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Syncing Directory...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No users match these criteria</td></tr>
                ) : (
                  filtered.map((user, idx) => (
                    <tr key={user.matricule} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => openEdit(user)}>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-800 tracking-tight">{user.matricule}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-700">{user.name} {user.prenom}</td>
                      <td className="px-6 py-5 text-xs text-slate-500 font-medium">{user.email || "—"}</td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2C4E5E] bg-slate-100 px-2 py-0.5 rounded-md">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex items-center justify-end gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${user.is_active ? "text-emerald-500" : "text-rose-500"}`}>
                          {user.is_active ? "Active" : "Suspended"}
                        </span>
                        
                        {/* Inline Actions (Hidden by default, shown on group hover) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleToggle(user.matricule); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#2C4E5E] transition-all"><Power className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(user.matricule); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Area */}
          <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filtered.length} of {users.length} profiles
            </p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg bg-[#2C4E5E] text-white text-xs font-bold flex items-center justify-center transition-all">1</button>
                <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white text-xs font-bold flex items-center justify-center transition-all">2</button>
              </div>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="relative h-28 bg-gradient-to-br from-[#2C4E5E] to-[#1A2F39] p-6 flex items-end shrink-0">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"><X className="w-4 h-4" /></button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shadow-lg border border-white/10"><Users className="w-3 h-3 text-white" /></div>
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Profile Management</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">{editUser ? "Modify User Profile" : "Onboard New Account"}</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Hash className="w-3 h-3"/> Matricule *</label>
                  <input value={form.matricule} onChange={e => setForm({ ...form, matricule: e.target.value.toUpperCase() })} disabled={!!editUser} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 disabled:opacity-40 transition-all" placeholder="USR001" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Shield className="w-3 h-3"/> System Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 cursor-pointer transition-all">
                    {ROLES
                      .filter(r => myRole === "superadmin" || !["admin", "superadmin"].includes(r))
                      .map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> First Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 transition-all" placeholder="Enter first name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 transition-all" placeholder="Enter last name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Username</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 transition-all" placeholder="j.doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Corporate Email</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 transition-all" placeholder="email@leoni.com" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Key className="w-3 h-3"/> {editUser ? "Security Update (Optional)" : "Security Password *"}</label>
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#2C4E5E]/10 transition-all" placeholder="••••••••" />
                {editUser && <p className="text-[9px] text-slate-400 italic mt-1">Leave blank to keep current password.</p>}
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}
            </div>

            <div className="p-6 pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Dismiss</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#2C4E5E] hover:bg-[#3d6b81] disabled:opacity-50 text-white px-6 py-3 text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-100">
                <Check className="w-4 h-4" />
                {saving ? "Processing..." : editUser ? "Update Profile" : "Create Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation — Premium Redesign */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Security Alert</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              You are about to permanently remove user <span className="font-black text-[#2C4E5E]">#{deleteTarget}</span> from the network directory. This cannot be reversed.
            </p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Abort Action</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-100">
                {deleting ? "Deleting..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
