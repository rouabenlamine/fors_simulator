import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatBubble } from "@/components/layout/ChatBubble";
import { getSession } from "@/lib/auth";
import { ViewPermissionsProvider } from "@/contexts/ViewPermissionsContext";
import { getViewPermissionsForRole } from "@/app/actions/view-permissions-actions";
import type { RolePermissions } from "@/lib/view-components";
import { ConditionalView } from "@/components/ConditionalView";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session.user;

  const dbRole = user?.role ?? "it_support";

  let viewPermissions: RolePermissions | null = null;
  try {
    viewPermissions = await getViewPermissionsForRole(dbRole);
  } catch {
    // gracefully degrade — all components visible if DB is unreachable
  }

  return (
    <ViewPermissionsProvider permissions={viewPermissions}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex w-full overflow-hidden">
        <Suspense fallback={<div className="w-56 h-screen bg-slate-900 shrink-0" />}>
          <Sidebar user={user as any} />
        </Suspense>
        <div className="flex-1 ml-64 flex flex-col h-screen relative min-w-0">
          <Header user={user as any} />
          
          {/* Colorful Background Accents */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-rose-400/20 to-teal-400/20 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none animate-[pulse_12s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 blur-[150px] rounded-full pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />

          <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative px-4 pb-2 pt-4">
            {children}
          </main>

          {/* Modal Portal Target (Ensures modals overlap Header but not Sidebar) */}
          <div id="modal-portal" className="relative z-[99999]" />
        </div>
        {dbRole !== "superadmin" && (
          <ConditionalView componentId="chat_bubble">
            <ChatBubble user={user} />
          </ConditionalView>
        )}
      </div>
    </ViewPermissionsProvider>
  );
}
