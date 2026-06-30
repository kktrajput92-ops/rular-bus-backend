import { useEffect, useState } from "react";
import { API_BASE } from "../api/api";

function AdminRoute() {

  const API = `${API_BASE}/routes`;

  const [routes, setRoutes] = useState([]);

  const [form, setForm] = useState({
    source: "",
    destination: "",
    distance_km: "",
    estimated_time: "",
  });

  const loadRoutes = async () => {

    try {

      const res = await fetch(API);

      const data = await res.json();

      setRoutes(data.routes || []);

    } catch (err) {

      console.error(err);

    }

  };

  useEffect(() => {

    loadRoutes();

  }, []);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const addRoute = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: form.source,
          destination: form.destination,
          distance_km: Number(form.distance_km),
          estimated_time: form.estimated_time,
        }),
      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        setForm({
          source: "",
          destination: "",
          distance_km: "",
          estimated_time: "",
        });

        loadRoutes();

      }

    } catch (err) {

      console.error(err);

    }

  };

  return (

    <div style={{ padding: "20px" }}>

      <h2>🛣 Route Management</h2>

      <form onSubmit={addRoute}>
        <input
          type="text"
          name="source"
          placeholder="Source"
          value={form.source}
          onChange={handleChange}
          required
        />

        <br /><br />

        <input
          type="text"
          name="destination"
          placeholder="Destination"
          value={form.destination}
          onChange={handleChange}
          required
        />

        <br /><br />

        <input
          type="number"
          name="distance_km"
          placeholder="Distance (KM)"
          value={form.distance_km}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="text"
          name="estimated_time"
          placeholder="Estimated Time (HH:MM)"
          value={form.estimated_time}
          onChange={handleChange}
        />

        <br /><br />

        <button type="submit">
          Add Route
        </button>

      </form>

      <hr />

      <h3>Route List</h3>

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
            <th>Source</th>
            <th>Destination</th>
            <th>Distance</th>
            <th>Estimated Time</th>
          </tr>
        </thead>

        <tbody>
          {routes.length === 0 ? (

            <tr>
              <td colSpan="5">No Routes Found</td>
            </tr>

          ) : (

            routes.map((route) => (

              <tr key={route.id}>
                <td>{route.id}</td>
                <td>{route.source}</td>
                <td>{route.destination}</td>
                <td>{route.distance_km} KM</td>
                <td>{route.estimated_time}</td>
              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}

export default AdminRoute;
