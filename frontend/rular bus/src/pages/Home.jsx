import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/logo/rular-logo.png";
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

    } finally {

      setLoading(false);

    }

  };

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: 20,
        fontFamily: "Arial",
      }}
    >

       <div
  style={{
    maxWidth: 850,
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 18px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,.08)",
  }}
>
  <div
    style={{
      fontSize: "22px",
      fontWeight: "700",
      color: "#0B3D91",
    }}
  >
    🚌 Rular Bus
  </div>

  <div
    style={{
      fontSize: "15px",
      color: "#555",
      fontWeight: "500",
    }}
  >
    Home
  </div>
</div>


<div
  style={{
    textAlign: "center",
    marginBottom: "15px",
  }}
>
  <img
    src={logo}
    alt="Rular Bus"
    style={{
      width: "220px",
      maxWidth: "100%",
      height: "auto",
    }}
  />

  <p
  style={{
    textAlign: "center",
    fontSize: "32px",
    fontWeight: "700",
    color: "#0B3D91",
    marginTop: "15px",
    marginBottom: "10px",
  }}
>
  India's Smart Bus Booking Platform
</p>

<p
  style={{
    textAlign: "center",
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "25px",
  }}
>
  Book Safe • Travel Smart • Reach Happy
</p>
</div>

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
            padding: 12,
            marginTop: 15,
          }}
        />

        <input
          type="text"
          placeholder="To City"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
          }}
        />

        <input
          type="date"
          value={journeyDate}
          onChange={(e) => setJourneyDate(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 10,
          }}
        />

        <button
          onClick={searchBus}
          disabled={loading}
          style={{
            width: "100%",
            padding: 15,
            marginTop: 15,
            background: "#d62828",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Searching..." : "Search Buses"}
        </button>

        <hr />

        <h3>Available Buses</h3>
        {buses.length === 0 ? (

          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginTop: 20,
            }}
          >
            No buses found.
          </p>

        ) : (

          buses.map((bus) => (

            <div
              key={bus.schedule_id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                marginTop: 15,
                background: "#fafafa",
              }}
            >

              <h3>{bus.bus_name}</h3>

              <p>🚌 {bus.bus_number}</p>

              <p>
                📍 {bus.source} → {bus.destination}
              </p>

              <p>
                💺 Available Seats : {bus.available_seats}
              </p>

              <p>
                🕒 Departure :
                {" "}
                {new Date(
                  bus.departure_time
                ).toLocaleString()}
              </p>

              <p>
                🕒 Arrival :
                {" "}
                {new Date(
                  bus.arrival_time
                ).toLocaleString()}
              </p>

              <button
                onClick={() =>
                  navigate("/seats", {
                    state: bus,
                  })
                }
                style={{
                  width: "100%",
                  padding: 12,
                  marginTop: 12,
                  background: "#198754",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Select Seats
              </button>

            </div>

          ))
        )}

      </div>

  );

}

export default Home;
