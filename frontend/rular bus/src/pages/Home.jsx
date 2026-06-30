import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function Home() {
  const navigate = useNavigate();

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchBus = async () => {
    console.time("Search API");
    setLoading(true);

    try {
      const res = await api.get(
        `/search?source=${source}&destination=${destination}`
      );

      console.timeEnd("Search API");

      setBuses(res.data.buses);
    } catch (err) {
      console.timeEnd("Search API");
      console.error(err);
      alert("Unable to search buses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "auto",
          background: "#fff",
          borderRadius: "15px",
          padding: "20px",
          boxShadow: "0 10px 25px rgba(0,0,0,.15)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#d62828" }}>
          🚌 Rular Bus
        </h1>

        <input
          placeholder="From"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <input
          placeholder="To"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
          }}
        />

        <input
          type="date"
          value={journeyDate}
          onChange={(e) => setJourneyDate(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
          }}
        />

        <button
          onClick={searchBus}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            marginTop: "15px",
            background: "#d62828",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Searching..." : "Search Buses"}
        </button>

        {buses.map((bus) => (
          <div
            key={bus.schedule_id}
            style={{
              marginTop: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "15px",
            }}
          >
            <h2>{bus.bus_name}</h2>

            <p>
              {bus.source} ➜ {bus.destination}
            </p>

            <p>🚌 Bus No: {bus.bus_number}</p>

            <p>💺 Available Seats: {bus.available_seats}</p>

            <p>
              🕗 Departure:{" "}
              {new Date(bus.departure_time).toLocaleTimeString()}
            </p>

            <p>
              🕐 Arrival:{" "}
              {new Date(bus.arrival_time).toLocaleTimeString()}
            </p>

            <button
              onClick={() => navigate("/seats")}
              style={{
                width: "100%",
                padding: "12px",
                background: "#198754",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              View Seats
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
