"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Shield, Pencil, Trash2, Power, X, Search, Check, AlertTriangle } from "lucide-react";
import {
  getAdminUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  toggleUserActiveAction,
  getMyRoleAction,
} from "@/app/actions/admin-actions";

type DBUser = {
  matricule: string; name: string; prenom: string; username: string;
  email: string; role: string; is_active: number; created_at: string;
};

import { ROLE_OPTIONS } from "@/lib/constants";

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
    setForm({ matricule: "", name: "", prenom: "", username: "", email: "", password: "", role: "user" });
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

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      superadmin: "bg-rose-50 text-rose-600 border-rose-200",
      admin: "bg-indigo-50 text-indigo-600 border-indigo-200",
      it_support: "bg-blue-50 text-blue-600 border-blue-200",
      agent: "bg-blue-50 text-blue-600 border-blue-200",
      it_manager: "bg-teal-50 text-teal-600 border-teal-200",
      manager: "bg-teal-50 text-teal-600 border-teal-200",
      it_report: "bg-emerald-50 text-emerald-600 border-emerald-200",
      reporter: "bg-emerald-50 text-emerald-600 border-emerald-200",
      user: "bg-gray-50 text-gray-600 border-gray-200",
    };
    return map[role] || map.user;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 py-4 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">User Management</h1>
            <p className="text-sm text-slate-500">Create, update, and manage users and their role-based access.</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all hover:shadow-md active:scale-[0.98]">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by matricule, name, or email..." className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer">
          <option value="all">All Roles</option>
          {ROLES
            .filter(r => myRole === "superadmin" || !["admin", "superadmin"].includes(r))
            .map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", val: users.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", val: users.filter(u => u.is_active).length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Admins", val: users.filter(u => ["admin", "superadmin"].includes(u.role)).length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Inactive", val: users.filter(u => !u.is_active).length, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <span className={`text-2xl font-bold ${s.color}`}>{s.val}</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Matricule</th>
                <th className="px-5 py-3.5 font-semibold">Name</th>
                <th className="px-5 py-3.5 font-semibold">Email</th>
                <th className="px-5 py-3.5 font-semibold">Role</th>
                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 animate-pulse">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No users found.</td></tr>
              ) : filtered.map(user => (
                <tr key={user.matricule} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-700">{user.matricule}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {user.name?.[0]}{user.prenom?.[0] || ""}
                      </div>
                      <span className="font-semibold text-slate-700">{user.name} {user.prenom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{user.email || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${roleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleToggle(user.matricule)} title={user.is_active ? "Deactivate" : "Activate"} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"><Power className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(user.matricule)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-blue-600" /></div>
                {editUser ? "Edit User" : "Create User"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Matricule *</label>
                  <input value={form.matricule} onChange={e => setForm({ ...form, matricule: e.target.value.toUpperCase() })} disabled={!!editUser} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-40 transition-all" placeholder="USR001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer transition-all">
                    {ROLES
                      .filter(r => myRole === "superadmin" || !["admin", "superadmin"].includes(r))
                      .map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">First Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Last Name</label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" placeholder="Dupont" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Username</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" placeholder="jdupont" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" placeholder="jean@leoni.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{editUser ? "New Password (leave blank to keep)" : "Password *"}</label>
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" placeholder="••••••••" />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editUser ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Confirm Deletion</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Delete user <span className="font-mono font-bold text-red-500">{deleteTarget}</span> permanently?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm">
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
