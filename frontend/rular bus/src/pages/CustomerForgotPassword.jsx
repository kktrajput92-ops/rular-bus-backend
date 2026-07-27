import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import customerApi from "../api/customerApi";
import ThemeToggle from "../theme/ThemeToggle";

export default function CustomerForgotPassword() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [step, setStep] =
    useState("REQUEST");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const requestOtp = async (event) => {
    event.preventDefault();

    if (!identifier.trim()) {
      setError(
        "मोबाइल नंबर या ईमेल दर्ज करें"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } =
        await customerApi.post(
          "/customer-auth/forgot-password",
          {
            identifier:
              identifier.trim(),
          }
        );

      setMessage(
        data.message ||
          "OTP generated"
      );

      setStep("VERIFY");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "OTP generate नहीं हो पाया"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (!/^[0-9]{6}$/.test(otp)) {
      setError(
        "6 अंकों का OTP दर्ज करें"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } =
        await customerApi.post(
          "/customer-auth/verify-reset-otp",
          {
            identifier:
              identifier.trim(),
            otp,
          }
        );

      navigate(
        "/customer/reset-password",
        {
          state: {
            resetToken:
              data.reset_token,
          },
          replace: true,
        }
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "OTP verify नहीं हुआ"
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
        onSubmit={
          step === "REQUEST"
            ? requestOtp
            : verifyOtp
        }
        style={styles.card}
      >
        <button
          type="button"
          onClick={() =>
            navigate(
              "/customer/login"
            )
          }
          style={styles.back}
        >
          ← लॉगिन
        </button>

        <h1 style={styles.heading}>
          पासवर्ड भूल गए?
        </h1>

        <p style={styles.subtitle}>
          {step === "REQUEST"
            ? "अपने रजिस्टर्ड मोबाइल नंबर या ईमेल से OTP प्राप्त करें।"
            : "Testing में OTP 123456 दर्ज करें।"}
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        <label style={styles.label}>
          मोबाइल नंबर या ईमेल

          <input
            type="text"
            value={identifier}
            disabled={
              step === "VERIFY"
            }
            onChange={(event) =>
              setIdentifier(
                event.target.value
              )
            }
            style={styles.input}
          />
        </label>

        {step === "VERIFY" && (
          <label style={styles.label}>
            OTP

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="123456"
              style={styles.input}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          style={styles.primary}
        >
          {loading
            ? "कृपया प्रतीक्षा करें..."
            : step === "REQUEST"
              ? "OTP प्राप्त करें"
              : "OTP Verify करें"}
        </button>

        {step === "VERIFY" && (
          <button
            type="button"
            onClick={() => {
              setStep("REQUEST");
              setOtp("");
              setMessage("");
              setError("");
            }}
            style={styles.secondary}
          >
            मोबाइल/ईमेल बदलें
          </button>
        )}

        <p style={styles.footer}>
          <Link
            to="/customer/login"
            style={styles.link}
          >
            लॉगिन पर वापस जाएँ
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
  theme: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  card: {
    width: "min(440px,100%)",
    padding: 28,
    borderRadius: 18,
    background: "var(--erp-surface)",
    border: "1px solid var(--erp-border)",
    boxShadow: "var(--erp-shadow-lg)",
  },
  back: {
    border: "none",
    background: "transparent",
    color: "var(--erp-text)",
    cursor: "pointer",
    fontWeight: 800,
  },
  heading: {
    margin: "20px 0 6px",
    color: "var(--erp-heading)",
  },
  subtitle: {
    margin: "0 0 20px",
    lineHeight: 1.6,
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
  secondary: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    border: "1px solid var(--erp-border)",
    background: "transparent",
    color: "var(--erp-text)",
    fontWeight: 800,
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
  footer: {
    textAlign: "center",
    margin: "18px 0 0",
  },
  link: {
    color: "#2563eb",
    fontWeight: 800,
    textDecoration: "none",
  },
};
