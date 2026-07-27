import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./PaymentProcessing.css";

const PROCESSING_STEPS = [
  {
    threshold: 0,
    icon: "🔒",
    title: "Payment सुरक्षित किया जा रहा है",
    subtitle:
      "आपके payment details को secure तरीके से verify किया जा रहा है।",
  },
  {
    threshold: 24,
    icon: "✅",
    title: "Booking verify हो रही है",
    subtitle:
      "Selected seats और passenger details confirm की जा रही हैं।",
  },
  {
    threshold: 48,
    icon: "👨‍👩‍👧‍👦",
    title: "सभी यात्रियों का ticket बन रहा है",
    subtitle:
      "एक ticket number में सभी passengers और seats जोड़ी जा रही हैं।",
  },
  {
    threshold: 72,
    icon: "▣",
    title: "Smart QR तैयार हो रहा है",
    subtitle:
      "Boarding verification के लिए secure QR code generate किया जा रहा है।",
  },
  {
    threshold: 94,
    icon: "🎫",
    title: "आपका Smart Ticket तैयार है",
    subtitle:
      "बस कुछ ही पल में आपका confirmed digital ticket खुल जाएगा।",
  },
];

const getStepIndex = (progress) => {
  let activeIndex = 0;

  PROCESSING_STEPS.forEach(
    (step, index) => {
      if (progress >= step.threshold) {
        activeIndex = index;
      }
    }
  );

  return activeIndex;
};

function PaymentProcessing({
  ready = false,
  onComplete,
}) {
  const [progress, setProgress] =
    useState(0);

  const [isCompleted, setIsCompleted] =
    useState(false);

  const currentStepIndex = useMemo(
    () => getStepIndex(progress),
    [progress]
  );

  const currentStep =
    PROCESSING_STEPS[
      currentStepIndex
    ];

  useEffect(() => {
    let completionTimer;

    const progressTimer =
      window.setInterval(() => {
        setProgress((current) => {
          const increment =
            current < 30
              ? 2
              : current < 75
                ? 1.6
                : 1.2;

          const maximumProgress =
            ready ? 100 : 94;

          const next = Math.min(
            maximumProgress,
            current + increment
          );

          if (
            ready &&
            next >= 100
          ) {
            window.clearInterval(
              progressTimer
            );

            setIsCompleted(true);

            completionTimer =
              window.setTimeout(() => {
                onComplete?.();
              }, 1200);
          }

          return next;
        });
      }, 70);

    return () => {
      window.clearInterval(
        progressTimer
      );

      if (completionTimer) {
        window.clearTimeout(
          completionTimer
        );
      }
    };
  }, [
    onComplete,
    ready,
  ]);

  return (
    <main className="payment-processing-page">
      <section
        className={`payment-processing-card ${
          isCompleted
            ? "is-complete"
            : ""
        }`}
      >
        <header className="processing-brand">
          <span className="processing-premium-label">
            RULAR BUS SECURE ENGINE
          </span>

          <h1>
            Rular Bus Smart Journey
            Engine™
          </h1>

          <p>
            आपकी यात्रा को सुरक्षित,
            सरल और यादगार बनाया जा
            रहा है।
          </p>
        </header>

        <div className="processing-road-scene">
          <div className="processing-sky-glow" />

          <div
            className="processing-bus"
            style={{
              left: `calc(${Math.min(
                progress,
                88
              )}% - 28px)`,
            }}
          >
            🚌
          </div>

          <div className="processing-road">
            <div
              className="processing-road-complete"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="processing-road-labels">
            <span>
              Payment
            </span>

            <span>
              Verification
            </span>

            <span>
              Ticket
            </span>
          </div>
        </div>

        <div className="processing-percentage-row">
          <div>
            <strong>
              {Math.round(progress)}%
            </strong>

            <span>
              Journey preparation
            </span>
          </div>

          <span className="processing-secure-chip">
            🛡 Secure Process
          </span>
        </div>

        <div className="processing-progress-track">
          <div
            className="processing-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />

          <div
            className="processing-progress-shine"
            style={{
              left: `${Math.max(
                0,
                progress - 4
              )}%`,
            }}
          />
        </div>

        <section className="processing-active-message">
          <span className="processing-active-icon">
            {isCompleted
              ? "✓"
              : currentStep.icon}
          </span>

          <div>
            <h2>
              {isCompleted
                ? "Journey Ready"
                : currentStep.title}
            </h2>

            <p>
              {isCompleted
                ? "आपका payment सफल है और digital ticket तैयार हो गया है।"
                : currentStep.subtitle}
            </p>
          </div>
        </section>

        <div className="processing-step-list">
          {PROCESSING_STEPS.slice(
            0,
            4
          ).map((step, index) => {
            const completed =
              currentStepIndex > index ||
              isCompleted;

            const active =
              currentStepIndex ===
                index &&
              !isCompleted;

            return (
              <div
                key={step.title}
                className={`processing-step ${
                  completed
                    ? "completed"
                    : ""
                } ${
                  active
                    ? "active"
                    : ""
                }`}
              >
                <span className="processing-step-status">
                  {completed
                    ? "✓"
                    : index + 1}
                </span>

                <span>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <div className="processing-emotional-note">
          <span>❤</span>

          <div>
            <strong>
              आपकी सीटें सुरक्षित हैं
            </strong>

            <p>
              कृपया इस page को refresh
              या back न करें। आपका
              combined ticket तैयार हो
              रहा है।
            </p>
          </div>
        </div>

        <footer className="processing-footer">
          <span>
            🔐 Encrypted Payment
          </span>

          <span>
            🎫 One Combined Ticket
          </span>

          <span>
            ⚡ Instant Confirmation
          </span>
        </footer>
      </section>
    </main>
  );
}

export default PaymentProcessing;
