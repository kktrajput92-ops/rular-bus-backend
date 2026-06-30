import { useEffect, useState } from "react";
import { API_BASE } from "../api/api";

function AdminSchedule() {

  const API = `${API_BASE}/schedules`;
  const BUS_API = `${API_BASE}/buses`;
  const ROUTE_API = `${API_BASE}/routes`;

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    bus_id: "",
    route_id: "",
    departure_time: "",
    arrival_time: "",
  });

  const loadData = async () => {

    try {

      const [busRes, routeRes, scheduleRes] =
        await Promise.all([
          fetch(BUS_API),
          fetch(ROUTE_API),
          fetch(API),
        ]);

      const busData = await busRes.json();
      const routeData = await routeRes.json();
      const scheduleData = await scheduleRes.json();

      setBuses(busData.buses || []);
      setRoutes(routeData.routes || []);
      setSchedules(scheduleData.schedules || []);

    } catch (err) {

      console.error(err);

    }

  };

  useEffect(() => {

    loadData();

  }, []);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const saveSchedule = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const url = editingId
        ? `${API}/${editingId}`
        : API;

      const method = editingId
        ? "PUT"
        : "POST";

      const res = await fetch(url, {

        method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          bus_id: Number(form.bus_id),

          route_id: Number(form.route_id),

          departure_time: form.departure_time,

          arrival_time: form.arrival_time,

        }),

      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        setEditingId(null);

        setForm({

          bus_id: "",

          route_id: "",

          departure_time: "",

          arrival_time: "",

        });

        loadData();

      }

    } catch (err) {

      console.error(err);

    }

    setLoading(false);

  };

  const editSchedule = (schedule) => {

    setEditingId(schedule.id);

    setForm({

      bus_id: schedule.bus_id,

      route_id: schedule.route_id,

      departure_time: schedule.departure_time.slice(0,16),

      arrival_time: schedule.arrival_time.slice(0,16),

    });

  };

  const deleteSchedule = async (id) => {

    if (!window.confirm("Delete this schedule?")) return;

    try {

      const res = await fetch(`${API}/${id}`, {

        method: "DELETE",

      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        loadData();

      }

    } catch (err) {

      console.error(err);

    }

  };

  return (

    <div style={{ padding: "20px" }}>

      <h2>🕒 Schedule Management</h2>

      <form onSubmit={saveSchedule}>
        <select
          name="bus_id"
          value={form.bus_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Bus</option>

          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.bus_name} ({bus.bus_number})
            </option>
          ))}

        </select>

        <br /><br />

        <select
          name="route_id"
          value={form.route_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Route</option>

          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.source} → {route.destination}
            </option>
          ))}

        </select>

        <br /><br />

        <input
          type="datetime-local"
          name="departure_time"
          value={form.departure_time}
          onChange={handleChange}
          required
        />

        <br /><br />

        <input
          type="datetime-local"
          name="arrival_time"
          value={form.arrival_time}
          onChange={handleChange}
          required
        />

        <br /><br />

        <button
          type="submit"
          disabled={loading}
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
            onClick={() => {

              setEditingId(null);

              setForm({

                bus_id: "",

                route_id: "",

                departure_time: "",

                arrival_time: "",

              });

            }}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>

        )}

      </form>

      <hr />

      <h3>Schedule List</h3>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >

        <thead>

          <tr>

            <th>ID</th>

            <th>Bus</th>

            <th>Route</th>

            <th>Departure</th>

            <th>Arrival</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>
          {schedules.length === 0 ? (

            <tr>
              <td colSpan="6">No Schedules Found</td>
            </tr>

          ) : (

            schedules.map((schedule) => (

              <tr key={schedule.id}>

                <td>{schedule.id}</td>

                <td>
                  {schedule.bus_name}
                  <br />
                  <small>{schedule.bus_number}</small>
                </td>

                <td>
                  {schedule.source} → {schedule.destination}
                </td>

                <td>
                  {new Date(schedule.departure_time).toLocaleString()}
                </td>

                <td>
                  {new Date(schedule.arrival_time).toLocaleString()}
                </td>

                <td>

                  <button
                    onClick={() => editSchedule(schedule)}
                    style={{
                      marginRight: "8px",
                      background: "#0d6efd",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    style={{
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}

export default AdminSchedule;
