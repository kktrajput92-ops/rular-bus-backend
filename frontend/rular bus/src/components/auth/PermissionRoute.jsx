import { Navigate } from "react-router-dom";
import { usePermission } from "../../context/PermissionContext";

export default function PermissionRoute({
  permission,
  children,
}) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

