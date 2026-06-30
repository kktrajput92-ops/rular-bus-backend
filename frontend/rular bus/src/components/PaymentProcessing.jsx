import { useEffect, useState } from "react";

function PaymentProcessing({ onComplete }) {

  const steps = [

    "🚌 Reserving your seat...",

    "🔒 Protecting your payment...",

    "📡 Connecting with driver...",

    "📍 Preparing your journey...",

    "🎫 Printing your Smart Ticket...",

    "❤️ Journey Ready",

  ];

  const [currentStep, setCurrentStep] = useState(0);

  const [progress, setProgress] = useState(0);
  useEffect(() => {

    const timer = setInterval(() => {

      setProgress((old) => {

        const next = old + 2;

        if (next >= 100) {

          clearInterval(timer);

          setTimeout(() => {

            if (onComplete) {

              onComplete();

            }

          }, 600);

          return 100;

        }

        return next;

      });

    }, 80);

    return () => clearInterval(timer);

  }, [onComplete]);

  useEffect(() => {

    if (progress >= 15) setCurrentStep(1);

    if (progress >= 35) setCurrentStep(2);

    if (progress >= 55) setCurrentStep(3);

    if (progress >= 75) setCurrentStep(4);

    if (progress >= 95) setCurrentStep(5);

  }, [progress]);

  return (

    <div

      style={{

        width: "100%",

        maxWidth: "500px",

        margin: "auto",

        padding: "25px",

        textAlign: "center",

      }}

    >
      <h2
        style={{
          color: "#d62828",
          marginBottom: "25px",
        }}
      >
        Rular Bus Smart Journey Engine™
      </h2>

      <div
        style={{
          fontSize: "60px",
          marginBottom: "15px",
          animation: "bounce 1s infinite",
        }}
      >
        🚌
      </div>

      <div
        style={{
          height: "10px",
          width: "100%",
          background: "#e5e7eb",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >

        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background:
              "linear-gradient(90deg,#16a34a,#22c55e)",
            transition: "0.3s",
          }}
        />

      </div>

      <p
        style={{
          marginTop: "25px",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#1f2937",
        }}
      >
        {steps[currentStep]}
      </p>

      <p
        style={{
          color: "#6b7280",
        }}
      >
        Making Your Journey Ready...
      </p>
    </div>

  );

}

export default PaymentProcessing;
