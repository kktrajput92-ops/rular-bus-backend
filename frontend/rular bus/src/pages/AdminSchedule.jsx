import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../api/api";

const EMPTY_FORM = {
  bus_id: "",
  route_id: "",
  departure_time: "",
  arrival_time: "",
};

const calculateDurationMinutes = (
  departureValue,
  arrivalValue
) => {
  if (!departureValue || !arrivalValue) {
    return null;
  }

  const departure = new Date(departureValue);
  const arrival = new Date(arrivalValue);

  if (
    Number.isNaN(departure.getTime()) ||
    Number.isNaN(arrival.getTime())
  ) {
    return null;
  }

  const minutes = Math.round(
    (arrival.getTime() - departure.getTime()) /
      60000
  );

  return minutes > 0 ? minutes : null;
};

const formatDuration = (value) => {
  const totalMinutes = Number(value);

  if (
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return "Invalid timing";
  }

  const days = Math.floor(
    totalMinutes / 1440
  );

  const remainingMinutes =
    totalMinutes % 1440;

  const hours = Math.floor(
    remainingMinutes / 60
  );

  const minutes =
    remainingMinutes % 60;

  const parts = [];

  if (days) {
    parts.push(`${days} दिन`);
  }

  if (hours) {
    parts.push(`${hours} घंटे`);
  }

  if (minutes) {
    parts.push(`${minutes} मिनट`);
  }

  return parts.join(" ");
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateTimeLocal = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
};

const arrivesOnNextDay = (
  departureValue,
  arrivalValue
) => {
  if (!departureValue || !arrivalValue) {
    return false;
  }

  const departure = new Date(departureValue);
  const arrival = new Date(arrivalValue);

  if (
    Number.isNaN(departure.getTime()) ||
    Number.isNaN(arrival.getTime())
  ) {
    return false;
  }

  return (
    departure.getFullYear() !==
      arrival.getFullYear() ||
    departure.getMonth() !==
      arrival.getMonth() ||
    departure.getDate() !==
      arrival.getDate()
  );
};

