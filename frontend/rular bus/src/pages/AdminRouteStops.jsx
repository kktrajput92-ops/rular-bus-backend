import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";

const STOP_TYPES = [
  ["ORIGIN", "Origin"],
  ["CITY", "City"],
  ["TOWN", "Town / कस्बा"],
  ["VILLAGE", "Village / गाँव"],
  ["BUS_STAND", "Bus Stand"],
  ["PICKUP_POINT", "Pickup Point"],
  ["BYPASS", "Bypass"],
  ["LANDMARK", "Landmark"],
  ["STOP", "General Stop"],
  ["DESTINATION", "Destination"],
];

const EMPTY_FORM = {
  route_id: "",
  location_id: "",
  stop_name: "",
  display_name: "",
  stop_type: "STOP",
  stop_order: 0,
  arrival_offset_minutes: "",
  departure_offset_minutes: "",
  distance_from_origin_km: "",
  boarding_allowed: true,
  dropping_allowed: true,
  landmark: "",
  address: "",
  latitude: "",
  longitude: "",
  is_active: true,
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

export default function AdminRouteStops() {
  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const routesApi = `${API_BASE}/routes`;
  const locationsApi = `${API_BASE}/passenger-locations`;
  const stopsApi = `${API_BASE}/stops`;

  const loadMasterData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [routesResponse, locationsResponse] =
        await Promise.all([
          fetch(routesApi),
          fetch(locationsApi),
        ]);

      const routesData = await routesResponse.json();
      const locationsData = await locationsResponse.json();

      if (!routesResponse.ok || !routesData.success) {
        throw new Error(
          routesData.message || "Failed to load routes."
        );
      }

      if (
        !locationsResponse.ok ||
        !locationsData.success
      ) {
        throw new Error(
          locationsData.message ||
            "Failed to load passenger locations."
        );
      }

      setRoutes(routesData.routes || []);
      setLocations(locationsData.locations || []);
    } catch (requestError) {
      console.error(
        "Route stops master data load failed:",
        requestError
      );

      setError(
        requestError.message ||
          "Failed to load route stop master data."
      );
    } finally {
      setLoading(false);
    }
  }, [locationsApi, routesApi]);

  const loadStops = useCallback(
    async (routeId) => {
      if (!routeId) {
        setStops([]);
        return;
      }

      setStopsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${stopsApi}/route/${routeId}?include_inactive=true`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load route stops."
          );
        }

        setStops(data.stops || []);
      } catch (requestError) {
        console.error(
          "Route stops load failed:",
          requestError
        );

        setError(
          requestError.message ||
            "Failed to load route stops."
        );
      } finally {
        setStopsLoading(false);
      }
    },
    [stopsApi]
  );

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadStops(selectedRouteId);
  }, [loadStops, selectedRouteId]);

  const selectedRoute = useMemo(() => {
    return routes.find(
      (route) =>
        String(route.id) === String(selectedRouteId)
    );
  }, [routes, selectedRouteId]);

  const selectedLocation = useMemo(() => {
    return locations.find(
      (location) =>
        String(location.id) === String(form.location_id)
    );
  }, [form.location_id, locations]);

  const handleRouteChange = (event) => {
    const routeId = event.target.value;

    setSelectedRouteId(routeId);
    setEditingId(null);
    setNotice("");
    setError("");

    setForm({
      ...EMPTY_FORM,
      route_id: routeId,
    });
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLocationChange = (event) => {
    const locationId = event.target.value;

    const location = locations.find(
      (item) =>
        String(item.id) === String(locationId)
    );

    setForm((current) => ({
      ...current,
      location_id: locationId,
      stop_name:
        location?.location_name || current.stop_name,
      display_name:
        location?.display_name ||
        location?.location_name ||
        current.display_name,
      stop_type:
        location?.location_type === "BUS_STAND"
          ? "BUS_STAND"
          : location?.location_type === "BYPASS"
            ? "BYPASS"
            : location?.location_type === "PICKUP_POINT"
              ? "PICKUP_POINT"
              : location?.location_type === "LANDMARK"
                ? "LANDMARK"
                : location?.location_type === "VILLAGE"
                  ? "VILLAGE"
                  : location?.location_type === "TOWN"
                    ? "TOWN"
                    : location?.location_type === "CITY"
                      ? "CITY"
                      : location?.location_type === "AREA"
                        ? "STOP"
                        : current.stop_type,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setError("");

    setForm({
      ...EMPTY_FORM,
      route_id: selectedRouteId,
      stop_order: stops.length,
    });
  };

  const saveStop = async (event) => {
    event.preventDefault();

    if (!selectedRouteId) {
      setError("Please select a route.");
      return;
    }

    if (
      !form.stop_name.trim() &&
      !form.location_id
    ) {
      setError(
        "Please select a location or enter a stop name."
      );
      return;
    }

    const stopOrder = Number(form.stop_order);

    if (
      !Number.isInteger(stopOrder) ||
      stopOrder < 0
    ) {
      setError(
        "Stop order must be a non-negative integer."
      );
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        editingId
          ? `${stopsApi}/${editingId}`
          : stopsApi,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route_id: Number(selectedRouteId),
            location_id: form.location_id
              ? Number(form.location_id)
              : null,
            stop_name: form.stop_name.trim() || null,
            display_name:
              form.display_name.trim() || null,
            stop_type: form.stop_type,
            stop_order: stopOrder,
            arrival_offset_minutes: toOptionalNumber(
              form.arrival_offset_minutes
            ),
            departure_offset_minutes: toOptionalNumber(
              form.departure_offset_minutes
            ),
            distance_from_origin_km: toOptionalNumber(
              form.distance_from_origin_km
            ),
            boarding_allowed: Boolean(
              form.boarding_allowed
            ),
            dropping_allowed: Boolean(
              form.dropping_allowed
            ),
            landmark: form.landmark.trim() || null,
            address: form.address.trim() || null,
            latitude: toOptionalNumber(form.latitude),
            longitude: toOptionalNumber(form.longitude),
            is_active: Boolean(form.is_active),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save route stop."
        );
      }

      setNotice(
        data.message || "Route stop saved successfully."
      );

      await loadStops(selectedRouteId);
      resetForm();
    } catch (requestError) {
      console.error(
        "Route stop save failed:",
        requestError
      );

      setError(
        requestError.message ||
          "Failed to save route stop."
      );
    } finally {
      setSaving(false);
    }
  };

  const editStop = (stop) => {
    setEditingId(stop.id);
    setNotice("");
    setError("");

    setForm({
      route_id: String(stop.route_id),
      location_id: stop.location_id
        ? String(stop.location_id)
        : "",
      stop_name: stop.stop_name || "",
      display_name: stop.display_name || "",
      stop_type: stop.stop_type || "STOP",
      stop_order: stop.stop_order ?? 0,
      arrival_offset_minutes:
        stop.arrival_offset_minutes ?? "",
      departure_offset_minutes:
        stop.departure_offset_minutes ?? "",
      distance_from_origin_km:
        stop.distance_from_origin_km ?? "",
      boarding_allowed: Boolean(
        stop.boarding_allowed
      ),
      dropping_allowed: Boolean(
        stop.dropping_allowed
      ),
      landmark: stop.landmark || "",
      address: stop.address || "",
      latitude: stop.latitude ?? "",
      longitude: stop.longitude ?? "",
      is_active: Boolean(stop.is_active),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleStopStatus = async (stop) => {
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${stopsApi}/${stop.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !stop.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update route stop status."
        );
      }

      setNotice(data.message);
      await loadStops(selectedRouteId);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to update route stop status."
      );
    }
  };

  const deleteStop = async (stop) => {
    const confirmed = window.confirm(
      `Delete stop "${stop.display_name}"?`
    );

    if (!confirmed) {
      return;
    }

    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${stopsApi}/${stop.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete route stop."
        );
      }

      setNotice(data.message);
      await loadStops(selectedRouteId);

      if (editingId === stop.id) {
        resetForm();
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to delete route stop."
      );
    }
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            Fleet Management
          </p>

          <h1 style={styles.title}>
            📍 Route Stops
          </h1>

          <p style={styles.subtitle}>
            Add ordered villages, towns, pickup points,
            bypasses and dropping points for every route.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => {
            loadMasterData();
            loadStops(selectedRouteId);
          }}
          disabled={loading || stopsLoading}
        >
          {loading || stopsLoading
            ? "Loading..."
            : "Refresh"}
        </button>
      </header>

      {notice && (
        <div style={styles.success}>{notice}</div>
      )}

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      <section style={styles.routeCard}>
        <label style={styles.field}>
          <span style={styles.label}>
            Operational Route *
          </span>

          <select
            value={selectedRouteId}
            onChange={handleRouteChange}
            style={styles.input}
          >
            <option value="">Select route</option>

            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.source} → {route.destination}
              </option>
            ))}
          </select>
        </label>

        {selectedRoute && (
          <div style={styles.routePreview}>
            🚌 {selectedRoute.source} →{" "}
            {selectedRoute.destination}
          </div>
        )}
      </section>

      {selectedRouteId && (
        <div style={styles.layout}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>
              {editingId
                ? "Edit Route Stop"
                : "Add Route Stop"}
            </h2>

            <form
              onSubmit={saveStop}
              style={styles.form}
            >
              <label style={styles.field}>
                <span style={styles.label}>
                  Passenger Location
                </span>

                <select
                  name="location_id"
                  value={form.location_id}
                  onChange={handleLocationChange}
                  style={styles.input}
                >
                  <option value="">
                    Select location or enter manually
                  </option>

                  {locations.map((location) => (
                    <option
                      key={location.id}
                      value={location.id}
                    >
                      {location.display_name ||
                        location.location_name}
                      {location.state_name
                        ? `, ${location.state_name}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              {selectedLocation && (
                <div style={styles.locationPreview}>
                  Selected:{" "}
                  {selectedLocation.display_name ||
                    selectedLocation.location_name}
                </div>
              )}

              <div style={styles.grid}>
                <label style={styles.field}>
                  <span style={styles.label}>
                    Stop Name *
                  </span>

                  <input
                    name="stop_name"
                    value={form.stop_name}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Example: Etawah Bypass"
                    maxLength={100}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Passenger Display Name
                  </span>

                  <input
                    name="display_name"
                    value={form.display_name}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="उदाहरण: इटावा बाईपास"
                    maxLength={150}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Stop Type
                  </span>

                  <select
                    name="stop_type"
                    value={form.stop_type}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    {STOP_TYPES.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Stop Order *
                  </span>

                  <input
                    type="number"
                    name="stop_order"
                    value={form.stop_order}
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    step="1"
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Distance from Origin (KM)
                  </span>

                  <input
                    type="number"
                    name="distance_from_origin_km"
                    value={
                      form.distance_from_origin_km
                    }
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Arrival Offset (Minutes)
                  </span>

                  <input
                    type="number"
                    name="arrival_offset_minutes"
                    value={
                      form.arrival_offset_minutes
                    }
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    step="1"
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Departure Offset (Minutes)
                  </span>

                  <input
                    type="number"
                    name="departure_offset_minutes"
                    value={
                      form.departure_offset_minutes
                    }
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    step="1"
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Landmark
                  </span>

                  <input
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Near petrol pump"
                    maxLength={250}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Latitude
                  </span>

                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    style={styles.input}
                    min="-90"
                    max="90"
                    step="0.0000001"
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Longitude
                  </span>

                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    style={styles.input}
                    min="-180"
                    max="180"
                    step="0.0000001"
                  />
                </label>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>
                  Full Address
                </span>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    minHeight: 82,
                    resize: "vertical",
                  }}
                  placeholder="Exact boarding or dropping address"
                />
              </label>

              <div style={styles.permissions}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="boarding_allowed"
                    checked={form.boarding_allowed}
                    onChange={handleChange}
                  />
                  Boarding Allowed
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="dropping_allowed"
                    checked={form.dropping_allowed}
                    onChange={handleChange}
                  />
                  Dropping Allowed
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  Active
                </label>
              </div>

              <div style={styles.actions}>
                <button
                  type="submit"
                  disabled={saving}
                  style={styles.primaryButton}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Stop"
                      : "Add Stop"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={styles.secondaryButton}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section style={styles.card}>
            <div style={styles.listHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  Route Timeline
                </h2>

                <p style={styles.listSubtitle}>
                  {stops.length} configured stop(s)
                </p>
              </div>
            </div>

            {stopsLoading ? (
              <div style={styles.empty}>
                Loading route stops...
              </div>
            ) : stops.length === 0 ? (
              <div style={styles.empty}>
                No stops configured for this route.
              </div>
            ) : (
              <div style={styles.timeline}>
                {stops.map((stop, index) => (
                  <article
                    key={stop.id}
                    style={{
                      ...styles.stopCard,
                      opacity: stop.is_active ? 1 : 0.58,
                    }}
                  >
                    <div style={styles.stopMarker}>
                      {index + 1}
                    </div>

                    <div style={styles.stopContent}>
                      <div style={styles.stopTop}>
                        <div>
                          <h3 style={styles.stopName}>
                            {stop.display_name ||
                              stop.stop_name}
                          </h3>

                          <p style={styles.stopMeta}>
                            {stop.stop_type} · Order{" "}
                            {stop.stop_order}
                            {stop.distance_from_origin_km !==
                              null &&
                              ` · ${stop.distance_from_origin_km} KM`}
                          </p>
                        </div>

                        <span
                          style={
                            stop.is_active
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          {stop.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div style={styles.tags}>
                        {stop.boarding_allowed && (
                          <span style={styles.tag}>
                            Boarding
                          </span>
                        )}

                        {stop.dropping_allowed && (
                          <span style={styles.tag}>
                            Dropping
                          </span>
                        )}

                        {stop.landmark && (
                          <span style={styles.tag}>
                            📍 {stop.landmark}
                          </span>
                        )}
                      </div>

                      <div style={styles.rowActions}>
                        <button
                          type="button"
                          onClick={() => editStop(stop)}
                          style={styles.smallButton}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStopStatus(stop)
                          }
                          style={styles.smallButton}
                        >
                          {stop.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteStop(stop)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
    padding: "28px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 22,
  },
  eyebrow: {
    margin: "0 0 5px",
    color: "#f97316",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 12,
  },
  title: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "clamp(26px, 4vw, 38px)",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "var(--erp-text-muted)",
    maxWidth: 700,
  },
  routeCard: {
    background: "var(--erp-surface)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 22,
    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
  },
  routePreview: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    background: "rgba(11,61,145,.1)",
    color: "var(--erp-heading)",
    fontWeight: 800,
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 430px), 1fr))",
    gap: 22,
    alignItems: "start",
  },
  card: {
    background: "var(--erp-surface)",
    padding: 22,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
  },
  cardTitle: {
    margin: "0 0 18px",
    color: "var(--erp-heading)",
  },
  form: {
    display: "grid",
    gap: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 7,
  },
  label: {
    color: "var(--erp-heading)",
    fontWeight: 700,
    fontSize: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid rgba(148,163,184,.5)",
    borderRadius: 9,
    background: "var(--erp-surface)",
    color: "var(--erp-text)",
    outline: "none",
  },
  locationPreview: {
    padding: 11,
    borderRadius: 9,
    background: "rgba(249,115,22,.1)",
    color: "var(--erp-heading)",
    fontWeight: 700,
  },
  permissions: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    padding: 14,
    borderRadius: 10,
    background: "rgba(148,163,184,.1)",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    border: 0,
    borderRadius: 9,
    background: "#0B3D91",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "11px 16px",
    border: "1px solid rgba(148,163,184,.55)",
    borderRadius: 9,
    background: "var(--erp-surface)",
    color: "var(--erp-heading)",
    fontWeight: 800,
    cursor: "pointer",
  },
  success: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    background: "rgba(22,163,74,.14)",
    color: "#15803d",
    fontWeight: 700,
  },
  error: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    background: "rgba(220,38,38,.14)",
    color: "#dc2626",
    fontWeight: 700,
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  listSubtitle: {
    margin: "-12px 0 16px",
    color: "var(--erp-text-muted)",
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "var(--erp-text-muted)",
  },
  timeline: {
    display: "grid",
    gap: 12,
  },
  stopCard: {
    display: "flex",
    gap: 13,
    padding: 15,
    border: "1px solid rgba(148,163,184,.3)",
    borderRadius: 12,
  },
  stopMarker: {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#0B3D91",
    color: "#fff",
    fontWeight: 800,
  },
  stopContent: {
    flex: 1,
    minWidth: 0,
  },
  stopTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  stopName: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: 17,
  },
  stopMeta: {
    margin: "5px 0 0",
    color: "var(--erp-text-muted)",
    fontSize: 13,
  },
  activeBadge: {
    color: "#15803d",
    fontWeight: 800,
    fontSize: 12,
  },
  inactiveBadge: {
    color: "#dc2626",
    fontWeight: 800,
    fontSize: 12,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  tag: {
    padding: "5px 8px",
    borderRadius: 999,
    background: "rgba(11,61,145,.1)",
    color: "var(--erp-heading)",
    fontSize: 12,
    fontWeight: 700,
  },
  rowActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  smallButton: {
    padding: "7px 10px",
    border: "1px solid rgba(148,163,184,.5)",
    borderRadius: 7,
    background: "var(--erp-surface)",
    color: "var(--erp-heading)",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteButton: {
    padding: "7px 10px",
    border: "1px solid rgba(220,38,38,.4)",
    borderRadius: 7,
    background: "rgba(220,38,38,.08)",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 700,
  },
};
