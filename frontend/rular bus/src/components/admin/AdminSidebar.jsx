import { Link, useLocation } from "react-router-dom";
import { usePermission } from "../../context/PermissionContext";
const menus = [
  { name: "Dashboard", icon: "🏠", path: "/admin" },

  { name: "Buses", icon: "🚌", path: "/admin/buses" },

  { name: "Drivers", icon: "👨‍✈️", path: "/admin/drivers" },

  { name: "Staff", icon: "👥", path: "/admin/staff" },

  { name: "Departments", icon: "🏢", path: "/admin/departments" },

  { name: "Designations", icon: "🏷️", path: "/admin/designations" },

  {
    name: "Roles",
    icon: "🔐",
    path: "/admin/roles",
    permission: "role.view",
  },

  {
    name: "Role Permissions",
    icon: "🔑",
    path: "/admin/role-permissions",
    permission: "role.view",
  },

  {
    name: "Permissions",
    icon: "🛡️",
    path: "/admin/permissions",
    permission: "permission.view",
  },

  {
    name: "Users",
    icon: "👤",
    path: "/admin/users",
    permission: "user.view",
  },

  { name: "Routes", icon: "🛣️", path: "/admin/routes" },

  { name: "Schedules", icon: "⏰", path: "/admin/schedules" },

  { name: "Passengers", icon: "👥", path: "/admin/passengers" },

  { name: "Bookings", icon: "📚", path: "/bookings" },

  { name: "Tickets", icon: "🎫", path: "/admin/tickets" },

  { name: "Payments", icon: "💳", path: "/admin/payments" },

  { name: "Reports", icon: "📊", path: "/admin/reports" },

  { name: "Live Tracking", icon: "📍", path: "/admin/tracking" },
];

export default function AdminSidebar() {
  const location = useLocation();
const { hasPermission } = usePermission();
  return (
    <div
      style={{
        width: 270,
        minHeight: "100vh",
        background: "#0B3D91",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "5px 0 15px rgba(0,0,0,.15)",
      }}
    >
      <div
        style={{
          padding: 25,
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,.15)",
        }}
      >
        <img
          src="/logo.png"
          alt="Rular Bus"
          style={{
            width: 75,
            marginBottom: 10,
          }}
        />

        <h2
          style={{
            margin: 0,
            color: "#fff",
          }}
        >
          Rular Bus
        </h2>

        <small
          style={{
            color: "#ddd",
          }}
        >
          Enterprise ERP
        </small>
      </div>

      <div style={{ padding: 12, flex: 1 }}>
        {menus
  .filter(
    (item) =>
      !item.permission || hasPermission(item.permission)
  )
  .map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "block",
              textDecoration: "none",
              color: "#fff",
              padding: "14px 18px",
              marginBottom: 8,
              borderRadius: 12,
              background:
                location.pathname === item.path
                  ? "#D62828"
                  : "transparent",
              transition: ".25s",
            }}
          >
            <span style={{ marginRight: 12 }}>{item.icon}</span>

            {item.name}
          </Link>
        ))}
      </div>

      <div
        style={{
          padding: 18,
          borderTop: "1px solid rgba(255,255,255,.15)",
          textAlign: "center",
          fontSize: 13,
          color: "#ddd",
        }}
      >
        Rular Bus ERP v1.0
      </div>
    </div>
  );
}

