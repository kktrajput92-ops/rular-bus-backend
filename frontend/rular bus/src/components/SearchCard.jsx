import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";
import "./SearchCard.css";
import {
  detectClientChannel,
  getAnonymousSessionId,
} from "../utils/customerAnalytics";

const getLocationLabel = (location) =>
  location.display_name ||
  location.location_name ||
  "";

export default function SearchCard({
  source,
  destination,
  journeyDate,
  setSource,
  setDestination,
  setJourneyDate,
  searchBus,
  loading,
  searchMessage,
}) {
  const [sourceLocations, setSourceLocations] = useState([]);
  const [destinationLocations, setDestinationLocations] =
    useState([]);
  const [nearestLocations, setNearestLocations] = useState([]);
  const [locationLoading, setLocationLoading] =
    useState(false);
  const [locationMessage, setLocationMessage] =
    useState("");

  const loadLocations = useCallback(async () => {
    try {
      const [sourceResponse, destinationResponse] =
        await Promise.all([
          fetch(
            `${API_BASE}/passenger-locations/public?type=source`
          ),
          fetch(
            `${API_BASE}/passenger-locations/public?type=destination`
          ),
        ]);

      const sourceData = await sourceResponse.json();
      const destinationData =
        await destinationResponse.json();

      if (
        !sourceResponse.ok ||
        !sourceData.success ||
        !destinationResponse.ok ||
        !destinationData.success
      ) {
        throw new Error(
          "Passenger locations could not be loaded."
        );
      }

      setSourceLocations(sourceData.locations || []);
      setDestinationLocations(
        destinationData.locations || []
      );
    } catch (error) {
      console.error(
        "Passenger search locations failed:",
        error
      );

      setLocationMessage(
        "लोकेशन सूची लोड नहीं हो सकी। आप नाम manually लिख सकते हैं।"
      );
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);


  const recordLocationConsent = async ({
    consentStatus,
    nearestLocationId = null,
    accuracyMeters = null,
  }) => {
    sessionStorage.setItem(
      "rular_location_permission_status",
      consentStatus
    );

    try {
      await fetch(
        `${API_BASE}/customer-analytics/location-consent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            anonymous_session_id:
              getAnonymousSessionId(),
            consent_status: consentStatus,
            channel: detectClientChannel(),
            nearest_location_id:
              nearestLocationId,
            accuracy_meters:
              accuracyMeters,
          }),
        }
      );
    } catch (error) {
      console.error(
        "Location consent analytics failed:",
        error
      );
    }
  };

  const findNearestSource = () => {
    setLocationMessage("");
    setNearestLocations([]);

    if (!navigator.geolocation) {
      setLocationMessage(
        "इस डिवाइस में location सुविधा उपलब्ध नहीं है।"
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage(
      "आपके पास की pickup locations खोजी जा रही हैं..."
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            latitude: String(
              position.coords.latitude
            ),
            longitude: String(
              position.coords.longitude
            ),
            limit: "5",
          });

          const response = await fetch(
            `${API_BASE}/passenger-locations/public/nearest?${params.toString()}`
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.message ||
                "Nearby locations could not be found."
            );
          }

          const nearby = data.nearest_locations || [];

          setNearestLocations(nearby);

          sessionStorage.setItem(
            "rular_location_permission_status",
            "GRANTED"
          );

          if (nearby[0]?.id) {
            sessionStorage.setItem(
              "rular_nearest_location_id",
              String(nearby[0].id)
            );
          }

          await recordLocationConsent({
            consentStatus: "GRANTED",
            nearestLocationId:
              nearby[0]?.id || null,
            accuracyMeters: Math.round(
              position.coords.accuracy || 0
            ) || null,
          });

          if (nearby.length === 0) {
            setLocationMessage(
              "आपके पास कोई configured pickup location नहीं मिली।"
            );
            return;
          }

          const closest = nearby[0];

          setSource(getLocationLabel(closest));

          setLocationMessage(
            `सबसे पास: ${getLocationLabel(
              closest
            )} — ${closest.distance_km} km`
          );
        } catch (error) {
          console.error(
            "Nearest source request failed:",
            error
          );

          setLocationMessage(
            "नजदीकी pickup location नहीं मिल सकी। आप dropdown से चुन सकते हैं।"
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(
          "Passenger geolocation failed:",
          error
        );

        if (error.code === 1) {
          recordLocationConsent({
            consentStatus: "DENIED",
          });

          setLocationMessage(
            "Location permission बंद है। कृपया अनुमति दें या जगह manually चुनें।"
          );
        } else if (error.code === 2) {
          recordLocationConsent({
            consentStatus: "UNAVAILABLE",
          });

          setLocationMessage(
            "आपकी location उपलब्ध नहीं हो सकी।"
          );
        } else {
          recordLocationConsent({
            consentStatus: "TIMEOUT",
          });

          setLocationMessage(
            "Location request का समय समाप्त हो गया। दोबारा कोशिश करें।"
          );
        }

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const sourceOptions = useMemo(() => {
    const combined = [
      ...nearestLocations,
      ...sourceLocations,
    ];

    const unique = new Map();

    combined.forEach((location) => {
      const label = getLocationLabel(location);

      if (!label) return;

      if (!unique.has(label.toLowerCase())) {
        unique.set(label.toLowerCase(), location);
      }
    });

    return Array.from(unique.values());
  }, [nearestLocations, sourceLocations]);

  return (
    <section className="worker-search-card">
      <div className="worker-search-heading">
        <span>अपना सफर शुरू करें</span>
        <h2>आज कहाँ जाना है?</h2>
        <p>
          शहर, pickup location और तारीख चुनें, फिर अपनी
          बस खोजें।
        </p>
      </div>

      <div className="nearest-location-row">
        <button
          type="button"
          className="nearest-location-button"
          onClick={findNearestSource}
          disabled={locationLoading}
        >
          {locationLoading
            ? "📍 लोकेशन खोजी जा रही है..."
            : "📍 मेरे पास की pickup location"}
        </button>

        <span className="nearest-location-privacy">
          Location केवल पास की boarding जगह खोजने के लिए
          उपयोग होगी।
        </span>
      </div>

      {nearestLocations.length > 0 && (
        <div className="nearest-location-suggestions">
          <strong>आपके पास की जगहें</strong>

          <div>
            {nearestLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  setSource(
                    getLocationLabel(location)
                  );

                  sessionStorage.setItem(
                    "rular_selected_nearest_location_id",
                    String(location.id)
                  );
                }}
              >
                <span>
                  {location.location_type_icon || "📍"}{" "}
                  {getLocationLabel(location)}
                </span>

                <small>
                  {location.distance_km} km
                </small>
              </button>
            ))}
          </div>
        </div>
      )}

      {locationMessage && (
        <p className="nearest-location-message">
          {locationMessage}
        </p>
      )}

      <div className="worker-search-grid">
        <label className="worker-field">
          <span>कहाँ से चलना है?</span>

          <div className="worker-input-shell">
            <span aria-hidden="true">📍</span>

            <input
              type="text"
              list="passenger-source-locations"
              placeholder="जैसे: इटावा बाईपास"
              value={source}
              onChange={(event) =>
                setSource(event.target.value)
              }
              autoComplete="off"
            />

            <datalist id="passenger-source-locations">
              {sourceOptions.map((location) => (
                <option
                  key={location.id}
                  value={getLocationLabel(location)}
                >
                  {location.location_name}
                  {location.state_name
                    ? `, ${location.state_name}`
                    : ""}
                </option>
              ))}
            </datalist>
          </div>
        </label>

        <label className="worker-field">
          <span>कहाँ जाना है?</span>

          <div className="worker-input-shell">
            <span aria-hidden="true">🏠</span>

            <input
              type="text"
              list="passenger-destination-locations"
              placeholder="जैसे: गोरखपुर"
              value={destination}
              onChange={(event) =>
                setDestination(event.target.value)
              }
              autoComplete="off"
            />

            <datalist id="passenger-destination-locations">
              {destinationLocations.map((location) => (
                <option
                  key={location.id}
                  value={getLocationLabel(location)}
                >
                  {location.location_name}
                  {location.state_name
                    ? `, ${location.state_name}`
                    : ""}
                </option>
              ))}
            </datalist>
          </div>
        </label>

        <label className="worker-field worker-date-field">
          <span>कब जाना है?</span>

          <div className="worker-input-shell">
            <span aria-hidden="true">📅</span>

            <input
              type="date"
              value={journeyDate}
                min={new Date().toISOString().split("T")[0]}
                aria-label="यात्रा की तारीख"
                aria-required="true"
              onChange={(event) =>
                setJourneyDate(event.target.value)
              }
            />
          </div>
        </label>
      </div>

      {searchMessage && (
          <div
            className="worker-search-message"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">ℹ️</span>
            <p>{searchMessage}</p>
          </div>
        )}

        <button
          type="button"
          className="worker-search-button"
          onClick={searchBus}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span
                className="worker-search-spinner"
                aria-hidden="true"
              />
              हम आपके लिए सही बसें खोज रहे हैं...
            </>
          ) : (
            "🚌 अपनी बस खोजें"
          )}
        </button>

      <div className="worker-search-help">
        <span>✓ सुरक्षित भुगतान</span>
        <span>✓ साफ किराया</span>
        <span>✓ आसान टिकट</span>
      </div>
    </section>
  );
}
