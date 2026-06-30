import AdminSchedule from "./pages/AdminSchedule";import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Seats from "./pages/Seats";
import Passenger from "./pages/Passenger";
import Payment from "./pages/Payment";
import Ticket from "./pages/Ticket";
import BookingHistory from "./pages/BookingHistory";
import Admin from "./pages/Admin";
import AdminBus from "./pages/AdminBus";
import AdminRoute from "./pages/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/seats" element={<Seats />} />
        <Route path="/passenger" element={<Passenger />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/bookings" element={<BookingHistory />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/buses" element={<AdminBus />} />
        <Route path="/admin/routes" element={<AdminRoute />} />
         <Route path="/admin/schedules" element={<AdminSchedule />} />      
</Routes>
    </BrowserRouter>
  );
}

export default App;
