import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Seats from "./pages/Seats";
import Passenger from "./pages/Passenger";
import Payment from "./pages/Payment";
import Ticket from "./pages/Ticket";
import BookingHistory from "./pages/BookingHistory";
import Admin from "./pages/Admin";
import AdminBus from "./pages/AdminBus";
import AdminRoute from "./pages/AdminRoute";
import AdminSchedule from "./pages/AdminSchedule";
import AdminDriver from "./pages/AdminDriver";
import QRScanner from "./pages/QRScanner";
import ConductorDashboard from "./pages/ConductorDashboard";
import Login from "./pages/Login";
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
      <Route path="/bookings" element={<BookingHistory />} />
      <Route path="/login" element={<Login />} />
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
  path="/admin/seat-layout/:busId"
  element={<SeatLayout />}
/>
      <Route path="/admin/routes" element={<AdminRoute />} />
      
<Route path="/admin/schedules" element={<AdminSchedule />} />
      <Route path="/admin/drivers" element={<AdminDriver />} />
      <Route path="/conductor-dashboard"element={<ConductorDashboard />}
/>    
<Route path="/icon-lab" element={<IconLab />} />
</Routes>
  </BrowserRouter>
);
}

export default App;

