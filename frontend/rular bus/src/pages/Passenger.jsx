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
import customerApi from "../api/customerApi";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import {
  getAnonymousSessionId,
} from "../utils/customerAnalytics";

import "./PassengerPremium.css";
import SavedTravellerControls from "../components/passenger/SavedTravellerControls";

const getSeatNumber = (seat) => {
  if (
    typeof seat === "string" ||
    typeof seat === "number"
  ) {
    return String(seat);
  }

  return String(
    seat?.seat_number ||
      seat?.seat_no ||
      seat?.number ||
      ""
  );
};

const getSeatFare = (seat) => {
  if (!seat || typeof seat !== "object") {
    return null;
  }

  const fare = Number(
    seat.fare_amount ??
      seat.fare ??
      seat.private_fare ??
      seat.sharing_fare ??
      seat.price ??
      seat.seat_fare
  );

  return Number.isFinite(fare) &&
    fare >= 0
    ? fare
    : null;
};

const getSeatMeta = (seatValue) => {
  const seatNumber =
    getSeatNumber(seatValue).toUpperCase();

  if (seatValue && typeof seatValue === "object") {
    const deck = String(
      seatValue.deck || ""
    ).toUpperCase();

    const seatType = String(
      seatValue.seat_type || ""
    ).toUpperCase();

    return {
      deck:
        deck === "UPPER"
          ? "Upper Deck"
          : "Lower Deck",

      type:
        seatType.includes("UPPER") ||
        seatNumber.startsWith("SU") ||
        seatNumber.startsWith("DU")
          ? seatNumber.startsWith("DU")
            ? "Double Berth"
            : "Single Berth"
          : seatNumber.startsWith("DL")
          ? "Double Berth"
          : "Single Berth",
    };
  }

  return {
    deck:
      seatNumber.startsWith("SU") ||
      seatNumber.startsWith("DU")
        ? "Upper Deck"
        : "Lower Deck",

    type:
      seatNumber.startsWith("DL") ||
      seatNumber.startsWith("DU")
        ? "Double Berth"
        : "Single Berth",
  };
};

const getPassengerCategory = (
  ageValue
) => {
  const age = Number(ageValue);

  if (
    !Number.isInteger(age) ||
    age < 1
  ) {
    return "";
  }

  if (age <= 4) {
    return "Infant";
  }

  if (age <= 11) {
    return "Child";
  }

  if (age <= 59) {
    return "Adult";
  }

  return "Senior";
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits:
        Number.isInteger(amount)
          ? 0
          : 2,
    }
  ).format(amount);
};

