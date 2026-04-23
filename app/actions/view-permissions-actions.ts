"use server";

import { query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  buildDefaultPermissions,
  type RolePermissions,
} from "@/lib/view-components";

// Re-export types so consumers can do a single import
export type { ComponentId, RolePermissions } from "@/lib/view-components";

// ── Fetch permissions for one role ────────────────────────────────────────────
export async function getViewPermissionsForRole(
  role: string
): Promise<RolePermissions> {
  try {
    const rows = await query<any>(
      "SELECT permissions FROM view_permissions WHERE role = ?",
      [role]
    );
    if (rows.length === 0) return buildDefaultPermissions();
    const stored =
      typeof rows[0].permissions === "string"
        ? JSON.parse(rows[0].permissions)
        : rows[0].permissions;
    // Merge with defaults so newly added components default to visible
    return { ...buildDefaultPermissions(), ...stored };
  } catch {
    return buildDefaultPermissions();
  }
}

export async function getAllViewPermissions(): Promise<
  Record<string, RolePermissions>
> {
  const session = await getSession();
  const callerRole = session.user?.role;

  // Global Controller oversight: only superadmin can access the suite
  if (callerRole !== "superadmin") {
    return {};
  }

  const roles = ["it_support", "it_manager", "it_report", "admin"];
  const result: Record<string, RolePermissions> = {};
  for (const role of roles) {
    result[role] = await getViewPermissionsForRole(role);
  }
  return result;
}

// ── Persist updated permissions for a role ────────────────────────────────────
export async function updateViewPermissionsAction(
  targetRole: string,
  permissions: RolePermissions
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const callerRole = session.user?.role;
  const callerMatricule = session.user?.matricule || "SYSTEM";

  // Auth guard: Global Controller oversight
  if (callerRole !== "superadmin") {
    return { success: false, error: "Superadmin access required to manage view control." };
  }

  try {
    await execute(
      `INSERT INTO view_permissions (role, permissions, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         permissions = VALUES(permissions),
         updated_by  = VALUES(updated_by),
         updated_at  = NOW()`,
      [targetRole, JSON.stringify(permissions), callerMatricule]
    );

    await logActivity("VIEW_PERMISSIONS_UPDATED", {
      userMatricule: callerMatricule,
      details: {
        message: `Updated view permissions for role: ${targetRole}`,
        targetRole,
      },
    });

    // Revalidate the entire layout so permission changes propagate everywhere
    revalidatePath("/", "layout");
    revalidatePath("/admin/view-control");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
