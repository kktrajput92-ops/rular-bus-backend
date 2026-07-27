const getDeckLabel = (deck) =>
  String(deck).toUpperCase() ===
  "UPPER"
    ? "Upper Berth"
    : "Lower Berth";

export default function BookingSummary({
  selectedSeats = [],
  totalFare = 0,
  source = "",
  destination = "",
  journeyDate = "",
  departureTime = "",
  arrivalTime = "",
  journeyDuration = "",
  arrivesNextDay = false,
  onContinue,
}) {
  const hasSelection =
    selectedSeats.length > 0;

  const seatNames =
    selectedSeats
      .map(
        (seat) =>
          seat.seat_no
      )
      .join(", ");

  const firstSeat =
    selectedSeats[0];

  const seatDetail =
    selectedSeats.length === 1 &&
    firstSeat
      ? `${firstSeat.seat_no} • ${getDeckLabel(
          firstSeat.deck
        )}`
      : seatNames;

  return (
    <aside
      className={[
        "premium-booking-summary",
        "premium-booking-summary-final",
        hasSelection
          ? "summary-visible"
          : "",
      ].join(" ")}
      aria-live="polite"
    >
      <div className="summary-seat-information">
        <span>
          चुनी गई सीट
        </span>

        <strong>
          {hasSelection
            ? seatDetail
            : "कोई सीट नहीं"}
        </strong>

        <small>
          {hasSelection
            ? `${selectedSeats.length} ${
                selectedSeats.length ===
                1
                  ? "Passenger"
                  : "Passengers"
              }`
            : "अपनी पसंद की सीट चुनें"}
        </small>
      </div>

      {hasSelection && (
        <div className="summary-journey-information">
          <div>
            <span>
              {source} → {destination}
            </span>

            <small>
              {journeyDate}
            </small>
          </div>

          <div className="summary-time-row">
            <strong>
              {departureTime}
            </strong>

            <i>→</i>

            <strong>
              {arrivalTime}
            </strong>

            {arrivesNextDay && (
              <em>
                अगले दिन
              </em>
            )}
          </div>

          <small className="summary-duration">
            यात्रा अवधि: {journeyDuration}
          </small>
        </div>
      )}

      <div className="summary-price">
        <span>
          कुल किराया
        </span>

        <strong>
          ₹
          {Number(
            totalFare || 0
          ).toLocaleString(
            "en-IN"
          )}
        </strong>
      </div>

      <button
        type="button"
        disabled={!hasSelection}
        onClick={onContinue}
      >
        <span>
          Passenger Details पर जाएँ
        </span>

        <i>→</i>
      </button>
    </aside>
  );
}
