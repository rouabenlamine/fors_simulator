"use client";

import React, { createContext, useContext } from "react";
import type { RolePermissions } from "@/lib/view-components";

interface ViewPermissionsContextValue {
  permissions: RolePermissions | null;
}

const ViewPermissionsContext = createContext<ViewPermissionsContextValue>({
  permissions: null,
});

export function ViewPermissionsProvider({
  permissions,
  children,
}: {
  permissions: RolePermissions | null;
  children: React.ReactNode;
}) {
  return (
    <ViewPermissionsContext.Provider value={{ permissions }}>
      {children}
    </ViewPermissionsContext.Provider>
  );
}

export function useViewPermissions() {
  return useContext(ViewPermissionsContext);
}
