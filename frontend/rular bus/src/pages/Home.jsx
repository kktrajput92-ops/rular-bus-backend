import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/logo/rular-logo.png";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchCard from "../components/SearchCard";
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

    <Navbar />
    <Hero />
<SearchCard />

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
