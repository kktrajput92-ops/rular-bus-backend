import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../api/api";
import PaymentProcessing from "../components/PaymentProcessing";

import "./PaymentPremium.css";

const PAYMENT_METHODS = [
  {
    value: "UPI",
    icon: "📱",
    title: "UPI",
    subtitle: "Google Pay, PhonePe, BHIM",
  },
  {
    value: "DEBIT_CARD",
    icon: "💳",
    title: "Debit Card",
    subtitle: "Visa, Mastercard, RuPay",
  },
  {
    value: "CREDIT_CARD",
    icon: "💳",
    title: "Credit Card",
    subtitle: "All major credit cards",
  },
  {
    value: "NET_BANKING",
    icon: "🏦",
    title: "Net Banking",
    subtitle: "Pay through your bank",
  },
  {
    value: "WALLET",
    icon: "👛",
    title: "Wallet",
    subtitle: "Supported digital wallets",
  },
];

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const selector =
      'script[data-rular-razorpay="true"]';

    const existingScript =
      document.querySelector(
        selector
      );

    if (existingScript) {
      if (
        existingScript.dataset.loaded ===
        "true"
      ) {
        resolve(true);
        return;
      }

      existingScript.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "Razorpay Checkout load नहीं हो सका।"
            )
          ),
        { once: true }
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.dataset.rularRazorpay =
      "true";

    script.onload = () => {
      script.dataset.loaded =
        "true";

      resolve(true);
    };

    script.onerror = () => {
      script.remove();

      reject(
        new Error(
          "Razorpay Checkout load नहीं हो सका।"
        )
      );
    };

    document.body.appendChild(
      script
    );
  });

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const getHindiTimePeriod = (date) => {
  const hour = date.getHours();

  if (hour < 12) {
    return "सुबह";
  }

  if (hour < 17) {
    return "दोपहर";
  }

  if (hour < 21) {
    return "शाम";
  }

  return "रात";
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const period =
    getHindiTimePeriod(date);

  const time = date
    .toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    )
    .replace(
      /\s?(am|pm)/i,
      ""
    )
    .trim();

  return `${period} ${time} बजे`;
};