function AdminSchedule() {
  const API = `${API_BASE}/schedules`;
  const BUS_API = `${API_BASE}/buses`;
  const ROUTE_API = `${API_BASE}/routes`;

  const [buses, setBuses] =
    useState([]);

  const [routes, setRoutes] =
    useState([]);

  const [schedules, setSchedules] =
    useState([]);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [form, setForm] =
    useState(EMPTY_FORM);

  const durationMinutes = useMemo(
    () =>
      calculateDurationMinutes(
        form.departure_time,
        form.arrival_time
      ),
    [
      form.departure_time,
      form.arrival_time,
    ]
  );

  const nextDayArrival = useMemo(
    () =>
      arrivesOnNextDay(
        form.departure_time,
        form.arrival_time
      ),
    [
      form.departure_time,
      form.arrival_time,
    ]
  );

  const selectedRoute = useMemo(
    () =>
      routes.find(
        (route) =>
          String(route.id) ===
          String(form.route_id)
      ) || null,
    [routes, form.route_id]
  );

  const loadData = async () => {
    try {
      const [
        busResponse,
        routeResponse,
        scheduleResponse,
      ] = await Promise.all([
        fetch(BUS_API),
        fetch(ROUTE_API),
        fetch(API),
      ]);

      const [
        busData,
        routeData,
        scheduleData,
      ] = await Promise.all([
        busResponse.json(),
        routeResponse.json(),
        scheduleResponse.json(),
      ]);

      setBuses(busData.buses || []);
      setRoutes(routeData.routes || []);
      setSchedules(
        scheduleData.schedules || []
      );
    } catch (error) {
      console.error(
        "Schedule data load failed:",
        error
      );

      setMessage(
        "Schedule data load नहीं हो सका।"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        const searchableText = [
          schedule.bus_name,
          schedule.bus_number,
          schedule.source,
          schedule.destination,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          search.toLowerCase()
        );
      }),
    [schedules, search]
  );

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage("");
  };

  const saveSchedule = async (event) => {
    event.preventDefault();

    if (!durationMinutes) {
      setMessage(
        "Arrival date-time, departure date-time के बाद होना चाहिए।"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const method = editingId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          bus_id: Number(form.bus_id),
          route_id: Number(form.route_id),
          departure_time:
            form.departure_time,
          arrival_time:
            form.arrival_time,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Schedule save failed."
        );
      }

      setMessage(
        editingId
          ? "Schedule successfully update हुआ।"
          : "Schedule successfully add हुआ।"
      );

      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadData();
    } catch (error) {
      console.error(
        "Schedule save failed:",
        error
      );

      setMessage(
        error.message ||
          "Schedule save नहीं हो सका।"
      );
    } finally {
      setLoading(false);
    }
  };

  const editSchedule = (schedule) => {
    setEditingId(schedule.id);

    setForm({
      bus_id: String(
        schedule.bus_id || ""
      ),
      route_id: String(
        schedule.route_id || ""
      ),
      departure_time:
        toDateTimeLocal(
          schedule.departure_time
        ),
      arrival_time:
        toDateTimeLocal(
          schedule.arrival_time
        ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteSchedule = async (id) => {
    if (
      !window.confirm(
        "Delete this schedule?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Delete failed."
        );
      }

      setMessage(
        "Schedule delete हो गया।"
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Schedule delete नहीं हो सका।"
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--erp-bg)",
        padding: "30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color:
                "var(--erp-heading)",
            }}
          >
            🕒 Schedule Management
          </h1>

          <p
            style={{
              color:
                "var(--erp-text-muted)",
            }}
          >
            Rular Bus Admin ERP
          </p>
        </div>

        <input
          type="search"
          placeholder="Search Schedule..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          style={{
            padding: "12px",
            width: "300px",
            maxWidth: "100%",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
            outline: "none",
          }}
        />
      </div>

      <form
        onSubmit={saveSchedule}
        style={{
          background:
            "var(--erp-surface)",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "25px",
          boxShadow:
            "0 4px 10px rgba(0,0,0,.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                fontWeight: 800,
              }}
            >
              Bus
            </span>

            <select
              name="bus_id"
              value={form.bus_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <option value="">
                Select Bus
              </option>

              {buses.map((bus) => (
                <option
                  key={bus.id}
                  value={bus.id}
                >
                  {bus.bus_name}
                  {" ("}
                  {bus.bus_number}
                  {")"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                fontWeight: 800,
              }}
            >
              Route
            </span>

            <select
              name="route_id"
              value={form.route_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <option value="">
                Select Route
              </option>

              {routes.map((route) => (
                <option
                  key={route.id}
                  value={route.id}
                >
                  {route.source}
                  {" → "}
                  {route.destination}
                </option>
              ))}
            </select>
          </label>

          <h3
            style={{
              gridColumn: "1 / -1",
              margin: "10px 0 5px",
              color:
                "var(--erp-heading)",
            }}
          >
            📅 Schedule Details
          </h3>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                fontWeight: 800,
              }}
            >
              Departure Date & Time
            </span>

            <input
              type="datetime-local"
              name="departure_time"
              value={
                form.departure_time
              }
              onChange={handleChange}
              required
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
                padding: "12px",
                border:
                  "1px solid #ddd",
                borderRadius: "8px",
              }}
            />
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 7,
                fontWeight: 800,
              }}
            >
              Arrival Date & Time
            </span>

            <input
              type="datetime-local"
              name="arrival_time"
              value={form.arrival_time}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
                padding: "12px",
                border:
                  form.arrival_time &&
                  !durationMinutes
                    ? "1px solid #ef4444"
                    : "1px solid #ddd",
                borderRadius: "8px",
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background:
                durationMinutes
                  ? "#ecfdf5"
                  : "#fff7ed",
              border:
                durationMinutes
                  ? "1px solid #86efac"
                  : "1px solid #fdba74",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Auto Calculated Duration
            </span>

            <strong
              style={{
                display: "block",
                marginTop: 5,
                fontSize: 19,
              }}
            >
              {durationMinutes
                ? formatDuration(
                    durationMinutes
                  )
                : "Timing select करें"}
            </strong>

            {nextDayArrival && (
              <small
                style={{
                  display:
                    "inline-flex",
                  marginTop: 7,
                  padding: "4px 8px",
                  borderRadius: 999,
                  color: "#9a3412",
                  background:
                    "#ffedd5",
                  fontWeight: 800,
                }}
              >
                अगले दिन आगमन
              </small>
            )}
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "#eff6ff",
              border:
                "1px solid #93c5fd",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Route Information
            </span>

            <strong
              style={{
                display: "block",
                marginTop: 5,
              }}
            >
              {selectedRoute
                ? `${selectedRoute.source} → ${selectedRoute.destination}`
                : "Route select करें"}
            </strong>

            {selectedRoute && (
              <small
                style={{
                  display: "block",
                  marginTop: 6,
                  color: "#52647e",
                }}
              >
                {selectedRoute.distance_km
                  ? `${selectedRoute.distance_km} KM`
                  : "Distance unavailable"}
                {" • "}
                {selectedRoute.estimated_time ||
                  "Estimate unavailable"}
              </small>
            )}
          </div>
        </div>

        {message && (
          <div
            style={{
              marginTop: 14,
              padding: 11,
              borderRadius: 8,
              background: "#eef5ff",
              border:
                "1px solid #9dc3ff",
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            type="submit"
            disabled={
              loading ||
              !durationMinutes
            }
            style={{
              flex: 1,
              minWidth: 210,
              padding: "14px",
              background:
                durationMinutes
                  ? "#0B3D91"
                  : "#94a3b8",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                durationMinutes
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Update Schedule"
              : "Add Schedule"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding:
                  "14px 20px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#ffffff",
                fontWeight: 800,
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          background:
            "var(--erp-surface)",
          borderRadius: "10px",
          overflowX: "auto",
          boxShadow:
            "0 4px 10px rgba(0,0,0,.08)",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 900,
            borderCollapse:
              "collapse",
          }}
        >
          <thead
            style={{
              background: "#0B3D91",
              color: "#fff",
            }}
          >
            <tr>
              <th>ID</th>
              <th>Bus</th>
              <th>Route</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSchedules.length ===
            0 ? (
              <tr>
                <td colSpan="7">
                  No Schedules Found
                </td>
              </tr>
            ) : (
              filteredSchedules.map(
                (schedule) => {
                  const validDuration =
                    Number(
                      schedule.duration_minutes
                    );

                  return (
                    <tr
                      key={schedule.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <td>{schedule.id}</td>

                      <td>
                        {schedule.bus_name}
                        <br />
                        <small>
                          {schedule.bus_number}
                        </small>
                      </td>

                      <td>
                        {schedule.source}
                        {" → "}
                        {schedule.destination}
                      </td>

                      <td>
                        {formatDateTime(
                          schedule.departure_time
                        )}
                      </td>

                      <td>
                        {formatDateTime(
                          schedule.arrival_time
                        )}

                        {schedule.arrives_next_day && (
                          <>
                            <br />
                            <small
                              style={{
                                color:
                                  "#c2410c",
                                fontWeight:
                                  800,
                              }}
                            >
                              अगले दिन
                            </small>
                          </>
                        )}
                      </td>

                      <td
                        style={{
                          color:
                            validDuration >
                            0
                              ? "#166534"
                              : "#b91c1c",
                          fontWeight: 800,
                        }}
                      >
                        {validDuration > 0
                          ? formatDuration(
                              validDuration
                            )
                          : "Invalid timing"}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            editSchedule(
                              schedule
                            )
                          }
                          style={{
                            marginRight:
                              "8px",
                            background:
                              "#0d6efd",
                            color: "#fff",
                            border: "none",
                            padding:
                              "6px 10px",
                            borderRadius:
                              "5px",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteSchedule(
                              schedule.id
                            )
                          }
                          style={{
                            background:
                              "#dc3545",
                            color: "#fff",
                            border: "none",
                            padding:
                              "6px 10px",
                            borderRadius:
                              "5px",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminSchedule;
