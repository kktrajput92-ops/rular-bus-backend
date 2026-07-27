import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";

import logo from "../assets/logo/rular-logo.png";
import api from "../api/api";
import "./TicketPremium.css";

const money = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  );
};

const formatDate = (
  value,
  options = {}
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    }
  );
};

const formatJourneyDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const datePart =
    date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  const hours =
    date.getHours();

  const period =
    hours < 12
      ? "सुबह"
      : "शाम";

  const timePart =
    date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    )
    .replace(/\s?(am|pm)/i, "")
    .trim();

  return `${datePart} • ${period} ${timePart} बजे`;
};

const formatJourneyTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const hours =
    date.getHours();

  const period =
    hours < 12
      ? "सुबह"
      : "शाम";

  const timePart =
    date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    )
    .replace(/\s?(am|pm)/i, "")
    .trim();

  return `${period} ${timePart} बजे`;
};

const groupTicketNumber = (value) => {
  const clean = String(value || "")
    .replace(/\s+/g, "");

  if (clean.length <= 6) {
    return clean;
  }

  const prefix = clean.slice(0, 6);
  const remaining = clean.slice(6);

  const groups =
    remaining.match(/.{1,4}/g) || [];

  return [prefix, ...groups].join(" ");
};

const formatDuration = (
  booking
) => {
  const savedMinutes = Number(
    booking?.duration_minutes
  );

  if (
    Number.isFinite(
      savedMinutes
    ) &&
    savedMinutes > 0
  ) {
    const hours = Math.floor(
      savedMinutes / 60
    );

    const minutes =
      savedMinutes % 60;

    return `${hours} घंटे${
      minutes
        ? ` ${minutes} मिनट`
        : ""
    }`;
  }

  if (
    !booking?.departure_time ||
    !booking?.arrival_time
  ) {
    return "—";
  }

  const start = new Date(
    booking.departure_time
  );

  const end = new Date(
    booking.arrival_time
  );

  const difference =
    end.getTime() -
    start.getTime();

  if (
    !Number.isFinite(
      difference
    ) ||
    difference <= 0
  ) {
    return "—";
  }

  const totalMinutes =
    Math.floor(
      difference / 60000
    );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes =
    totalMinutes % 60;

  return `${hours} घंटे${
    minutes
      ? ` ${minutes} मिनट`
      : ""
  }`;
};

const normalizeCategory = (
  value,
  age
) => {
  if (value) {
    return String(value)
      .replaceAll("_", " ")
      .toUpperCase();
  }

  const numericAge =
    Number(age);

  if (
    Number.isFinite(
      numericAge
    )
  ) {
    if (numericAge < 5) {
      return "INFANT";
    }

    if (numericAge < 12) {
      return "CHILD";
    }

    if (numericAge >= 60) {
      return "SENIOR";
    }
  }

  return "ADULT";
};

const getPassengerName = (
  passenger,
  index
) =>
  passenger?.full_name ||
  passenger?.passenger_name ||
  passenger?.name ||
  `Passenger ${index + 1}`;

const toDisplayName = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ");

const formatPassengerGender = (value) => {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();

  if (normalized === "MALE") {
    return "पुरुष";
  }

  if (normalized === "FEMALE") {
    return "महिला";
  }

  if (
    normalized === "OTHER" ||
    normalized === "OTHERS"
  ) {
    return "अन्य";
  }

  return "";
};

const formatPassengerCategory = (
  value
) => {
  const normalized =
    String(value || "")
      .trim()
      .toUpperCase();

  const labels = {
    INFANT: "शिशु",
    CHILD: "बच्चा",
    ADULT: "वयस्क",
    SENIOR: "वरिष्ठ नागरिक",
    SENIOR_CITIZEN:
      "वरिष्ठ नागरिक",
  };

  return (
    labels[normalized] ||
    String(value || "")
      .replaceAll("_", " ")
  );
};