const formatDuration = (minutesValue) => {
  const minutes = Number(minutesValue);

  if (
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    return "—";
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  if (
    hours > 0 &&
    remainingMinutes > 0
  ) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
};

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const { booking } =
    location.state || {};

  const [loading, setLoading] =
    useState(false);

  const [
    showProcessing,
    setShowProcessing,
  ] = useState(false);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("UPI");

  const [
    ticketPayload,
    setTicketPayload,
  ] = useState(null);

  const passengers = useMemo(
    () =>
      Array.isArray(
        booking?.passengers
      )
        ? booking.passengers
        : [],
    [booking]
  );

  const seats = useMemo(() => {
    if (
      Array.isArray(
        booking?.seats
      ) &&
      booking.seats.length
    ) {
      return booking.seats;
    }

    if (passengers.length) {
      return passengers
        .map(
          (passenger) =>
            passenger.seat_number
        )
        .filter(Boolean);
    }

    if (booking?.seat_number) {
      return [
        booking.seat_number,
      ];
    }

    return [];
  }, [booking, passengers]);

  const bookingFare = useMemo(
    () => {
      const directFare = Number(
        booking?.fare_amount
      );

      if (
        Number.isFinite(
          directFare
        ) &&
        directFare > 0
      ) {
        return directFare;
      }

      const passengerFareTotal =
        passengers.reduce(
          (total, passenger) =>
            total +
            Number(
              passenger?.fare_amount ||
                0
            ),
          0
        );

      return Number.isFinite(
        passengerFareTotal
      )
        ? passengerFareTotal
        : 0;
    },
    [booking, passengers]
  );

  const passengerCount =
    Number(
      booking?.passenger_count
    ) ||
    passengers.length ||
    seats.length;

  const makePayment = async () => {
    if (
      !Number.isFinite(
        bookingFare
      ) ||
      bookingFare <= 0
    ) {
      window.alert(
        "Booking fare उपलब्ध नहीं है।"
      );

      return;
    }

    try {
        setLoading(true);
        setShowProcessing(false);

        await loadRazorpayCheckout();

        const orderResponse =
          await api.post(
            "/payments/create-order",
            {
              booking_id:
                booking.id,

              payment_method:
                paymentMethod,
            }
          );

        const gatewayOrder =
          orderResponse?.data?.order;

        const gatewayKey =
          orderResponse?.data?.key_id;

        if (
          !gatewayOrder?.id ||
          !gatewayOrder?.amount ||
          !gatewayOrder?.currency ||
          !gatewayKey
        ) {
          throw new Error(
            "Razorpay order response incomplete है।"
          );
        }

        const checkoutResult =
          await new Promise(
            (resolve, reject) => {
              let settled = false;

              const resolveOnce = (
                value
              ) => {
                if (settled) {
                  return;
                }

                settled = true;
                resolve(value);
              };

              const rejectOnce = (
                error
              ) => {
                if (settled) {
                  return;
                }

                settled = true;
                reject(error);
              };

              const razorpay =
                new window.Razorpay({
                  key:
                    gatewayKey,

                  amount:
                    gatewayOrder.amount,

                  currency:
                    gatewayOrder.currency,

                  name:
                    "Rular Bus",

                  description:
                    `Bus Booking #${booking.id}`,

                  order_id:
                    gatewayOrder.id,

                  prefill: {
                    name:
                      booking?.contact_name ||
                      passengers?.[0]?.name ||
                      "",

                    email:
                      booking?.contact_email ||
                      orderResponse?.data
                        ?.customer?.email ||
                      "",

                    contact:
                      booking?.contact_phone ||
                      orderResponse?.data
                        ?.customer?.contact ||
                      "",
                  },

                  notes: {
                    booking_id:
                      String(booking.id),

                    selected_method:
                      paymentMethod,
                  },

                  theme: {
                    color:
                      "#173f35",
                  },

                  handler:
                    resolveOnce,

                  modal: {
                    ondismiss: () => {
                      rejectOnce(
                        new Error(
                          "Payment window बंद कर दी गई।"
                        )
                      );
                    },
                  },
                });

              razorpay.on(
                "payment.failed",
                (response) => {
                  rejectOnce(
                    new Error(
                      response?.error
                        ?.description ||
                      "Razorpay payment failed."
                    )
                  );
                }
              );

              razorpay.open();
            }
          );

        if (
          !checkoutResult
            ?.razorpay_order_id ||
          !checkoutResult
            ?.razorpay_payment_id ||
          !checkoutResult
            ?.razorpay_signature
        ) {
          throw new Error(
            "Razorpay checkout response incomplete है।"
          );
        }

        const paymentResponse =
          await api.post(
            "/payments/verify",
            {
              booking_id:
                booking.id,

              razorpay_order_id:
                checkoutResult
                  .razorpay_order_id,

              razorpay_payment_id:
                checkoutResult
                  .razorpay_payment_id,

              razorpay_signature:
                checkoutResult
                  .razorpay_signature,
            }
          );

        setShowProcessing(true);

        const bookingResponse =
        await api.get(
          `/bookings/${booking.id}`
        );

      const resolvedBooking =
        bookingResponse?.data?.booking ||
        bookingResponse?.data?.data?.booking ||
        bookingResponse?.data?.data ||
        bookingResponse?.data;

      const resolvedPayment =
        paymentResponse?.data?.payment ||
        paymentResponse?.data?.data?.payment ||
        paymentResponse?.data?.data ||
        paymentResponse?.data;

      if (
        !resolvedBooking ||
        !resolvedPayment
      ) {
        throw new Error(
          "Booking or payment response data missing."
        );
      }

      const mergedPassengers =
        Array.isArray(
          resolvedBooking?.passengers
        ) &&
        resolvedBooking.passengers.length
          ? resolvedBooking.passengers
          : Array.isArray(
              booking?.passengers
            )
            ? booking.passengers
            : [];

      const mergedSeats =
        Array.isArray(
          resolvedBooking?.seats
        ) &&
        resolvedBooking.seats.length
          ? resolvedBooking.seats
          : Array.isArray(
              booking?.seats
            ) &&
            booking.seats.length
            ? booking.seats
            : mergedPassengers
                .map(
                  (passenger) =>
                    passenger.seat_number
                )
                .filter(Boolean);

      const originalDeparture =
        booking?.departure_time;

      const originalArrival =
        booking?.arrival_time;

      const resolvedDeparture =
        resolvedBooking?.departure_time;

      const resolvedArrival =
        resolvedBooking?.arrival_time;

      const isValidSchedulePair = (
        departureValue,
        arrivalValue
      ) => {
        if (
          !departureValue ||
          !arrivalValue
        ) {
          return false;
        }

        const departureDate =
          new Date(departureValue);

        const arrivalDate =
          new Date(arrivalValue);

        return (
          !Number.isNaN(
            departureDate.getTime()
          ) &&
          !Number.isNaN(
            arrivalDate.getTime()
          ) &&
          arrivalDate.getTime() >
            departureDate.getTime()
        );
      };

      const useResolvedSchedule =
        isValidSchedulePair(
          resolvedDeparture,
          resolvedArrival
        );

      const confirmedDeparture =
        useResolvedSchedule
          ? resolvedDeparture
          : originalDeparture ||
            resolvedDeparture;

      const confirmedArrival =
        useResolvedSchedule
          ? resolvedArrival
          : originalArrival ||
            resolvedArrival;

      const confirmedDurationMinutes =
        Number(
          resolvedBooking
            ?.duration_minutes
        ) > 0
          ? Number(
              resolvedBooking
                .duration_minutes
            )
          : Number(
              booking
                ?.duration_minutes
            ) > 0
            ? Number(
                booking
                  .duration_minutes
              )
            : null;

      console.log(
        "TICKET SCHEDULE DEBUG",
        {
          originalBooking: booking,
          resolvedBooking,
          originalDeparture:
            booking?.departure_time,
          originalArrival:
            booking?.arrival_time,
          resolvedDeparture:
            resolvedBooking?.departure_time,
          resolvedArrival:
            resolvedBooking?.arrival_time,
          originalDuration:
            booking?.duration_minutes,
          resolvedDuration:
            resolvedBooking?.duration_minutes,
        }
      );

      setTicketPayload({
        booking: {
          ...booking,
          ...resolvedBooking,

          departure_time:
            confirmedDeparture,

          arrival_time:
            confirmedArrival,

          duration_minutes:
            confirmedDurationMinutes,

          passengers:
            mergedPassengers,

          seats:
            mergedSeats,

          passenger_count:
            Number(
              resolvedBooking
                ?.passenger_count
            ) ||
            Number(
              booking
                ?.passenger_count
            ) ||
            mergedPassengers.length ||
            mergedSeats.length,
        },

        payment:
          resolvedPayment,
      });
    } catch (error) {
      console.error(
        "Payment failed:",
        error
      );

      setShowProcessing(false);

      window.alert(
        error.response?.data
          ?.message ||
        error.message ||
        "Payment process नहीं हो सकी।"
      );
    } finally {
      setLoading(false);
    }
  };

  const completeProcessing =
    useCallback(() => {
      if (
        !ticketPayload?.booking ||
        !ticketPayload?.payment
      ) {
        return;
      }

      navigate("/ticket", {
        replace: true,
        state: {
          booking:
            ticketPayload.booking,

          payment:
            ticketPayload.payment,
        },
      });
    }, [
      navigate,
      ticketPayload,
    ]);

  if (!booking) {
    return (
      <div className="payment-missing-page">
        <div className="payment-missing-card">
          <div className="payment-missing-icon">
            🚌
          </div>

          <h2>
            Booking Not Found
          </h2>

          <p>
            Payment करने से पहले booking details आवश्यक हैं।
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showProcessing) {
    return (
      <PaymentProcessing
        ready={Boolean(ticketPayload)}
        onComplete={
          completeProcessing
        }
      />
    );
  }

  return (
    <div className="payment-emotional-page">
      <div className="payment-page-shell">
        <div className="payment-top-navigation">
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Passenger Details
          </button>

          <div className="payment-progress">
            <span className="completed">
              ✓ Seats
            </span>

            <span className="progress-line" />

            <span className="completed">
              ✓ Passenger
            </span>

            <span className="progress-line" />

            <span className="active">
              3 Payment
            </span>
          </div>

          <div className="payment-safe-badge">
            🛡 Secure Checkout
          </div>
        </div>

        <section className="payment-emotional-hero">
          <div className="payment-family-visual">
            <div className="payment-bus-visual">
              🚌
            </div>

            <div className="payment-heart">
              ❤
            </div>

            <div className="payment-family-avatars">
              <span>👨</span>
              <span>👩</span>
              <span>👧</span>
              <span>👦</span>
            </div>
          </div>

          <div className="payment-emotional-copy">
            <span className="payment-premium-label">
              PREMIUM SECURE CHECKOUT
            </span>

            <h1>
              हर सफर, एक याद बनता है
              <span> ❤</span>
            </h1>

            <p>
              Rular Bus चुनने के लिए धन्यवाद। आपके परिवार की सुरक्षित और आरामदायक यात्रा हमारी जिम्मेदारी है।
            </p>

            <div className="payment-emotional-pills">
              <span>
                🛡 सुरक्षित सफर
              </span>

              <span>
                😊 खुशहाल यात्रा
              </span>

              <span>
                ❤ यादें साथ-साथ
              </span>
            </div>
          </div>
        </section>

        <div className="payment-checkout-layout">
          <aside className="payment-sidebar">
            <section className="payment-side-card journey-card">
              <h2>
                🚌 आपकी यात्रा
              </h2>

              <div className="payment-route-row">
                <div className="payment-route-point start" />

                <div>
                  <strong>
                    {booking.source ||
                      "Source"}
                  </strong>

                  <span>
                    {formatDate(
                      booking.departure_time
                    )}
                    {" • "}
                    {formatTime(
                      booking.departure_time
                    )}
                  </span>
                </div>
              </div>

              <div className="payment-route-line" />

              <div className="payment-route-row">
                <div className="payment-route-point end" />

                <div>
                  <strong>
                    {booking.destination ||
                      "Destination"}
                  </strong>

                  <span>
                    {formatDate(
                      booking.arrival_time
                    )}
                    {" • "}
                    {formatTime(
                      booking.arrival_time
                    )}
                  </span>
                </div>
              </div>

              <div className="payment-route-meta">
                <span>
                  ⏱{" "}
                  {formatDuration(
                    booking.duration_minutes
                  )}
                </span>

                <span>
                  🌙 अगले दिन आगमन
                </span>
              </div>
            </section>

            <section className="payment-side-card travellers-card">
              <h2>
                👨‍👩‍👧‍👦 साथ यात्रा करने वाले
              </h2>

              {passengers.length ? (
                passengers.map(
                  (
                    passenger,
                    index
                  ) => (
                    <div
                      className="payment-passenger-row"
                      key={
                        passenger.booking_passenger_id ||
                        `${passenger.seat_number}-${index}`
                      }
                    >
                      <span className="payment-passenger-number">
                        {index + 1}
                      </span>

                      <div className="payment-passenger-info">
                        <strong>
                          {passenger.full_name ||
                            `Passenger ${index + 1}`}
                        </strong>

                        <span>
                          Seat{" "}
                          {passenger.seat_number}
                          {passenger.deck
                            ? ` • ${passenger.deck}`
                            : ""}
                        </span>
                      </div>

                      <div className="payment-passenger-fare">
                        <strong>
                          {formatCurrency(
                            passenger.fare_amount
                          )}
                        </strong>

                        {passenger.passenger_category && (
                          <span>
                            {
                              passenger.passenger_category
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="payment-passenger-row">
                  <span className="payment-passenger-number">
                    1
                  </span>

                  <div className="payment-passenger-info">
                    <strong>
                      Passenger
                    </strong>

                    <span>
                      Seats{" "}
                      {seats.join(", ")}
                    </span>
                  </div>
                </div>
              )}
            </section>

            <section className="payment-side-card booking-card">
              <h2>
                🎟 Booking Summary
              </h2>

              <div>
                <span>
                  Booking ID
                </span>

                <strong>
                  #{booking.id}
                </strong>
              </div>

              <div>
                <span>
                  Ticket Number
                </span>

                <strong>
                  {booking.ticket_number ||
                    "Generated"}
                </strong>
              </div>

              <div>
                <span>
                  Bus
                </span>

                <strong>
                  {booking.bus_name ||
                    "RULAR BUS"}
                </strong>
              </div>

              <div>
                <span>
                  Seats
                </span>

                <strong>
                  {seats.join(", ")}
                </strong>
              </div>

              <div>
                <span>
                  Passengers
                </span>

                <strong>
                  {passengerCount}
                </strong>
              </div>

              <div className="payment-sidebar-total">
                <span>
                  Total Payable
                </span>

                <strong>
                  {formatCurrency(
                    bookingFare
                  )}
                </strong>
              </div>
            </section>

            <section className="payment-trust-message">
              <span className="payment-trust-heart">
                ❤
              </span>

              <div>
                <strong>
                  आपका भरोसा, हमारी जिम्मेदारी
                </strong>

                <p>
                  निश्चिंत होकर payment कीजिए। हम आपकी यात्रा को सुरक्षित और यादगार बनाने के लिए तैयार हैं।
                </p>
              </div>
            </section>
          </aside>

          <main className="payment-main-card">
            <div className="payment-secure-heading">
              <div>
                <span className="payment-lock-icon">
                  🔒
                </span>

                <div>
                  <h2>
                    Secure Payment
                  </h2>

                  <p>
                    एक payment में सभी passengers का booking confirmation।
                  </p>
                </div>
              </div>

              <span className="payment-verified-chip">
                ✓ Verified Fare
              </span>
            </div>

            <section className="payment-total-highlight">
              <div>
                <small>
                  TOTAL AMOUNT TO PAY
                </small>

                <strong>
                  {formatCurrency(
                    bookingFare
                  )}
                </strong>

                <span>
                  One payment for all passengers
                </span>
              </div>

              <div className="payment-shield-visual">
                🛡
                <span>₹</span>
              </div>
            </section>

            <section className="payment-method-section">
              <h2>
                Choose Payment Method
              </h2>

              <div className="payment-method-grid">
                {PAYMENT_METHODS.map(
                  (method) => {
                    const selected =
                      paymentMethod ===
                      method.value;

                    return (
                      <button
                        key={method.value}
                        type="button"
                        className={
                          selected
                            ? "payment-method-card selected"
                            : "payment-method-card"
                        }
                        onClick={() =>
                          setPaymentMethod(
                            method.value
                          )
                        }
                      >
                        {selected && (
                          <span className="payment-method-check">
                            ✓
                          </span>
                        )}

                        <span className="payment-method-icon">
                          {method.icon}
                        </span>

                        <strong>
                          {method.title}
                        </strong>

                        <small>
                          {method.subtitle}
                        </small>
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            <section className="payment-security-features">
              <div>
                <span>✓</span>

                <div>
                  <strong>
                    Backend Verified Fare
                  </strong>

                  <small>
                    सही और transparent pricing
                  </small>
                </div>
              </div>

              <div>
                <span>✓</span>

                <div>
                  <strong>
                    Encrypted Payment
                  </strong>

                  <small>
                    सुरक्षित payment processing
                  </small>
                </div>
              </div>

              <div>
                <span>✓</span>

                <div>
                  <strong>
                    Instant Confirmation
                  </strong>

                  <small>
                    Payment के बाद digital ticket
                  </small>
                </div>
              </div>
            </section>

            <section className="payment-confidence-card">
              <div>
                <span className="payment-confidence-icon">
                  🛡
                </span>

                <div>
                  <strong>
                    आपकी booking सुरक्षित है
                  </strong>

                  <p>
                    Ticket number पहले ही reserve हो चुका है। सफल payment के बाद सभी यात्रियों का एक combined digital ticket मिलेगा।
                  </p>
                </div>
              </div>

              <span className="payment-passenger-count-chip">
                {passengerCount} Passenger
                {passengerCount > 1
                  ? "s"
                  : ""}
              </span>
            </section>

            <button
              type="button"
              className="payment-final-button"
              disabled={
                loading ||
                bookingFare <= 0
              }
              onClick={makePayment}
            >
              {loading
                ? "Payment Processing..."
                : `🔒 Pay ${formatCurrency(
                    bookingFare
                  )} Securely →`}
            </button>

            <div className="payment-gateway-note">
              🛡 Payment सफल होने के बाद आपका ticket तुरंत generate होगा।
            </div>

            <section className="payment-support-card">
              <span>
                🎧
              </span>

              <div>
                <strong>
                  Payment में सहायता चाहिए?
                </strong>

                <p>
                  हमारी support team आपकी यात्रा में मदद के लिए उपलब्ध है।
                </p>
              </div>

              <span className="payment-support-status">
                Support Available
              </span>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Payment;
