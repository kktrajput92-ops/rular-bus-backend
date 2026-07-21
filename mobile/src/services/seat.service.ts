import { API } from "@/constants/api";

export async function getSeatStatus(
  scheduleId: number
) {
  const response = await fetch(
    `${API.BASE_URL}/seats/${scheduleId}`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to load seats"
    );
  }

  return result;
}

