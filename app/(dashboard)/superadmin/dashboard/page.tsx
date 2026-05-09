import React from "react";
import { getAdminDashboardStats, getMyRoleAction } from "@/app/actions/admin-actions";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const role = await getMyRoleAction();

  return (
    <div className="min-h-full">
      <AdminControlPanel stats={stats} role={role} />
    </div>
  );
}

