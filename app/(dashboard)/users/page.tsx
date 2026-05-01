"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Shield, Pencil, Power, X, Search, Check, AlertTriangle, Save, Clock, Mail, User, Fingerprint, ChevronRight, Activity, Trash2, Calendar, MapPin, Hash, ShieldCheck, Key } from "lucide-react";
import {
  getAdminUsersAction,
  createUserAction,
  updateUserAction,
  toggleUserActiveAction,
  getMyRoleAction,
} from "@/app/actions/admin-actions";

type DBUser = {
  matricule: string; name: string; prenom: string; username: string;
  email: string; role: string; is_active: number; created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  it_support: "IT Support Agent",
  it_manager: "IT Manager",
  it_report: "IT Report Analyst",
  admin: "Administrator",
  superadmin: "Super Administrator",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  it_support: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: User },
  it_manager: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-100", icon: Shield },
  it_report:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: Activity },
  admin:      { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", icon: Shield },
  superadmin: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", icon: Shield },
};

export default function UsersPage() {
  const [myRole, setMyRole] = useState<string>("user");
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<DBUser | null>(null);
  
  const [form, setForm] = useState({ matricule: "", name: "", prenom: "", username: "", email: "", password: "", role: "it_support" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.matricule.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.prenom || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  function openCreate() {
    setEditUser(null);
    setForm({ matricule: "", name: "", prenom: "", username: "", email: "", password: "", role: "it_support" });
    setError("");
    setShowModal(true);
  }

  function openEdit(e: React.MouseEvent, u: DBUser) {
    e.stopPropagation();
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
        showToast(`Updated user ${form.name}`);
      } else {
        if (!form.matricule || !form.name || !form.password) { 
          setError("Matricule, Name, and Password are required."); 
          setSaving(false); 
          return; 
        }
        await createUserAction({ matricule: form.matricule, name: form.name, prenom: form.prenom, username: form.username, email: form.email, password: form.password, role: form.role });
        showToast(`Created user ${form.name}`);
      }
      setShowModal(false);
      await load();
    } catch (e: any) { setError(e.message || "Failed."); }
    setSaving(false);
  }

  async function handleToggle(e: React.MouseEvent, matricule: string) {
    e.stopPropagation();
    try { 
      await toggleUserActiveAction(matricule); 
      await load(); 
      showToast("User status updated");
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-bold z-50 animate-in slide-in-from-right-10 duration-300 flex items-center gap-3 border border-white/10">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-[9px] font-black text-teal-600 uppercase tracking-[0.2em]">
              <Shield className="w-2.5 h-2.5" />
              Security & Identity Control
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Team Management</h2>
              <p className="text-slate-500 text-xs font-medium max-w-lg">
                Orchestrate your IT support workforce. Provision accounts and monitor agent status.
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="group flex items-center gap-2.5 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-teal-100 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <UserPlus className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
            Provision New Agent
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 shadow-xl shadow-indigo-200/50 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-4xl font-black text-white tracking-tighter">{users.length}</p>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">Total Directory</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 shadow-xl shadow-emerald-200/50 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-4xl font-black text-white tracking-tighter">{activeCount}</p>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">Active Operatives</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Power className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-4xl font-black text-white tracking-tighter">{inactiveCount}</p>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">Inactive Accounts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-900">Agent Directory</h3>
              <p className="text-[10px] font-medium text-slate-400">Total of {filtered.length} matching agents</p>
            </div>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find agent..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50">
                  <th className="text-left px-8 py-5 border-b border-slate-100">Identity</th>
                  <th className="text-left px-6 py-5 border-b border-slate-100">Security Clearance</th>
                  <th className="text-left px-6 py-5 border-b border-slate-100">Creation Date</th>
                  <th className="text-left px-6 py-5 border-b border-slate-100">Status</th>
                  <th className="text-right px-8 py-5 border-b border-slate-100">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center animate-pulse"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" /><p className="text-sm font-bold text-slate-400">Syncing workforce data...</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">No agents found matching &quot;{search}&quot;</td></tr>
                ) : (
                  filtered.map((u, idx) => {
                    const rStyle = ROLE_COLORS[u.role] || ROLE_COLORS.it_support;
                    const RoleIcon = rStyle.icon;
                    return (
                      <tr 
                        key={u.matricule} 
                        onClick={() => setSelectedUserDetails(u)}
                        className="group hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer relative animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 shadow-lg border-2 border-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                <span className="text-slate-800 text-sm font-black">
                                  {u.name[0]}{u.prenom?.[0] || ""}
                                </span>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full p-0.5 shadow-sm">
                                <div className={`w-full h-full rounded-full ${u.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                              </div>
                            </div>
                            <div>
                              <p className="text-[15px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-none">{u.name} {u.prenom}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                                <Mail className="w-3 h-3" />
                                {u.email || "NO SECURE EMAIL"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 shadow-sm ${rStyle.bg} ${rStyle.text} ${rStyle.border} group-hover:scale-105 transition-transform`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{ROLE_LABELS[u.role] || u.role}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID:</span>
                              <span className="text-[10px] font-black text-slate-500 tracking-wider">{u.matricule}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm transition-all ${
                            u.is_active ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-slate-200 text-slate-500 shadow-slate-100"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                            {u.is_active ? "Live" : "Locked"}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => openEdit(e, u)}
                              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all shadow-sm"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleToggle(e, u.matricule)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                u.is_active
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100"
                              }`}
                              title={u.is_active ? "Lock Account" : "Unlock Account"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUserDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedUserDetails(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-40 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 flex items-end">
              <button 
                onClick={() => setSelectedUserDetails(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                  <span className="text-white text-2xl font-black">
                    {selectedUserDetails.name[0]}{selectedUserDetails.prenom?.[0] || ""}
                  </span>
                </div>
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${ROLE_COLORS[selectedUserDetails.role]?.bg || "bg-slate-100"} ${ROLE_COLORS[selectedUserDetails.role]?.text || "text-slate-600"} text-[9px] font-black uppercase tracking-widest mb-2`}>
                    <ShieldCheck className="w-3 h-3" />
                    {ROLE_LABELS[selectedUserDetails.role] || selectedUserDetails.role}
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                    {selectedUserDetails.name} {selectedUserDetails.prenom}
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 grid grid-cols-2 gap-8 bg-white">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Identification</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Fingerprint className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedUserDetails.matricule}</p>
                      <p className="text-[10px] font-medium text-slate-400">Employee ID</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Corporate Email</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{selectedUserDetails.email || "Not Linked"}</p>
                      <p className="text-[10px] font-medium text-slate-400">Active Directory</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">System Status</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${selectedUserDetails.is_active ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
                      <Power className={`w-4 h-4 ${selectedUserDetails.is_active ? "text-emerald-500" : "text-rose-500"}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase ${selectedUserDetails.is_active ? "text-emerald-600" : "text-rose-600"}`}>
                        {selectedUserDetails.is_active ? "Authorized" : "Deactivated"}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">Account Access</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Member Since</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{new Date(selectedUserDetails.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                      <p className="text-[10px] font-medium text-slate-400">Join Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username: {selectedUserDetails.username || "n/a"}</span>
              </div>
              <button 
                onClick={(e) => { setSelectedUserDetails(null); openEdit(e, selectedUserDetails); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <Pencil className="w-3 h-3" />
                Modify Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provisioning Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-20 bg-gradient-to-br from-slate-900 to-teal-950 p-6 flex items-end shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                    <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.2em]">Provisioning</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">{editUser ? "Update Profile" : "New Identity"}</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name *</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs font-bold"
                      placeholder="Marc"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs font-bold"
                    placeholder="Lambert"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Matricule *</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                  <input
                    value={form.matricule}
                    onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value.toUpperCase() }))}
                    disabled={!!editUser}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs font-mono font-bold disabled:opacity-40"
                    placeholder="M123456"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs font-bold"
                    placeholder="marc.lambert@leoni.com"
                  />
                </div>
              </div>

              {(!editUser || form.password) && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{editUser ? "Update Password" : "Password *"}</label>
                  <input
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-xs font-bold"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[10px] font-bold animate-in shake-in-1 duration-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2 shrink-0">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-100 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {editUser ? "Update" : "Provision"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
