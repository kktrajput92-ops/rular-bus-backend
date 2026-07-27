import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../api/api";

const EMPTY_FORM = {
  route_id: "",
  display_label: "",
  note: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminHomepageRoutes() {
  const [masterRoutes, setMasterRoutes] = useState([]);
  const [homepageRoutes, setHomepageRoutes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const homepageRouteApi = `${API_BASE}/homepage-route-shortcuts`;
  const operationalRouteApi = `${API_BASE}/routes`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [routeResponse, homepageResponse] = await Promise.all([
        fetch(operationalRouteApi),
        fetch(homepageRouteApi),
      ]);

      const routeData = await routeResponse.json();
      const homepageData = await homepageResponse.json();

      if (!routeResponse.ok || !routeData.success) {
        throw new Error(
          routeData.message || "Failed to load operational routes."
        );
      }

      if (!homepageResponse.ok || !homepageData.success) {
        throw new Error(
          homepageData.message || "Failed to load homepage routes."
        );
      }

      setMasterRoutes(routeData.routes || []);
      setHomepageRoutes(homepageData.routes || []);
    } catch (requestError) {
      console.error("Homepage route data load failed:", requestError);
      setError(
        requestError.message || "Failed to load homepage route data."
      );
    } finally {
      setLoading(false);
    }
  }, [homepageRouteApi, operationalRouteApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return homepageRoutes;
    }

    return homepageRoutes.filter((route) =>
      [
        route.source,
        route.destination,
        route.display_label,
        route.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [homepageRoutes, search]);

  const selectedRoute = useMemo(() => {
    return masterRoutes.find(
      (route) => String(route.id) === String(form.route_id)
    );
  }, [form.route_id, masterRoutes]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const saveRoute = async (event) => {
    event.preventDefault();

    if (!form.route_id) {
      setError("Please select an operational route.");
      return;
    }

    const sortOrder = Number(form.sort_order);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("Display order must be a non-negative integer.");
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        editingId
          ? `${homepageRouteApi}/${editingId}`
          : homepageRouteApi,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route_id: Number(form.route_id),
            display_label: form.display_label.trim() || null,
            note: form.note.trim() || null,
            sort_order: sortOrder,
            is_active: Boolean(form.is_active),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save homepage route."
        );
      }

      setNotice(data.message || "Homepage route saved successfully.");
      resetForm();
      await loadData();
    } catch (requestError) {
      console.error("Homepage route save failed:", requestError);
      setError(
        requestError.message || "Failed to save homepage route."
      );
    } finally {
      setSaving(false);
    }
  };

  const editRoute = (route) => {
    setEditingId(route.id);

    setForm({
      route_id: String(route.route_id),
      display_label: route.display_label || "",
      note: route.note || "",
      sort_order: route.sort_order ?? 0,
      is_active: Boolean(route.is_active),
    });

    setNotice("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteRoute = async (route) => {
    const confirmed = window.confirm(
      `Remove ${route.source} → ${route.destination} from homepage?`
    );

    if (!confirmed) {
      return;
    }

    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${homepageRouteApi}/${route.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete homepage route."
        );
      }

      setNotice(
        data.message || "Homepage route deleted successfully."
      );

      if (editingId === route.id) {
        resetForm();
      }

      await loadData();
    } catch (requestError) {
      console.error("Homepage route delete failed:", requestError);
      setError(
        requestError.message || "Failed to delete homepage route."
      );
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Passenger Experience</p>

          <h1 style={styles.title}>🧭 Homepage Routes</h1>

          <p style={styles.subtitle}>
            Control the one-click routes displayed on the passenger
            homepage.
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {notice && <div style={styles.success}>{notice}</div>}

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.layout}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingId
              ? "Edit Homepage Route"
              : "Add Homepage Route"}
          </h2>

          <form onSubmit={saveRoute} style={styles.form}>
            <label style={styles.field}>
              <span style={styles.label}>
                Operational Route *
              </span>

              <select
                name="route_id"
                value={form.route_id}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select route</option>

                {masterRoutes.map((route) => (
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

            <label style={styles.field}>
              <span style={styles.label}>Display Label</span>

              <input
                type="text"
                name="display_label"
                value={form.display_label}
                onChange={handleChange}
                style={styles.input}
                placeholder="Optional custom label"
                maxLength={160}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Passenger Note</span>

              <input
                type="text"
                name="note"
                value={form.note}
                onChange={handleChange}
                style={styles.input}
                placeholder="Example: घर जाने वालों की पसंद"
                maxLength={200}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Display Order</span>

              <input
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                min="0"
                step="1"
                style={styles.input}
              />
            </label>

            <label style={styles.statusBox}>
              <div>
                <strong style={styles.statusTitle}>
                  Active on Passenger Homepage
                </strong>

                <span style={styles.statusDescription}>
                  Inactive routes remain saved but stay hidden from
                  passengers.
                </span>
              </div>

              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                style={styles.checkbox}
              />
            </label>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={resetForm}
                disabled={saving}
              >
                Reset
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Route"
                    : "Add to Homepage"}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Configured Homepage Routes
              </h2>

              <p style={styles.listDescription}>
                Active routes appear on the public passenger homepage.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.searchInput}
              placeholder="Search routes..."
            />
          </div>

          {loading ? (
            <div style={styles.empty}>Loading routes...</div>
          ) : filteredRoutes.length === 0 ? (
            <div style={styles.empty}>
              No homepage routes configured.
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order</th>
                    <th style={styles.th}>Route</th>
                    <th style={styles.th}>Content</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} style={styles.row}>
                      <td style={styles.td}>
                        {route.sort_order}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {route.source} → {route.destination}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        <div>
                          {route.display_label ||
                            `${route.source} → ${route.destination}`}
                        </div>

                        {route.note && (
                          <small style={styles.muted}>
                            {route.note}
                          </small>
                        )}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            route.is_active
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          {route.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.rowActions}>
                          <button
                            type="button"
                            style={styles.editButton}
                            onClick={() => editRoute(route)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            style={styles.deleteButton}
                            onClick={() => deleteRoute(route)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "24px",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  title: {
    margin: "6px 0",
    color: "var(--erp-heading)",
    fontSize: "32px",
  },

  subtitle: {
    margin: 0,
    color: "var(--erp-text-muted)",
    lineHeight: 1.5,
  },

  refreshButton: {
    minHeight: "42px",
    padding: "10px 18px",
    border: 0,
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  success: {
    marginBottom: "15px",
    padding: "13px 15px",
    border: "1px solid #86efac",
    borderRadius: "9px",
    background: "#dcfce7",
    color: "#166534",
  },

  error: {
    marginBottom: "15px",
    padding: "13px 15px",
    border: "1px solid #fca5a5",
    borderRadius: "9px",
    background: "#fee2e2",
    color: "#991b1b",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 390px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
  },

  card: {
    minWidth: 0,
    padding: "20px",
    border: "1px solid var(--erp-border)",
    borderRadius: "15px",
    background: "var(--erp-surface)",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },

  cardTitle: {
    margin: "0 0 15px",
    color: "var(--erp-heading)",
    fontSize: "21px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    color: "var(--erp-text)",
    fontSize: "13px",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    minHeight: "43px",
    boxSizing: "border-box",
    padding: "10px 11px",
    border: "1px solid var(--erp-border)",
    borderRadius: "9px",
    outline: 0,
    background: "var(--erp-input-bg)",
    color: "var(--erp-text)",
    font: "inherit",
  },

  routePreview: {
    padding: "11px 13px",
    border: "1px solid var(--erp-border)",
    borderRadius: "10px",
    background: "var(--erp-surface-muted)",
    color: "var(--erp-heading)",
    fontWeight: 800,
  },

  statusBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "13px",
    border: "1px solid var(--erp-border)",
    borderRadius: "10px",
    background: "var(--erp-surface-muted)",
  },

  statusTitle: {
    display: "block",
    color: "var(--erp-heading)",
    fontSize: "13px",
  },

  statusDescription: {
    display: "block",
    marginTop: "4px",
    color: "var(--erp-text-muted)",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  checkbox: {
    flex: "0 0 auto",
    width: "22px",
    height: "22px",
    cursor: "pointer",
  },

  formActions: {
    display: "flex",
    gap: "9px",
  },

  primaryButton: {
    flex: 1,
    minHeight: "44px",
    padding: "11px 14px",
    border: 0,
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: "44px",
    padding: "11px 16px",
    border: "1px solid var(--erp-border)",
    borderRadius: "9px",
    background: "var(--erp-surface-muted)",
    color: "var(--erp-text)",
    fontWeight: 700,
    cursor: "pointer",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  listDescription: {
    margin: "-8px 0 0",
    color: "var(--erp-text-muted)",
    fontSize: "12px",
  },

  searchInput: {
    width: "230px",
    maxWidth: "100%",
    minHeight: "42px",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid var(--erp-border)",
    borderRadius: "9px",
    outline: 0,
    background: "var(--erp-input-bg)",
    color: "var(--erp-text)",
  },

  empty: {
    padding: "38px 20px",
    border: "1px dashed var(--erp-border)",
    borderRadius: "11px",
    background: "var(--erp-surface-muted)",
    color: "var(--erp-text-muted)",
    textAlign: "center",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid var(--erp-border)",
    borderRadius: "11px",
  },

  table: {
    width: "100%",
    minWidth: "760px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "12px",
    borderBottom: "1px solid var(--erp-border)",
    background: "var(--erp-surface-muted)",
    color: "var(--erp-text-secondary)",
    textAlign: "left",
    fontSize: "12px",
  },

  row: {
    borderBottom: "1px solid var(--erp-border)",
  },

  td: {
    padding: "12px",
    color: "var(--erp-text)",
    verticalAlign: "top",
    fontSize: "13px",
  },

  muted: {
    display: "block",
    marginTop: "5px",
    color: "var(--erp-text-muted)",
    lineHeight: 1.4,
  },

  activeBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "11px",
    fontWeight: 800,
  },

  inactiveBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "11px",
    fontWeight: 800,
  },

  rowActions: {
    display: "flex",
    gap: "7px",
  },

  editButton: {
    padding: "7px 10px",
    border: "1px solid #2563eb",
    borderRadius: "7px",
    background: "transparent",
    color: "#2563eb",
    fontWeight: 700,
    cursor: "pointer",
  },

  deleteButton: {
    padding: "7px 10px",
    border: "1px solid #dc2626",
    borderRadius: "7px",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
  },
};
