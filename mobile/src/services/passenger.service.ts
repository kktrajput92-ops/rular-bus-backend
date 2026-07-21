import { API } from "@/constants/api";

export type PassengerPayload = {
  full_name: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
};

export async function createPassenger(
  data: PassengerPayload
) {
  const response = await fetch(
    `${API.BASE_URL}/passengers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  console.log("Passenger Status =", response.status);
  console.log("Passenger Response =", result);

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to create passenger"
    );
  }

  return result;
}
