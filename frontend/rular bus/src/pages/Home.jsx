import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/logo/rular-logo.png";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchCard from "../components/SearchCard";
import PopularRoutes from "../components/PopularRoutes";
import WhyChooseUs from "../components/WhyChooseUs";
import BusCard from "../components/BusCard";
import Footer from "../components/Footer";
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
console.log("Search Params:", {
  source,
  destination,
  journeyDate,
});

console.log("API Response:", res.data);
console.log("API Response:", res.data);
console.log("First Bus:", res.data.buses?.[0]);
      setBuses(res.data.buses || []);
alert(JSON.stringify(res.data));
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
<SearchCard
  source={source}
  destination={destination}
  journeyDate={journeyDate}
  setSource={setSource}
  setDestination={setDestination}
  setJourneyDate={setJourneyDate}
  searchBus={searchBus}
  loading={loading}
/>
<PopularRoutes />
       <WhyChooseUs />
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
  <BusCard
    key={bus.id}
    bus={bus}
    onSelect={() =>
      navigate("/seats", {
        state: bus,
      })
    }
  />
))

      
          

    
        )}
    <Footer />
      </div>

  );

}

export default Home;
