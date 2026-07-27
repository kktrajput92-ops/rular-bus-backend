import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import customerApi from "../api/customerApi";
import Navbar from "../components/Navbar";

export default function CustomerChangePassword() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const update =
    (field) => (event) => {
      setForm((current) => ({
        ...current,
        [field]:
          event.target.value,
      }));

      setError("");
      setSuccess("");
    };

  const submit = async (event) => {
    event.preventDefault();

    if (
      !form.current_password
    ) {
      setError(
        "Current password दर्ज करें"
      );
      return;
    }

    if (
      form.new_password.length < 8 ||
      !/[A-Za-z]/.test(
        form.new_password
      ) ||
      !/[0-9]/.test(
        form.new_password
      )
    ) {
      setError(
        "नए पासवर्ड में कम से कम 8 अक्षर, एक letter और एक number होना चाहिए।"
      );
      return;
    }

    if (
      form.new_password !==
      form.confirm_password
    ) {
      setError(
        "दोनों नए पासवर्ड समान नहीं हैं।"
      );
      return;
    }

    try {
      setLoading(true);

      const { data } =
        await customerApi.post(
          "/customer-auth/change-password",
          form
        );

      if (data.token) {
        localStorage.setItem(
          "customer_token",
          data.token
        );
      }

      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setSuccess(
        "पासवर्ड सफलतापूर्वक बदल गया।"
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "पासवर्ड change नहीं हुआ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.container}>
        <button
          type="button"
          onClick={() =>
            navigate("/profile")
          }
          style={styles.back}
        >
          ← प्रोफाइल
        </button>

        <form
          onSubmit={submit}
          style={styles.card}
        >
          <h1 style={styles.heading}>
            🔐 पासवर्ड बदलें
          </h1>

          <p style={styles.subtitle}>
            पहले अपना current password verify करें।
          </p>

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

          <PasswordField
            label="Current password"
            value={
              form.current_password
            }
            onChange={update(
              "current_password"
            )}
            autoComplete=
              "current-password"
          />

          <PasswordField
            label="नया password"
            value={
              form.new_password
            }
            onChange={update(
              "new_password"
            )}
            autoComplete=
              "new-password"
          />

          <PasswordField
            label="नया password दोबारा"
            value={
              form.confirm_password
            }
            onChange={update(
              "confirm_password"
            )}
            autoComplete=
              "new-password"
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.primary}
          >
            {loading
              ? "Change हो रहा है..."
              : "पासवर्ड बदलें"}
          </button>
        </form>
      </main>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}) {
  return (
    <label style={styles.label}>
      {label}

      <input
        type="password"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={styles.input}
      />
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },
  container: {
    width: "min(620px,100%)",
    margin: "0 auto",
    padding: 20,
    boxSizing: "border-box",
  },
  back: {
    border: "none",
    background: "transparent",
    color: "var(--erp-text)",
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 14,
  },
  card: {
    padding: 26,
    borderRadius: 18,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-surface)",
    boxShadow: "var(--erp-shadow-lg)",
  },
  heading: {
    margin: 0,
    color: "var(--erp-heading)",
  },
  subtitle: {
    margin: "8px 0 20px",
    opacity: 0.75,
  },
  label: {
    display: "grid",
    gap: 8,
    marginBottom: 16,
    fontWeight: 800,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input-bg)",
    color: "var(--erp-text)",
    fontSize: 16,
  },
  primary: {
    width: "100%",
    padding: 14,
    border: "none",
    borderRadius: 10,
    background: "#0B3D91",
    color: "#fff",
    fontWeight: 900,
  },
  error: {
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    color: "#dc2626",
    border: "1px solid #dc2626",
    background:
      "rgba(220,38,38,.08)",
  },
  success: {
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    color: "#15803d",
    border: "1px solid #16a34a",
    background:
      "rgba(22,163,74,.1)",
  },
};
