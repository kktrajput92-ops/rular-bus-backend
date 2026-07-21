import { API } from "@/constants/api";

type SearchParams = {
  source: string;
  destination: string;
  journey_date: string;
};

export async function searchBus(params: SearchParams) {
  const query = new URLSearchParams({
    source: params.source,
    destination: params.destination,
    journey_date: params.journey_date,
  });

  const response = await fetch(
    `${API.BASE_URL}/search?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to search buses");
  }

  return response.json();
}
