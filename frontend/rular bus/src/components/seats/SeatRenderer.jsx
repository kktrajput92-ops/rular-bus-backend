const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const getSeatLabel = (seat, fallbackIndex = 0) =>
  normalizeText(
    seat?.seat_no ||
      seat?.seat_number ||
      seat?.label ||
      seat?.code ||
      `S${fallbackIndex + 1}`
  );

const getSeatNumber = (seat) => {
  const match = getSeatLabel(seat).match(/(\d+)/);

  return match
    ? Number(match[1])
    : Number.MAX_SAFE_INTEGER;
};

const getFare = (seat) => {
  const fare = Number(
    seat?.private_fare ??
      seat?.fare ??
      seat?.price ??
      seat?.amount ??
      0
  );

  return Number.isFinite(fare)
    ? fare
    : 0;
};

const isLayoutMarker = (seat) => {
  const value = normalizeText(
    [
      seat?.seat_no,
      seat?.seat_number,
      seat?.label,
      seat?.code,
      seat?.seat_type,
      seat?.type,
      seat?.category,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return [
    "AISLE",
    "DRIVER",
    "CONDUCTOR",
    "DOOR",
    "ENTRY",
    "EXIT",
    "FRONT",
    "REAR",
    "STAIR",
    "STAIRS",
    "GANGWAY",
    "WALKWAY",
  ].some((word) =>
    value.includes(word)
  );
};

const isConductorSeat = (seat) => {
  const label = getSeatLabel(seat);

  const side = normalizeText(
    seat?.side ||
      seat?.seat_side ||
      seat?.position_side
  );

  if (side === "LEFT") {
    return true;
  }

  if (side === "RIGHT") {
    return false;
  }

  return (
    label.startsWith("SL") ||
    label.startsWith("SU")
  );
};

const sortSeats = (seats) =>
  [...seats].sort((seatA, seatB) => {
    const numberDifference =
      getSeatNumber(seatA) -
      getSeatNumber(seatB);

    if (numberDifference !== 0) {
      return numberDifference;
    }

    return getSeatLabel(
      seatA
    ).localeCompare(
      getSeatLabel(seatB),
      undefined,
      {
        numeric: true,
      }
    );
  });

const getSeatStatus = (
  seat,
  selected
) => {
  const status = normalizeText(
    seat?.status
  );

  if (
    seat?.booked === true ||
    seat?.booked === 1 ||
    seat?.booked === "1" ||
    status === "BOOKED"
  ) {
    return "booked";
  }

  if (
    seat?.locked === true ||
    seat?.locked === 1 ||
    seat?.locked === "1" ||
    status === "LOCKED"
  ) {
    return "locked";
  }

  if (
    seat?.sellable === false ||
    seat?.private_available === false ||
    status === "BLOCKED" ||
    status === "UNAVAILABLE"
  ) {
    return "blocked";
  }

  if (selected) {
    return "selected";
  }

  return "available";
};

const buildCoachRows = (layout) => {
  const passengerSeats =
    layout.filter(
      (seat) =>
        !isLayoutMarker(seat)
    );

  const conductorSeats =
    sortSeats(
      passengerSeats.filter(
        isConductorSeat
      )
    );

  const driverSeats =
    sortSeats(
      passengerSeats.filter(
        (seat) =>
          !isConductorSeat(seat)
      )
    );

  const driverPairs = [];

  for (
    let index = 0;
    index < driverSeats.length;
    index += 2
  ) {
    driverPairs.push([
      driverSeats[index] || null,
      driverSeats[index + 1] || null,
    ]);
  }

  const totalRows = Math.max(
    conductorSeats.length,
    driverPairs.length
  );

  return Array.from(
    {
      length: totalRows,
    },
    (_, index) => ({
      conductorSeat:
        conductorSeats[index] ||
        null,

      driverPair:
        driverPairs[index] ||
        [null, null],
    })
  );
};

function StatusIndicator({
  status,
}) {
  if (status === "selected") {
    return (
      <span className="rbs-seat-check">
        ✓
      </span>
    );
  }

  if (status === "booked") {
    return (
      <span className="rbs-seat-lock rbs-booked-lock">
        🔒
      </span>
    );
  }

  if (status === "locked") {
    return (
      <span className="rbs-seat-lock">
        ⏳
      </span>
    );
  }

  if (status === "blocked") {
    return (
      <span className="rbs-seat-lock">
        ✕
      </span>
    );
  }

  return (
    <span className="rbs-available-badge">
      Available
    </span>
  );
}

function SingleBerth({
  seat,
  selectedSeatNumbers,
  onSeatClick,
  fallbackIndex,
}) {
  if (!seat) {
    return (
      <div className="rbs-empty-single-slot" />
    );
  }

  const label =
    getSeatLabel(
      seat,
      fallbackIndex
    );

  const selected =
    selectedSeatNumbers.has(label);

  const status =
    getSeatStatus(
      seat,
      selected
    );

  const fare =
    getFare(seat);

  const disabled = [
    "booked",
    "locked",
    "blocked",
  ].includes(status);

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "rbs-single-berth",
        status,
      ].join(" ")}
      onClick={() =>
        onSeatClick(seat)
      }
      aria-label={`${label}, single berth, ${status}`}
    >
      <span className="rbs-window-line" />

      <span className="rbs-pillow" />

      <span className="rbs-mattress" />

      <span className="rbs-curtain">
        <i />
        <i />
        <i />
      </span>

      <span className="rbs-seat-copy">
        <strong>{label}</strong>

        <small>
          Single Berth
        </small>
      </span>

      {fare > 0 && (
        <span className="rbs-fare">
          ₹
          {fare.toLocaleString(
            "en-IN"
          )}
        </span>
      )}

      <StatusIndicator
        status={status}
      />
    </button>
  );
}

