import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePermission } from "../../context/PermissionContext";
import { API_BASE } from "../../api/api";
import "./AdminSidebar.css";

const MENU_SECTIONS = [
  {
    title: "Dashboard",
    items: [
      {
        name: "Dashboard",
        icon: "🏠",
        path: "/admin",
      },
    ],
  },
  {
    title: "Fleet Management",
    items: [
      {
        name: "Buses",
        icon: "🚌",
        path: "/admin/buses",
      },
      {
        name: "Seat Management",
        icon: "🪑",
        path: "/admin/seat-layout/4",
        activePrefixes: ["/admin/seat-layout"],
      },
      {
        name: "Drivers",
        icon: "👨‍✈️",
        path: "/admin/drivers",
      },
      {
        name: "Routes",
        icon: "🛣️",
        path: "/admin/routes",
      },
                      {
          name: "Location Types",
          icon: "🏷️",
          path: "/admin/location-types",
        },
        {
          name: "Search Locations",
          icon: "📌",
          path: "/admin/passenger-locations",
        },
{
          name: "Route Stops",
          icon: "📍",
          path: "/admin/route-stops",
        },
{
        name: "Homepage Routes",
        icon: "🧭",
        path: "/admin/homepage-routes",
      },
      {
        name: "Schedules",
        icon: "⏰",
        path: "/admin/schedules",
      },
      {
        name: "Live Tracking",
        icon: "📍",
        path: "/admin/tracking",
      },
    ],
  },
  {
    title: "People & Access",
    items: [
      {
        name: "Staff",
        icon: "👥",
        path: "/admin/staff",
      },
      {
        name: "Departments",
        icon: "🏢",
        path: "/admin/departments",
      },
      {
        name: "Designations",
        icon: "🏷️",
        path: "/admin/designations",
      },
      {
        name: "Users",
        icon: "👤",
        path: "/admin/users",
        permission: "user.view",
      },
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
    ],
  },
  {
    title: "Revenue Management",
    items: [
      {
        name: "Fare Categories",
        icon: "🏷️",
        path: "/admin/fare-categories",
      },
      {
        name: "Pricing Rules",
        icon: "💰",
        path: "/admin/pricing-rules",
      },
      {
        name: "Offers",
        icon: "🎁",
        path: "/admin/offers",
      },
      {
        name: "Coupons",
        icon: "🎟️",
        path: "/admin/coupons",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Passengers",
        icon: "👥",
        path: "/admin/passengers",
      },
      {
        name: "Bookings",
        icon: "📚",
        path: "/bookings",
      },
      {
        name: "Tickets",
        icon: "🎫",
        path: "/admin/tickets",
      },
      {
        name: "Payments",
        icon: "💳",
        path: "/admin/payments",
      },

      {
        name: "Refund Management",
        icon: "↩️",
        path: "/admin/refunds",
        activePrefixes: ["/admin/refunds"],
        permission: "refund.view",
      },
      {
        name: "Customer Intelligence",
        icon: "🧠",
        path: "/admin/customer-intelligence",
      },
      {
        name: "Reports",
        icon: "📊",
        path: "/admin/reports",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        name: "Company Profile",
        icon: "🏢",
        path: "/admin/company",
      },
    ],
  },
];
const AdminSidebar = () => {
  const location = useLocation();
  const { hasPermission } = usePermission();

  const [company, setCompany] = useState({});
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5001";

const logoUrl = company?.logo_url
  ? company.logo_url.startsWith("http")
    ? company.logo_url
    : `${API_ORIGIN}${company.logo_url}`
  : "";
  useEffect(() => {
    let mounted = true;

    async function loadCompany() {
      try {
      const res = await fetch(`${API_BASE}/companies`);

if (!res.ok) {
  throw new Error(`Company API failed: ${res.status}`);
}

const result = await res.json();

if (!mounted) return;

const companyData = Array.isArray(result?.data)
  ? result.data[0]
  : result?.data || result?.company || result;

setCompany(companyData || {});
      } catch (err) {
        console.error("Company load failed:", err);
      }
    }

    loadCompany();

    return () => {
      mounted = false;
    };
  }, []);

  const sections = useMemo(() => {
    return MENU_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.permission || hasPermission(item.permission)
      ),
    })).filter((section) => section.items.length);
  }, [hasPermission]);

  const isActive = (item) => {
    if (location.pathname === item.path) return true;

    if (item.activePrefixes) {
      return item.activePrefixes.some((prefix) =>
        location.pathname.startsWith(prefix)
      );
    }

    return false;
  };

  return (


    <>


      <button


        type="button"


        className="admin-sidebar-toggle"


        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}


        aria-expanded={isOpen}


        onClick={() => setIsOpen((current) => !current)}


      >


        <span />


        <span />


        <span />


      </button>



      {isOpen && (


        <button


          type="button"


          className="admin-sidebar-backdrop"


          aria-label="Close navigation menu"


          onClick={() => setIsOpen(false)}


        />


      )}



      <aside


        className={`admin-sidebar ${


          isOpen ? "admin-sidebar--open" : ""


        }`}


      >
      <div className="admin-sidebar__brand">

        <div className="admin-sidebar__logo-shell">

        {logoUrl ? (
  <img
    key={logoUrl}
    src={logoUrl}
    alt="Company Logo"
    className="admin-sidebar__logo"
    onLoad={() => setLogoLoaded(true)}
    onError={(e) => {
      console.error("Sidebar logo failed:", logoUrl);
      e.currentTarget.style.display = "none";
      setLogoLoaded(false);
    }}
  />
) : (
  <span style={{ fontSize: "34px" }}>🚌</span>
)}

        </div>

        <div className="admin-sidebar__brand-copy">
          <h2>
            {company.company_name || "Rular Bus ERP"}
          </h2>

          <p>
            {company.short_name || "Enterprise Edition"}
          </p>

          <div className="admin-sidebar__status">
            <span className="admin-sidebar__status-dot"></span>
            <span>System Online</span>
          </div>

        </div>

      </div>

      <nav className="admin-sidebar__navigation">
        {sections.map((section) => (
          <div
            key={section.title}
            className="admin-sidebar__section"
          >
            <div className="admin-sidebar__section-title">
              {section.title}
            </div>

            <div className="admin-sidebar__menu">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    isActive(item)
                      ? "admin-sidebar__link admin-sidebar__link--active"
                      : "admin-sidebar__link"
                  }
                >
                  <span className="admin-sidebar__link-icon">
                    {item.icon}
                  </span>

                  <span className="admin-sidebar__link-label">
                    {item.name}
                  </span>

                  <span className="admin-sidebar__link-arrow">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__footer-icon">
          ERP
        </div>

        <div className="admin-sidebar__footer-copy">
          <strong>
            Enterprise Edition
          </strong>

          <small>
            Secure Admin Panel
          </small>
        </div>

        <div className="admin-sidebar__footer-shield">
          🛡️
        </div>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
