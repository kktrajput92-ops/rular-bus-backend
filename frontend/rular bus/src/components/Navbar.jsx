import { useNavigate } from "react-router-dom";

import logo from "../assets/logo/rular-logo.png";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import ThemeToggle from "../theme/ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();

  const {
    customer,
    loading,
    isAuthenticated,
    logout,
  } = useCustomerAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/", {
      replace: true,
    });
  };

  return (
    <nav className="worker-navbar">
      <div
        className="worker-brand"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/")}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            navigate("/");
          }
        }}
        style={{
          cursor: "pointer",
        }}
      >
        <img
          src={logo}
          alt="Rular Bus"
          className="worker-brand-logo"
        />

        <div className="worker-brand-copy">
          <h2>Rular Bus</h2>
          <p>घर तक भरोसे का सफर</p>
        </div>
      </div>

      <div className="worker-navbar-actions">
        <button
          type="button"
          className="worker-booking-button"
          onClick={() =>
            navigate("/bookings")
          }
        >
          🎫 मेरी बुकिंग
        </button>

        <ThemeToggle />

        {!loading &&
          !isAuthenticated && (
            <>
              <button
                type="button"
                className="worker-login-button"
                onClick={() =>
                  navigate(
                    "/customer/login"
                  )
                }
              >
                यात्री लॉगिन
              </button>

              <button
                type="button"
                className="worker-login-button"
                onClick={() =>
                  navigate(
                    "/customer/register"
                  )
                }
              >
                रजिस्टर
              </button>
            </>
          )}

        {!loading &&
          isAuthenticated && (
            <>
              <button
                type="button"
                className="worker-login-button"
                onClick={() =>
                  navigate(
                    "/saved-travellers"
                  )
                }
              >
                👥 यात्री
              </button>

              <button
                type="button"
                className="worker-login-button"
                onClick={() =>
                  navigate("/profile")
                }
              >
                👤 प्रोफाइल
              </button>

              <span
                title={
                  customer?.full_name ||
                  ""
                }
                style={{
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                }}
              >
                {customer?.full_name ||
                  "यात्री"}
              </span>

              <button
                type="button"
                className="worker-login-button"
                onClick={handleLogout}
              >
                लॉगआउट
              </button>
            </>
          )}
      </div>
    </nav>
  );
}