function Ticket() {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketRef = useRef(null);

  const [downloading, setDownloading] =
    useState(false);

  const initialBooking =
    location.state?.booking ||
    null;

  const payment =
    location.state?.payment ||
    null;

  const [booking, setBooking] =
    useState(initialBooking);

  const bookingId =
    initialBooking?.id;

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }

    let active = true;

    const loadConfirmedBooking =
      async () => {
        try {
          const response =
            await api.get(
              `/bookings/${bookingId}`
            );

          const freshBooking =
            response.data?.booking;

          if (
            active &&
            freshBooking
          ) {
            setBooking(
              (currentBooking) => ({
                ...(currentBooking || {}),
                ...freshBooking,
              })
            );
          }
        } catch (error) {
          console.error(
            "Fresh ticket booking load failed:",
            error
          );
        }
      };

    loadConfirmedBooking();

    return () => {
      active = false;
    };
  }, [bookingId]);

  const passengers = useMemo(() => {
    const sourcePassengers =
      Array.isArray(
        booking?.passengers
      )
        ? booking.passengers
        : Array.isArray(
            booking
              ?.booking_passengers
          )
          ? booking
              .booking_passengers
          : [];

    if (
      sourcePassengers.length
    ) {
      return sourcePassengers.map(
        (passenger, index) => ({
          ...passenger,

          full_name:
            toDisplayName(
              getPassengerName(
                passenger,
                index
              )
            ),

          seat_number:
            passenger.seat_number ||
            passenger.seat_no ||
            passenger.seat ||
            booking?.seats?.[
              index
            ] ||
            "—",

          passenger_category:
            normalizeCategory(
              passenger
                .passenger_category,
              passenger.age
            ),

          fare_amount:
            Number(
              passenger
                .fare_amount ||
              passenger.fare ||
              0
            ),
        })
      );
    }

    return [
      {
        full_name:
          toDisplayName(
            booking?.full_name ||
            "Passenger"
          ),

        seat_number:
          booking?.seat_number ||
          booking?.seats?.[0] ||
          "—",

        passenger_category:
          normalizeCategory(
            booking
              ?.passenger_category,
            booking?.age
          ),

        gender:
          booking?.gender,

        age:
          booking?.age,

        fare_amount:
          Number(
            booking?.fare_amount ||
            payment?.amount ||
            0
          ),
      },
    ];
  }, [
    booking,
    payment,
  ]);

  const seats = useMemo(
    () =>
      [
        ...new Set(
          passengers
            .map(
              (passenger) =>
                passenger
                  .seat_number
            )
            .filter(
              (seat) =>
                seat &&
                seat !== "—"
            )
        ),
      ],
    [passengers]
  );

  const totalFare =
    Number(
      payment?.amount
    ) ||
    Number(
      booking?.fare_amount
    ) ||
    passengers.reduce(
      (total, passenger) =>
        total +
        Number(
          passenger
            .fare_amount ||
          0
        ),
      0
    );

  const leadPassenger =
    passengers[0];

  const travellerNames =
    passengers
      .map(
        (passenger) =>
          passenger.full_name
      )
      .filter(Boolean);

  const emotionalNames =
    travellerNames.length <= 2
      ? travellerNames.join(" और ")
      : `${travellerNames
          .slice(0, 2)
          .join(", ")} और ${
          travellerNames.length - 2
        } अन्य यात्री`;

  const departureDate =
    booking?.departure_time
      ? new Date(
          booking.departure_time
        )
      : null;

  const arrivalDate =
    booking?.arrival_time
      ? new Date(
          booking.arrival_time
        )
      : null;

  const hasValidArrival =
    departureDate &&
    arrivalDate &&
    !Number.isNaN(
      departureDate.getTime()
    ) &&
    !Number.isNaN(
      arrivalDate.getTime()
    ) &&
    arrivalDate.getTime() >
      departureDate.getTime();

  const savedDurationMinutes =
    Number(
      booking?.duration_minutes
    );

  const hasValidDuration =
    (
      Number.isFinite(
        savedDurationMinutes
      ) &&
      savedDurationMinutes > 0
    ) ||
    hasValidArrival;

  const ticketNumber =
    booking?.ticket_number ||
    booking?.booking_number ||
    `RB-${booking?.id || "TICKET"}`;

  const source =
    booking?.source ||
    booking?.source_name ||
    "Source";

  const destination =
    booking?.destination ||
    booking
      ?.destination_name ||
    "Destination";

  const qrPayload =
    JSON.stringify({
      ticket_number:
        ticketNumber,

      booking_id:
        booking?.id,

      payment_id:
        payment?.id,

      route: {
        source,
        destination,
      },

      passengers:
        passengers.map(
          (passenger) => ({
            name:
              passenger.full_name,

            seat:
              passenger.seat_number,

            category:
              passenger
                .passenger_category,
          })
        ),

      amount:
        totalFare,

      status: "CONFIRMED",
    });

  const downloadPDF =
    async () => {
      if (
        !ticketRef.current ||
        downloading
      ) {
        return;
      }

      try {
        setDownloading(true);

        const ticketElement =
          ticketRef.current;

        /*
         * PDF के लिए mobile screen layout की जगह
         * dedicated readable capture mode लगाया जाता है।
         */
        ticketElement.classList.add(
          "ticket-pdf-readable-mode"
        );

        await new Promise(
          (resolve) =>
            window.requestAnimationFrame(
              () =>
                window.requestAnimationFrame(
                  resolve
                )
            )
        );

        const canvas =
          await html2canvas(
            ticketElement,
            {
              scale: 2.5,
              useCORS: true,
              logging: false,
              backgroundColor:
                "#ffffff",
              scrollX: 0,
              scrollY: 0,

              windowWidth:
                ticketElement.scrollWidth,

              windowHeight:
                ticketElement.scrollHeight,
            }
          );

        const qrSection =
          ticketElement.querySelector(
            ".ticket-qr-section"
          );

        const canvasScaleY =
          canvas.height /
          ticketElement.scrollHeight;

        /*
         * Page 1 QR section से ठीक पहले समाप्त होगी।
         * Page 2 QR section से शुरू होगी।
         */
        const rawSplitPosition =
          qrSection
            ? qrSection.offsetTop *
              canvasScaleY
            : canvas.height * 0.58;

        const splitGap =
          Math.round(
            12 * canvasScaleY
          );

        const splitY =
          Math.max(
            1,
            Math.min(
              canvas.height - 1,
              Math.round(
                rawSplitPosition -
                splitGap
              )
            )
          );

        const createPageCanvas = (
          startY,
          height
        ) => {
          const pageCanvas =
            document.createElement(
              "canvas"
            );

          pageCanvas.width =
            canvas.width;

          pageCanvas.height =
            height;

          const context =
            pageCanvas.getContext(
              "2d"
            );

          context.fillStyle =
            "#ffffff";

          context.fillRect(
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          context.drawImage(
            canvas,
            0,
            startY,
            canvas.width,
            height,
            0,
            0,
            canvas.width,
            height
          );

          return pageCanvas;
        };

        const firstCanvas =
          createPageCanvas(
            0,
            splitY
          );

        const secondCanvas =
          createPageCanvas(
            splitY,
            canvas.height -
              splitY
          );

        const pdfWidthMm = 210;

        const firstHeightMm =
          (
            firstCanvas.height *
            pdfWidthMm
          ) /
          firstCanvas.width;

        const secondHeightMm =
          (
            secondCanvas.height *
            pdfWidthMm
          ) /
          secondCanvas.width;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [
            pdfWidthMm,
            firstHeightMm,
          ],
          compress: true,
        });

        pdf.addImage(
          firstCanvas.toDataURL(
            "image/png"
          ),
          "PNG",
          0,
          0,
          pdfWidthMm,
          firstHeightMm,
          undefined,
          "FAST"
        );

        pdf.addPage(
          [
            pdfWidthMm,
            secondHeightMm,
          ],
          "portrait"
        );

        pdf.addImage(
          secondCanvas.toDataURL(
            "image/png"
          ),
          "PNG",
          0,
          0,
          pdfWidthMm,
          secondHeightMm,
          undefined,
          "FAST"
        );

        pdf.save(
          `RularBus-${ticketNumber}.pdf`
        );
      } catch (error) {
        console.error(
          "Ticket PDF generation failed:",
          error
        );

        window.alert(
          "Ticket PDF generate नहीं हो सकी।"
        );
      } finally {
        ticketRef.current
          ?.classList.remove(
            "ticket-pdf-readable-mode"
          );

        setDownloading(false);
      }
    };

  const shareTicket =
    async () => {
      const travellerLines =
        passengers
          .map(
            (passenger, index) =>
              `${index + 1}. ${
                passenger.full_name
              } — Seat ${
                passenger.seat_number
              }`
          )
          .join("\n");

      const message =
`🚌 RULAR BUS PREMIUM TICKET

Ticket: ${ticketNumber}
Booking ID: #${booking.id}
Route: ${source} → ${destination}
Journey: ${formatDate(booking.departure_time)}
Passengers: ${passengers.length}
Seats: ${seats.join(", ")}
Amount Paid: ${money(totalFare)}

Travellers:
${travellerLines}

Status: Confirmed ✅
शुभ यात्रा ❤️`;

      if (navigator.share) {
        try {
          await navigator.share({
            title:
              "Rular Bus Ticket",

            text: message,
          });
        } catch (error) {
          if (
            error?.name !==
            "AbortError"
          ) {
            console.error(
              error
            );
          }
        }

        return;
      }

      await navigator.clipboard
        .writeText(message);

      window.alert(
        "Ticket details copied."
      );
    };

  if (
    !booking ||
    !payment
  ) {
    return (
      <main className="ticket-missing-page">
        <section className="ticket-missing-card">
          <span>🎫</span>

          <h2>
            Ticket Not Found
          </h2>

          <p>
            Booking और payment
            details उपलब्ध नहीं हैं।
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Home पर जाएँ
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="premium-ticket-page">
      <section className="ticket-screen-heading">
        <div>
          <span className="ticket-success-icon">
            ✓
          </span>

          <div>
            <strong>
              Booking Confirmed
            </strong>

            <p>
              आपका premium digital
              ticket तैयार है।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
        >
          Home
        </button>
      </section>

      <article
        id="ticket-card"
        ref={ticketRef}
        className="premium-ticket-card"
      >
        <div className="ticket-watermark">
          RULAR BUS
        </div>

        <header className="ticket-emotional-hero">
          <div className="ticket-hero-orb ticket-hero-orb-one" />
          <div className="ticket-hero-orb ticket-hero-orb-two" />

          <span className="ticket-premium-badge">
            PREMIUM DIGITAL TICKET
          </span>

          <div className="ticket-brand-row">
            <img
              src={logo}
              alt="Rular Bus"
            />

            <div>
              <h1>
                Rular Bus
              </h1>

              <p>
                Travel Beyond
                Expectations
              </p>
            </div>
          </div>

          <div className="ticket-emotional-copy">
            <span>
              आपकी यात्रा तैयार है ✨
            </span>

            <h2>
              शुभ यात्रा,{" "}
              {leadPassenger
                .full_name}
              !
            </h2>

            <p>
              {passengers.length > 1
                ? "आपकी सभी सीटें, payment और सभी यात्रियों का combined ticket सुरक्षित रूप से confirm हो चुका है।"
                : "आपकी सीट, payment और digital ticket सुरक्षित रूप से confirm हो चुके हैं।"}
            </p>
          </div>

          <div className="ticket-hero-route">
            <div>
              <small>
                FROM
              </small>

              <strong>
                {source}
              </strong>
            </div>

            <span>
              🚌
            </span>

            <div>
              <small>
                TO
              </small>

              <strong>
                {destination}
              </strong>
            </div>
          </div>
        </header>

        <section className="ticket-confirmation-strip">
          <div>
            <small>
              TICKET NUMBER
            </small>

            <strong>
              {groupTicketNumber(
                ticketNumber
              )}
            </strong>

            <span>
              Booking #{booking.id}
            </span>
          </div>

          <div className="ticket-paid-block">
            <span>
              ✓ PAID & VERIFIED
            </span>

            <strong>
              {money(totalFare)}
            </strong>
          </div>
        </section>

        <section className="ticket-quick-grid">
          <div>
            <span>
              📅
            </span>

            <small>
              Journey Date
            </small>

            <strong>
              {formatDate(
                booking
                  .departure_time
              )}
            </strong>
          </div>

          <div>
            <span>
              🕘
            </span>

            <small>
              Departure
            </small>

            <strong>
              {formatJourneyTime(
                booking
                  .departure_time
              )}
            </strong>
          </div>

          <div>
            <span>
              👨‍👩‍👧‍👦
            </span>

            <small>
              Travellers
            </small>

            <strong>
              {passengers.length}
            </strong>
          </div>

          <div>
            <span>
              💺
            </span>

            <small>
              Seats
            </small>

            <strong>
              {seats.join(", ") ||
                "—"}
            </strong>
          </div>
        </section>

        <section className="ticket-section ticket-travellers-section">
          <div className="ticket-section-heading">
            <div>
              <span>
                👨‍👩‍👧‍👦
              </span>

              <div>
                <h3>
                  {passengers.length > 1
                    ? "साथ यात्रा करने वाले"
                    : "यात्री विवरण"}
                </h3>

                <p>
                  {passengers.length > 1
                    ? "One ticket for the entire travel group"
                    : "Confirmed passenger and seat details"}
                </p>
              </div>
            </div>

            <span className="ticket-count-chip">
              {passengers.length > 1
                ? `${passengers.length} Travellers`
                : "Confirmed Traveller"}
            </span>
          </div>

          <div className="ticket-passenger-list">
            {passengers.map(
              (
                passenger,
                index
              ) => (
                <article
                  key={
                    passenger
                      .passenger_id ||
                    `${passenger.full_name}-${index}`
                  }
                  className="ticket-passenger-card"
                >
                  <div className="ticket-passenger-avatar">
                    {String(
                      passenger
                        .full_name
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="ticket-passenger-main">
                    <div>
                      <h4>
                        {
                          passenger
                            .full_name
                        }
                      </h4>

                      {passengers.length > 1 &&
                        index === 0 && (
                        <span className="ticket-lead-chip">
                          Lead Traveller
                        </span>
                      )}
                    </div>

                    <p>
                      {formatPassengerGender(
                        passenger.gender
                      )
                        ? `${formatPassengerGender(
                            passenger.gender
                          )} • `
                        : ""}

                      {passenger.age
                        ? `${passenger.age} वर्ष • `
                        : ""}

                      {formatPassengerCategory(
                        passenger
                          .passenger_category
                      )}
                    </p>
                  </div>

                  <div className="ticket-passenger-seat">
                    <small>
                      SEAT
                    </small>

                    <strong>
                      {
                        passenger
                          .seat_number
                      }
                    </strong>

                    {Number(
                      passenger
                        .fare_amount
                    ) > 0 && (
                      <span>
                        {money(
                          passenger
                            .fare_amount
                        )}
                      </span>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        <section className="ticket-section ticket-journey-section">
          <div className="ticket-section-heading">
            <div>
              <span>
                🛣
              </span>

              <div>
                <h3>
                  Journey Timeline
                </h3>

                <p>
                  आपकी यात्रा का पूरा
                  schedule
                </p>
              </div>
            </div>

            <span className="ticket-soft-chip">
              {booking.bus_type ||
                "AC Sleeper"}
            </span>
          </div>

          <div className="ticket-route-timeline">
            <div className="ticket-route-stop">
              <span className="ticket-route-dot start" />

              <div>
                <small>
                  BOARDING
                </small>

                <h4>
                  {source}
                </h4>

                <p>
                  {formatJourneyDateTime(
                    booking
                      .departure_time
                  )}
                </p>
              </div>
            </div>

            <div className="ticket-route-middle">
              <span />

              <div>
                <strong>
                  🚌{" "}
                  {hasValidDuration
                    ? formatDuration(
                        booking
                      )
                    : "Duration उपलब्ध नहीं"}
                </strong>

                <small>
                  Confirmed schedule duration
                </small>
              </div>
            </div>

            <div className="ticket-route-stop destination">
              <span className="ticket-route-dot end" />

              <div>
                <small>
                  ARRIVAL
                </small>

                <h4>
                  {destination}
                </h4>

                <p>
                  {hasValidArrival
                    ? formatJourneyDateTime(
                        booking
                          .arrival_time
                      )
                    : "Arrival उपलब्ध नहीं"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="ticket-two-column">
          <section className="ticket-section ticket-info-card">
            <div className="ticket-section-heading compact">
              <div>
                <span>
                  🚌
                </span>

                <div>
                  <h3>
                    Bus Details
                  </h3>
                </div>
              </div>
            </div>

            <dl>
              <div>
                <dt>
                  Bus Name
                </dt>

                <dd>
                  {booking.bus_name ||
                    "Rular Express"}
                </dd>
              </div>

              <div>
                <dt>
                  Bus Number
                </dt>

                <dd>
                  {booking.bus_number ||
                    "—"}
                </dd>
              </div>

              <div>
                <dt>
                  Bus Type
                </dt>

                <dd>
                  {booking.bus_type ||
                    "AC Sleeper"}
                </dd>
              </div>

              <div>
                <dt>
                  Seats
                </dt>

                <dd>
                  {seats.join(", ") ||
                    "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="ticket-section ticket-info-card">
            <div className="ticket-section-heading compact">
              <div>
                <span>
                  📍
                </span>

                <div>
                  <h3>
                    Boarding Details
                  </h3>
                </div>
              </div>
            </div>

            <dl>
              <div>
                <dt>
                  Boarding Point
                </dt>

                <dd>
                  {booking
                    .boarding_point ||
                    source}
                </dd>
              </div>

              <div>
                <dt>
                  Reporting Time
                </dt>

                <dd>
                  30 minutes early
                </dd>
              </div>

              <div>
                <dt>
                  Contact
                </dt>

                <dd>
                  {booking
                    .contact_phone ||
                    "Available at counter"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="ticket-section ticket-qr-section">
          <div className="ticket-qr-copy">
            <span className="ticket-official-chip">
              🛡 OFFICIAL DIGITAL
              BOARDING PASS
            </span>

            <h3>
              Smart QR Ticket
            </h3>

            <p>
              Boarding के समय यह QR
              conductor को दिखाएँ। यह
              पूरे travel group का
              verified digital boarding
              pass है।
            </p>

            <div className="ticket-verification-code">
              <small>
                VERIFICATION CODE
              </small>

              <strong>
                {ticketNumber}
              </strong>
            </div>
          </div>

          <div className="ticket-qr-frame">
            <QRCodeSVG
              value={qrPayload}
              size={178}
              includeMargin
              level="M"
            />

            <span>
              Scan to verify
            </span>
          </div>
        </section>

        <section className="ticket-section ticket-payment-section">
          <div className="ticket-section-heading">
            <div>
              <span>
                💳
              </span>

              <div>
                <h3>
                  Payment Confirmation
                </h3>

                <p>
                  One secure payment
                  for all passengers
                </p>
              </div>
            </div>

            <span className="ticket-payment-success">
              SUCCESSFUL ✓
            </span>
          </div>

          <div className="ticket-payment-grid">
            <div>
              <small>
                Payment ID
              </small>

              <strong>
                {payment.id ||
                  "—"}
              </strong>
            </div>

            <div>
              <small>
                Method
              </small>

              <strong>
                {String(
                  payment
                    .payment_method ||
                    "UPI"
                ).replaceAll(
                  "_",
                  " "
                )}
              </strong>
            </div>

            <div>
              <small>
                Travellers
              </small>

              <strong>
                {passengers.length}
              </strong>
            </div>

            <div className="ticket-payment-total">
              <small>
                Total Paid
              </small>

              <strong>
                {money(totalFare)}
              </strong>
            </div>
          </div>
        </section>

        <section className="ticket-emotional-note">
          <span>
            ❤️
          </span>

          <div>
            <h3>
              आपका भरोसा, हमारी
              जिम्मेदारी
            </h3>

            <p>
              {emotionalNames
                ? `${emotionalNames}, `
                : ""}

              आपका यह सफर सुरक्षित,
              आरामदायक और खूबसूरत
              यादों से भरा रहे। Rular
              Bus परिवार की ओर से
              दिल से शुभ यात्रा।
            </p>
          </div>
        </section>

        <section className="ticket-travel-instructions">
          <h3>
            यात्रा से पहले ध्यान दें
          </h3>

          <div>
            <p>
              <span>✓</span>
              Boarding point पर 30
              मिनट पहले पहुँचें।
            </p>

            <p>
              <span>✓</span>
              Valid photo ID साथ रखें।
            </p>

            <p>
              <span>✓</span>
              Boarding के समय Smart QR
              दिखाएँ।
            </p>

            <p>
              <span>✓</span>
              अपना सामान सुरक्षित रखें।
            </p>
          </div>
        </section>

        <footer className="ticket-premium-footer">
          <div>
            <img
              src={logo}
              alt="Rular Bus"
            />

            <div>
              <strong>
                Rular Bus Smart Journey
                Engine™
              </strong>

              <span>
                Safe • Secure •
                Comfortable
              </span>
            </div>
          </div>

          <p>
            हर सफर, एक याद बनता है ❤️
          </p>
        </footer>
      </article>

      <section className="ticket-actions">
        <button
          type="button"
          className="ticket-download-button"
          disabled={downloading}
          onClick={downloadPDF}
        >
          {downloading
            ? "PDF बन रहा है..."
            : "📄 Download PDF"}
        </button>

        <button
          type="button"
          className="ticket-share-button"
          onClick={shareTicket}
        >
          📤 Share Ticket
        </button>

        <button
          type="button"
          className="ticket-home-button"
          onClick={() =>
            navigate("/")
          }
        >
          🏠 Go to Home
        </button>
      </section>
    </main>
  );
}

export default Ticket;
