import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useCustomerAuth } from "../context/CustomerAuthContext";
import ThemeToggle from "../theme/ThemeToggle";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    isAuthenticated,
    loading: authLoading,
  } = useCustomerAuth();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const destination =
    location.state?.from || "/";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(destination, {
        replace: true,
      });
    }
  }, [
    authLoading,
    destination,
    isAuthenticated,
    navigate,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedIdentifier =
      identifier.trim();

    if (!normalizedIdentifier) {
      setError(
        "मोबाइल नंबर या ईमेल दर्ज करें"
      );
      return;
    }

    if (!password) {
      setError("पासवर्ड दर्ज करें");
      return;
    }

    try {
      setSubmitting(true);

      await login(
        normalizedIdentifier,
        password
      );

      navigate(destination, {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "लॉगिन नहीं हो पाया"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.themeToggle}>
        <ThemeToggle />
      </div>

      <form
        onSubmit={handleSubmit}
        style={styles.card}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          style={styles.backButton}
        >
          ← होम
        </button>

        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>
            यात्री लॉगिन
          </h1>

          <p style={styles.subtitle}>
            अपनी बुकिंग और यात्रा विवरण देखने के
            लिए लॉगिन करें।
          </p>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <label style={styles.label}>
          मोबाइल नंबर या ईमेल

          <input
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(event) =>
              setIdentifier(event.target.value)
            }
            placeholder="मोबाइल नंबर या ईमेल"
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          पासवर्ड

          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="अपना पासवर्ड दर्ज करें"
            style={styles.input}
          />
        </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              margin: "-6px 0 18px",
            }}
          >
            <Link
              to="/customer/forgot-password"
              state={{
                identifier,
              }}
              style={{
                ...styles.link,
                display: "inline-block",
              }}
            >
              पासवर्ड भूल गए?
            </Link>
          </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            ...styles.submitButton,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting
              ? "not-allowed"
              : "pointer",
          }}
        >
          {submitting
            ? "लॉगिन हो रहा है..."
            : "लॉगिन करें"}
        </button>

        <p style={styles.footerText}>
          आपका अकाउंट नहीं है?{" "}
          <Link
            to="/customer/register"
            state={{
              from: destination,
            }}
            style={styles.link}
          >
            नया अकाउंट बनाएँ
          </Link>
        </p>

        <p style={styles.adminText}>
          ERP कर्मचारी हैं?{" "}
          <Link
            to="/admin/login"
            style={styles.link}
          >
            Admin Login
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    boxSizing: "border-box",
    position: "relative",
    background: "var(--erp-bg)",
    color: "var(--erp-text)",
  },

  themeToggle: {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 10,
  },

  card: {
    width: "min(440px, 100%)",
    padding: "28px",
    boxSizing: "border-box",
    borderRadius: "18px",
    border: "1px solid var(--erp-border)",
    background: "var(--erp-surface)",
    boxShadow: "var(--erp-shadow-lg)",
  },

  backButton: {
    border: "none",
    padding: 0,
    marginBottom: "20px",
    background: "transparent",
    color: "var(--erp-text)",
    cursor: "pointer",
    fontWeight: 700,
  },

  headingBlock: {
    marginBottom: "22px",
  },

  heading: {
    margin: 0,
    color: "var(--erp-heading)",
    fontSize: "28px",
  },

  subtitle: {
    margin: "8px 0 0",
    lineHeight: 1.6,
    opacity: 0.75,
  },

  error: {
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #dc2626",
    background: "rgba(220, 38, 38, 0.1)",
    color: "#dc2626",
    lineHeight: 1.5,
  },

  label: {
    display: "grid",
    gap: "8px",
    marginBottom: "16px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid var(--erp-border)",
    background: "var(--erp-input-bg)",
    color: "var(--erp-text)",
    outline: "none",
    fontSize: "16px",
  },

  submitButton: {
    width: "100%",
    padding: "14px",
    marginTop: "4px",
    border: "none",
    borderRadius: "10px",
    background: "#0B3D91",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "16px",
  },

  footerText: {
    margin: "20px 0 0",
    textAlign: "center",
    lineHeight: 1.6,
  },

  adminText: {
    margin: "10px 0 0",
    textAlign: "center",
    fontSize: "14px",
    opacity: 0.8,
  },

  link: {
    color: "#2563eb",
    fontWeight: 800,
    textDecoration: "none",
  },
};
