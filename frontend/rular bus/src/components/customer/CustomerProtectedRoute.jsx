import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

export default function CustomerProtectedRoute() {
  const {
    customer,
    loading,
    isAuthenticated,
  } = useCustomerAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <p>Loading customer account...</p>
      </div>
    );
  }

  if (!isAuthenticated || !customer) {
    return (
      <Navigate
        to="/customer/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}

