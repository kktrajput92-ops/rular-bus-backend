import { API } from "@/constants/api";

export const getTicketPdfUrl = (ticketNumber: string) =>
  `${API.BASE_URL}/tickets/pdf/${ticketNumber}`;
