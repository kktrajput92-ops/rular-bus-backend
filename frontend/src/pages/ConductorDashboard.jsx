import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = "http://localhost:5000/api";

export default function ConductorDashboard() {
  const [stats, setStats] = useState({
    totalPassengers: 0,
    boarded: 0,
    remaining: 0,
  });

  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);

  const loadDashboard = async () => {
    try {
      const res = await axios.get(`${API}/tickets/conductor-dashboard`);
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadDashboard();

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: 250 },
        false
      );

      scannerRef.current.render(
        async (decodedText) => {
          try {
            const ticket = decodedText.replace(/"/g, "");

            const res = await axios.post(
              `${API}/tickets/board/${ticket}`
            );

            setMessage(res.data.message);
            loadDashboard();
          } catch (err) {
            setMessage(
              err.response?.data?.message || "Boarding Failed"
            );
          }
        },
        () => {}
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🚍 Conductor Dashboard</h1>

      <h2>Total : {stats.totalPassengers}</h2>
      <h2>Boarded : {stats.boarded}</h2>
      <h2>Remaining : {stats.remaining}</h2>

      <hr />

      <div id="reader"></div>

      <h3>{message}</h3>
    </div>
  );
}
