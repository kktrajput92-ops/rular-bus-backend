import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import { useCustomerAuth } from "../context/CustomerAuthContext";

export default function CustomerProfile() {
  const navigate = useNavigate();

  const {
    customer,
    updateCustomer,
  } = useCustomerAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    preferred_language: "hi",
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    setForm({
      full_name:
        customer?.full_name || "",

      email:
        customer?.email || "",

      preferred_language:
        customer?.preferred_language ||
        "hi",
    });
  }, [customer]);

  const updateField =
    (field) => (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));

      setError("");
      setSuccess("");
    };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const payload = {
      full_name:
        form.full_name
          .replace(/\s+/g, " ")
          .trim(),

      email:
        form.email
          .trim()
          .toLowerCase() ||
        null,

      preferred_language:
        form.preferred_language,
    };

    if (payload.full_name.length < 2) {
      setError(
        "पूरा नाम दर्ज करें"
      );
      return;
    }

    try {
      setSaving(true);

      await updateCustomer(payload);

      setSuccess(
        "प्रोफाइल सफलतापूर्वक अपडेट हो गई"
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "प्रोफाइल अपडेट नहीं हो पाई"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.container}>
        <section style={styles.headerCard}>
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
              👤 मेरी प्रोफाइल
            </h1>

            <p style={styles.subtitle}>
              अपनी व्यक्तिगत जानकारी और भाषा
              प्राथमिकता अपडेट करें।
            </p>
          </div>
        </section>

        <section style={styles.profileGrid}>
          <aside style={styles.accountCard}>
            <div style={styles.avatar}>
              {String(
                customer?.full_name ||
                "Y"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2 style={styles.accountName}>
              {customer?.full_name ||
                "यात्री"}
            </h2>

            <p style={styles.accountPhone}>
              {customer?.phone ||
                "मोबाइल उपलब्ध नहीं"}
            </p>

            <div style={styles.statusBadge}>
              {customer?.account_status ||
                "ACTIVE"}
            </div>

            <div style={styles.accountMeta}>
              <MetaRow
                label="फोन सत्यापन"
                value={
                  customer?.phone_verified_at
                    ? "Verified"
                    : "Not verified"
                }
              />

              <MetaRow
                label="ईमेल सत्यापन"
                value={
                  customer?.email_verified_at
                    ? "Verified"
                    : "Not verified"
                }
              />

              <MetaRow
                label="प्रोफाइल"
                value={
                  customer?.profile_completed
                    ? "Complete"
                    : "Incomplete"
                }
              />
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            style={styles.formCard}
          >
            <div style={styles.formHeading}>
              <h2 style={styles.sectionTitle}>
                व्यक्तिगत जानकारी
              </h2>

              <p style={styles.sectionText}>
                मोबाइल नंबर बदलने के लिए OTP
                verification आवश्यक होगा।
              </p>
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

            <label style={styles.label}>
              पूरा नाम

              <input
                type="text"
                value={form.full_name}
                onChange={updateField(
                  "full_name"
                )}
                autoComplete="name"
                placeholder="पूरा नाम"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              मोबाइल नंबर

              <input
                type="text"
                value={
                  customer?.phone || ""
                }
                readOnly
                style={{
                  ...styles.input,
                  opacity: 0.72,
                  cursor: "not-allowed",
                }}
              />

              <span style={styles.helpText}>
                सुरक्षा के लिए मोबाइल नंबर अभी
                readonly है।
              </span>
            </label>

            <label style={styles.label}>
              ईमेल पता

              <input
                type="email"
                value={form.email}
                onChange={updateField(
                  "email"
                )}
                autoComplete="email"
                placeholder="example@email.com"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              पसंदीदा भाषा

              <select
                value={
                  form.preferred_language
                }
                onChange={updateField(
                  "preferred_language"
                )}
                style={styles.input}
              >
                <option value="hi">
                  हिन्दी
                </option>

                <option value="en">
                  English
                </option>
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving
                  ? 0.65
                  : 1,

                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "सेव हो रहा है..."
                : "प्रोफाइल सेव करें"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/change-password"
                )
              }
              style={{
                ...styles.saveButton,
                marginTop: 12,
                background:
                  "linear-gradient(135deg,#475569,#1e293b)",
              }}
            >
              🔐 पासवर्ड बदलें
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function MetaRow({
  label,
  value,
}) {
  return (
    <div style={styles.metaRow}>
      <span>{label}</span>
      <strong>{value}</strong>
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
    width: "min(1100px, 100%)",
    margin: "0 auto",
    padding: "20px",
    boxSizing: "border-box",
  },

  headerCard: {
    display: "grid",
    gridTemplateColumns:
      "auto 1fr",
    gap: "16px",
    alignItems: "start",
    padding: "22px",
    marginBottom: "20px",
    borderRadius: "18px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow)",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "var(--erp-text)",
    fontWeight: 800,
    cursor: "pointer",
    padding: "8px",
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
    fontSize:
      "clamp(26px, 5vw, 38px)",
  },

  subtitle: {
    margin: "8px 0 0",
    opacity: 0.72,
    lineHeight: 1.6,
  },

  profileGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(240px, 320px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
  },

  accountCard: {
    padding: "26px",
    textAlign: "center",
    borderRadius: "18px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow-lg)",
  },

  avatar: {
    width: "84px",
    height: "84px",
    margin: "0 auto 14px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #2563eb, #0284c7)",
    color: "#fff",
    fontSize: "34px",
    fontWeight: 900,
  },

  accountName: {
    margin: 0,
    color: "var(--erp-heading)",
  },

  accountPhone: {
    margin: "7px 0 12px",
    opacity: 0.72,
  },

  statusBadge: {
    display: "inline-block",
    padding: "7px 13px",
    borderRadius: "999px",
    background:
      "rgba(22,163,74,0.12)",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: 900,
  },

  accountMeta: {
    marginTop: "22px",
    display: "grid",
    gap: "10px",
  },

  metaRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "12px",
    padding: "11px 0",
    borderBottom:
      "1px solid var(--erp-border)",
    textAlign: "left",
    fontSize: "13px",
  },

  formCard: {
    padding: "26px",
    borderRadius: "18px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-surface)",
    boxShadow:
      "var(--erp-shadow-lg)",
  },

  formHeading: {
    marginBottom: "22px",
  },

  sectionTitle: {
    margin: 0,
    color: "var(--erp-heading)",
  },

  sectionText: {
    margin: "7px 0 0",
    opacity: 0.7,
    lineHeight: 1.6,
  },

  label: {
    display: "grid",
    gap: "8px",
    marginBottom: "18px",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    boxSizing: "border-box",
    borderRadius: "10px",
    border:
      "1px solid var(--erp-border)",
    background:
      "var(--erp-input-bg)",
    color: "var(--erp-text)",
    fontSize: "16px",
    outline: "none",
  },

  helpText: {
    fontSize: "12px",
    fontWeight: 500,
    opacity: 0.65,
  },

  error: {
    padding: "13px",
    marginBottom: "18px",
    borderRadius: "10px",
    border: "1px solid #dc2626",
    background:
      "rgba(220,38,38,0.08)",
    color: "#dc2626",
  },

  success: {
    padding: "13px",
    marginBottom: "18px",
    borderRadius: "10px",
    border: "1px solid #16a34a",
    background:
      "rgba(22,163,74,0.1)",
    color: "#15803d",
  },

  saveButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #0369a1)",
    color: "#fff",
    fontWeight: 900,
    fontSize: "16px",
  },
};
