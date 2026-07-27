import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Seats from "./pages/Seats";
import Passenger from "./pages/Passenger";
import Payment from "./pages/Payment";
import Ticket from "./pages/Ticket";
import BookingHistory from "./pages/BookingHistory";
import Admin from "./pages/Admin";
import AdminBus from "./pages/AdminBus";
import AdminBusCatalog from "./pages/AdminBusCatalog";
import AdminRoute from "./pages/AdminRoute";
import AdminHomepageRoutes from "./pages/AdminHomepageRoutes";
import AdminRouteStops from "./pages/AdminRouteStops";
import AdminPassengerLocations from "./pages/AdminPassengerLocations";
import AdminLocationTypes from "./pages/AdminLocationTypes";
import AdminSchedule from "./pages/AdminSchedule";
import AdminDriver from "./pages/AdminDriver";
import QRScanner from "./pages/QRScanner";
import ConductorDashboard from "./pages/ConductorDashboard";
import Login from "./pages/Login";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerSavedTravellers from "./pages/CustomerSavedTravellers";
import CustomerForgotPassword from "./pages/CustomerForgotPassword";
import CustomerResetPassword from "./pages/CustomerResetPassword";
import CustomerChangePassword from "./pages/CustomerChangePassword";
import CustomerProtectedRoute from "./components/customer/CustomerProtectedRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminStaff from "./pages/AdminStaff";
import AdminDepartment from "./pages/AdminDepartment";
import AdminDesignation from "./pages/AdminDesignation";
import AdminRole from "./pages/AdminRole";
import AdminRolePermission from "./pages/AdminRolePermission";
import AdminPermission from "./pages/AdminPermission";
import AdminUser from "./pages/AdminUser";
import AdminCompany from "./pages/AdminCompany";
import PermissionRoute from "./components/auth/PermissionRoute";
import Unauthorized from "./pages/Unauthorized";
import IconLab from "./pages/IconLab";
import SeatLayout from "./pages/SeatLayout";
import AdminFareCategories from "./pages/AdminFareCategories";
import AdminPricingRules from "./pages/AdminPricingRules";
import AdminOffers from "./pages/AdminOffers";
import AdminCoupons from "./pages/AdminCoupons";
import AdminCustomerIntelligence from "./pages/AdminCustomerIntelligence";
import AdminRefunds from "./pages/AdminRefunds";
import AdminRefundDetails from "./pages/AdminRefundDetails";

function App() {
    return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/seats" element={<Seats />} />
      <Route path="/passenger" element={<Passenger />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/ticket" element={<Ticket />} />
      <Route path="/qr-scanner" element={<QRScanner />} />

        <Route
          path="/login"
          element={
            <Navigate
              to="/customer/login"
              replace
            />
          }
        />

        <Route
          path="/customer/login"
          element={<CustomerLogin />}
        />

        <Route
          path="/customer/register"
          element={<CustomerRegister />}
        />

        <Route
          path="/customer/forgot-password"
          element={<CustomerForgotPassword />}
        />

        <Route
          path="/customer/reset-password"
          element={<CustomerResetPassword />}
        />


        <Route
          path="/admin/login"
          element={<Login />}
        />

        <Route element={<CustomerProtectedRoute />}>
          <Route
            path="/bookings"
            element={<BookingHistory />}
          />

          <Route
            path="/profile"
            element={<CustomerProfile />}
          />

          <Route
            path="/change-password"
            element={<CustomerChangePassword />}
          />


          <Route
            path="/saved-travellers"
            element={
              <CustomerSavedTravellers />
            }
          />


        </Route>

<Route path="/unauthorized" element={<Unauthorized />} />      
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/staff"
  element={
    <ProtectedRoute>
      <AdminStaff />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/departments"
  element={
    <ProtectedRoute>
      <AdminDepartment />
    </ProtectedRoute>
     }
  />
  
<Route
  path="/admin/designations"
  element={
    <ProtectedRoute>
      <AdminDesignation />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/roles"
  element={
    <ProtectedRoute>
      <PermissionRoute permission="role.view">
  <AdminRole />
</PermissionRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/role-permissions"
  element={
    <ProtectedRoute>
      <PermissionRoute permission="role.view">
  <AdminRolePermission />
</PermissionRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/permissions"
  element={
    <ProtectedRoute>
      <PermissionRoute permission="permission.view">
  <AdminPermission />
</PermissionRoute>
    </ProtectedRoute>
  }
/>
   <Route
  path="/admin/users"
  element={
    <ProtectedRoute>
      <PermissionRoute permission="user.view">
  <AdminUser />
</PermissionRoute>
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/company"
  element={
    <ProtectedRoute>
      <AdminCompany />
    </ProtectedRoute>
  }
/>

      <Route path="/admin/buses" element={<AdminBus />} />

<Route
  path="/admin/bus-catalog"
  element={
    <ProtectedRoute>
      <AdminBusCatalog />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/seat-layout/:busId"
  element={<SeatLayout />}
/>
      <Route path="/admin/routes" element={<AdminRoute />} />

  
  
  <Route
    path="/admin/location-types"
    element={
      <ProtectedRoute>
        <AdminLocationTypes />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/passenger-locations"
    element={
      <ProtectedRoute>
        <AdminPassengerLocations />
      </ProtectedRoute>
    }
  />

<Route
    path="/admin/route-stops"
    element={
      <ProtectedRoute>
        <AdminRouteStops />
      </ProtectedRoute>
    }
  />

<Route
    path="/admin/homepage-routes"
    element={
      <ProtectedRoute>
        <AdminHomepageRoutes />
      </ProtectedRoute>
    }
  />

      
<Route path="/admin/schedules" element={<AdminSchedule />} />
      <Route path="/admin/drivers" element={<AdminDriver />} />
      <Route path="/conductor-dashboard"element={<ConductorDashboard />}
/>    
<Route
  path="/admin/fare-categories"
  element={
    <ProtectedRoute>
      <AdminFareCategories />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/pricing-rules"
  element={
    <ProtectedRoute>
      <AdminPricingRules />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/offers"
  element={
    <ProtectedRoute>
      <AdminOffers />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/coupons"
  element={
    <ProtectedRoute>
      <AdminCoupons />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/customer-intelligence"
  element={
    <ProtectedRoute>
      <AdminCustomerIntelligence />
    </ProtectedRoute>
  }
/>
<Route path="/icon-lab" element={<IconLab />} />

        <Route
          path="/admin/refunds"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="refund.view">
                <AdminRefunds />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/refunds/:refundId"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="refund.view">
                <AdminRefundDetails />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />

      </Routes>
  </BrowserRouter>
);
}

export default App;

