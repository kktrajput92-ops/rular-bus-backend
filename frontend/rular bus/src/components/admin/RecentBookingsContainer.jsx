import { useEffect, useState } from "react";
import api from "../../api/api";
import RecentBookings from "./RecentBookings";
export default function RecentBookingsContainer({ bookings }) {
  return <RecentBookings bookings={bookings} />;
}
