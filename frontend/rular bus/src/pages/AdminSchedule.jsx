import { useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");

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
const filteredSchedules = useMemo(() => {

  return schedules.filter((schedule) => {

    const text = (
      schedule.bus_name +
      " " +
      schedule.bus_number +
      " " +
      schedule.source +
      " " +
      schedule.destination
    ).toLowerCase();

    return text.includes(search.toLowerCase());

  });

}, [schedules, search]);
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

  <div
    style={{
      minHeight: "100vh",
      background: "#f5f7fa",
      padding: "30px",
    }}
  >

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
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
            color: "#0B3D91",
          }}
        >
          🕒 Schedule Management
        </h1>

        <p
          style={{
            color: "#666",
          }}
        >
          Rular Bus Admin ERP
        </p>

      </div>

      <input
        type="text"
        placeholder="Search Schedule..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "12px",
          width: "300px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          outline: "none",
        }}
      />

    </div>

      <form
  onSubmit={saveSchedule}
  style={{
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "25px",
    boxShadow: "0 4px 10px rgba(0,0,0,.08)",
  }}
>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
  }}
>     
   <select
          name="bus_id"
          value={form.bus_id}
          onChange={handleChange}
          required
         style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
}}
        >
          <option value="">Select Bus</option>

          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.bus_name} ({bus.bus_number})
            </option>
          ))}

        </select>
     

        <select
          name="route_id"
          value={form.route_id}
          onChange={handleChange}
          required
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}
        >
          <option value="">Select Route</option>

          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.source} → {route.destination}
            </option>
          ))}

        </select>
<h3
  style={{
    gridColumn: "1 / -1",
    margin: "10px 0 5px",
    color: "#0B3D91",
  }}
>
  📅 Schedule Details
</h3>
        

        <input
          type="datetime-local"
          name="departure_time"
          value={form.departure_time}
          onChange={handleChange}
          required
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}
        />

       

        <input
          type="datetime-local"
          name="arrival_time"
          value={form.arrival_time}
          onChange={handleChange}
          required
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}
        />

       
         </div>
        <button
          type="submit"
          disabled={loading}
style={{
  marginTop: "20px",
  width: "100%",
  padding: "14px",
  background: "#0B3D91",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
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

   <div
  style={{
    background: "#fff",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,.08)",
  }}
>

<table
  style={{
    width: "100%",
    borderCollapse: "collapse",
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

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>
          {schedules.length === 0 ? (

            <tr>
              <td colSpan="6">No Schedules Found</td>
            </tr>

          ) : (

            filteredSchedules.map((schedule) => (

              <tr
  key={schedule.id}
  style={{
    borderBottom: "1px solid #eee",
  }}
>

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
  </div>
  );

}

export default AdminSchedule;
