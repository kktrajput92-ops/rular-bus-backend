import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const INITIAL_FORM = {
  name: "",
  code: "",
  description: "",
  seat_type: "ANY",
  service_type: "ANY",
  is_active: true,
};

export default function AdminFareCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [seatFilter, setSeatFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/fare-categories");

      setCategories(
        Array.isArray(response.data?.categories)
          ? response.data.categories
          : []
      );
    } catch (err) {
      console.error("Load fare categories error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load fare categories."

      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const categoryName = String(category.name || "").toLowerCase();
      const categoryCode = String(category.code || "").toLowerCase();
      const categoryDescription = String(
        category.description || ""
      ).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        categoryName.includes(normalizedSearch) ||
        categoryCode.includes(normalizedSearch) ||
        categoryDescription.includes(normalizedSearch);

      const matchesSeat =
        seatFilter === "ALL" ||
        category.seat_type === seatFilter;

      const matchesService =
        serviceFilter === "ALL" ||
        category.service_type === serviceFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          Boolean(category.is_active)) ||
        (statusFilter === "INACTIVE" &&
          !Boolean(category.is_active));

      return (
        matchesSearch &&
        matchesSeat &&
        matchesService &&
        matchesStatus
      );
    });
  }, [
    categories,
    search,
    seatFilter,
    serviceFilter,
    statusFilter,
  ]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const handleCodeChange = (event) => {
    const formattedCode = event.target.value
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");

    setForm((currentForm) => ({
      ...currentForm,
      code: formattedCode,
    }));

    setError("");
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Category name is required.";
    }

    if (!form.code.trim()) {
      return "Category code is required.";
    }

    if (!/^[A-Z0-9_]+$/.test(form.code.trim())) {
      return "Code can contain only uppercase letters, numbers and underscores.";
    }

    if (!form.seat_type) {
      return "Seat type is required.";
    }

    if (!form.service_type) {
      return "Service type is required.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || null,
      seat_type: form.seat_type,
      service_type: form.service_type,
      is_active: Boolean(form.is_active),
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await api.put(
          `/fare-categories/${editingId}`,
          payload
        );

        setSuccess(
          "Fare category updated successfully."
        );
      } else {
        await api.post(
          "/fare-categories",
          payload
        );

        setSuccess(
          "Fare category created successfully."
        );
      }

      setForm(INITIAL_FORM);
      setEditingId(null);

      await loadCategories();
    } catch (err) {
      console.error(
        "Save fare category error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to save fare category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);

    setForm({
      name: category.name || "",
      code: category.code || "",
      description: category.description || "",
      seat_type: category.seat_type || "ANY",
      service_type: category.service_type || "ANY",
      is_active: Boolean(category.is_active),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete fare category "${category.name}"?`
    );

    if (!confirmed

    ) {
      return;
    }

    setDeletingId(category.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/fare-categories/${category.id}`);

      setSuccess("Fare category deleted successfully.");

      if (editingId === category.id) {
        resetForm();
      }

      await loadCategories();
    } catch (err) {
      console.error("Delete fare category error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to delete fare category."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (category) => {
    setError("");
    setSuccess("");

    const payload = {
      name: category.name,
      code: category.code,
      description: category.description || null,
      seat_type: category.seat_type || "ANY",
      service_type: category.service_type || "ANY",
      is_active: !Boolean(category.is_active),
    };

    try {
      await api.put(
        `/fare-categories/${category.id}`,
        payload
      );

      setSuccess(
        payload.is_active
          ? "Fare category activated successfully."
          : "Fare category deactivated successfully."
      );

      await loadCategories();
    } catch (err) {
      console.error("Update fare category status error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to update fare category status."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatLabel = (value) => {
    if (!value) return "-";

    return String(value)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const activeCount = categories.filter(
    (category) => Boolean(category.is_active)
  ).length;

  const inactiveCount =
    categories.length - activeCount;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>PRICING MANAGEMENT</p>

          <h1 style={styles.pageTitle}>
            Fare Categories
          </h1>

          <p style={styles.pageSubtitle}>
            Create and manage passenger fare categories,
            seat types and service classifications.
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={loadCategories}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📋
          </div>

          <div>
            <p style={styles.summaryLabel}>
              Total Categories
            </p>

            <h3 style={styles.summaryValue}>
              {categories.length}
            </h3>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            ✅
          </div>

          <div>
            <p style={styles.summaryLabel}>
              Active Categories
            </p>

            <h3 style={styles.summaryValue}>
              {activeCount}
            </h3>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            ⛔
          </div>

          <div>
            <p style={styles.summaryLabel}>
              Inactive Categories
            </p>

            <h3 style={styles.summaryValue}>
              {inactiveCount}
            </h3>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            🔎
          </div>

          <div>
            <p style={styles.summaryLabel}>
              Filtered Results
            </p>

            <h3 style={styles.summaryValue}>
              {filteredCategories.length}
            </h3>
          </div>
        </div>
      </div>

      {error ? (
        <div style={styles.errorAlert}>
          <span style={styles.alertIcon}>!</span>

          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div style={styles.successAlert}>
          <span style={styles.alertIcon}>✓</span>

          <span>{success}</span>
        </div>
      ) : null}

      <div style={styles.contentGrid}>
        <section style={styles.formCard}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardEyebrow}>
                {editingId
                  ? "UPDATE CATEGORY"
                  : "NEW CATEGORY"}
              </p>

             <h2 style={styles.cardTitle}>
                {editingId
                  ? "Edit Fare Category"
                  : "Add Fare Category"}
              </h2>

              <p style={styles.cardDescription}>
                {editingId
                  ? "Update the selected fare category details."
                  : "Create a new fare category for the pricing engine."}
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                style={styles.cancelButton}
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label
                  htmlFor="name"
                  style={styles.label}
                >
                  Category Name
                  <span style={styles.required}>
                    *
                  </span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Adult"
                  style={styles.input}
                  disabled={saving}
                />
              </div>

              <div style={styles.formGroup}>
                <label
                  htmlFor="code"
                  style={styles.label}
                >
                  Category Code
                  <span style={styles.required}>
                    *
                  </span>
                </label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  value={form.code}
                  onChange={handleCodeChange}
                  placeholder="Example: ADULT"
                  style={styles.input}
                  disabled={saving || Boolean(editingId)}
                />
              </div>

              <div style={styles.formGroup}>
                <label
                  htmlFor="seat_type"
                  style={styles.label}
                >
                  Seat Type
                </label>

                <select
                  id="seat_type"
                  name="seat_type"
                  value={form.seat_type}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={saving}
                >
                  <option value="ANY">Any Seat</option>
                  <option value="SEATER">Seater</option>
                  <option value="SLEEPER">Sleeper</option>
                  <option value="SEMI_SLEEPER">
                    Semi Sleeper
                  </option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label
                  htmlFor="service_type"
                  style={styles.label}
                >
                  Service Type
                </label>

                <select
                  id="service_type"
                  name="service_type"
                  value={form.service_type}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={saving}
                >
                  <option value="ANY">
                    Any Service
                  </option>

                  <option value="ORDINARY">
                    Ordinary
                  </option>

                  <option value="EXPRESS">
                    Express
                  </option>

                  <option value="DELUXE">
                    Deluxe
                  </option>

                  <option value="AC">
                    AC
                  </option>

                  <option value="VOLVO">
                    Volvo
                  </option>
                </select>
              </div>
              <div style={styles.fullWidthGroup}>
                <label
                  htmlFor="description"
                  style={styles.label}
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter category description..."
                  style={styles.textarea}
                  rows={4}
                  disabled={saving}
                />

                <p style={styles.fieldHelp}>
                  Optional description for internal use.
                </p>
              </div>

              <div style={styles.fullWidthGroup}>
                <label style={styles.statusToggleCard}>
                  <div>
                    <span style={styles.statusToggleTitle}>
                      Active Category
                    </span>

                    <span
                      style={
                        styles.statusToggleDescription
                      }
                    >
                      Active categories are available
                      for booking and fare calculation.
                    </span>
                  </div>

                  <div style={styles.toggleWrapper}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      disabled={saving}
                      style={styles.hiddenCheckbox}
                    />

                    <span
                      style={{
                        ...styles.toggleTrack,
                        ...(form.is_active
                          ? styles.toggleTrackActive
                          : {}),
                      }}
                    >
                      <span
                        style={{
                          ...styles.toggleThumb,
                          ...(form.is_active
                            ? styles.toggleThumbActive
                            : {}),
                        }}
                      />
                    </span>
                  </div>
                </label>
              </div>
            </div>

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
                style={{
                  ...styles.primaryButton,
                  ...(saving
                    ? styles.disabledButton
                    : {}),
                }}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Category"
                  : "Create Category"}
              </button>
            </div>
          </form>
        </section>
        <section style={styles.listCard}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardEyebrow}>
                CATEGORY DIRECTORY
              </p>

              <h2 style={styles.cardTitle}>
                Existing Fare Categories
              </h2>

              <p style={styles.cardDescription}>
                Search, filter and manage all fare
                categories.
              </p>
            </div>

            <span style={styles.resultBadge}>
              {filteredCategories.length} Results
            </span>
          </div>

          <div style={styles.filterGrid}>
            <div style={styles.searchGroup}>
              <label
                htmlFor="category-search"
                style={styles.label}
              >
                Search
              </label>

              <input
                id="category-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, code or description..."
                style={styles.input}
              />
            </div>

            <div style={styles.filterGroup}>
              <label
                htmlFor="seat-filter"
                style={styles.label}
              >
                Seat Type
              </label>

              <select
                id="seat-filter"
                value={seatFilter}
                onChange={(event) =>
                  setSeatFilter(event.target.value)
                }
                style={styles.select}
              >
                <option value="ALL">
                  All Seat Types
                </option>

                <option value="ANY">
                  Any Seat
                </option>

                <option value="SEATER">
                  Seater
                </option>

                <option value="SLEEPER">
                  Sleeper
                </option>

                <option value="SEMI_SLEEPER">
                  Semi Sleeper
                </option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label
                htmlFor="service-filter"
                style={styles.label}
              >
                Service Type
              </label>

              <select
                id="service-filter"
                value={serviceFilter}
                onChange={(event) =>
                  setServiceFilter(event.target.value)
                }
                style={styles.select}
              >
                <option value="ALL">
                  All Services
                </option>

                <option value="ANY">
                  Any Service
                </option>

                <option value="ORDINARY">
                  Ordinary
                </option>

                <option value="EXPRESS">
                  Express
                </option>

                <option value="DELUXE">
                  Deluxe
                </option>

                <option value="AC">
                  AC
                </option>

                <option value="VOLVO">
                  Volvo
                </option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label
                htmlFor="status-filter"
                style={styles.label}
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                style={styles.select}
              >
                <option value="ALL">
                  All Statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <div style={styles.filterActions}>
            <button
              type="button"
              style={styles.clearFilterButton}
              onClick={() => {
                setSearch("");
                setSeatFilter("ALL");
                setServiceFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              Clear Filters
            </button>
          </div>

          {loading ? (
            <div style={styles.stateBox}>
              <div style={styles.loader} />

              <p style={styles.stateTitle}>
                Loading fare categories...
              </p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div style={styles.stateBox}>
              <div style={styles.emptyIcon}>
                🔍
              </div>

              <p style={styles.stateTitle}>
                No fare categories found
              </p>

              <p style={styles.stateDescription}>
                Change the filters or create a new fare
                category.
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>
                      Category
                    </th>

                    <th style={styles.tableHeader}>
                      Code
                    </th>

                    <th style={styles.tableHeader}>
                      Seat Type
                    </th>

                    <th style={styles.tableHeader}>
                      Service Type
                    </th>

                    <th style={styles.tableHeader}>
                      Status
                    </th>

                    <th style={styles.tableHeader}>
                      Updated
                    </th>

                    <th
                      style={{
                        ...styles.tableHeader,
                        ...styles.actionsHeader,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map(
                    (category) => (
                      <tr
                        key={category.id}
                        style={styles.tableRow}
                      >
                        <td style={styles.tableCell}>
                          <div style={styles.categoryCell}>
                            <div
                              style={
                                styles.categoryAvatar
                              }
                            >
                              {String(
                                category.name || "F"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong
                                style={
                                  styles.categoryName
                                }
                              >
                                {category.name}
                              </strong>

                              <p
                                style={
                                  styles.categoryDescription
                                }
                              >
                                {category.description ||
                                  "No description"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td style={styles.tableCell}>
                          <span style={styles.codeBadge}>
                            {category.code}
                          </span>
                        </td>

                        <td style={styles.tableCell}>
                          {formatLabel(
                            category.seat_type
                          )}
                        </td>

                        <td style={styles.tableCell}>
                          {formatLabel(
                            category.service_type
                          )}
                        </td>

                        <td style={styles.tableCell}>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                category
                              )
                            }
                            style={{
                              ...styles.statusButton,
                              ...(category.is_active
                                ? styles.activeStatus
                                : styles.inactiveStatus),
                            }}
                          >
                            <span
                              style={{
                                ...styles.statusDot,
                                ...(category.is_active
                                  ? styles.activeDot
                                  : styles.inactiveDot),
                              }}
                            />

                            {category.is_active
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        <td style={styles.tableCell}>
                          {formatDate(
                            category.updated_at ||
                              category.created_at
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.tableCell,
                            ...styles.actionsCell,
                          }}
                        >
                          <button
                            type="button"
                            style={styles.editButton}
                            onClick={() =>
                              handleEdit(category)
                            }
                            disabled={
                              deletingId === category.id
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            style={{
                              ...styles.deleteButton,
                              ...(deletingId ===
                              category.id
                                ? styles.disabledButton
                                : {}),
                            }}
                            onClick={() =>
                              handleDelete(category)
                            }
                            disabled={
                              deletingId === category.id
                            }
                          >
                            {deletingId === category.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    )
                  )}
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
    padding: "24px",
    background: "var(--erp-bg)",
    minHeight: "100vh",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },

  pageTitle: {
    margin: "6px 0",
    fontSize: "32px",
    fontWeight: 700,
    color: "var(--erp-heading)",
  },

  pageSubtitle: {
    margin: 0,
    color: "var(--erp-text-muted)",
    fontSize: "15px",
    lineHeight: 1.6,
    maxWidth: "700px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    background: "#2563eb",
    color: "var(--erp-surface)",
    fontWeight: 600,
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  summaryCard: {
    background: "var(--erp-surface)",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow:
      "0 6px 20px rgba(15,23,42,.08)",
  },

  summaryIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    background: "var(--erp-surface-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
  },

  summaryLabel: {
    margin: 0,
    color: "var(--erp-text-muted)",
    fontSize: "13px",
  },

  summaryValue: {
    margin: "6px 0 0",
    fontSize: "26px",
    fontWeight: 700,
    color: "var(--erp-heading)",
  },

  errorAlert: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },

  successAlert: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px 18px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },

  alertIcon: {
    fontWeight: 700,
    fontSize: "18px",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "24px",
    alignItems: "start",
  },

  formCard: {
    background: "var(--erp-surface)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow:
      "0 6px 20px rgba(15,23,42,.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "12px",
  },

  cardEyebrow: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 700,
    fontSize: "11px",
    letterSpacing: "1px",
  },

  cardTitle: {
    margin: "6px 0",
    fontSize: "22px",
    color: "var(--erp-heading)",
  },

  cardDescription: {
    margin: 0,
    color: "var(--erp-text-muted)",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  cancelButton: {
    border: "none",
    background: "#ef4444",
    color: "var(--erp-surface)",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "18px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  fullWidthGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontWeight: 600,
    color: "var(--erp-text)",
    fontSize: "14px",
  },

  required: {
    color: "#dc2626",
    marginLeft: "4px",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "var(--erp-surface)",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    resize: "vertical",
    minHeight: "110px",
    boxSizing: "border-box",
  },

  fieldHelp: {
    margin: 0,
    fontSize: "12px",
    color: "var(--erp-text-muted)",
  },
  statusToggleCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fafafa",
    cursor: "pointer",
  },

  statusToggleTitle: {
    display: "block",
    fontWeight: 600,
    color: "var(--erp-heading)",
    marginBottom: "4px",
  },

  statusToggleDescription: {
    display: "block",
    fontSize: "13px",
    color: "var(--erp-text-muted)",
    lineHeight: 1.5,
  },

  toggleWrapper: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },

  hiddenCheckbox: {
    display: "none",
  },

  toggleTrack: {
    width: "52px",
    height: "30px",
    borderRadius: "999px",
    background: "#d1d5db",
    position: "relative",
    transition: "0.25s",
  },

  toggleTrackActive: {
    background: "#22c55e",
  },

  toggleThumb: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "var(--erp-surface)",
    position: "absolute",
    top: "3px",
    left: "3px",
    transition: "0.25s",
    boxShadow: "0 2px 8px rgba(0,0,0,.15)",
  },

  toggleThumbActive: {
    transform: "translateX(22px)",
  },

  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "10px",
  },

  primaryButton: {
    flex: 1,
    border: "none",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "#2563eb",
    color: "var(--erp-surface)",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "13px 18px",
    background: "var(--erp-surface)",
    color: "var(--erp-text)",
    fontWeight: 600,
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  listCard: {
    background: "var(--erp-surface)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 6px 20px rgba(15,23,42,.08)",
  },

  resultBadge: {
    background: "var(--erp-surface-muted)",
    color: "#2563eb",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "2fr repeat(3,1fr)",
    gap: "16px",
    marginBottom: "18px",
  },

  searchGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  filterActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  },

  clearFilterButton: {
    border: "none",
    borderRadius: "8px",
    background: "#ef4444",
    color: "var(--erp-surface)",
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  stateBox: {
    padding: "60px 20px",
    textAlign: "center",
  },

  loader: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #2563eb",
    margin: "0 auto 20px",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "14px",
  },

  stateTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: "18px",
    color: "var(--erp-heading)",
  },

  stateDescription: {
    marginTop: "8px",
    color: "var(--erp-text-muted)",
    fontSize: "14px",
  },

  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    background: "#f9fafb",
    padding: "14px",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--erp-text)",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 700,
  },
  tableRow: {
    borderBottom: "1px solid #e5e7eb",
  },

  tableCell: {
    padding: "14px",
    fontSize: "14px",
    color: "var(--erp-text)",
    verticalAlign: "middle",
  },

  actionsHeader: {
    textAlign: "right",
    minWidth: "150px",
  },

  categoryCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: "220px",
  },

  categoryAvatar: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    fontWeight: 800,
  },

  categoryName: {
    display: "block",
    color: "var(--erp-heading)",
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "4px",
  },

  categoryDescription: {
    margin: 0,
    color: "var(--erp-text-muted)",
    fontSize: "12px",
    lineHeight: 1.4,
    maxWidth: "240px",
    whiteSpace: "normal",
  },

  codeBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "8px",
    background: "#f3f4f6",
    color: "var(--erp-text)",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.4px",
  },

  statusButton: {
    border: "none",
    borderRadius: "999px",
    padding: "7px 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  activeStatus: {
    background: "#dcfce7",
    color: "#166534",
  },

  inactiveStatus: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },

  activeDot: {
    background: "#22c55e",
  },

  inactiveDot: {
    background: "#ef4444",
  },

  actionsCell: {
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  editButton: {
    border: "1px solid #2563eb",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "var(--erp-surface-muted)",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    marginRight: "8px",
  },

  deleteButton: {
    border: "1px solid #ef4444",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
