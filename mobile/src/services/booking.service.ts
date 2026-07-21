import { API } from "@/constants/api";

export type BookingPayload = {
  passenger_id: number;
  schedule_id: number;
  seat_number: number;
};

export async function createBooking(
  data: BookingPayload
) {
  const response = await fetch(
    `${API.BASE_URL}/bookings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to create booking"
    );
  }

  return result;
}