function DoubleSeatHalf({
  seat,
  selectedSeatNumbers,
  onSeatClick,
  fallbackIndex,
  side,
}) {
  if (!seat) {
    return (
      <div
        className={`rbs-double-half rbs-empty-half ${side}`}
      />
    );
  }

  const label =
    getSeatLabel(
      seat,
      fallbackIndex
    );

  const selected =
    selectedSeatNumbers.has(label);

  const status =
    getSeatStatus(
      seat,
      selected
    );

  const fare =
    getFare(seat);

  const disabled = [
    "booked",
    "locked",
    "blocked",
  ].includes(status);

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "rbs-double-half",
        side,
        status,
      ].join(" ")}
      onClick={() =>
        onSeatClick(seat)
      }
      aria-label={`${label}, double berth, ${status}`}
    >
      <span className="rbs-half-copy">
        <strong>{label}</strong>

        <small>
          Double Berth
        </small>
      </span>

      {fare > 0 && (
        <span className="rbs-half-fare">
          ₹
          {fare.toLocaleString(
            "en-IN"
          )}
        </span>
      )}

      <StatusIndicator
        status={status}
      />
    </button>
  );
}

function DoubleBerth({
  seats,
  selectedSeatNumbers,
  onSeatClick,
  rowIndex,
}) {
  return (
    <div className="rbs-double-berth">
      <span className="rbs-window-line" />

      <span className="rbs-double-pillow">
        <i />
        <i />
      </span>

      <span className="rbs-double-mattress" />

      <span className="rbs-curtain">
        <i />
        <i />
        <i />
      </span>

      <div className="rbs-double-divider" />

      <div className="rbs-double-seat-area">
        <DoubleSeatHalf
          seat={seats[0]}
          selectedSeatNumbers={
            selectedSeatNumbers
          }
          onSeatClick={
            onSeatClick
          }
          fallbackIndex={
            rowIndex * 2
          }
          side="left"
        />

        <DoubleSeatHalf
          seat={seats[1]}
          selectedSeatNumbers={
            selectedSeatNumbers
          }
          onSeatClick={
            onSeatClick
          }
          fallbackIndex={
            rowIndex * 2 + 1
          }
          side="right"
        />
      </div>
    </div>
  );
}

export default function SeatRenderer({
  layout = [],
  selectedSeats = [],
  onSeatClick,
}) {
  const validLayout =
    Array.isArray(layout)
      ? layout
      : [];

  const rows =
    buildCoachRows(
      validLayout
    );

  const selectedSeatNumbers =
    new Set(
      selectedSeats.map(
        (seat) =>
          getSeatLabel(seat)
      )
    );

  if (rows.length === 0) {
    return (
      <div className="rbs-empty-layout">
        <strong>
          इस deck पर कोई berth
          उपलब्ध नहीं है
        </strong>

        <p>
          कृपया दूसरा deck चुनें।
        </p>
      </div>
    );
  }

  return (
    <div className="rbs-sleeper-layout">
      <div className="rbs-side-headings">
        <span>
          CONDUCTOR SIDE
        </span>

        <span>
          AISLE
        </span>

        <span>
          DRIVER SIDE
        </span>
      </div>

      <div className="rbs-coach-rows">
        {rows.map(
          (
            {
              conductorSeat,
              driverPair,
            },
            rowIndex
          ) => (
            <div
              className="rbs-coach-row"
              key={`row-${rowIndex}`}
            >
              <div className="rbs-conductor-column">
                <SingleBerth
                  seat={
                    conductorSeat
                  }
                  selectedSeatNumbers={
                    selectedSeatNumbers
                  }
                  onSeatClick={
                    onSeatClick
                  }
                  fallbackIndex={
                    rowIndex
                  }
                />
              </div>

              <div className="rbs-aisle">
                <span>
                  AISLE
                </span>
              </div>

              <div className="rbs-driver-column">
                <DoubleBerth
                  seats={
                    driverPair
                  }
                  selectedSeatNumbers={
                    selectedSeatNumbers
                  }
                  onSeatClick={
                    onSeatClick
                  }
                  rowIndex={
                    rowIndex
                  }
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
