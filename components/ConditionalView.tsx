"use client";

import { useViewPermissions } from "@/contexts/ViewPermissionsContext";
import type { ComponentId } from "@/lib/view-components";

interface ConditionalViewProps {
  componentId: ComponentId;
  children: React.ReactNode;
  /**
   * Optional fallback to render when the component is hidden.
   * Defaults to null (renders nothing).
   */
  fallback?: React.ReactNode;
}

/**
 * ConditionalView — wraps any dashboard component and hides it
 * when the current user's role has toggled it "off" in View Control.
 *
 * Usage:
 *   <ConditionalView componentId="chat_bubble">
 *     <ChatBubble />
 *   </ConditionalView>
 */
export function ConditionalView({
  componentId,
  children,
  fallback = null,
}: ConditionalViewProps) {
  const { permissions } = useViewPermissions();

  // If no permissions loaded yet (SSR mismatch guard), show by default
  if (!permissions) return <>{children}</>;

  // If the component is explicitly disabled for this role, hide it
  if (permissions[componentId] === false) return <>{fallback}</>;

  return <>{children}</>;
}
