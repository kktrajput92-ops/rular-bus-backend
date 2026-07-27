import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";
import EmojiIconPicker from "../components/admin/EmojiIconPicker";
import "./AdminLocationTypes.css";

const EMPTY_FORM = {
  type_code: "",
  type_name: "",
  display_name: "",
  icon: "📍",
  description: "",
  sort_order: 0,
  is_active: true,
};

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export default function AdminLocationTypes() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const api = `${API_BASE}/passenger-location-types`;

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(api);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load location types."
        );
      }

      setTypes(data.location_types || []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to load location types."
      );
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const filteredTypes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return types;

    return types.filter((item) =>
      [
        item.type_code,
        item.type_name,
        item.display_name,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, types]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNameChange = (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      type_name: value,
      type_code:
        editingId || current.type_code
          ? current.type_code
          : normalizeCode(value),
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const saveType = async (event) => {
    event.preventDefault();

    const typeName = form.type_name.trim();
    const typeCode = normalizeCode(
      form.type_code || typeName
    );
    const sortOrder = Number(form.sort_order);

    if (!typeName || !typeCode) {
      setError("Type name and type code are required.");
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
            type_code: typeCode,
            type_name: typeName,
            display_name:
              form.display_name.trim() || null,
            icon: form.icon.trim() || null,
            description:
              form.description.trim() || null,
            sort_order: sortOrder,
            is_active: Boolean(form.is_active),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save location type."
        );
      }

      setNotice(
        data.message ||
          "Location type saved successfully."
      );
      resetForm();
      await loadTypes();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to save location type."
      );
    } finally {
      setSaving(false);
    }
  };

  const editType = (item) => {
    setEditingId(item.id);
    setNotice("");
    setError("");

    setForm({
      type_code: item.type_code || "",
      type_name: item.type_name || "",
      display_name: item.display_name || "",
      icon: item.icon || "📍",
      description: item.description || "",
      sort_order: item.sort_order ?? 0,
      is_active: Boolean(item.is_active),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleType = async (item) => {
    setNotice("");
    setError("");

    try {
      const response = await fetch(`${api}/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...item,
          is_active: !item.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update location type."
        );
      }

      setNotice(data.message);
      await loadTypes();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to update location type."
      );
    }
  };

  const deleteType = async (item) => {
    const confirmed = window.confirm(
      `Delete location type "${item.type_name}"?`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      const response = await fetch(`${api}/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete location type."
        );
      }

      setNotice(data.message);

      if (editingId === item.id) {
        resetForm();
      }

      await loadTypes();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Failed to delete location type."
      );
    }
  };

  return (
    <main className="admin-location-types-page">
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Passenger Experience</p>
          <h1 style={styles.title}>🏷️ Location Types</h1>
          <p style={styles.subtitle}>
            Create any custom location category used by cities,
            villages, bypasses, restaurants and route points.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadTypes}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {notice && <div style={styles.success}>{notice}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div className="admin-location-types-layout">
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingId
              ? "Edit Location Type"
              : "Add Location Type"}
          </h2>

          <form onSubmit={saveType} style={styles.form}>
            <label style={styles.field}>
              <span style={styles.label}>Type Name *</span>
              <input
                name="type_name"
                value={form.type_name}
                onChange={handleNameChange}
                style={styles.input}
                placeholder="Example: Highway Restaurant"
                required
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Type Code *</span>
              <input
                name="type_code"
                value={form.type_code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type_code: normalizeCode(
                      event.target.value
                    ),
                  }))
                }
                style={styles.input}
                placeholder="HIGHWAY_RESTAURANT"
                required
              />
            </label>

            <div style={styles.grid}>
              <label style={styles.field}>
                <span style={styles.label}>
                  Passenger Display Name
                </span>
                <input
                  name="display_name"
                  value={form.display_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="हाईवे रेस्टोरेंट"
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Icon</span>

                <EmojiIconPicker
                  value={form.icon}
                  onChange={(icon) =>
                    setForm((current) => ({
                      ...current,
                      icon,
                    }))
                  }
                />
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

            <label style={styles.field}>
              <span style={styles.label}>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Where this location type is used"
              />
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

            <div style={styles.actions}>
              <button
                type="submit"
                disabled={saving}
                style={styles.primaryButton}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Type"
                    : "Add Type"}
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
                Configured Location Types
              </h2>
              <p style={styles.count}>
                {filteredTypes.length} type(s)
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={styles.searchInput}
              placeholder="Search types..."
            />
          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading location types...
            </div>
          ) : filteredTypes.length === 0 ? (
            <div style={styles.empty}>
              No location types configured.
            </div>
          ) : (
            <div style={styles.list}>
              {filteredTypes.map((item) => (
                <article
                  key={item.id}
                  style={{
                    ...styles.itemCard,
                    opacity: item.is_active ? 1 : 0.58,
                  }}
                >
                  <div style={styles.itemTop}>
                    <div>
                      <h3 style={styles.itemName}>
                        {item.icon || "📍"}{" "}
                        {item.display_name ||
                          item.type_name}
                      </h3>
                      <p style={styles.meta}>
                        {item.type_name} · {item.type_code}
                      </p>
                    </div>

                    <span
                      style={
                        item.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {item.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  {item.description && (
                    <p style={styles.description}>
                      {item.description}
                    </p>
                  )}

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.smallButton}
                      onClick={() => editType(item)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      style={styles.smallButton}
                      onClick={() => toggleType(item)}
                    >
                      {item.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => deleteType(item)}
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
    gap: 20,
    alignItems: "flex-start",
    marginBottom: 22,
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    color: "var(--erp-primary)",
    fontWeight: 800,
  },
  title: {
    margin: "6px 0",
    color: "var(--erp-heading)",
  },
  subtitle: {
    margin: 0,
    maxWidth: 720,
    opacity: 0.78,
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(300px, 430px) minmax(0, 1fr)",
    gap: 22,
    alignItems: "start",
  },
  card: {
    background: "var(--erp-card)",
    border: "1px solid var(--erp-border)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "var(--erp-shadow)",
  },
  cardTitle: {
    margin: "0 0 16px",
    color: "var(--erp-heading)",
  },
  form: {
    display: "grid",
    gap: 15,
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 7,
  },
  label: {
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    resize: "vertical",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
  },
  checkboxLabel: {
    display: "flex",
    gap: 9,
    alignItems: "center",
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 9,
  },
  primaryButton: {
    border: 0,
    borderRadius: 10,
    padding: "11px 16px",
    fontWeight: 800,
    cursor: "pointer",
    background: "var(--erp-primary)",
    color: "#fff",
  },
  secondaryButton: {
    border: "1px solid var(--erp-border)",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "var(--erp-card)",
    color: "var(--erp-text)",
  },
  smallButton: {
    border: "1px solid var(--erp-border)",
    borderRadius: 9,
    padding: "8px 11px",
    cursor: "pointer",
    background: "var(--erp-card)",
    color: "var(--erp-text)",
  },
  deleteButton: {
    border: "1px solid #ef4444",
    borderRadius: 9,
    padding: "8px 11px",
    cursor: "pointer",
    background: "transparent",
    color: "#ef4444",
  },
  success: {
    marginBottom: 16,
    padding: 13,
    borderRadius: 10,
    background: "rgba(34,197,94,.13)",
  },
  error: {
    marginBottom: 16,
    padding: 13,
    borderRadius: 10,
    background: "rgba(239,68,68,.13)",
    color: "#ef4444",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  count: {
    margin: 0,
    opacity: 0.68,
  },
  searchInput: {
    minWidth: 210,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input)",
    color: "var(--erp-text)",
  },
  list: {
    display: "grid",
    gap: 12,
  },
  itemCard: {
    padding: 15,
    borderRadius: 13,
    border: "1px solid var(--erp-border)",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  itemName: {
    margin: 0,
    color: "var(--erp-heading)",
  },
  meta: {
    margin: "6px 0 0",
    opacity: 0.68,
  },
  description: {
    opacity: 0.8,
  },
  activeBadge: {
    alignSelf: "flex-start",
    padding: "5px 9px",
    borderRadius: 999,
    background: "rgba(34,197,94,.14)",
    color: "#22c55e",
    fontWeight: 800,
  },
  inactiveBadge: {
    alignSelf: "flex-start",
    padding: "5px 9px",
    borderRadius: 999,
    background: "rgba(239,68,68,.14)",
    color: "#ef4444",
    fontWeight: 800,
  },
  empty: {
    padding: 30,
    textAlign: "center",
    opacity: 0.7,
  },
};