const formatDuration = (
  minutesValue,
  departureValue,
  arrivalValue
) => {
  let totalMinutes =
    Number(minutesValue);

  if (
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    const departure =
      departureValue
        ? new Date(departureValue)
        : null;

    const arrival =
      arrivalValue
        ? new Date(arrivalValue)
        : null;

    if (
      departure &&
      arrival &&
      !Number.isNaN(
        departure.getTime()
      ) &&
      !Number.isNaN(
        arrival.getTime()
      )
    ) {
      let difference =
        arrival.getTime() -
        departure.getTime();

      if (difference <= 0) {
        difference +=
          24 * 60 * 60 * 1000;
      }

      totalMinutes =
        Math.round(
          difference / 60000
        );
    }
  }

  if (
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return "";
  }

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  if (
    hours > 0 &&
    minutes > 0
  ) {
    return `${hours} घंटे ${minutes} मिनट`;
  }

  if (hours > 0) {
    return `${hours} घंटे`;
  }

  return `${minutes} मिनट`;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const getHindiTimePeriod = (date) => {
  const hour =
    date.getHours();

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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const period =
    getHindiTimePeriod(date);

  const time =
    date.toLocaleTimeString(
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

const createPassenger = (
  seat,
  index
) => ({
  client_id: `${getSeatNumber(
    seat
  )}-${index}`,

  seat,
  seat_number:
    getSeatNumber(seat),

  full_name: "",
  gender: "",
  age: "",
  traveller_mode: "NEW",
  saved_traveller_id: "",
  relationship: "OTHER",
  date_of_birth: "",
  save_for_future: false,
});

function Passenger() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    customer,
    isAuthenticated,
  } = useCustomerAuth();

  const state = location.state || {};

  const {
    schedule_id,
    seats = [],
    selectedSeatDetails = [],
    totalFare = 0,
    bus_name = "",
    bus_number = "",
    source = "",
    destination = "",
    departure_time,
    arrival_time,
    duration_minutes,
    boarding_point,
    dropping_point,
  } = state;

  const [contact, setContact] =
    useState({
      phone: "",
      email: "",
    });

  useEffect(() => {
    if (!customer) {
      return;
    }

    setContact((current) => ({
      phone:
        current.phone ||
        String(customer.phone || "")
          .replace(/\D/g, "")
          .trim(),

      email:
        current.email ||
        String(customer.email || "")
          .trim()
          .toLowerCase(),
    }));
  }, [customer]);

  const [
    savedTravellers,
    setSavedTravellers,
  ] = useState([]);

  const [
    familyLoading,
    setFamilyLoading,
  ] = useState(false);

  const [
    familyLoaded,
    setFamilyLoaded,
  ] = useState(false);

  const [
    familySummary,
    setFamilySummary,
  ] = useState({
    total: 0,
    infant: 0,
    child: 0,
    adult: 0,
    senior: 0,
  });

  const bookingSeats =
    Array.isArray(selectedSeatDetails) &&
    selectedSeatDetails.length
      ? selectedSeatDetails
      : seats;

  const [passengers, setPassengers] =
    useState(
      bookingSeats.map((seat, index) =>
        createPassenger(
          seat,
          index
        )
      )
    );

  const [errors, setErrors] =
    useState({});

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [confirmed, setConfirmed] =
    useState(false);

  const normalizedSeats = useMemo(
    () =>
      bookingSeats
        .map((seat) =>
          getSeatNumber(seat)
        )
        .filter(Boolean),
    [bookingSeats]
  );

  const calculatedFare = useMemo(
    () => {
      const seatFareTotal =
        bookingSeats.reduce(
          (sum, seat) => {
            const fare =
              getSeatFare(seat);

            return fare === null
              ? sum
              : sum + fare;
          },
          0
        );

      return seatFareTotal > 0
        ? seatFareTotal
        : Number(totalFare || 0);
    },
    [bookingSeats, totalFare]
  );

  const loadSavedTravellers = async () => {
    if (!isAuthenticated) {
      setSavedTravellers([]);
      setFamilyLoaded(false);
      setFamilyLoading(false);

      setFamilySummary({
        total: 0,
        infant: 0,
        child: 0,
        adult: 0,
        senior: 0,
      });

      return [];
    }

    try {
      setFamilyLoading(true);

      const response =
        await customerApi.get(
          "/saved-travellers"
        );

      const loadedTravellers =
        Array.isArray(
          response.data?.travellers
        )
          ? response.data.travellers
          : [];

      setSavedTravellers(
        loadedTravellers
      );

      setFamilySummary(
        response.data?.summary || {
          total: 0,
          infant: 0,
          child: 0,
          adult: 0,
          senior: 0,
        }
      );

      setFamilyLoaded(true);

      return loadedTravellers;
    } catch (error) {
      console.error(
        "Saved travellers load failed:",
        error
      );

      setSavedTravellers([]);
      setFamilyLoaded(true);

      setFamilySummary({
        total: 0,
        infant: 0,
        child: 0,
        adult: 0,
        senior: 0,
      });

      return [];
    } finally {
      setFamilyLoading(false);
    }
  };

  useEffect(() => {
    loadSavedTravellers();
  }, [isAuthenticated]);

  const changeTravellerMode = (
    index,
    mode
  ) => {
    setPassengers((current) =>
      current.map(
        (passenger, itemIndex) => {
          if (itemIndex !== index) {
            return passenger;
          }

          if (mode === "SAVED") {
            return {
              ...passenger,
              traveller_mode: "SAVED",
              saved_traveller_id: "",
              full_name: "",
              gender: "",
              age: "",
              relationship: "OTHER",
              date_of_birth: "",
              save_for_future: false,
            };
          }

          return {
            ...passenger,
            traveller_mode: "NEW",
            saved_traveller_id: "",
            full_name: "",
            gender: "",
            age: "",
            relationship: "OTHER",
            date_of_birth: "",
            save_for_future: false,
          };
        }
      )
    );

    setMessage("");
  };

  const selectSavedTraveller = (
    index,
    travellerIdValue
  ) => {
    const travellerId = Number(
      travellerIdValue
    );

    if (!travellerIdValue) {
      updatePassenger(
        index,
        "saved_traveller_id",
        ""
      );
      return;
    }

    const duplicate = passengers.some(
      (passenger, passengerIndex) =>
        passengerIndex !== index &&
        Number(
          passenger.saved_traveller_id
        ) === travellerId
    );

    if (duplicate) {
      setMessage(
        "एक saved traveller को एक ही booking में दो seats assign नहीं कर सकते।"
      );
      return;
    }

    const traveller =
      savedTravellers.find(
        (item) =>
          Number(item.id) ===
          travellerId
      );

    if (!traveller) {
      return;
    }

    setPassengers((current) =>
      current.map(
        (passenger, itemIndex) =>
          itemIndex === index
            ? {
                ...passenger,
                traveller_mode: "SAVED",
                saved_traveller_id:
                  traveller.id,
                full_name:
                  traveller.full_name,
                gender:
                  traveller.gender,
                age: String(
                  traveller.age
                ),
                relationship:
                  traveller.relationship ||
                  "OTHER",
                date_of_birth:
                  traveller.date_of_birth
                    ? String(
                        traveller.date_of_birth
                      ).slice(0, 10)
                    : "",
                save_for_future:
                  false,
              }
            : passenger
      )
    );

    setMessage("");
  };

  const updatePassenger = (
    index,
    field,
    value
  ) => {
    setPassengers((current) =>
      current.map(
        (passenger, itemIndex) =>
          itemIndex === index
            ? {
                ...passenger,
                [field]: value,
              }
            : passenger
      )
    );

    setErrors((current) => {
      const next = { ...current };

      delete next[
        `passengers.${index}.${field}`
      ];

      return next;
    });

    setMessage("");
  };

  const updateContact = (
    field,
    value
  ) => {
    setContact((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      const next = { ...current };

      delete next[`contact.${field}`];

      return next;
    });

    setMessage("");
  };

  const validateForm = () => {
    const nextErrors = {};

    const normalizedPhone =
      contact.phone.replace(
        /\D/g,
        ""
      );

    if (
      !/^[6-9][0-9]{9}$/.test(
        normalizedPhone
      )
    ) {
      nextErrors["contact.phone"] =
        "10 अंकों का सही मोबाइल नंबर दर्ज करें।";
    }

    const normalizedEmail =
      contact.email.trim();

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      nextErrors["contact.email"] =
        "सही ईमेल पता दर्ज करें।";
    }

    passengers.forEach(
      (passenger, index) => {
        const fullName =
          passenger.full_name
            .replace(/\s+/g, " ")
            .trim();

        const age = Number(
          passenger.age
        );

        if (fullName.length < 2) {
          nextErrors[
            `passengers.${index}.full_name`
          ] =
            "यात्री का पूरा नाम दर्ज करें।";
        }

        if (!passenger.gender) {
          nextErrors[
            `passengers.${index}.gender`
          ] =
            "Gender चुनें।";
        }

        if (
          !Number.isInteger(age) ||
          age < 1 ||
          age > 120
        ) {
          nextErrors[
            `passengers.${index}.age`
          ] =
            "उम्र 1 से 120 के बीच होनी चाहिए।";
        }
      }
    );

    if (!confirmed) {
      nextErrors.confirmed =
        "आगे बढ़ने से पहले विवरण की पुष्टि करें।";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!schedule_id) {
      setMessage(
        "Schedule information उपलब्ध नहीं है। सीट पेज पर वापस जाएँ।"
      );
      return;
    }

    if (!passengers.length) {
      setMessage(
        "कोई seat selected नहीं है।"
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const createdPassengers = [];

      for (
        let index = 0;
        index < passengers.length;
        index += 1
      ) {
        const passenger =
          passengers[index];

        let savedTravellerId =
          passenger.saved_traveller_id
            ? Number(
                passenger.saved_traveller_id
              )
            : null;

        if (
          passenger.traveller_mode === "NEW" &&
          passenger.save_for_future
        ) {
          const savedResponse =
            await customerApi.post(
              "/saved-travellers",
              {
                full_name:
                  passenger.full_name
                    .replace(
                      /\s+/g,
                      " "
                    )
                    .trim(),

                relationship:
                  passenger.relationship ||
                  "OTHER",

                gender:
                  passenger.gender,

                date_of_birth:
                  passenger.date_of_birth,
              }
            );

          const savedTraveller =
            savedResponse.data?.traveller;

          if (!savedTraveller?.id) {
            throw new Error(
              "Saved traveller response is invalid."
            );
          }

          savedTravellerId =
            Number(savedTraveller.id);

          setSavedTravellers(
            (current) => {
              const exists = current.some(
                (item) =>
                  Number(item.id) ===
                  Number(savedTraveller.id)
              );

              if (exists) {
                return current.map(
                  (item) =>
                    Number(item.id) ===
                    Number(savedTraveller.id)
                      ? {
                          ...item,
                          ...savedTraveller,
                        }
                      : item
                );
              }

              return [
                ...current,
                savedTraveller,
              ];
            }
          );

          setFamilyLoaded(true);

          await loadSavedTravellers();
        }

        const passengerResponse =
          await api.post(
            "/passengers",
            {
              full_name:
                passenger.full_name
                  .replace(
                    /\s+/g,
                    " "
                  )
                  .trim(),

              phone: null,
              email: null,

              gender:
                passenger.gender,

              age: Number(
                passenger.age
              ),

              saved_traveller_id:
                savedTravellerId,

              date_of_birth:
                passenger.date_of_birth ||
                null,

              relationship:
                passenger.relationship ||
                "OTHER",
            }
          );

        createdPassengers.push({
          passenger_id:
            passengerResponse.data
              .passenger.id,

          seat_number:
            passenger.seat_number,
        });
      }

      const bookingResponse =
        await customerApi.post(
          "/bookings",
          {
            schedule_id:
              Number(schedule_id),

            contact_phone:
              contact.phone.replace(
                /\D/g,
                ""
              ),

            contact_email:
              contact.email
                .trim()
                .toLowerCase() ||
              null,

            passengers:
              createdPassengers,
          }
        );

      const createdBooking =
        bookingResponse.data.booking;

      const searchLogId = Number(
        sessionStorage.getItem(
          "rular_search_log_id"
        )
      );

      const primaryPassengerId =
        createdPassengers[0]
          ?.passenger_id;

      if (
        searchLogId > 0 &&
        createdBooking?.id &&
        primaryPassengerId
      ) {
        try {
          await api.post(
            "/customer-analytics/convert-search",
            {
              search_log_id:
                searchLogId,

              booking_id:
                createdBooking.id,

              passenger_id:
                primaryPassengerId,

              anonymous_session_id:
                getAnonymousSessionId(),
            }
          );

          sessionStorage.removeItem(
            "rular_search_log_id"
          );
        } catch (
          analyticsError
        ) {
          console.error(
            "Booking conversion analytics failed:",
            analyticsError
          );
        }
      }

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

      const createdScheduleIsValid =
        isValidSchedulePair(
          createdBooking
            ?.departure_time,
          createdBooking
            ?.arrival_time
        );

      const originalScheduleIsValid =
        isValidSchedulePair(
          departure_time,
          arrival_time
        );

      const confirmedDeparture =
        createdScheduleIsValid
          ? createdBooking
              .departure_time
          : originalScheduleIsValid
            ? departure_time
            : createdBooking
                ?.departure_time ||
              departure_time ||
              null;

      const confirmedArrival =
        createdScheduleIsValid
          ? createdBooking
              .arrival_time
          : originalScheduleIsValid
            ? arrival_time
            : createdBooking
                ?.arrival_time ||
              arrival_time ||
              null;

      const calculatedDurationMinutes =
        isValidSchedulePair(
          confirmedDeparture,
          confirmedArrival
        )
          ? Math.round(
              (
                new Date(
                  confirmedArrival
                ).getTime() -
                new Date(
                  confirmedDeparture
                ).getTime()
              ) /
                60000
            )
          : null;

      const confirmedBooking = {
        ...state,
        ...createdBooking,

        schedule_id:
          createdBooking?.schedule_id ||
          Number(schedule_id),

        departure_time:
          confirmedDeparture,

        arrival_time:
          confirmedArrival,

        duration_minutes:
          Number(
            createdBooking
              ?.duration_minutes
          ) > 0 &&
          createdScheduleIsValid
            ? Number(
                createdBooking
                  .duration_minutes
              )
            : Number(
                duration_minutes
              ) > 0 &&
              originalScheduleIsValid
              ? Number(
                  duration_minutes
                )
              : calculatedDurationMinutes,

        source:
          createdBooking?.source ||
          source,

        destination:
          createdBooking?.destination ||
          destination,

        bus_name:
          createdBooking?.bus_name ||
          bus_name,

        bus_number:
          createdBooking?.bus_number ||
          bus_number,

        boarding_point:
          createdBooking
            ?.boarding_point ||
          boarding_point ||
          source,

        dropping_point:
          createdBooking
            ?.dropping_point ||
          dropping_point ||
          destination,

        passengers:
          Array.isArray(
            createdBooking
              ?.passengers
          ) &&
          createdBooking
            .passengers.length
            ? createdBooking
                .passengers
            : createdPassengers,

        seats:
          normalizedSeats,

        passenger_count:
          passengers.length,

        fare_amount:
          Number(
            createdBooking
              ?.fare_amount
          ) > 0
            ? Number(
                createdBooking
                  .fare_amount
              )
            : calculatedFare,
      };

      navigate("/payment", {
        state: {
          booking:
            confirmedBooking,
        },
      });
    } catch (error) {
      console.error(
        "Multi-passenger booking failed:",
        error
      );

      const backendMessage =
        error.response?.data?.message;

      const errorDetails =
        error.response?.data?.details;

      setMessage(
        [
          backendMessage ||
            error.message ||
            "Booking create नहीं हो सकी।",

          errorDetails?.occupied_seats?.length
            ? `Booked seats: ${errorDetails.occupied_seats.join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    !schedule_id ||
    passengers.length === 0
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 20,
          background:
            "var(--erp-bg)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            padding: 28,
            borderRadius: 20,
            background:
              "var(--erp-surface)",
            textAlign: "center",
            boxShadow:
              "0 12px 30px rgba(15,23,42,.10)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0B3D91",
            }}
          >
            Booking Details Missing
          </h2>

          <p
            style={{
              color:
                "var(--erp-text-muted)",
            }}
          >
            Passenger details भरने से पहले seats select करें।
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={{
              width: "100%",
              padding: 14,
              border: 0,
              borderRadius: 10,
              background:
                "#0B3D91",
              color: "#ffffff",
              fontWeight: 800,
            }}
          >
            ← सीट चयन पर वापस जाएँ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="passenger-premium-page"
      style={{
        minHeight: "100vh",
        padding: "20px 14px 130px",
        background:
          "linear-gradient(180deg,#eaf2ff 0%,#f7f9fc 280px)",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={{
              border: 0,
              padding: 0,
              background:
                "transparent",
              color: "#0B3D91",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← सीट बदलें
          </button>

          <h1
            style={{
              margin:
                "14px 0 5px",
              color: "#102a56",
              fontSize:
                "clamp(25px,5vw,36px)",
            }}
          >
            Passenger Details
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            एक ticket number पर सभी यात्रियों की जानकारी भरें।
          </p>
        </header>

        <section
          style={{
            borderRadius: 22,
            overflow: "hidden",
            marginBottom: 18,
            background:
              "#ffffff",
            border:
              "1px solid #dbe8f8",
            boxShadow:
              "0 12px 32px rgba(11,61,145,.10)",
          }}
        >
          <div
            style={{
              padding: 22,
              color: "#ffffff",
              background:
                "linear-gradient(120deg,#082f72,#1565c0)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    opacity: 0.8,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {bus_name ||
                    "RULAR BUS"}
                </div>

                <h2
                  style={{
                    margin:
                      "8px 0 5px",
                    fontSize:
                      "clamp(21px,5vw,30px)",
                  }}
                >
                  {source} →{" "}
                  {destination}
                </h2>

                {bus_number && (
                  <div
                    style={{
                      opacity: 0.88,
                    }}
                  >
                    Bus No:{" "}
                    {bus_number}
                  </div>
                )}
              </div>

              <div
                style={{
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.78,
                  }}
                >
                  Total Fare
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 27,
                  }}
                >
                  {formatCurrency(
                    calculatedFare
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(150px,1fr))",
              gap: 1,
              background:
                "#dbe8f8",
            }}
          >
            <div
              style={{
                padding: 16,
                background:
                  "#ffffff",
              }}
            >
              <small
                style={{
                  color: "#64748b",
                }}
              >
                Journey Date
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                }}
              >
                {formatDate(
                  departure_time
                ) || "—"}
              </strong>
            </div>

            <div
              style={{
                padding: 16,
                background:
                  "#ffffff",
              }}
            >
              <small
                style={{
                  color: "#64748b",
                }}
              >
                Departure
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                }}
              >
                {formatTime(
                  departure_time
                ) || "—"}
              </strong>
            </div>

            <div
              style={{
                padding: 16,
                background:
                  "#ffffff",
              }}
            >
              <small
                style={{
                  color: "#64748b",
                }}
              >
                Arrival
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                }}
              >
                {formatTime(
                  arrival_time
                ) || "—"}
              </strong>
            </div>

            <div
              style={{
                padding: 16,
                background:
                  "#ffffff",
              }}
            >
              <small
                style={{
                  color: "#64748b",
                }}
              >
                Duration
              </small>

              <strong
                style={{
                  display: "block",
                  marginTop: 5,
                }}
              >
                {formatDuration(
                  duration_minutes,
                  departure_time,
                  arrival_time
                ) || "—"}
              </strong>
            </div>
          </div>

          <div
            style={{
              padding: 17,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <strong>
              {passengers.length}{" "}
              Passenger
              {passengers.length > 1
                ? "s"
                : ""}
            </strong>

            <span
              style={{
                color: "#94a3b8",
              }}
            >
              •
            </span>

            <span>
              Seats:{" "}
              {normalizedSeats.join(
                ", "
              )}
            </span>

            {boarding_point && (
              <>
                <span
                  style={{
                    color:
                      "#94a3b8",
                  }}
                >
                  •
                </span>

                <span>
                  Boarding:{" "}
                  {boarding_point}
                </span>
              </>
            )}

            {dropping_point && (
              <>
                <span
                  style={{
                    color:
                      "#94a3b8",
                  }}
                >
                  •
                </span>

                <span>
                  Dropping:{" "}
                  {dropping_point}
                </span>
              </>
            )}
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <section
            style={{
              padding: 22,
              borderRadius: 20,
              marginBottom: 18,
              background:
                "#ffffff",
              border:
                "1px solid #e2e8f0",
              boxShadow:
                "0 8px 25px rgba(15,23,42,.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems:
                    "center",
                  borderRadius: 12,
                  background:
                    "#e8f1ff",
                  fontSize: 21,
                }}
              >
                📱
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color:
                      "#102a56",
                    fontSize: 21,
                  }}
                >
                  Booking Contact
                </h2>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Ticket और payment confirmation इसी contact पर भेजी जाएगी।
                </small>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(250px,1fr))",
                gap: 15,
              }}
            >
              <label>
                <span
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontWeight: 800,
                    color:
                      "#334155",
                  }}
                >
                  Mobile Number *
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={
                    contact.phone
                  }
                  placeholder="10 digit mobile number"
                  onChange={(
                    event
                  ) =>
                    updateContact(
                      "phone",
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 10)
                    )
                  }
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding: 13,
                    borderRadius: 10,
                    border:
                      errors[
                        "contact.phone"
                      ]
                        ? "1px solid #dc2626"
                        : "1px solid #cbd5e1",
                    outline: "none",
                  }}
                />

                {errors[
                  "contact.phone"
                ] && (
                  <small
                    style={{
                      display: "block",
                      marginTop: 6,
                      color:
                        "#dc2626",
                    }}
                  >
                    {
                      errors[
                        "contact.phone"
                      ]
                    }
                  </small>
                )}
              </label>

              <label>
                <span
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontWeight: 800,
                    color:
                      "#334155",
                  }}
                >
                  Email Address
                  <small
                    style={{
                      marginLeft: 5,
                      color:
                        "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    (Optional)
                  </small>
                </span>

                <input
                  type="email"
                  value={
                    contact.email
                  }
                  placeholder="customer@example.com"
                  onChange={(
                    event
                  ) =>
                    updateContact(
                      "email",
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding: 13,
                    borderRadius: 10,
                    border:
                      errors[
                        "contact.email"
                      ]
                        ? "1px solid #dc2626"
                        : "1px solid #cbd5e1",
                    outline: "none",
                  }}
                />

                {errors[
                  "contact.email"
                ] && (
                  <small
                    style={{
                      display: "block",
                      marginTop: 6,
                      color:
                        "#dc2626",
                    }}
                  >
                    {
                      errors[
                        "contact.email"
                      ]
                    }
                  </small>
                )}
              </label>
            </div>
          </section>

          {familyLoaded &&
            savedTravellers.length > 0 && (
            <section
              style={{
                padding: 18,
                borderRadius: 18,
                marginBottom: 18,
                background:
                  "linear-gradient(135deg,#ecfdf5,#f0fdf4)",
                border:
                  "1px solid #86efac",
                boxShadow:
                  "0 8px 24px rgba(22,163,74,.08)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  color: "#166534",
                }}
              >
                👨‍👩‍👧‍👦 Saved Family Summary
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {[
                  [
                    "Total",
                    familySummary.total,
                  ],
                  [
                    "Adults",
                    familySummary.adult,
                  ],
                  [
                    "Children",
                    familySummary.child,
                  ],
                  [
                    "Infants",
                    familySummary.infant,
                  ],
                  [
                    "Seniors",
                    familySummary.senior,
                  ],
                ].map(([label, value]) => (
                  <span
                    key={label}
                    style={{
                      padding: "7px 11px",
                      borderRadius: 999,
                      background: "#ffffff",
                      border:
                        "1px solid #bbf7d0",
                      color: "#166534",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {label}: {value}
                  </span>
                ))}
              </div>
            </section>
          )}

          {passengers.map(
            (passenger, index) => {
              const seatMeta =
                getSeatMeta(
                  passenger.seat
                );

              const seatFare =
                getSeatFare(
                  passenger.seat
                );

              const category =
                getPassengerCategory(
                  passenger.age
                );

              return (
                <section
                  key={
                    passenger.client_id
                  }
                  style={{
                    padding: 22,
                    borderRadius: 20,
                    marginBottom: 18,
                    background:
                      "#ffffff",
                    border:
                      "1px solid #e2e8f0",
                    boxShadow:
                      "0 8px 25px rgba(15,23,42,.07)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 12,
                      alignItems:
                        "flex-start",
                      flexWrap:
                        "wrap",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            "#64748b",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        PASSENGER{" "}
                        {index + 1}
                      </div>

                      <h2
                        style={{
                          margin:
                            "5px 0",
                          color:
                            "#102a56",
                          fontSize: 22,
                        }}
                      >
                        यात्री विवरण
                      </h2>

                      <div
                        style={{
                          color:
                            "#64748b",
                        }}
                      >
                        {seatMeta.deck}
                        {" • "}
                        {seatMeta.type}

                        {seatFare !==
                          null && (
                          <>
                            {" • "}
                            {formatCurrency(
                              seatFare
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        minWidth: 58,
                        padding:
                          "10px 14px",
                        borderRadius:
                          12,
                        background:
                          "#eaf2ff",
                        color:
                          "#0B3D91",
                        fontSize: 18,
                        fontWeight: 900,
                        textAlign:
                          "center",
                        border:
                          "1px solid #bdd5f7",
                      }}
                    >
                      {
                        passenger.seat_number
                      }
                    </span>
                  </div>

                  <SavedTravellerControls
                    passenger={passenger}
                    index={index}
                    savedTravellers={
                      savedTravellers
                    }
                    familyLoading={
                      familyLoading
                    }
                    familyLoaded={
                      familyLoaded
                    }
                    contactReady={
                      isAuthenticated
                    }
                    onModeChange={
                      changeTravellerMode
                    }
                    onSavedTravellerSelect={
                      selectSavedTraveller
                    }
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2,minmax(0,1fr))",
                      gap: 15,
                    }}
                  >
                    <label
                      style={{
                        gridColumn:
                          "1 / -1",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          marginBottom: 7,
                          fontWeight: 800,
                          color:
                            "#334155",
                        }}
                      >
                        Full Name *
                      </span>

                      <input
                        type="text"
                        autoComplete="name"
                        value={
                          passenger.full_name
                        }
                        readOnly={
                          passenger.traveller_mode ===
                          "SAVED"
                        }
                        placeholder="यात्री का पूरा नाम"
                        onChange={(
                          event
                        ) =>
                          updatePassenger(
                            index,
                            "full_name",
                            event.target
                              .value
                          )
                        }
                        style={{
                          width: "100%",
                          boxSizing:
                            "border-box",
                          padding: 13,
                          borderRadius:
                            10,
                          border:
                            errors[
                              `passengers.${index}.full_name`
                            ]
                              ? "1px solid #dc2626"
                              : "1px solid #cbd5e1",
                          outline:
                            "none",
                        }}
                      />

                      {errors[
                        `passengers.${index}.full_name`
                      ] && (
                        <small
                          style={{
                            display:
                              "block",
                            marginTop: 6,
                            color:
                              "#dc2626",
                          }}
                        >
                          {
                            errors[
                              `passengers.${index}.full_name`
                            ]
                          }
                        </small>
                      )}
                    </label>

                    <label>
                      <span
                        style={{
                          display:
                            "block",
                          marginBottom: 7,
                          fontWeight: 800,
                          color:
                            "#334155",
                        }}
                      >
                        Gender *
                      </span>

                      <select
                        disabled={
                          passenger.traveller_mode ===
                          "SAVED"
                        }
                        value={
                          passenger.gender
                        }
                        onChange={(
                          event
                        ) =>
                          updatePassenger(
                            index,
                            "gender",
                            event.target
                              .value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: 13,
                          borderRadius:
                            10,
                          border:
                            errors[
                              `passengers.${index}.gender`
                            ]
                              ? "1px solid #dc2626"
                              : "1px solid #cbd5e1",
                          background:
                            "#ffffff",
                        }}
                      >
                        <option value="">
                          Select Gender
                        </option>

                        <option value="MALE">
                          Male
                        </option>

                        <option value="FEMALE">
                          Female
                        </option>

                        <option value="OTHER">
                          Other
                        </option>
                      </select>

                      {errors[
                        `passengers.${index}.gender`
                      ] && (
                        <small
                          style={{
                            display:
                              "block",
                            marginTop: 6,
                            color:
                              "#dc2626",
                          }}
                        >
                          {
                            errors[
                              `passengers.${index}.gender`
                            ]
                          }
                        </small>
                      )}
                    </label>

                    <label>
                      <span
                        style={{
                          display:
                            "block",
                          marginBottom: 7,
                          fontWeight: 800,
                          color:
                            "#334155",
                        }}
                      >
                        Age *
                      </span>

                      <input
                        type="number"
                        min="1"
                        max="120"
                        inputMode="numeric"
                        value={
                          passenger.age
                        }
                        readOnly={
                          passenger.traveller_mode ===
                          "SAVED"
                        }
                        placeholder="Age"
                        onChange={(
                          event
                        ) =>
                          updatePassenger(
                            index,
                            "age",
                            event.target
                              .value
                          )
                        }
                        style={{
                          width: "100%",
                          boxSizing:
                            "border-box",
                          padding: 13,
                          borderRadius:
                            10,
                          border:
                            errors[
                              `passengers.${index}.age`
                            ]
                              ? "1px solid #dc2626"
                              : "1px solid #cbd5e1",
                          outline:
                            "none",
                        }}
                      />

                      {errors[
                        `passengers.${index}.age`
                      ] && (
                        <small
                          style={{
                            display:
                              "block",
                            marginTop: 6,
                            color:
                              "#dc2626",
                          }}
                        >
                          {
                            errors[
                              `passengers.${index}.age`
                            ]
                          }
                        </small>
                      )}
                    </label>
                  </div>

                  {passenger.traveller_mode ===
                    "NEW" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2,minmax(0,1fr))",
                        gap: 15,
                        marginTop: 15,
                      }}
                    >
                      <label>
                        <span
                          style={{
                            display: "block",
                            marginBottom: 7,
                            fontWeight: 800,
                            color: "#334155",
                          }}
                        >
                          Relationship
                        </span>

                        <select
                          value={
                            passenger.relationship
                          }
                          onChange={(event) =>
                            updatePassenger(
                              index,
                              "relationship",
                              event.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: 13,
                            borderRadius: 10,
                            border:
                              "1px solid #cbd5e1",
                            background:
                              "#ffffff",
                          }}
                        >
                          <option value="SELF">
                            Self
                          </option>
                          <option value="SPOUSE">
                            Spouse
                          </option>
                          <option value="SON">
                            Son
                          </option>
                          <option value="DAUGHTER">
                            Daughter
                          </option>
                          <option value="FATHER">
                            Father
                          </option>
                          <option value="MOTHER">
                            Mother
                          </option>
                          <option value="BROTHER">
                            Brother
                          </option>
                          <option value="SISTER">
                            Sister
                          </option>
                          <option value="RELATIVE">
                            Relative
                          </option>
                          <option value="FRIEND">
                            Friend
                          </option>
                          <option value="OTHER">
                            Other
                          </option>
                        </select>
                      </label>

                      <label>
                        <span
                          style={{
                            display: "block",
                            marginBottom: 7,
                            fontWeight: 800,
                            color: "#334155",
                          }}
                        >
                          Date of Birth
                        </span>

                        <input
                          type="date"
                          max={
                            new Date()
                              .toISOString()
                              .slice(0, 10)
                          }
                          value={
                            passenger.date_of_birth
                          }
                          onChange={(event) =>
                            updatePassenger(
                              index,
                              "date_of_birth",
                              event.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: 13,
                            borderRadius: 10,
                            border:
                              "1px solid #cbd5e1",
                          }}
                        />
                      </label>

                      <label
                        style={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          padding: 12,
                          borderRadius: 10,
                          background: "#f8fafc",
                          border:
                            "1px solid #dbe3ed",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            passenger.save_for_future
                          }
                          disabled={
                            !passenger.date_of_birth
                          }
                          onChange={(event) =>
                            updatePassenger(
                              index,
                              "save_for_future",
                              event.target.checked
                            )
                          }
                          style={{
                            width: 18,
                            height: 18,
                            minHeight: "auto",
                          }}
                        />

                        <span>
                          इस traveller को future bookings के लिए family list में save करें
                        </span>
                      </label>
                    </div>
                  )}

                  {category && (
                    <div
                      style={{
                        marginTop: 15,
                        display:
                          "inline-flex",
                        padding:
                          "7px 11px",
                        borderRadius:
                          999,
                        color:
                          "#166534",
                        background:
                          "#dcfce7",
                        border:
                          "1px solid #86efac",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      Passenger Category:{" "}
                      {category}
                    </div>
                  )}
                </section>
              );
            }
          )}

          <section
            style={{
              padding: 22,
              borderRadius: 20,
              marginBottom: 18,
              background:
                "#ffffff",
              border:
                "1px solid #e2e8f0",
              boxShadow:
                "0 8px 25px rgba(15,23,42,.07)",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 16px",
                color: "#102a56",
                fontSize: 21,
              }}
            >
              Booking Summary
            </h2>

            {passengers.map(
              (passenger, index) => {
                const seatFare =
                  getSeatFare(
                    passenger.seat
                  );

                return (
                  <div
                    key={`summary-${passenger.client_id}`}
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: 12,
                      padding:
                        "10px 0",
                      borderBottom:
                        index ===
                        passengers.length -
                          1
                          ? "none"
                          : "1px solid #edf2f7",
                    }}
                  >
                    <span>
                      Passenger{" "}
                      {index + 1}
                      {" • Seat "}
                      {
                        passenger.seat_number
                      }
                    </span>

                    <strong>
                      {seatFare !==
                      null
                        ? formatCurrency(
                            seatFare
                          )
                        : "Included"}
                    </strong>
                  </div>
                );
              }
            )}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 12,
                marginTop: 13,
                paddingTop: 15,
                borderTop:
                  "2px solid #dbe8f8",
              }}
            >
              <div>
                <strong
                  style={{
                    display:
                      "block",
                    fontSize: 18,
                  }}
                >
                  Total Fare
                </strong>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  {passengers.length}{" "}
                  Passenger
                  {passengers.length > 1
                    ? "s"
                    : ""}
                  {" • "}
                  {
                    passengers.length
                  }{" "}
                  Seat
                  {passengers.length > 1
                    ? "s"
                    : ""}
                </small>
              </div>

              <strong
                style={{
                  color: "#d62828",
                  fontSize: 25,
                }}
              >
                {formatCurrency(
                  calculatedFare
                )}
              </strong>
            </div>
          </section>

          <label
            style={{
              display: "flex",
              gap: 11,
              alignItems:
                "flex-start",
              padding: 16,
              borderRadius: 14,
              marginBottom: 15,
              background:
                errors.confirmed
                  ? "#fff1f2"
                  : "#f8fafc",
              border:
                errors.confirmed
                  ? "1px solid #fda4af"
                  : "1px solid #dbe3ed",
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(
                event
              ) => {
                setConfirmed(
                  event.target
                    .checked
                );

                setErrors(
                  (current) => {
                    const next = {
                      ...current,
                    };

                    delete next.confirmed;

                    return next;
                  }
                );
              }}
              style={{
                width: 19,
                height: 19,
                marginTop: 1,
              }}
            />

            <span>
              मैंने यात्री नाम, उम्र, gender, seat और यात्रा विवरण जाँच लिया है।
            </span>
          </label>

          {errors.confirmed && (
            <small
              style={{
                display: "block",
                margin:
                  "-7px 0 14px",
                color: "#dc2626",
              }}
            >
              {errors.confirmed}
            </small>
          )}

          {message && (
            <div
              style={{
                padding: 13,
                borderRadius: 10,
                marginBottom: 14,
                color: "#991b1b",
                background:
                  "#fef2f2",
                border:
                  "1px solid #fecaca",
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(150px,.42fr) minmax(220px,1fr)",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              disabled={loading}
              style={{
                padding: 15,
                borderRadius: 11,
                border:
                  "1px solid #94a3b8",
                background:
                  "#ffffff",
                color: "#334155",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ← सीट बदलें
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 15,
                border: 0,
                borderRadius: 11,
                background:
                  loading
                    ? "#94a3b8"
                    : "linear-gradient(90deg,#0B3D91,#1565C0)",
                color: "#ffffff",
                fontSize: 17,
                fontWeight: 900,
                cursor:
                  loading
                    ? "wait"
                    : "pointer",
                boxShadow:
                  "0 10px 22px rgba(11,61,145,.20)",
              }}
            >
              {loading
                ? "Booking बन रही है..."
                : `${formatCurrency(
                    calculatedFare
                  )} का भुगतान करें`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Passenger;
