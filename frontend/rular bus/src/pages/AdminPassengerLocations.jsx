import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";
import "./AdminPassengerLocations.css";
import LocationMapPicker from "../components/admin/LocationMapPicker";

const EMPTY_FORM = {
  location_name: "",
  display_name: "",
  state_name: "",
  location_type: "CITY",
  location_type_id: "",
  latitude: "",
  longitude: "",
  geofence_radius_meters: 5000,
  address: "",
  landmark: "",
  allow_source: true,
  allow_destination: true,
  sort_order: 0,
  is_active: true,
};

export default function AdminPassengerLocations() {
  const [locations, setLocations] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const api = `${API_BASE}/passenger-locations`;
  const typeApi = `${API_BASE}/passenger-location-types`;


  const loadLocationTypes = useCallback(async () => {
    try {
      const response = await fetch(typeApi);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load location types."
        );
      }

      const loadedTypes = data.location_types || [];
      setLocationTypes(loadedTypes);

      setForm((current) => {
        if (current.location_type_id || !loadedTypes.length) {
          return current;
        }

        const cityType =
          loadedTypes.find(
            (item) => item.type_code === "CITY"
          ) || loadedTypes[0];

        return {
          ...current,
          location_type_id: String(cityType.id),
          location_type: cityType.type_code,
        };
      });
    } catch (requestError) {
      console.error(
        "Location types load failed:",
        requestError
      );

      setError(
        requestError.message ||
          "Failed to load location types."
      );
    }
  }, [typeApi]);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(api);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load passenger locations."
        );
      }

      setLocations(data.locations || []);
    } catch (requestError) {
      console.error(
        "Passenger locations load failed:",
        requestError
      );

      setError(
        requestError.message ||
          "Failed to load passenger locations."
      );
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadLocations();
    loadLocationTypes();
  }, [loadLocations, loadLocationTypes]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return locations;
    }

    return locations.filter((location) =>
      [
        location.location_name,
        location.display_name,
        location.state_name,
        location.location_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [locations, search]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };


  const handleLocationTypeChange = async (event) => {
    const value = event.target.value;

    if (value !== "__ADD_NEW__") {
      const selectedType = locationTypes.find(
        (item) => String(item.id) === String(value)
      );

      setForm((current) => ({
        ...current,
        location_type_id: value,
        location_type:
          selectedType?.type_code ||
          current.location_type,
      }));

      return;
    }

    const typeName = window.prompt(
      "New location type name:"
    );

    if (!typeName?.trim()) {
      return;
    }

    const displayName = window.prompt(
      "Passenger display name / Hindi name:",
      ""
    );

    const icon = window.prompt(
      "Icon:",
      "📍"
    );

    const typeCode = String(typeName)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    try {
      const response = await fetch(typeApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type_code: typeCode,
          type_name: typeName.trim(),
          display_name:
            displayName?.trim() || null,
          icon: icon?.trim() || "📍",
          sort_order: locationTypes.length + 1,
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create location type."
        );
      }

      await loadLocationTypes();

      setForm((current) => ({
        ...current,
        location_type_id: String(
          data.location_type.id
        ),
        location_type:
          data.location_type.type_code,
      }));

      setNotice(
        "New location type created successfully."
      );
      setError("");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to create location type."
      );
    }
  };
  const resetForm = () => {
    const cityType =
      locationTypes.find(
        (item) => item.type_code === "CITY"
      ) || locationTypes[0];

    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      location_type_id: cityType
        ? String(cityType.id)
        : "",
      location_type:
        cityType?.type_code || "CITY",
    });
    setError("");
  };

  const saveLocation = async (event) => {
    event.preventDefault();

    const locationName = form.location_name.trim();
    const sortOrder = Number(form.sort_order);
    const selectedType = locationTypes.find(
      (item) =>
        String(item.id) ===
        String(form.location_type_id)
    );

    if (!locationName) {
      setError("Location name is required.");
      return;
    }

    if (!selectedType) {
      setError("Please select a location type.");
      return;
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError(
        "Display order must be a non-negative integer."
      );
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        editingId ? `${api}/${editingId}` : api,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location_name: locationName,
            display_name:
              form.display_name.trim() || null,
            state_name: form.state_name.trim() || null,
            location_type: selectedType.type_code,
            location_type_id: selectedType.id,
            latitude:
              form.latitude === ""
                ? null
                : Number(form.latitude),
            longitude:
              form.longitude === ""
                ? null
                : Number(form.longitude),
            geofence_radius_meters: Number(
              form.geofence_radius_meters
            ),
            address: form.address.trim() || null,
            landmark: form.landmark.trim() || null,
            allow_source: Boolean(form.allow_source),
            allow_destination: Boolean(
              form.allow_destination
            ),
            sort_order: sortOrder,
            is_active: Boolean(form.is_active),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save location."
        );
      }

      setNotice(
        data.message || "Location saved successfully."
      );

      resetForm();
      await loadLocations();
    } catch (requestError) {
      console.error(
        "Passenger location save failed:",
        requestError
      );

      setError(
        requestError.message ||
          "Failed to save passenger location."
      );
    } finally {
      setSaving(false);
    }
  };

  const editLocation = (location) => {
    setEditingId(location.id);
    setNotice("");
    setError("");

    setForm({
      location_name: location.location_name || "",
      display_name: location.display_name || "",
      state_name: location.state_name || "",
      location_type:
        location.location_type || "CITY",
      location_type_id:
        location.location_type_id
          ? String(location.location_type_id)
          : String(
              locationTypes.find(
                (item) =>
                  item.type_code ===
                  location.location_type
              )?.id || ""
            ),
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      geofence_radius_meters:
        location.geofence_radius_meters ?? 5000,
      address: location.address || "",
      landmark: location.landmark || "",
      allow_source: Boolean(location.allow_source),
      allow_destination: Boolean(
        location.allow_destination
      ),
      sort_order: location.sort_order ?? 0,
      is_active: Boolean(location.is_active),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleLocation = async (location) => {
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${api}/${location.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...location,
            is_active: !location.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update location status."
        );
      }

      setNotice(data.message);
      await loadLocations();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to update location status."
      );
    }
  };

  const deleteLocation = async (location) => {
    const confirmed = window.confirm(
      `Delete location "${location.display_name || location.location_name}"?`
    );

    if (!confirmed) {
      return;
    }

    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${api}/${location.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete location."
        );
      }

      setNotice(data.message);

      if (editingId === location.id) {
        resetForm();
      }

      await loadLocations();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to delete location."
      );
    }
  };

  return (
    <main className="admin-passenger-locations-page">
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            Passenger Experience
          </p>

          <h1 style={styles.title}>
            📌 Search Locations
          </h1>

          <p style={styles.subtitle}>
            Manage cities, villages, towns, areas and
            boarding or dropping locations visible to passengers.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadLocations}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {notice && (
        <div style={styles.success}>{notice}</div>
      )}

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      <div className="admin-passenger-locations-layout">
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingId
              ? "Edit Passenger Location"
              : "Add Passenger Location"}
          </h2>

          <form
            onSubmit={saveLocation}
            style={styles.form}
          >
            <label style={styles.field}>
              <span style={styles.label}>
                Location Name *
              </span>

              <input
                name="location_name"
                value={form.location_name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Example: Etawah Bypass"
                maxLength={150}
                required
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

            <div style={styles.grid}>
              <label style={styles.field}>
                <span style={styles.label}>State</span>

                <input
                  name="state_name"
                  value={form.state_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Example: Uttar Pradesh"
                  maxLength={120}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>
                  Location Type
                </span>

                <select
                  name="location_type_id"
                  value={form.location_type_id}
                  onChange={handleLocationTypeChange}
                  style={styles.input}
                  required
                >
                  <option value="">
                    Select location type
                  </option>

                  {locationTypes.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.icon || "📍"}{" "}
                      {item.type_name}
                      {item.display_name
                        ? ` / ${item.display_name}`
                        : ""}
                      {!item.is_active
                        ? " (Inactive)"
                        : ""}
                    </option>
                  ))}

                  <option value="__ADD_NEW__">
                    ➕ Add New Type
                  </option>
                </select>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>
                  Display Order
                </span>

                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="1"
                />
              </label>
            </div>

            <div style={styles.coordinateSection}>
              <div style={styles.coordinateHeader}>
                <div>
                  <h3 style={styles.coordinateTitle}>
                    📍 Map Coordinates
                  </h3>

                  <p style={styles.coordinateHelp}>
                    Coordinates are required for nearest
                    passenger location and route maps.
                  </p>
                </div>

                
              </div>

              <LocationMapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={({
                  latitude,
                  longitude,
                }) =>
                  setForm((current) => ({
                    ...current,
                    latitude,
                    longitude,
                  }))
                }
              />

              <div style={styles.grid}>
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
                    placeholder="26.7850000"
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
                    placeholder="79.0230000"
                    min="-180"
                    max="180"
                    step="0.0000001"
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>
                    Nearby Radius (meters)
                  </span>

                  <input
                    type="number"
                    name="geofence_radius_meters"
                    value={form.geofence_radius_meters}
                    onChange={handleChange}
                    style={styles.input}
                    min="100"
                    max="100000"
                    step="100"
                  />
                </label>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>Landmark</span>

                <input
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Example: Near Expressway Exit"
                  maxLength={250}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>
                  Full Address
                </span>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Complete address of this location"
                  rows="3"
                />
              </label>
            </div>

            <div style={styles.permissions}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="allow_source"
                  checked={form.allow_source}
                  onChange={handleChange}
                />
                Show in “From”
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="allow_destination"
                  checked={form.allow_destination}
                  onChange={handleChange}
                />
                Show in “To”
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
                    ? "Update Location"
                    : "Add Location"}
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
                Configured Locations
              </h2>

              <p style={styles.count}>
                {filteredLocations.length} location(s)
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={styles.searchInput}
              placeholder="Search location..."
            />
          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading locations...
            </div>
          ) : filteredLocations.length === 0 ? (
            <div style={styles.empty}>
              No passenger locations configured.
            </div>
          ) : (
            <div style={styles.locationList}>
              {filteredLocations.map((location) => (
                <article
                  key={location.id}
                  style={{
                    ...styles.locationCard,
                    opacity: location.is_active ? 1 : 0.58,
                  }}
                >
                  <div style={styles.locationTop}>
                    <div>
                      <h3 style={styles.locationName}>
                        {location.display_name ||
                          location.location_name}
                      </h3>

                      <p style={styles.locationMeta}>
                        {location.location_name}
                        {location.state_name
                          ? ` · ${location.state_name}`
                          : ""}
                        {" · "}
                        {location.location_type_icon || "📍"}{" "}
                        {location.location_type_display_name ||
                          location.location_type_name ||
                          location.location_type}
                      </p>
                    </div>

                    <span
                      style={
                        location.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {location.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div style={styles.tags}>
                    {location.allow_source && (
                      <span style={styles.tag}>From</span>
                    )}

                    {location.allow_destination && (
                      <span style={styles.tag}>To</span>
                    )}

                    <span style={styles.tag}>
                      Order {location.sort_order}
                    </span>

                    {location.latitude !== null &&
                      location.longitude !== null && (
                        <span style={styles.tag}>
                          📍 {location.latitude},{" "}
                          {location.longitude}
                        </span>
                      )}
                  </div>

                  <div style={styles.rowActions}>
                    <button
                      type="button"
                      style={styles.smallButton}
                      onClick={() =>
                        editLocation(location)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      style={styles.smallButton}
                      onClick={() =>
                        toggleLocation(location)
                      }
                    >
                      {location.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() =>
                        deleteLocation(location)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 28,
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
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
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "clamp(26px, 4vw, 38px)",
  },
  subtitle: {
    margin: "8px 0 0",
    maxWidth: 720,
    color: "var(--erp-text-muted)",
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 430px), 1fr))",
    gap: 22,
    alignItems: "start",
  },
  card: {
    padding: 22,
    borderRadius: 16,
    background: "var(--erp-surface)",
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
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--erp-heading)",
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
  searchInput: {
    width: 220,
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid rgba(148,163,184,.5)",
    borderRadius: 9,
    background: "var(--erp-surface)",
    color: "var(--erp-text)",
  },
  coordinateSection: {
    display: "grid",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
  },
  coordinateHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  coordinateTitle: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: 17,
  },
  coordinateHelp: {
    margin: "5px 0 0",
    opacity: 0.7,
    fontSize: 13,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-card)",
    color: "var(--erp-text)",
    resize: "vertical",
  },
  permissions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
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
    flexWrap: "wrap",
    gap: 10,
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
    marginBottom: 16,
    borderRadius: 10,
    background: "rgba(22,163,74,.14)",
    color: "#15803d",
    fontWeight: 700,
  },
  error: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 10,
    background: "rgba(220,38,38,.14)",
    color: "#dc2626",
    fontWeight: 700,
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  count: {
    margin: "-12px 0 16px",
    color: "var(--erp-text-muted)",
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "var(--erp-text-muted)",
  },
  locationList: {
    display: "grid",
    gap: 12,
  },
  locationCard: {
    padding: 15,
    border: "1px solid rgba(148,163,184,.3)",
    borderRadius: 12,
  },
  locationTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  locationName: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: 17,
  },
  locationMeta: {
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
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteButton: {
    padding: "7px 10px",
    border: "1px solid rgba(220,38,38,.4)",
    borderRadius: 7,
    background: "rgba(220,38,38,.08)",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
  },
};
