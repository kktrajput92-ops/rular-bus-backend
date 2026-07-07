import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api/api";

export default function QRScanner() {
  const [ticket, setTicket] = useState(null);
const [message, setMessage] = useState("");
  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();

        try {
  console.log(decodedText);
  alert(decodedText);

  const data = JSON.parse(decodedText);

          const res = await api.get(
            `/tickets/verify/${data.ticket_number}`
          );

          setTicket(res.data.ticket);

      } catch (err) {
  console.log(err);
  console.log(err.response?.data);
  alert(err.response?.data?.message || err.message);
}
        
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);
const boardPassenger = async () => {
  try {

    const res = await api.post(
      `/tickets/board/${ticket.ticket_number}`
    );

    setMessage(res.data.message);

  } catch (err) {

    setMessage(
      err.response?.data?.message || "Boarding Failed"
    );

  }
};
  return (
  <div style={{ padding: 20 }}>
    <h1>QR Scanner Working</h1>
  </div>
);
}
