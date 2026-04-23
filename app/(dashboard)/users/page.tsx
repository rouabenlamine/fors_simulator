"use client";

import { useState } from "react";
import { Users, Shield, UserCheck, UserX, Clock, Plus, Pencil, Power, X, Save, Search } from "lucide-react";

type Role = "agent" | "reporter" | "manager";

interface User {
  matricule: string;
  name: string;
  role: Role;
  roleLabel: string;
  email: string;
  status: "active" | "inactive";
  lastLogin: string;
  department: string;
}

const ROLE_OPTIONS: { value: Role; label: string; dept: string }[] = [
  { value: "agent",    label: "IT Support",  dept: "IT Operations" },
  { value: "reporter", label: "IT Report",   dept: "IT Analytics"  },
  { value: "manager",  label: "IT Manager",  dept: "IT Management" },
];

const ROLE_BADGE: Record<Role, string> = {
  agent:    "bg-blue-100 text-blue-700",
  reporter: "bg-purple-100 text-purple-700",
  manager:  "bg-teal-100 text-teal-700",
};

const INITIAL_USERS: User[] = [
  { matricule: "654321", name: "Issen San Potale", role: "agent",    roleLabel: "IT Support",  email: "i.sanpotale@leoni.com", status: "active",   lastLogin: "Today, 08:52", department: "IT Operations" },
  { matricule: "123456", name: "Khaled Ben Nasr",  role: "reporter", roleLabel: "IT Report",   email: "k.bennasr@leoni.com",   status: "active",   lastLogin: "Today, 09:14", department: "IT Analytics"  },
  { matricule: "789012", name: "Sara Mansour",     role: "reporter", roleLabel: "IT Report",   email: "s.mansour@leoni.com",   status: "active",   lastLogin: "Today, 11:30", department: "IT Analytics"  },
  { matricule: "345678", name: "Omar Khalil",      role: "manager",  roleLabel: "IT Manager",  email: "o.khalil@leoni.com",    status: "active",   lastLogin: "Today, 13:05", department: "IT Management" },
];

const BLANK: Omit<User, "roleLabel"> & { roleLabel?: string } = {
  matricule: "", name: "", role: "agent", email: "",
  status: "active", lastLogin: "—", department: "IT Operations",
};

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>(INITIAL_USERS);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<"add" | "edit" | null>(null);
  const [form, setForm]         = useState<User>({ ...BLANK, roleLabel: "IT Support" } as User);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.matricule.includes(search)
  );
  const active   = users.filter((u) => u.status === "active").length;
  const inactive = users.filter((u) => u.status === "inactive").length;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setForm({ ...BLANK, roleLabel: "IT Support" } as User);
    setModal("add");
  }

  function openEdit(u: User) {
    setForm({ ...u });
    setModal("edit");
  }

  function saveUser() {
    const rOpt = ROLE_OPTIONS.find((r) => r.value === form.role);
    const enriched: User = { ...form, roleLabel: rOpt?.label ?? form.roleLabel, department: rOpt?.dept ?? form.department };
    if (modal === "add") {
      if (!form.matricule || !form.name || !form.email) return showToast("Please fill all required fields");
      if (users.find((u) => u.matricule === form.matricule)) return showToast("Matricule already exists");
      setUsers((prev) => [...prev, enriched]);
      showToast(`User "${enriched.name}" added`);
    } else {
      setUsers((prev) => prev.map((u) => u.matricule === enriched.matricule ? enriched : u));
      showToast(`User "${enriched.name}" updated`);
    }
    setModal(null);
  }

  function toggleStatus(matricule: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.matricule === matricule
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
    const u = users.find((x) => x.matricule === matricule);
    showToast(`${u?.name} set to ${u?.status === "active" ? "inactive" : "active"}`);
    setConfirmId(null);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          {toast}
        </div>
      )}

      {/* Confirm modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2">Toggle User Status</h3>
            <p className="text-sm text-slate-500 mb-5">
              Are you sure you want to {users.find((u) => u.matricule === confirmId)?.status === "active" ? "deactivate" : "activate"} this user?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => toggleStatus(confirmId)} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-sm font-semibold text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800">{modal === "add" ? "Invite New User" : "Edit User"}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Amine Trabelsi"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Matricule *</label>
                <input
                  value={form.matricule}
                  onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                  placeholder="e.g. 112233"
                  disabled={modal === "edit"}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@leoni.com"
                  type="email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    const r = ROLE_OPTIONS.find((o) => o.value === e.target.value as Role);
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as Role,
                      roleLabel: r?.label ?? f.roleLabel,
                      department: r?.dept ?? f.department,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={saveUser} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-sm font-semibold text-white">
                <Save className="w-4 h-4" />
                {modal === "add" ? "Invite User" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">User Management</h2>
            <p className="text-sm text-slate-400">Manage FORS system users and role assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            Manager only
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
            <p className="text-xs text-slate-500">Total Users</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{active}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <UserX className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{inactive}</p>
            <p className="text-xs text-slate-500">Inactive</p>
          </div>
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800 shrink-0">All Users</h3>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, matricule…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{filtered.length} accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-gray-100">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-4 py-3">Matricule</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Last Login</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.matricule} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-[11px] font-bold">
                          {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{u.matricule}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-700"}`}>
                      {u.roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{u.department}</td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {u.lastLogin}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmId(u.matricule)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.status === "active"
                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title={u.status === "active" ? "Deactivate" : "Activate"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-400">
                    No users match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
