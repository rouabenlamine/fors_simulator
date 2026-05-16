import "server-only";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * Checks whether the current session user is allowed to perform
 * resolution actions (validate, reject, SQL approve) on a ticket.
 *
 * Rules:
 *  - admin / superadmin  → always allowed
 *  - it_support          → allowed ONLY if they are the assigned_support_matricule
 *  - unassigned ticket   → no one may act (returns error)
 *
 * Returns { allowed: true } or { allowed: false, reason: string, status: 403 | 400 }
 */
export async function canActOnTicket(ticketId: string): Promise<
  | { allowed: true; userMatricule: string; role: string }
  | { allowed: false; reason: string; status: 403 | 400 }
> {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    return { allowed: false, reason: "Unauthorized — no active session.", status: 403 };
  }

  const role = user.role;
  const userMatricule = user.matricule;

  // Admins and superadmins bypass ownership checks
  if (role === "admin" || role === "superadmin") {
    return { allowed: true, userMatricule, role };
  }

  // For it_support: check ticket assignment
  if (role === "it_support") {
    const rows = await query<any>(
      "SELECT assigned_support_matricule FROM tickets WHERE number = ?",
      [ticketId]
    );

    if (rows.length === 0) {
      return { allowed: false, reason: "Ticket not found.", status: 400 };
    }

    const assignedMatricule: string | null = rows[0].assigned_support_matricule;

    if (!assignedMatricule) {
      return {
        allowed: false,
        reason: "This ticket has no assigned support user. It cannot be resolved until a support user is assigned via ServiceNow.",
        status: 403,
      };
    }

    if (assignedMatricule !== userMatricule) {
      return {
        allowed: false,
        reason: `Only the assigned IT support user (${assignedMatricule}) can take action on this ticket.`,
        status: 403,
      };
    }

    return { allowed: true, userMatricule, role };
  }

  // Other roles (it_manager, it_report) cannot act on tickets
  return {
    allowed: false,
    reason: "Your role does not have permission to resolve tickets.",
    status: 403,
  };
}

/**
 * Returns the current session user's matricule and role, and the
 * ticket's assigned_support_matricule, for frontend authorization hints.
 * Safe to call from Server Actions that need to expose auth state to Client Components.
 */
export async function getTicketAuthContext(ticketId: string): Promise<{
  userMatricule: string | null;
  userRole: string | null;
  assignedSupportMatricule: string | null;
  canAct: boolean;
  reason?: string;
}> {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    return { userMatricule: null, userRole: null, assignedSupportMatricule: null, canAct: false, reason: "No session" };
  }

  const role = user.role;
  const userMatricule = user.matricule;

  const rows = await query<any>(
    "SELECT assigned_support_matricule FROM tickets WHERE number = ?",
    [ticketId]
  );

  const assignedSupportMatricule: string | null =
    rows.length > 0 ? (rows[0].assigned_support_matricule ?? null) : null;

  if (role === "admin" || role === "superadmin") {
    return { userMatricule, userRole: role, assignedSupportMatricule, canAct: true };
  }

  if (role === "it_support") {
    if (!assignedSupportMatricule) {
      return {
        userMatricule, userRole: role, assignedSupportMatricule, canAct: false,
        reason: "No assigned support user — ticket is locked until assigned.",
      };
    }
    const canAct = assignedSupportMatricule === userMatricule;
    return {
      userMatricule, userRole: role, assignedSupportMatricule, canAct,
      reason: canAct ? undefined : "Only the assigned IT support user can resolve this ticket.",
    };
  }

  return {
    userMatricule, userRole: role, assignedSupportMatricule, canAct: false,
    reason: "Your role does not permit resolution actions.",
  };
}
