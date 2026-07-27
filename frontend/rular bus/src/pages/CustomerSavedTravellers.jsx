import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import customerApi from "../api/customerApi";
import Navbar from "../components/Navbar";

const EMPTY_FORM = {
  full_name: "",
  relationship: "OTHER",
  gender: "MALE",
  date_of_birth: "",
  phone: "",
  email: "",
};

const RELATIONSHIPS = [
  ["SELF", "स्वयं"],
  ["SPOUSE", "पति / पत्नी"],
  ["SON", "बेटा"],
  ["DAUGHTER", "बेटी"],
  ["FATHER", "पिता"],
  ["MOTHER", "माता"],
  ["BROTHER", "भाई"],
  ["SISTER", "बहन"],
  ["RELATIVE", "रिश्तेदार"],
  ["FRIEND", "मित्र"],
  ["OTHER", "अन्य"],
];

const GENDERS = [
  ["MALE", "पुरुष"],
  ["FEMALE", "महिला"],
  ["OTHER", "अन्य"],
];

const CATEGORY_LABELS = {
  INFANT: "शिशु",
  CHILD: "बच्चा",
  ADULT: "वयस्क",
  SENIOR: "वरिष्ठ",
};

export default function CustomerSavedTravellers() {
  const navigate = useNavigate();

  const [travellers, setTravellers] =
    useState([]);

  const [summary, setSummary] =
    useState({
      total: 0,
      infant: 0,
      child: 0,
      adult: 0,
      senior: 0,
    });

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const formTitle = useMemo(
    () =>
      editingId
        ? "यात्री की जानकारी बदलें"
        : "नया यात्री जोड़ें",
    [editingId]
  );

  const loadTravellers = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } =
        await customerApi.get(
          "/saved-travellers"
        );

      setTravellers(
        Array.isArray(data.travellers)
          ? data.travellers
          : []
      );

      setSummary(
        data.summary || {
          total: 0,
          infant: 0,
          child: 0,
          adult: 0,
          senior: 0,
        }
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Saved travellers load नहीं हो पाए।"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTravellers();
  }, []);

  const updateField =
    (field) => (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));

      setError("");
      setSuccess("");
    };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const startEdit = (traveller) => {
    setEditingId(
      Number(traveller.id)
    );

    setForm({
      full_name:
        traveller.full_name || "",

      relationship:
        traveller.relationship ||
        "OTHER",

      gender:
        traveller.gender || "MALE",

      date_of_birth:
        traveller.date_of_birth
          ? String(
              traveller.date_of_birth
            ).slice(0, 10)
          : "",

      phone:
        traveller.phone || "",

      email:
        traveller.email || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const payload = {
      full_name:
        form.full_name
          .replace(/\s+/g, " ")
          .trim(),

      relationship:
        form.relationship,

      gender:
        form.gender,

      date_of_birth:
        form.date_of_birth,

      phone:
        form.phone
          .replace(/\D/g, "")
          .trim() ||
        null,

      email:
        form.email
          .trim()
          .toLowerCase() ||
        null,
    };

    if (payload.full_name.length < 2) {
      setError(
        "यात्री का पूरा नाम दर्ज करें।"
      );
      return;
    }

    if (!payload.date_of_birth) {
      setError(
        "जन्मतिथि दर्ज करें।"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await customerApi.put(
          `/saved-travellers/${editingId}`,
          payload
        );

        setSuccess(
          "यात्री की जानकारी अपडेट हो गई।"
        );
      } else {
        await customerApi.post(
          "/saved-travellers",
          payload
        );

        setSuccess(
          "नया यात्री सेव हो गया।"
        );
      }

      resetForm();
      await loadTravellers();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "यात्री सेव नहीं हो पाया।"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeTraveller = async (
    traveller
  ) => {
    const confirmed =
      window.confirm(
        `${traveller.full_name} को saved travellers से हटाना है?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await customerApi.delete(
        `/saved-travellers/${traveller.id}`
      );

      setSuccess(
        "यात्री हटा दिया गया।"
      );

      if (
        Number(editingId) ===
        Number(traveller.id)
      ) {
        resetForm();
      }

      await loadTravellers();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "यात्री हटाया नहीं जा सका।"
      );
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.container}>
        <section style={styles.header}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.backButton}
          >
            ← होम
          </button>

          <div>
            <p style={styles.eyebrow}>
              यात्री अकाउंट
            </p>

            <h1 style={styles.title}>
              👥 Saved Travellers
            </h1>

            <p style={styles.subtitle}>
              परिवार और नियमित यात्रियों की
              जानकारी सुरक्षित रखें।
            </p>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <Summary
            label="कुल यात्री"
            value={summary.total}
          />

          <Summary
            label="वयस्क"
            value={summary.adult}
          />

          <Summary
            label="बच्चे"
            value={summary.child}
          />

          <Summary
            label="शिशु"
            value={summary.infant}
          />

          <Summary
            label="वरिष्ठ"
            value={summary.senior}
          />
        </section>

        <section style={styles.layout}>
          <form
            onSubmit={handleSubmit}
            style={styles.formCard}
          >
            <div style={styles.formHeader}>
              <h2 style={styles.sectionTitle}>
                {formTitle}
              </h2>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              )}
            </div>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            {success && (
              <div style={styles.success}>
                {success}
              </div>
            )}

            <Field label="पूरा नाम">
              <input
                type="text"
                value={form.full_name}
                onChange={updateField(
                  "full_name"
                )}
                style={styles.input}
                placeholder="यात्री का पूरा नाम"
              />
            </Field>

            <Field label="रिश्ता">
              <select
                value={form.relationship}
                onChange={updateField(
                  "relationship"
                )}
                style={styles.input}
              >
                {RELATIONSHIPS.map(
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
            </Field>

            <div style={styles.twoColumns}>
              <Field label="लिंग">
                <select
                  value={form.gender}
                  onChange={updateField(
                    "gender"
                  )}
                  style={styles.input}
                >
                  {GENDERS.map(
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
              </Field>

              <Field label="जन्मतिथि">
                <input
                  type="date"
                  value={
                    form.date_of_birth
                  }
                  onChange={updateField(
                    "date_of_birth"
                  )}
                  max={
                    new Date()
                      .toISOString()
                      .slice(0, 10)
                  }
                  style={styles.input}
                />
              </Field>
            </div>

            <Field label="मोबाइल नंबर (वैकल्पिक)">
              <input
                type="tel"
                value={form.phone}
                onChange={updateField(
                  "phone"
                )}
                style={styles.input}
                placeholder="10 अंकों का नंबर"
              />
            </Field>

            <Field label="ईमेल (वैकल्पिक)">
              <input
                type="email"
                value={form.email}
                onChange={updateField(
                  "email"
                )}
                style={styles.input}
                placeholder="example@email.com"
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity:
                  saving ? 0.65 : 1,
              }}
            >
              {saving
                ? "सेव हो रहा है..."
                : editingId
                  ? "जानकारी अपडेट करें"
                  : "यात्री सेव करें"}
            </button>
          </form>

          <section style={styles.listCard}>
            <h2 style={styles.sectionTitle}>
              सेव किए गए यात्री
            </h2>

            {loading ? (
              <div style={styles.empty}>
                Travellers load हो रहे हैं...
              </div>
            ) : travellers.length === 0 ? (
              <div style={styles.empty}>
                अभी कोई saved traveller नहीं
                है।
              </div>
            ) : (
              <div style={styles.travellerList}>
                {travellers.map(
                  (traveller) => (
                    <article
                      key={traveller.id}
                      style={
                        styles.travellerCard
                      }
                    >
                      <div
                        style={
                          styles.travellerTop
                        }
                      >
                        <div style={styles.avatar}>
                          {String(
                            traveller.full_name ||
                            "Y"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3
                            style={
                              styles.travellerName
                            }
                          >
                            {
                              traveller.full_name
                            }
                          </h3>

                          <p
                            style={
                              styles.travellerMeta
                            }
                          >
                            {
                              RELATIONSHIPS.find(
                                ([value]) =>
                                  value ===
                                  traveller.relationship
                              )?.[1]
                            }{" "}
                            •{" "}
                            {CATEGORY_LABELS[
                              traveller
                                .passenger_category
                            ] ||
                              traveller
                                .passenger_category}{" "}
                            • आयु{" "}
                            {traveller.age}
                          </p>
                        </div>

                        <span
                          style={
                            styles.categoryBadge
                          }
                        >
                          {
                            CATEGORY_LABELS[
                              traveller
                                .passenger_category
                            ]
                          }
                        </span>
                      </div>

                      <div
                        style={
                          styles.contactDetails
                        }
                      >
                        <span>
                          📅{" "}
                          {String(
                            traveller.date_of_birth
                          ).slice(0, 10)}
                        </span>

                        {traveller.phone && (
                          <span>
                            📱 {traveller.phone}
                          </span>
                        )}

                        {traveller.email && (
                          <span>
                            ✉️ {traveller.email}
                          </span>
                        )}
                      </div>

                      <div
                        style={
                          styles.actions
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              traveller
                            )
                          }
                          style={
                            styles.editButton
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeTraveller(
                              traveller
                            )
                          }
                          style={
                            styles.deleteButton
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label style={styles.label}>
      {label}
      {children}
    </label>
  );
}

function Summary({
  label,
  value,
}) {
  return (
    <div style={styles.summaryCard}>
      <strong style={styles.summaryValue}>
        {value || 0}
      </strong>
      <span>{label}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },

  container: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    padding: "20px",
    boxSizing: "border-box",
  },

  header: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "16px",
    padding: "22px",
    marginBottom: "18px",
    borderRadius: "18px",
    background: "var(--erp-surface)",
    border: "1px solid var(--erp-border)",
    boxShadow: "var(--erp-shadow)",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "var(--erp-text)",
    fontWeight: 800,
    cursor: "pointer",
  },

  eyebrow: {
    margin: "0 0 4px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "clamp(26px,5vw,38px)",
  },

  subtitle: {
    margin: "7px 0 0",
    opacity: 0.7,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5,minmax(100px,1fr))",
    gap: "12px",
    marginBottom: "20px",
    overflowX: "auto",
  },

  summaryCard: {
    minWidth: "105px",
    padding: "16px",
    display: "grid",
    gap: "4px",
    textAlign: "center",
    borderRadius: "14px",
    background: "var(--erp-surface)",
    border: "1px solid var(--erp-border)",
  },

  summaryValue: {
    color: "#2563eb",
    fontSize: "24px",
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(280px,380px) minmax(0,1fr)",
    gap: "20px",
    alignItems: "start",
  },

  formCard: {
    padding: "22px",
    borderRadius: "18px",
    background: "var(--erp-surface)",
    border: "1px solid var(--erp-border)",
    boxShadow: "var(--erp-shadow-lg)",
  },

  listCard: {
    padding: "22px",
    borderRadius: "18px",
    background: "var(--erp-surface)",
    border: "1px solid var(--erp-border)",
    boxShadow: "var(--erp-shadow-lg)",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: "0 0 18px",
    color: "var(--erp-heading)",
  },

  label: {
    display: "grid",
    gap: "7px",
    marginBottom: "16px",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    minHeight: "46px",
    padding: "11px 12px",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input-bg)",
    color: "var(--erp-text)",
    fontSize: "15px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "12px",
  },

  saveButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg,#2563eb,#0284c7)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },

  cancelButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 800,
  },

  error: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "10px",
    color: "#dc2626",
    border: "1px solid #dc2626",
    background: "rgba(220,38,38,.08)",
  },

  success: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "10px",
    color: "#15803d",
    border: "1px solid #16a34a",
    background: "rgba(22,163,74,.1)",
  },

  empty: {
    padding: "30px",
    textAlign: "center",
    opacity: 0.7,
  },

  travellerList: {
    display: "grid",
    gap: "14px",
  },

  travellerCard: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input-bg)",
  },

  travellerTop: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  avatar: {
    width: "46px",
    height: "46px",
    display: "grid",
    placeItems: "center",
    borderRadius: "13px",
    background: "#0284c7",
    color: "#fff",
    fontWeight: 900,
    fontSize: "20px",
  },

  travellerName: {
    margin: 0,
    color: "var(--erp-heading)",
  },

  travellerMeta: {
    margin: "5px 0 0",
    opacity: 0.7,
    fontSize: "13px",
  },

  categoryBadge: {
    padding: "6px 9px",
    borderRadius: "999px",
    background: "rgba(22,163,74,.12)",
    color: "#15803d",
    fontWeight: 800,
    fontSize: "12px",
  },

  contactDetails: {
    marginTop: "14px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    fontSize: "13px",
    opacity: 0.78,
  },

  actions: {
    marginTop: "15px",
    display: "flex",
    gap: "10px",
  },

  editButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  deleteButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
