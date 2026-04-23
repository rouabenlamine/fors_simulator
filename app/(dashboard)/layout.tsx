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

  // Map app role → DB role key used in view_permissions table
  const dbRole =
    user?.role === "agent" ? "it_support" :
    user?.role === "reporter" ? "it_report" :
    user?.role === "manager" ? "it_manager" :
    user?.role ?? "it_support";

  let viewPermissions: RolePermissions | null = null;
  try {
    viewPermissions = await getViewPermissionsForRole(dbRole);
  } catch {
    // gracefully degrade — all components visible if DB is unreachable
  }

  return (
    <ViewPermissionsProvider permissions={viewPermissions}>
      <div className="min-h-screen bg-slate-50 flex w-full overflow-hidden">
        <Suspense fallback={<div className="w-56 h-screen bg-slate-900 shrink-0" />}>
          <Sidebar role={user?.role} />
        </Suspense>
        <div className="flex-1 ml-56 flex flex-col h-screen relative min-w-0">
          {/* Colorful Background Accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          {/* Slim topbar — no title, only bell + user */}
          <Header user={user} viewPermissions={viewPermissions} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 px-4 pb-2">
            {children}
          </main>
        </div>
        <ConditionalView componentId="chat_bubble">
          <ChatBubble user={user} />
        </ConditionalView>
      </div>
    </ViewPermissionsProvider>
  );
}
