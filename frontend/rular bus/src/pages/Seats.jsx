import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import api from "../api/api";

import BusContainer from "../components/seats/BusContainer";
import DriverCabin from "../components/seats/DriverCabin";
import SeatRenderer from "../components/seats/SeatRenderer";
import BookingSummary from "../components/seats/BookingSummary";
import RularBusIcon from "../components/branding/RularBusIcon";

import "../styles/premiumSeats.css";
import "../styles/rularBusIcon.css";
import "../styles/seatLayoutFinal.css";
import "../styles/seatCardReadableFinal.css";
import "../styles/seatJourneyFinal.css";
import "../styles/seatReadabilityLock.css";

const getJourneyDate = (searchBus, schedule) =>
  searchBus.journey_date ||
  schedule.journey_date ||
  schedule.departure_time ||
  null;

const formatJourneyDate = (value) => {
  if (!value) {
    return "तारीख उपलब्ध नहीं";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "hi-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "long",
    }
  );
};

const formatJourneyTime = (value) => {
  if (!value) {
    return "समय उपलब्ध नहीं";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const getJourneyDuration = (
  departureValue,
  arrivalValue
) => {
  if (
    !departureValue ||
    !arrivalValue
  ) {
    return "अवधि उपलब्ध नहीं";
  }

  const departure =
    new Date(departureValue);

  const arrival =
    new Date(arrivalValue);

  if (
    Number.isNaN(
      departure.getTime()
    ) ||
    Number.isNaN(
      arrival.getTime()
    ) ||
    arrival <= departure
  ) {
    return "अवधि उपलब्ध नहीं";
  }

  const totalMinutes =
    Math.round(
      (
        arrival.getTime() -
        departure.getTime()
      ) /
        (1000 * 60)
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (hours && minutes) {
    return `${hours} घंटे ${minutes} मिनट`;
  }

  if (hours) {
    return `${hours} घंटे`;
  }

  return `${minutes} मिनट`;
};

const isNextDayArrival = (
  departureValue,
  arrivalValue
) => {
  if (
    !departureValue ||
    !arrivalValue
  ) {
    return false;
  }

  const departure =
    new Date(departureValue);

  const arrival =
    new Date(arrivalValue);

  if (
    Number.isNaN(
      departure.getTime()
    ) ||
    Number.isNaN(
      arrival.getTime()
    )
  ) {
    return false;
  }

  return (
    departure.toDateString() !==
    arrival.toDateString()
  );
};

const formatEstimatedDuration = (
  durationMinutes,
  estimatedTime
) => {
  const minutesValue =
    Number(durationMinutes);

  if (
    Number.isFinite(minutesValue) &&
    minutesValue > 0
  ) {
    const totalMinutes =
      Math.round(minutesValue);

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    if (hours && minutes) {
      return `${hours} घंटे ${minutes} मिनट`;
    }

    if (hours) {
      return `${hours} घंटे`;
    }

    return `${minutes} मिनट`;
  }

  const routeTime =
    String(
      estimatedTime || ""
    ).trim();

  if (routeTime) {
    return routeTime;
  }

  return "अवधि उपलब्ध नहीं";
};

const formatJourneyDistance = (value) => {
  const distance =
    Number(value);

  if (
    !Number.isFinite(distance) ||
    distance <= 0
  ) {
    return "";
  }

  return `${distance.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 1,
    }
  )} KM`;
};

function Seats() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchBus = location.state || {};

  const [schedule, setSchedule] =
    useState(searchBus);

  const [layout, setLayout] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [
    inventoryWarning,
    setInventoryWarning,
  ] = useState("");

  const [
    selectedDeck,
    setSelectedDeck,
  ] = useState("LOWER");

  const [
    selectedSeats,
    setSelectedSeats,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const scheduleId = Number(
    searchBus.schedule_id
  );

  const loadSeatStatus = async (
    preserveSelection = true
  ) => {
    if (
      !Number.isInteger(scheduleId) ||
      scheduleId <= 0
    ) {
      setError(
        "Valid schedule information is missing."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(
        `/seats/${scheduleId}`
      );

      const data = response.data || {};

      setSchedule({
        ...searchBus,
        ...(data.schedule || {}),
      });

      setLayout(
        Array.isArray(data.layout)
          ? data.layout
          : []
      );

      setSummary(
        data.summary || null
      );

      setInventoryWarning(
        data.inventory_warning || ""
      );

      const lowerDeck =
        data.decks?.lower || [];

      const upperDeck =
        data.decks?.upper || [];

      const hasLower =
        lowerDeck.length > 0 ||
        (data.layout || []).some(
          (seat) =>
            String(seat.deck).toUpperCase() ===
            "LOWER"
        );

      const hasUpper =
        upperDeck.length > 0 ||
        (data.layout || []).some(
          (seat) =>
            String(seat.deck).toUpperCase() ===
            "UPPER"
        );

      setSelectedDeck(
        (currentDeck) => {
          if (
            currentDeck === "LOWER" &&
            hasLower
          ) {
            return "LOWER";
          }

          if (
            currentDeck === "UPPER" &&
            hasUpper
          ) {
            return "UPPER";
          }

          if (hasLower) {
            return "LOWER";
          }

          if (hasUpper) {
            return "UPPER";
          }

          return "LOWER";
        }
      );

      if (preserveSelection) {
        setSelectedSeats(
          (currentSelected) =>
            currentSelected.filter(
              (selectedSeat) => {
                const latestSeat = (
                  data.layout || []
                ).find(
                  (item) =>
                    item.seat_no ===
                    selectedSeat.seat_no
                );

                return (
                  latestSeat &&
                  latestSeat.sellable &&
                  !latestSeat.booked &&
                  !latestSeat.locked &&
                  latestSeat.private_available
                );
              }
            )
        );
      }

      setError("");
    } catch (requestError) {
      console.error(
        "Seat status load failed:",
        requestError
      );

      setError(
        requestError.response?.data
          ?.message ||
          "Failed to load seat layout."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeatStatus(false);

    const intervalId =
      window.setInterval(() => {
        loadSeatStatus(true);
      }, 5000);

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [scheduleId]);

  const lowerLayout = useMemo(
    () =>
      layout.filter(
        (item) =>
          String(
            item.deck || "LOWER"
          ).toUpperCase() === "LOWER"
      ),
    [layout]
  );

  const upperLayout = useMemo(
    () =>
      layout.filter(
        (item) =>
          String(
            item.deck || ""
          ).toUpperCase() === "UPPER"
      ),
    [layout]
  );

  const visibleLayout =
    selectedDeck === "UPPER"
      ? upperLayout
      : lowerLayout;

  const hasLower =
    lowerLayout.length > 0;

  const hasUpper =
    upperLayout.length > 0;

  const toggleSeat = (seat) => {
    if (
      !seat.sellable ||
      seat.booked ||
      seat.locked ||
      !seat.private_available
    ) {
      return;
    }

    if (
      typeof navigator !==
        "undefined" &&
      navigator.vibrate
    ) {
      navigator.vibrate(35);
    }

    setSelectedSeats(
      (currentSeats) => {
        const alreadySelected =
          currentSeats.some(
            (item) =>
              item.seat_no ===
              seat.seat_no
          );

        if (alreadySelected) {
          return currentSeats.filter(
            (item) =>
              item.seat_no !==
              seat.seat_no
          );
        }

        if (
          currentSeats.length >= 20
        ) {
          window.alert(
            "Maximum 20 seats can be selected."
          );

          return currentSeats;
        }

        const fare = Number(
          seat.private_fare ??
            seat.fare ??
            searchBus.fare ??
            searchBus.price ??
            0
        );

        return [
          ...currentSeats,
          {
            seat_no: seat.seat_no,
            seat_layout_id: seat.id,
            seat_type:
              seat.seat_type,
            deck:
              seat.deck ||
              selectedDeck,
            booking_mode: "SEAT",
            berth_group:
              seat.berth_group ||
              null,
            fare,
          },
        ];
      }
    );
  };

  const totalFare =
    selectedSeats.reduce(
      (total, seat) =>
        total +
        Number(seat.fare || 0),
      0
    );

  const continueBooking = () => {
    if (
      selectedSeats.length === 0
    ) {
      window.alert(
        "कृपया आगे बढ़ने के लिए कम से कम एक सीट चुनें।"
      );

      return;
    }

    navigate("/passenger", {
      state: {
        ...searchBus,
        ...schedule,

        schedule_id:
          schedule.schedule_id ||
          scheduleId,

        bus_id:
          schedule.bus_id ||
          searchBus.bus_id,

        seats:
          selectedSeats.map(
            (seat) =>
              seat.seat_no
          ),

        selectedSeatDetails:
          selectedSeats,

        totalFare,
      },
    });
  };

  const source =
    schedule.source ||
    searchBus.source ||
    "Gurugram";

  const destination =
    schedule.destination ||
    searchBus.destination ||
    "Kannauj";

  const busName =
    schedule.bus_name ||
    searchBus.bus_name ||
    "RULAR BUS";

  const busNumber =
    schedule.bus_number ||
    searchBus.bus_number ||
    "";

  const selectedSeatNames =
    selectedSeats
      .map(
        (seat) =>
          seat.seat_no
      )
      .join(", ");

  const firstSelectedSeat =
    selectedSeats[0] || null;

  const journeyDate =
    getJourneyDate(
      searchBus,
      schedule
    );

  const departureTime =
    schedule.departure_time ||
    searchBus.departure_time ||
    null;

  const arrivalTime =
    schedule.arrival_time ||
    searchBus.arrival_time ||
    null;

  const durationMinutes =
    schedule.duration_minutes ??
    searchBus.duration_minutes ??
    null;

  const estimatedTime =
    schedule.estimated_time ??
    searchBus.estimated_time ??
    "";

  const distanceKm =
    schedule.distance_km ??
    searchBus.distance_km ??
    null;

  const journeyDuration =
    formatEstimatedDuration(
      durationMinutes,
      estimatedTime
    );

  const journeyDistance =
    formatJourneyDistance(
      distanceKm
    );

  const arrivesNextDay = (() => {
    if (
      !departureTime ||
      !arrivalTime
    ) {
      return false;
    }

    const departureDate =
      new Date(departureTime);

    const arrivalDate =
      new Date(arrivalTime);

    if (
      Number.isNaN(
        departureDate.getTime()
      ) ||
      Number.isNaN(
        arrivalDate.getTime()
      )
    ) {
      return false;
    }

    return (
      departureDate.getFullYear() !==
        arrivalDate.getFullYear() ||
      departureDate.getMonth() !==
        arrivalDate.getMonth() ||
      departureDate.getDate() !==
        arrivalDate.getDate()
    );
  })();

  if (loading) {
    return (
      <main className="premium-seat-page">
        <section className="seat-loading-card">
          <div className="loading-bus">
            <RularBusIcon
              size={92}
              className="rular-loading-bus-icon"
              decorative
            />
          </div>

          <h2>
            आपकी सीटें तैयार हो रही हैं
          </h2>

          <p>
            बस का लाइव सीट लेआउट लोड
            किया जा रहा है…
          </p>

          <div className="seat-loading-line">
            <span />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="premium-seat-page">
        <section className="seat-error-card">
          <div className="seat-error-icon">
            !
          </div>

          <h2>
            Seat Layout Error
          </h2>

          <p>{error}</p>

          <div className="seat-error-actions">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadSeatStatus(false);
              }}
            >
              दोबारा प्रयास करें
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                navigate(-1)
              }
            >
              वापस जाएँ
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="premium-seat-page">
      <section className="seat-hero-card">
        <div className="seat-hero-top">
          <div>
            <span className="brand-pill">
              RULAR BUS
            </span>

            <p className="seat-hero-eyebrow">
              आपकी पसंद • आपका सफर
            </p>

            <h1>
              अपनों तक पहुँचने की
              पहली सीट
            </h1>

            <p className="seat-hero-description">
              आराम से अपनी पसंद की
              सीट चुनिए। घर लौटने का
              सफर यहीं से शुरू होता
              है।
            </p>
          </div>

          <div
            className="hero-bus-symbol"
            aria-hidden="true"
          >
            <RularBusIcon
              size={74}
              className="rular-hero-bus-icon"
              decorative
            />
          </div>
        </div>

        <div className="animated-route">
          <div className="route-city">
            <span className="route-dot start" />

            <div>
              <strong>
                {source}
              </strong>

              <small>
                प्रस्थान
              </small>
            </div>
          </div>

          <div className="route-track">
            <span className="route-track-line" />

            <span
              className="moving-route-bus"
              aria-hidden="true"
            >
              <RularBusIcon
                size={36}
                className="rular-route-bus-icon"
                decorative
              />
            </span>
          </div>

          <div className="route-city destination">
            <div>
              <strong>
                {destination}
              </strong>

              <small>
                गंतव्य
              </small>
            </div>

            <span className="route-dot end" />
          </div>
        </div>

        <div className="journey-meta-grid journey-meta-grid-final">
          <div>
            <span>बस</span>

            <strong>
              {busName}
            </strong>

            {busNumber && (
              <small>
                {busNumber}
              </small>
            )}
          </div>

          <div>
            <span>यात्रा तारीख</span>

            <strong>
              {formatJourneyDate(
                journeyDate
              )}
            </strong>
          </div>

          <div>
            <span>प्रस्थान</span>

            <strong>
              {formatJourneyTime(
                departureTime
              )}
            </strong>
          </div>

          <div className="arrival-meta-item">
            <span>
              पहुँचने का समय
            </span>

            <strong>
              {formatJourneyTime(
                arrivalTime
              )}
            </strong>

            {arrivesNextDay && (
              <small className="next-day-badge">
                अगले दिन
              </small>
            )}
          </div>

          <div>
            <span>यात्रा अवधि</span>

            <strong>
              {journeyDuration}
            </strong>

            {journeyDistance && (
              <small>
                {journeyDistance}
              </small>
            )}
          </div>

          <div>
            <span>उपलब्ध सीटें</span>

            <strong>
              {summary?.available_positions ??
                visibleLayout.filter(
                  (seat) =>
                    seat.sellable &&
                    !seat.booked &&
                    !seat.locked &&
                    seat.private_available
                ).length}
            </strong>
          </div>
        </div>

        <div className="boarding-dropping-strip">
          <div className="journey-point boarding-point">
            <span className="journey-point-icon">
              ↑
            </span>

            <div>
              <small>Boarding</small>

              <strong>
                {source}
              </strong>

              <span>
                {formatJourneyTime(
                  departureTime
                )}
              </span>
            </div>
          </div>

          <div className="journey-point-line">
            <span />
          </div>

          <div className="journey-point dropping-point">
            <span className="journey-point-icon">
              ↓
            </span>

            <div>
              <small>Dropping</small>

              <strong>
                {destination}
              </strong>

              <span>
                {formatJourneyTime(
                  arrivalTime
                )}
                {arrivesNextDay
                  ? " • अगले दिन"
                  : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {inventoryWarning && (
        <section className="inventory-warning">
          <span>⚠️</span>

          <div>
            <strong>
              Seat inventory update
            </strong>

            <p>
              {inventoryWarning}
            </p>
          </div>
        </section>
      )}

      <section className="seat-selection-card">
        <div className="seat-section-header">
          <div>
            <span className="section-kicker">
              LIVE SEAT SELECTION
            </span>

            <h2>
              अपनी आरामदायक सीट चुनें
            </h2>

            <p>
              सीटें हर 5 सेकंड में
              लाइव अपडेट होती हैं।
            </p>
          </div>

          <span className="live-availability">
            <i />
            Live
          </span>
        </div>

        <div className="premium-seat-legend">
          <div>
            <span className="legend-shape available" />
            उपलब्ध
          </div>

          <div>
            <span className="legend-shape selected" />
            चुनी गई
          </div>

          <div>
            <span className="legend-shape booked">
              🔒
            </span>
            बुक
          </div>

          <div>
            <span className="legend-shape locked">
              ⏳
            </span>
            अस्थायी लॉक
          </div>
        </div>

        {(hasLower || hasUpper) && (
          <div className="premium-deck-switcher">
            {hasLower && (
              <button
                type="button"
                className={
                  selectedDeck ===
                  "LOWER"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedDeck(
                    "LOWER"
                  )
                }
              >
                <span>
                  Lower Deck
                </span>

                <small>
                  नीचे का कोच
                </small>
              </button>
            )}

            {hasUpper && (
              <button
                type="button"
                className={
                  selectedDeck ===
                  "UPPER"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedDeck(
                    "UPPER"
                  )
                }
              >
                <span>
                  Upper Deck
                </span>

                <small>
                  ऊपर का कोच
                </small>
              </button>
            )}
          </div>
        )}

        <div
          key={selectedDeck}
          className="deck-animation-shell"
        >
          {visibleLayout.length > 0 ? (
            <BusContainer
              deck={selectedDeck}
            >
              <DriverCabin
                showDoor={
                  selectedDeck ===
                  "LOWER"
                }
                deck={selectedDeck}
              />

              <SeatRenderer
                layout={
                  visibleLayout
                }
                selectedSeats={
                  selectedSeats
                }
                onSeatClick={
                  toggleSeat
                }
              />
            </BusContainer>
          ) : (
            <section className="seat-empty-state">
              <span
                className="seat-empty-state-icon"
                aria-hidden="true"
              >
                🚌
              </span>

              <h3>
                इस deck पर सीट लेआउट
                उपलब्ध नहीं है
              </h3>

              <p>
                कृपया दूसरा deck चुनें
                या दूसरी बस देखें।
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
              >
                दूसरी बस चुनें
              </button>
            </section>
          )}
        </div>

        <div
          className={[
            "seat-emotion-message",
            selectedSeats.length > 0
              ? "visible"
              : "",
          ].join(" ")}
        >
          {selectedSeats.length ===
            1 && (
            <>
              <span className="emotion-icon">
                💙
              </span>

              <div>
                <strong>
                  {
                    firstSelectedSeat
                      .seat_no
                  }{" "}
                  चुनी गई
                </strong>

                <p>
                  घर की ओर आपका सफर
                  एक कदम और करीब है।
                </p>
              </div>
            </>
          )}

          {selectedSeats.length >
            1 && (
            <>
              <span className="emotion-icon">
                👨‍👩‍👧
              </span>

              <div>
                <strong>
                  {
                    selectedSeats.length
                  }{" "}
                  सीटें चुनी गईं
                </strong>

                <p>
                  अब सफर साथ होगा।
                </p>
              </div>
            </>
          )}
        </div>

        {selectedSeats.length > 0 && (
          <div className="selected-seat-strip selected-seat-strip-final">
          <div>
            <span>
              चुनी गई सीटें
            </span>

            <strong>
              {selectedSeatNames}
            </strong>
          </div>

          <div className="selected-journey-context">
            <span>
              {source} → {destination}
            </span>

            <small>
              {formatJourneyDate(
                journeyDate
              )}
              {" • "}
              {formatJourneyTime(
                departureTime
              )}
            </small>
          </div>
        </div>
        )}
      </section>

      <blockquote className="journey-brand-quote">
        “सफर सिर्फ शहरों के बीच
        नहीं, अपनों के पास लौटने
        का होता है।”
      </blockquote>

      <BookingSummary
        selectedSeats={
          selectedSeats
        }
        totalFare={totalFare}
        source={source}
        destination={destination}
        journeyDate={
          formatJourneyDate(
            journeyDate
          )
        }
        departureTime={
          formatJourneyTime(
            departureTime
          )
        }
        arrivalTime={
          formatJourneyTime(
            arrivalTime
          )
        }
        journeyDuration={
          journeyDuration
        }
        arrivesNextDay={
          arrivesNextDay
        }
        onContinue={
          continueBooking
        }
      />
    </main>
  );
}

export default Seats;
