import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import customerApi from "../api/customerApi";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import ThemeToggle from "../theme/ThemeToggle";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    isAuthenticated,
    loading: authLoading,
  } = useCustomerAuth();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
  });

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

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.replace(/\D/g, ""),
      email:
        form.email.trim().toLowerCase() ||
        null,
      password: form.password,
      confirm_password:
        form.confirm_password,
    };

    if (payload.full_name.length < 2) {
      setError("पूरा नाम दर्ज करें");
      return;
    }

    if (
      !/^[0-9]{10,15}$/.test(payload.phone)
    ) {
      setError(
        "10 से 15 अंकों का सही मोबाइल नंबर दर्ज करें"
      );
      return;
    }

    if (
      payload.password.length < 8 ||
      !/[A-Za-z]/.test(payload.password) ||
      !/[0-9]/.test(payload.password)
    ) {
      setError(
        "पासवर्ड में कम से कम 8 अक्षर, एक letter और एक number होना चाहिए"
      );
      return;
    }

    if (
      payload.password !==
      payload.confirm_password
    ) {
      setError(
        "पासवर्ड और confirm password एक जैसे नहीं हैं"
      );
      return;
    }

    try {
      setSubmitting(true);

      await customerApi.post(
        "/customer-auth/register",
        payload
      );

      await login(
        payload.phone,
        payload.password
      );

      navigate(destination, {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "अकाउंट नहीं बन पाया"
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
            यात्री रजिस्ट्रेशन
          </h1>

          <p style={styles.subtitle}>
            अपनी बुकिंग सुरक्षित रखने के लिए
            यात्री अकाउंट बनाएँ।
          </p>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <label style={styles.label}>
          पूरा नाम

          <input
            type="text"
            autoComplete="name"
            value={form.full_name}
            onChange={updateField("full_name")}
            placeholder="यात्री का पूरा नाम"
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          मोबाइल नंबर

          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={form.phone}
            onChange={updateField("phone")}
            placeholder="10 अंकों का मोबाइल नंबर"
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          ईमेल
          <span style={styles.optional}>
            वैकल्पिक
          </span>

          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField("email")}
            placeholder="example@email.com"
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          पासवर्ड

          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField("password")}
            placeholder="कम से कम 8 अक्षर"
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          पासवर्ड दोबारा दर्ज करें

          <input
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={updateField(
              "confirm_password"
            )}
            placeholder="पासवर्ड की पुष्टि करें"
            style={styles.input}
          />
        </label>

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
            ? "अकाउंट बन रहा है..."
            : "अकाउंट बनाएँ"}
        </button>

        <p style={styles.footerText}>
          पहले से अकाउंट है?{" "}
          <Link
            to="/customer/login"
            state={{
              from: destination,
            }}
            style={styles.link}
          >
            लॉगिन करें
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
    padding: "70px 24px 30px",
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
    width: "min(500px, 100%)",
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
    position: "relative",
  },

  optional: {
    position: "absolute",
    right: 0,
    fontSize: "12px",
    fontWeight: 500,
    opacity: 0.65,
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

  link: {
    color: "#2563eb",
    fontWeight: 800,
    textDecoration: "none",
  },
};
