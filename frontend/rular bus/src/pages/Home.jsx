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

    if (!source || !destination || !journeyDate) {

      alert("Please fill all fields");

      return;

    }

    setLoading(true);

    try {

      const res = await api.get(

        `/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&journey_date=${journeyDate}`

      );

      setBuses(res.data.buses || []);

    } catch (err) {

      console.error(err);

      alert("Unable to search buses");

    }

    setLoading(false);

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
          maxWidth: "800px",
          margin: "auto",
          background: "#ffffff",
          borderRadius: "15px",
          padding: "25px",
          boxShadow: "0 10px 25px rgba(0,0,0,.15)",
        }}
      >

        <h1
          style={{
            textAlign: "center",
            color: "#d62828",
          }}
        >
          🚌 Rular Bus
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
          }}
        >
          Search & Book Your Journey
        </p>
        <input
          type="text"
          placeholder="From City"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <input
          type="text"
          placeholder="To City"
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

        <hr />

        <h3>Available Buses</h3>

        {buses.length === 0 ? (

          <p>No buses found.</p>

        ) : (

          buses.map((bus) => (

            <div
              key={bus.schedule_id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "15px",
                marginTop: "15px",
              }}
            >
              <h3>{bus.bus_name}</h3>

              <p>
                🚌 {bus.bus_number}
              </p>

              <p>
                📍 {bus.source} → {bus.destination}
              </p>

              <p>
                💺 Available Seats: {bus.available_seats}
              </p>

              <p>
                🕒 Departure:{" "}
                {new Date(bus.departure_time).toLocaleString()}
              </p>

              <p>
                🕒 Arrival:{" "}
                {new Date(bus.arrival_time).toLocaleString()}
              </p>

              <button
                onClick={() =>
                  navigate("/seats", {
                    state: bus,
                  })
                }
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
                Select Seats
              </button>

            </div>

          ))

        )}
      </div>

    </div>

  );

}

export default Home;
