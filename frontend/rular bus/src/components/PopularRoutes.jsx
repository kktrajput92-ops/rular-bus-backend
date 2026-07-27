import { useEffect, useState } from "react";
import { API_BASE } from "../api/api";

export default function PopularRoutes({
  setSource,
  setDestination,
}) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadRoutes = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/homepage-route-shortcuts/public`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load homepage routes."
          );
        }

        if (mounted) {
          setRoutes(data.routes || []);
        }
      } catch (requestError) {
        console.error(
          "Homepage routes load failed:",
          requestError
        );

        if (mounted) {
          setError("लोकप्रिय रास्ते अभी उपलब्ध नहीं हैं।");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRoutes();

    return () => {
      mounted = false;
    };
  }, []);

  const selectRoute = (route) => {
    setSource(route.source);
    setDestination(route.destination);

    document
      .querySelector(".worker-search-card")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  if (!loading && !error && routes.length === 0) {
    return null;
  }

  return (
    <section className="worker-section">
      <div className="worker-section-heading">
        <span>जल्दी चुनें</span>
        <h2>एक क्लिक में अपना रास्ता चुनें</h2>
        <p>यात्रियों के लिए चुने गए लोकप्रिय सफर</p>
      </div>

      {loading && (
        <div className="worker-route-state">
          लोकप्रिय रास्ते लोड हो रहे हैं...
        </div>
      )}

      {!loading && error && (
        <div className="worker-route-state worker-route-state-error">
          {error}
        </div>
      )}

      {!loading && !error && routes.length > 0 && (
        <div className="worker-route-grid">
          {routes.map((route) => (
            <button
              type="button"
              key={route.id}
              className="worker-route-card"
              onClick={() => selectRoute(route)}
            >
              <div className="worker-route-icon">🚌</div>

              <div className="worker-route-copy">
                <strong>
                  {route.source}
                  <span> → </span>
                  {route.destination}
                </strong>

                <small>
                  {route.note ||
                    route.display_label ||
                    "लोकप्रिय सफर"}
                </small>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
