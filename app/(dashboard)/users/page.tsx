"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Shield, Pencil, Power, X, Search, Check, AlertTriangle, Save, Mail, User, Fingerprint, Activity, Calendar, Hash, ShieldCheck, Key, ChevronDown, RefreshCw } from "lucide-react";
import {
  getAdminUsersAction,
  createUserAction,
  updateUserAction,
  toggleUserActiveAction,
  getMyRoleAction,
} from "@/app/actions/admin-actions";

type DBUser = {
  matricule: string; name: string; surname: string; username: string;
  email: string; role: string; is_active: number; created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  it_support: "IT Support Agent",
  it_manager: "IT Manager",
  it_report: "IT Report Analyst",
  admin: "Administrator",
  superadmin: "Super Administrator",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; ring: string; icon: any }> = {
  it_support: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100", icon: User },
  it_manager: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-100", icon: Shield },
  it_report:  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", icon: Activity },
  admin:      { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-100", icon: ShieldCheck },
  superadmin: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-100", icon: ShieldCheck },
};

// ─── Reusable Components (Matching Lab/Analysis Theme) ───────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 text-[10px] font-black tracking-[0.08em] text-slate-800 uppercase">
    {children}
  </p>
);

const FormInput = ({ label, icon: Icon, value, onChange, placeholder, type = "text", disabled }: any) => (
  <div className="w-full">
    <SectionLabel>{label}</SectionLabel>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-9 rounded-full border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-900 placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-600 focus:bg-white ${Icon ? 'pl-11 pr-4' : 'px-4'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

export default function UsersPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<DBUser | null>(null);
  
  const [form, setForm] = useState({ matricule: "", name: "", surname: "", username: "", email: "", password: "", role: "it_support" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const u = await getAdminUsersAction();
      setUsers(u);
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
    return !q || u.matricule.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.surname || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const activeCount = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;

  function openCreate() {
    setEditUser(null);
    setForm({ matricule: "", name: "", surname: "", username: "", email: "", password: "", role: "it_support" });
    setError("");
    setShowModal(true);
  }

  function openEdit(e: React.MouseEvent, u: DBUser) {
    e.stopPropagation();
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
          email: form.email, role: "it_support",
          ...(form.password ? { password: form.password } : {}),
        });
        showToast(`Updated user ${form.name}`);
      } else {
        if (!form.matricule || !form.name || !form.password) { 
          setError("Required fields missing"); 
          setSaving(false); 
          return; 
        }
        await createUserAction({ ...form, role: "it_support" });
        showToast(`Created user ${form.name}`);
      }
      setShowModal(false);
      await load();
    } catch (e: any) { setError(e.message || "Operation failed"); }
    setSaving(false);
  }

  async function handleToggle(e: React.MouseEvent, matricule: string) {
    e.stopPropagation();
    try { 
      await toggleUserActiveAction(matricule); 
      await load(); 
      showToast("Access status updated");
    } catch (e: any) { alert(e.message); }
  }

  return (
    <React.Fragment>
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-widest z-[200] animate-in slide-in-from-right-10 flex items-center gap-3 border border-white/10 backdrop-blur-xl bg-opacity-90">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="p-4 sm:p-6 w-full max-w-[1800px] mx-auto space-y-6">
        
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">
                Team <span className="text-indigo-500">Management</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Force Directory & Access Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search operatives..."
                className="bg-white border border-slate-200 rounded-full pl-10 pr-4 h-9 text-[11px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all w-48 sm:w-80 shadow-sm"
              />
            </div>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white h-9 px-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>
        </div>

        {/* ── KPI Strip ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Active", value: activeCount, icon: Check, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
            { label: "System Admins", value: adminCount, icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-100" },
            { label: "Total Users", value: users.length, icon: Users, color: "text-slate-600", bg: "bg-slate-50", ring: "ring-slate-200" },
            { label: "Inactive", value: users.length - activeCount, icon: Power, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" },
          ].map((kpi, i) => (
            <div key={i} className={`rounded-xl px-4 py-3 border ${kpi.bg}/50 border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all`}>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 ${kpi.color}`}>{kpi.label}</p>
                <p className="text-xl font-black text-slate-800 tracking-tight">{kpi.value}</p>
              </div>
            <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center border border-white group-hover:scale-110 transition-transform shadow-sm`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Directory Table ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative group/table">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left px-8 py-5">Operative</th>
                  <th className="text-left px-4 py-5">Security Role</th>
                  <th className="text-left px-4 py-5">System ID</th>
                  <th className="text-left px-4 py-5">Access Status</th>
                  <th className="text-right px-8 py-5">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><div className="flex flex-col items-center gap-2"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Accessing Secure Records...</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No matches found in directory</td></tr>
                ) : (
                  filtered.map((u, idx) => {
                    const r = ROLE_COLORS[u.role] || ROLE_COLORS.it_support;
                    const RoleIcon = r.icon;
                    return (
                      <tr key={u.matricule} onClick={() => setSelectedUserDetails(u)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm font-black text-slate-400 text-[10px]">
                              {u.name[0]}{u.surname?.[0] || ""}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{u.name} {u.surname}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5 lowercase">{u.email || "no-email@secure.fors"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${r.bg} ${r.text} ${r.ring.replace('ring', 'border')} text-[9px] font-black uppercase tracking-tight`}>
                            <RoleIcon className="w-2.5 h-2.5" />
                            {ROLE_LABELS[u.role] || u.role}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[10px] font-black text-slate-400 tracking-wider uppercase">
                          {u.matricule}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${u.is_active ? 'text-emerald-500' : 'text-slate-300'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            {u.is_active ? 'Online' : 'Locked'}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={(e) => openEdit(e, u)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => handleToggle(e, u.matricule)} className={`w-8 h-8 rounded-full bg-white border flex items-center justify-center transition-all shadow-sm ${u.is_active ? 'text-slate-300 border-slate-200 hover:text-rose-500 hover:border-rose-200' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'}`}>
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── User Details Modal ── */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUserDetails(null)}>
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" />
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] w-full max-w-md flex flex-col max-h-[95vh] overflow-hidden relative z-[101] animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="overflow-y-auto custom-scrollbar">
              <div className="p-8 text-center space-y-4">
              <div className="inline-flex relative mx-auto">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-4 border-white shadow-xl text-3xl font-black text-slate-300">
                  {selectedUserDetails.name[0]}{selectedUserDetails.surname?.[0] || ""}
                </div>
                {selectedUserDetails.is_active ? (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
                ) : null}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedUserDetails.name} {selectedUserDetails.surname}</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">{ROLE_LABELS[selectedUserDetails.role] || selectedUserDetails.role}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                  <Fingerprint className="w-4 h-4 text-slate-300 mb-2" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Matricule</p>
                  <p className="text-[11px] font-black text-slate-800 uppercase">{selectedUserDetails.matricule}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-300 mb-2" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Enrolled</p>
                  <p className="text-[11px] font-black text-slate-800">{new Date(selectedUserDetails.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setSelectedUserDetails(null)} className="flex-1 h-11 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Close</button>
                <button onClick={(e) => { setSelectedUserDetails(null); openEdit(e, selectedUserDetails); }} className="flex-1 h-11 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
                  <Pencil className="w-3.5 h-3.5" /> Modify
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Provisioning Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" />
          <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] w-full max-w-md flex flex-col max-h-[95vh] overflow-hidden relative z-[101] animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 pt-8 pb-6 border-b border-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-white shadow-sm">
                  <UserPlus className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{editUser ? "Modify Identity" : "Add New Agent"}</h3>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Secure Personnel Provisioning</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="First Name *" icon={User} value={form.name} onChange={(e:any)=>setForm(f=>({...f, name: e.target.value}))} placeholder="Enter name" />
                <FormInput label="Last Name" icon={User} value={form.surname} onChange={(e:any)=>setForm(f=>({...f, surname: e.target.value}))} placeholder="Enter last name" />
              </div>

              <FormInput label="System Username *" icon={Hash} value={form.username} onChange={(e:any)=>setForm(f=>({...f, username: e.target.value}))} placeholder="e.g. j.doe" />

              <FormInput label="Corporate ID (Matricule) *" icon={Fingerprint} value={form.matricule} onChange={(e:any)=>setForm(f=>({...f, matricule: e.target.value.toUpperCase()}))} disabled={!!editUser} placeholder="E.G. M123456" />

              <FormInput label="Secure Email (Corporate) *" icon={Mail} value={form.email} onChange={(e:any)=>setForm(f=>({...f, email: e.target.value}))} placeholder="name@company.com" />

              <div className="w-full">
                <SectionLabel>Security Role *</SectionLabel>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    readOnly
                    value="IT Support Agent"
                    className="w-full h-9 rounded-full border border-slate-200 bg-slate-100 pl-11 pr-4 text-[12px] font-bold text-slate-500 cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              <FormInput label="Access Credentials *" icon={Key} type="password" value={form.password} onChange={(e:any)=>setForm(f=>({...f, password: e.target.value}))} placeholder={editUser ? "Leave blank to keep current" : "Set secure password"} />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-2xl border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-tight animate-in shake-in-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editUser ? "Update Profile" : "Add Operative"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
