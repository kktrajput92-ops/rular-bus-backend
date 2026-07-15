import { createContext, useContext, useState } from "react";

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("permissions")) || [];
  } catch {
    return [];
  }
});

  const hasPermission = (code) => {
  if (!code) return true;
  return permissions.includes(code);
};

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        setPermissions,
        hasPermission,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
