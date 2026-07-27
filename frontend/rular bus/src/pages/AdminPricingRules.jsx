import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const EMPTY_FORM = {
  name: "",
  rule_type: "ROUTE",
  route_id: "",
  bus_id: "",
  schedule_id: "",
  journey_id: "",
  category_id: "",
  pricing_method: "PERCENTAGE",
  amount: "",
  effective_from: "",
  effective_to: "",
  priority: 1,
  approval_mode: "MANAGER_ONLY",
  change_reason: "",
  adjustment_type: "DISCOUNT",
  time_from: "",
  time_to: "",
  days: [],
};

const DAY_OPTIONS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

const formatDate = (value) => {
  if (!value) return "Open ended";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMethod = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatAmount = (rule) => {
  const amount = Number(rule.amount || 0);

  if (rule.pricing_method === "PERCENTAGE") return `${amount}%`;
  if (rule.pricing_method === "MULTIPLIER") return `${amount}×`;
  return `₹${amount.toFixed(2)}`;
};

export default function AdminPricingRules() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [rulesResult, categoriesResult, routesResult] =
      await Promise.allSettled([
        api.get("/pricing-rules"),
        api.get("/fare-categories"),
        api.get("/routes"),
      ]);

    if (rulesResult.status === "fulfilled") {
      setRules(extractList(rulesResult.value.data, ["rules"]));
    } else {
      setRules([]);
      setError(
        rulesResult.reason?.response?.data?.message ||
          rulesResult.reason?.message ||
          "Failed to load pricing rules."
      );
    }

    if (categoriesResult.status === "fulfilled") {
      setCategories(
        extractList(categoriesResult.value.data, ["categories"])
      );
    }

    if (routesResult.status === "fulfilled") {
      setRoutes(extractList(routesResult.value.data, ["routes"]));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredRules = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rules.filter((rule) => {
      const routeLabel = `${rule.route_source || ""} ${
        rule.route_destination || ""
      }`.toLowerCase();

      const matchesSearch =
        !keyword ||
        String(rule.name || "").toLowerCase().includes(keyword) ||
        String(rule.category_name || "").toLowerCase().includes(keyword) ||
        routeLabel.includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" || rule.approval_status === statusFilter;

      const matchesMethod =
        methodFilter === "ALL" || rule.pricing_method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [rules, search, statusFilter, methodFilter]);

  const summary = useMemo(
    () => ({
      total: rules.length,
      approved: rules.filter((rule) => rule.approval_status === "APPROVED")
        .length,
      pending: rules.filter((rule) =>
        ["PENDING_APPROVAL", "PARTIALLY_APPROVED"].includes(
          rule.approval_status
        )
      ).length,
      live: rules.filter((rule) => rule.is_active).length,
    }),
    [rules]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Rule name is required.";
    if (!form.rule_type) return "Rule type is required.";
    if (!form.pricing_method) return "Pricing method is required.";
    if (form.amount === "" || Number.isNaN(Number(form.amount))) {
      return "A valid amount is required.";
    }
    if (Number(form.amount) < 0) return "Amount cannot be negative.";
    if (
      form.effective_from &&
      form.effective_to &&
      new Date(form.effective_from) > new Date(form.effective_to)
    ) {
      return "Effective From cannot be later than Effective To.";
    }
    return "";
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    rule_type: form.rule_type,
    route_id: toNullableNumber(form.route_id),
    bus_id: toNullableNumber(form.bus_id),
    schedule_id: toNullableNumber(form.schedule_id),
    journey_id: toNullableNumber(form.journey_id),
    category_id: toNullableNumber(form.category_id),
    pricing_method: form.pricing_method,
    amount: Number(form.amount),
    effective_from: form.effective_from || null,
    effective_to: form.effective_to || null,
    priority: Number(form.priority || 1),
    approval_mode: form.approval_mode,
    change_reason: form.change_reason.trim() || null,
    condition_data: {
      adjustmentType: form.adjustment_type,
      days: form.days,
      timeFrom: form.time_from || null,
      timeTo: form.time_to || null,
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload();

      if (editingId) {
        await api.put(`/pricing-rules/${editingId}`, payload);
        setSuccess("Pricing rule updated successfully.");
      } else {
        await api.post("/pricing-rules", payload);
        setSuccess("Pricing rule created successfully.");
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to save pricing rule."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule) => {
    const conditionData = rule.condition_data || {};

    setEditingId(rule.id);
    setForm({
      name: rule.name || "",
      rule_type: rule.rule_type || "ROUTE",
      route_id: rule.route_id ?? "",
      bus_id: rule.bus_id ?? "",
      schedule_id: rule.schedule_id ?? "",
      journey_id: rule.journey_id ?? "",
      category_id: rule.category_id ?? "",
      pricing_method: rule.pricing_method || "PERCENTAGE",
      amount: rule.amount ?? "",
      effective_from: toDateTimeLocal(rule.effective_from),
      effective_to: toDateTimeLocal(rule.effective_to),
      priority: rule.priority ?? 1,
      approval_mode: rule.approval_mode || "MANAGER_ONLY",
      change_reason: rule.change_reason || "",
      adjustment_type: conditionData.adjustmentType || "DISCOUNT",
      time_from: conditionData.timeFrom || "",
      time_to: conditionData.timeTo || "",
      days: Array.isArray(conditionData.days) ? conditionData.days : [],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (rule) => {
    const confirmed = window.confirm(
      `Deactivate pricing rule "${rule.name}"?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/pricing-rules/${rule.id}`);
      setSuccess("Pricing rule deactivated successfully.");
      if (editingId === rule.id) resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to deactivate pricing rule."
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>ENTERPRISE PRICING</p>
          <h1 style={styles.title}>Pricing Rules</h1>
          <p style={styles.subtitle}>
            Create and manage route, category and journey pricing rules.
          </p>
        </div>
        <button style={styles.refreshButton} onClick={loadData} type="button">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={styles.summaryGrid}>
        {[
          ["Total active rules", summary.total],
          ["Approved", summary.approved],
          ["Pending approval", summary.pending],
          ["Live", summary.live],
        ].map(([label, value]) => (
          <div style={styles.summaryCard} key={label}>
            <span style={styles.summaryLabel}>{label}</span>
            <strong style={styles.summaryValue}>{value}</strong>
          </div>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.contentGrid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingId ? "Edit Pricing Rule" : "Create Pricing Rule"}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <Field label="Rule Name">
              <input
                style={styles.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: Diwali Offer"
              />
            </Field>

            <div style={styles.twoColumns}>
              <Field label="Rule Type">
                <select
                  style={styles.input}
                  name="rule_type"
                  value={form.rule_type}
                  onChange={handleChange}
                >
                  {[
                    "GLOBAL",
                    "ROUTE",
                    "BUS",
                    "SCHEDULE",
                    "JOURNEY",
                    "CATEGORY",
                  ].map((value) => (
                    <option value={value} key={value}>
                      {formatMethod(value)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category">
                <select
                  style={styles.input}
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Route">
              <select
                style={styles.input}
                name="route_id"
                value={form.route_id}
                onChange={handleChange}
              >
                <option value="">All routes</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.source} → {route.destination}
                  </option>
                ))}
              </select>
            </Field>

            <div style={styles.threeColumns}>
              <Field label="Bus ID">
                <input
                  type="number"
                  style={styles.input}
                  name="bus_id"
                  value={form.bus_id}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Schedule ID">
                <input
                  type="number"
                  style={styles.input}
                  name="schedule_id"
                  value={form.schedule_id}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Journey ID">
                <input
                  type="number"
                  style={styles.input}
                  name="journey_id"
                  value={form.journey_id}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div style={styles.twoColumns}>
              <Field label="Pricing Method">
                <select
                  style={styles.input}
                  name="pricing_method"
                  value={form.pricing_method}
                  onChange={handleChange}
                >
                  <option value="FIXED">Fixed</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="MULTIPLIER">Multiplier</option>
                </select>
              </Field>
              <Field label="Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  style={styles.input}
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <div style={styles.twoColumns}>
              <Field label="Adjustment Type">
                <select
                  style={styles.input}
                  name="adjustment_type"
                  value={form.adjustment_type}
                  onChange={handleChange}
                >
                  <option value="DISCOUNT">Discount</option>
                  <option value="SURCHARGE">Surcharge</option>
                </select>
              </Field>
              <Field label="Priority">
                <input
                  type="number"
                  min="0"
                  style={styles.input}
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <div style={styles.twoColumns}>
              <Field label="Effective From">
                <input
                  type="datetime-local"
                  style={styles.input}
                  name="effective_from"
                  value={form.effective_from}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Effective To">
                <input
                  type="datetime-local"
                  style={styles.input}
                  name="effective_to"
                  value={form.effective_to}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <div style={styles.twoColumns}>
              <Field label="Time From">
                <input
                  type="time"
                  style={styles.input}
                  name="time_from"
                  value={form.time_from}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Time To">
                <input
                  type="time"
                  style={styles.input}
                  name="time_to"
                  value={form.time_to}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <Field label="Applicable Days">
              <div style={styles.dayGrid}>
                {DAY_OPTIONS.map((day) => (
                  <label style={styles.dayOption} key={day}>
                    <input
                      type="checkbox"
                      checked={form.days.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Approval Mode">
              <select
                style={styles.input}
                name="approval_mode"
                value={form.approval_mode}
                onChange={handleChange}
              >
                <option value="MANAGER_ONLY">Manager Only</option>
                <option value="ADMIN_ONLY">Admin Only</option>
                <option value="MANAGER_OR_ADMIN">Manager or Admin</option>
                <option value="MANAGER_THEN_ADMIN">
                  Manager then Admin
                </option>
              </select>
            </Field>

            <Field label="Change Reason">
              <textarea
                style={styles.textarea}
                name="change_reason"
                value={form.change_reason}
                onChange={handleChange}
                placeholder="Reason for creating or updating this rule"
              />
            </Field>

            <div style={styles.actions}>
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
                  ? "Update Rule"
                  : "Create Rule"}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.cardTitle}>Existing Rules</h2>
              <p style={styles.note}>
                The current GET API returns active rules only. Deactivated rules
                disappear from this list.
              </p>
            </div>
          </div>

          <div style={styles.filters}>
            <input
              style={styles.input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, category or route"
            />
            <select
              style={styles.input}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All approval statuses</option>
              {[
                "DRAFT",
                "PENDING_APPROVAL",
                "PARTIALLY_APPROVED",
                "APPROVED",
                "REJECTED",
                "LIVE",
                "EXPIRED",
              ].map((value) => (
                <option value={value} key={value}>
                  {formatMethod(value)}
                </option>
              ))}
            </select>
            <select
              style={styles.input}
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
            >
              <option value="ALL">All methods</option>
              <option value="FIXED">Fixed</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="MULTIPLIER">Multiplier</option>
            </select>
          </div>

          {loading ? (
            <div style={styles.empty}>Loading pricing rules...</div>
          ) : filteredRules.length === 0 ? (
            <div style={styles.empty}>No matching pricing rules found.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      "Rule",
                      "Scope",
                      "Category",
                      "Method",
                      "Amount",
                      "Approval",
                      "Priority",
                      "Effective Period",
                      "Actions",
                    ].map((heading) => (
                      <th style={styles.th} key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr style={styles.row} key={rule.id}>
                      <td style={styles.td}>
                        <strong>{rule.name}</strong>
                        <div style={styles.muted}>
                          v{rule.version || 1} · {formatMethod(rule.rule_type)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {rule.route_source || rule.route_destination
                          ? `${rule.route_source || "—"} → ${
                              rule.route_destination || "—"
                            }`
                          : "All routes"}
                      </td>
                      <td style={styles.td}>
                        {rule.category_name || "All categories"}
                      </td>
                      <td style={styles.td}>
                        {formatMethod(rule.pricing_method)}
                        <div style={styles.muted}>
                          {formatMethod(
                            rule.condition_data?.adjustmentType || ""
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <strong>{formatAmount(rule)}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={statusStyle(rule.approval_status)}>
                          {formatMethod(rule.approval_status)}
                        </span>
                      </td>
                      <td style={styles.td}>{rule.priority}</td>
                      <td style={styles.td}>
                        <div>{formatDate(rule.effective_from)}</div>
                        <div style={styles.muted}>
                          to {formatDate(rule.effective_to)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.tableActions}>
                          <button
                            type="button"
                            style={styles.editButton}
                            onClick={() => handleEdit(rule)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={styles.deleteButton}
                            onClick={() => handleDelete(rule)}
                          >
                            Deactivate
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

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const statusStyle = (status) => {
  const base = {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  };

  if (["APPROVED", "LIVE"].includes(status)) {
    return { ...base, background: "#dcfce7", color: "#166534" };
  }
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(status)) {
    return { ...base, background: "#fee2e2", color: "#991b1b" };
  }
  if (["PENDING_APPROVAL", "PARTIALLY_APPROVED"].includes(status)) {
    return { ...base, background: "#fef3c7", color: "#92400e" };
  }
  return { ...base, background: "#e0e7ff", color: "#3730a3" };
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "var(--erp-bg)",
    color: "var(--erp-heading)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  eyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },
  title: { margin: "6px 0", fontSize: "32px" },
  subtitle: { margin: 0, color: "var(--erp-text-muted)" },
  refreshButton: {
    border: 0,
    borderRadius: "10px",
    padding: "11px 18px",
    background: "var(--erp-heading)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  summaryCard: {
    background: "var(--erp-surface)",
    borderRadius: "14px",
    padding: "17px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)",
  },
  summaryLabel: { display: "block", color: "var(--erp-text-muted)", fontSize: "13px" },
  summaryValue: { display: "block", marginTop: "7px", fontSize: "26px", color: "var(--erp-heading)" },
  error: {
    padding: "13px 16px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#991b1b",
    marginBottom: "16px",
  },
  success: {
    padding: "13px 16px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#166534",
    marginBottom: "16px",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 390px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
  },
  card: {
    background: "var(--erp-surface)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)",
    minWidth: 0,
  },
  cardTitle: { margin: "0 0 16px", fontSize: "21px", color: "var(--erp-heading)" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "13px", fontWeight: 700, color: "var(--erp-text)" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--erp-border)",
    borderRadius: "9px",
    padding: "10px 11px",
    background: "var(--erp-surface)",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    minHeight: "82px",
    boxSizing: "border-box",
    border: "1px solid var(--erp-border)",
    borderRadius: "9px",
    padding: "10px 11px",
    resize: "vertical",
    fontSize: "14px",
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  threeColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },
  dayGrid: { display: "flex", gap: "7px", flexWrap: "wrap" },
  dayOption: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 8px",
    background: "var(--erp-surface-muted)",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 700,
  },
  actions: { display: "flex", gap: "10px", marginTop: "4px" },
  primaryButton: {
    flex: 1,
    border: 0,
    borderRadius: "9px",
    padding: "11px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid var(--erp-border)",
    borderRadius: "9px",
    padding: "11px 15px",
    background: "var(--erp-surface)",
    fontWeight: 700,
    cursor: "pointer",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },
  note: { margin: "-8px 0 0", fontSize: "12px", color: "var(--erp-text-muted)" },
  filters: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "10px",
    marginBottom: "14px",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--erp-text-muted)",
    background: "var(--erp-surface-muted)",
    borderRadius: "12px",
  },
  tableWrapper: { overflowX: "auto", border: "1px solid var(--erp-border)", borderRadius: "12px" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "1050px" },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "var(--erp-surface-muted)",
    borderBottom: "1px solid var(--erp-border)",
    fontSize: "12px",
    color: "var(--erp-text-secondary)",
  },
  row: { borderBottom: "1px solid var(--erp-border)" },
  td: { padding: "12px", fontSize: "13px", verticalAlign: "top" },
  muted: { marginTop: "4px", color: "var(--erp-text-muted)", fontSize: "11px" },
  tableActions: { display: "flex", gap: "7px" },
  editButton: {
    border: "1px solid #2563eb",
    borderRadius: "8px",
    padding: "7px 10px",
    background: "var(--erp-surface-muted)",
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteButton: {
    border: "1px solid #ef4444",
    borderRadius: "8px",
    padding: "7px 10px",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
  },
};
