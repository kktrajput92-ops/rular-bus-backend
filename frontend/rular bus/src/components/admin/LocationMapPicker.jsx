import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationMapPicker.css";

const INDIA_CENTER = [26.8467, 80.9462];

const markerIcon = L.divIcon({
  className: "location-map-picker__marker-shell",
  html: '<div class="location-map-picker__marker">📍</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 36],
});

const hasCoordinateValue = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "";

const isValidLatitude = (value) => {
  if (!hasCoordinateValue(value)) {
    return false;
  }

  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= -90 &&
    number <= 90
  );
};

const isValidLongitude = (value) => {
  if (!hasCoordinateValue(value)) {
    return false;
  }

  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= -180 &&
    number <= 180
  );
};

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    const refreshMap = () => {
      map.invalidateSize();

      if (position) {
        map.setView(
          position,
          Math.max(map.getZoom(), 15),
          {
            animate: false,
          }
        );
      }
    };

    const firstTimer = window.setTimeout(
      refreshMap,
      100
    );

    const secondTimer = window.setTimeout(
      refreshMap,
      500
    );

    window.addEventListener("resize", refreshMap);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
      window.removeEventListener(
        "resize",
        refreshMap
      );
    };
  }, [map, position]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function LocationMapPicker({
  latitude,
  longitude,
  onChange,
}) {
  const markerRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  const position = useMemo(() => {
    if (
      !isValidLatitude(latitude) ||
      !isValidLongitude(longitude)
    ) {
      return null;
    }

    return [Number(latitude), Number(longitude)];
  }, [latitude, longitude]);

  const mapCenter = position || INDIA_CENTER;

  const chooseCoordinates = (lat, lng) => {
    onChange({
      latitude: Number(lat).toFixed(7),
      longitude: Number(lng).toFixed(7),
    });

    setMessage(
      "Coordinates selected. Marker can also be dragged."
    );
  };

  const searchPlace = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setMessage(
        "Please enter at least 3 characters."
      );
      return;
    }

    setSearching(true);
    setResults([]);
    setMessage("");

    try {
      const params = new URLSearchParams({
        q: `${trimmedQuery}, India`,
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
        countrycodes: "in",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Language": "hi,en",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Map search failed: ${response.status}`
        );
      }

      const data = await response.json();

      setResults(Array.isArray(data) ? data : []);

      if (!data.length) {
        setMessage(
          "No matching place found. Try city, landmark or district name."
        );
      }
    } catch (error) {
      console.error("Location search failed:", error);

      setMessage(
        "Place search is currently unavailable. You can still tap directly on the map."
      );
    } finally {
      setSearching(false);
    }
  };

  const useCurrentPosition = () => {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage(
        "Current location is not supported on this device."
      );
      return;
    }

    setMessage("Finding current location...");

    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        chooseCoordinates(
          currentPosition.coords.latitude,
          currentPosition.coords.longitude
        );

        setMessage(
          `Current location added. Accuracy approximately ${Math.round(
            currentPosition.coords.accuracy
          )} metres.`
        );
      },
      (error) => {
        console.error("Current location failed:", error);

        if (error.code === 1) {
          setMessage(
            "Location permission denied. Allow location permission or select the point on the map."
          );
          return;
        }

        setMessage(
          "Current location could not be detected. Select the point manually on the map."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const clearCoordinates = () => {
    onChange({
      latitude: "",
      longitude: "",
    });

    setResults([]);
    setMessage("Selected coordinates cleared.");
  };

  return (
    <section className="location-map-picker">
      <div className="location-map-picker__heading">
        <div>
          <h4>🗺️ Select Location on Map</h4>

          <p>
            Search a real place, tap the map, or drag the
            marker to the exact boarding point.
          </p>
        </div>

        <button
          type="button"
          className="location-map-picker__button"
          onClick={useCurrentPosition}
        >
          Use Current Location
        </button>
      </div>

      <form
        className="location-map-picker__search"
        onSubmit={searchPlace}
      >
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search: Etawah Bus Stand, Etawah Bypass..."
        />

        <button type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search Place"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="location-map-picker__results">
          {results.map((result) => (
            <button
              key={`${result.place_id}-${result.lat}-${result.lon}`}
              type="button"
              onClick={() => {
                chooseCoordinates(
                  result.lat,
                  result.lon
                );

                setQuery(
                  result.display_name || query
                );

                setResults([]);
              }}
            >
              <strong>
                {result.name ||
                  result.display_name?.split(",")[0] ||
                  "Selected place"}
              </strong>

              <span>{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="location-map-picker__map">
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 5}
          scrollWheelZoom
          className="location-map-picker__map-container"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            crossOrigin
          />

          <MapClickHandler
            onSelect={chooseCoordinates}
          />

          <MapController position={position} />

          {position && (
            <Marker
              ref={markerRef}
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend() {
                  const marker = markerRef.current;

                  if (!marker) return;

                  const nextPosition =
                    marker.getLatLng();

                  chooseCoordinates(
                    nextPosition.lat,
                    nextPosition.lng
                  );
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="location-map-picker__footer">
        <div>
          <strong>Selected coordinates</strong>

          <span>
            {position
              ? `${Number(latitude).toFixed(
                  7
                )}, ${Number(longitude).toFixed(7)}`
              : "No point selected"}
          </span>
        </div>

        {position && (
          <button
            type="button"
            className="location-map-picker__clear"
            onClick={clearCoordinates}
          >
            Clear Point
          </button>
        )}
      </div>

      {message && (
        <p className="location-map-picker__message">
          {message}
        </p>
      )}
    </section>
  );
}
