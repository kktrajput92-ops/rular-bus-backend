import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import customerApi from "../api/customerApi";
import ThemeToggle from "../theme/ThemeToggle";

export default function CustomerResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const resetToken =
    location.state?.resetToken ||
    "";

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (!resetToken) {
      setError(
        "Reset session missing है। दोबारा OTP verify करें।"
      );
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "पासवर्ड में कम से कम 8 अक्षर, एक letter और एक number होना चाहिए।"
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "दोनों पासवर्ड समान नहीं हैं।"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await customerApi.post(
        "/customer-auth/reset-password",
        {
          reset_token: resetToken,
          password,
          confirm_password:
            confirmPassword,
        }
      );

      navigate(
        "/customer/login",
        {
          replace: true,
          state: {
            passwordReset: true,
          },
        }
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "पासवर्ड reset नहीं हुआ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.theme}>
        <ThemeToggle />
      </div>

      <form
        onSubmit={submit}
        style={styles.card}
      >
        <h1 style={styles.heading}>
          नया पासवर्ड बनाएँ
        </h1>

        <p style={styles.subtitle}>
          मजबूत और याद रखने योग्य पासवर्ड चुनें।
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <label style={styles.label}>
          नया पासवर्ड

          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          पासवर्ड दोबारा दर्ज करें

          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            style={styles.input}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={styles.primary}
        >
          {loading
            ? "पासवर्ड सेव हो रहा है..."
            : "पासवर्ड Reset करें"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    boxSizing: "border-box",
    position: "relative",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },
  theme: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  card: {
    width: "min(440px,100%)",
    padding: 28,
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
};
