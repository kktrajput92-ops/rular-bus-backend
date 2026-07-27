import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchCard from "../components/SearchCard";
import PopularRoutes from "../components/PopularRoutes";
import WhyChooseUs from "../components/WhyChooseUs";
import BusCard from "../components/BusCard";
import Footer from "../components/Footer";
import "./Home.css";
import "./AudienceHome.css";
import {
  detectClientChannel,
  detectDeviceInfo,
  getAnonymousSessionId,
} from "../utils/customerAnalytics";

function Home() {
  const navigate = useNavigate();

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const searchBus = async () => {
    const cleanSource = source.trim();
    const cleanDestination = destination.trim();

    if (
      !cleanSource ||
      !cleanDestination ||
      !journeyDate
    ) {
      setSearchMessage(
        "कृपया प्रस्थान स्थान, गंतव्य और यात्रा की तारीख चुनें।"
      );
      return;
    }

    if (
      cleanSource.toLowerCase() ===
      cleanDestination.toLowerCase()
    ) {
      setSearchMessage(
        "प्रस्थान और गंतव्य एक जैसे नहीं हो सकते। कृपया अलग-अलग स्थान चुनें।"
      );
      return;
    }

    setSearchMessage("");
    setLoading(true);

    const deviceInfo = detectDeviceInfo();

    const params = new URLSearchParams({
        source: cleanSource,
        destination: cleanDestination,
        journey_date: journeyDate,
      anonymous_session_id:
        getAnonymousSessionId(),
      channel: detectClientChannel(),
      device_type: deviceInfo.device_type,
      operating_system:
        deviceInfo.operating_system,
      browser_name: deviceInfo.browser_name,
      location_permission_status:
        sessionStorage.getItem(
          "rular_location_permission_status"
        ) || "NOT_REQUESTED",
    });

    const nearestLocationId =
      sessionStorage.getItem(
        "rular_nearest_location_id"
      );

    const selectedNearestLocationId =
      sessionStorage.getItem(
        "rular_selected_nearest_location_id"
      );

    if (nearestLocationId) {
      params.set(
        "nearest_location_id",
        nearestLocationId
      );
    }

    if (selectedNearestLocationId) {
      params.set(
        "selected_nearest_location_id",
        selectedNearestLocationId
      );
    }

    const url = `/search?${params.toString()}`;

    try {
      const response = await api.get(url);

      const availableBuses =
        response.data.buses || [];

      setBuses(availableBuses);

      if (availableBuses.length === 0) {
        setSearchMessage(
          "इस तारीख पर अभी कोई बस उपलब्ध नहीं मिली। दूसरी तारीख या नजदीकी स्थान चुनकर दोबारा खोजें।"
        );
      } else {
        setSearchMessage(
          `${availableBuses.length} उपलब्ध बस मिलीं। अपनी सुविधा के अनुसार बस चुनें।`
        );
      }

      if (response.data.search_log_id) {
        sessionStorage.setItem(
          "rular_search_log_id",
          String(response.data.search_log_id)
        );
      }
    } catch (error) {
      console.error("Bus search failed:", error);

        setBuses([]);
        setSearchMessage(
          "क्षमा कीजिए, अभी बसें खोजने में परेशानी हुई। कृपया दोबारा कोशिश करें।"
        );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="worker-home">
      <Navbar />

      <main>
          <section
            className="passenger-welcome-strip"
            aria-label="यात्री स्वागत"
          >
            <div
              className="passenger-welcome-icon"
              aria-hidden="true"
            >
              🙏
            </div>

            <div className="passenger-welcome-copy">
              <span>
                आपका सम्मान, हमारी जिम्मेदारी
              </span>

              <strong>
                नमस्ते यात्री जी, Rular Bus में आपका स्वागत है
              </strong>

              <p>
                आपकी यात्रा आसान, सुरक्षित और सम्मानजनक
                बनाने के लिए हम हर कदम पर आपके साथ हैं।
              </p>
            </div>

            <button
              type="button"
              className="passenger-welcome-action"
              onClick={() =>
                document
                  .querySelector(".worker-search-card")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
              }
            >
              सफर शुरू करें
            </button>
          </section>

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
          searchMessage={searchMessage}
        />

        <PopularRoutes
          setSource={setSource}
          setDestination={setDestination}
        />

        <WhyChooseUs />

        <section className="worker-section">
          <div className="worker-section-heading">
            <span>आपके सफर के लिए</span>
            <h2>उपलब्ध बसें</h2>
          </div>

          {buses.length === 0 ? (
            <div className="worker-empty-state">
              <div>🚌</div>

              <strong>
                अपनों तक पहुँचने का रास्ता बस एक खोज दूर है
              </strong>

              <p>
                शहर और यात्रा की तारीख चुनें। आपके लिए सही बसें
                यहाँ दिखाई देंगी।
              </p>
            </div>
          ) : (
            buses.map((bus) => (
              <BusCard
                key={bus.schedule_id}
                bus={bus}
                onSelect={() =>
                  navigate("/seats", {
                    state: bus,
                  })
                }
              />
            ))
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
