import { useEffect, useState } from "react";
import { API_BASE } from "../api/api";

function AdminRoute() {

  const API = `${API_BASE}/routes`;

  const [routes, setRoutes] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

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

  const saveRoute = async (e) => {

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

          source: form.source,

          destination: form.destination,

          distance_km: Number(form.distance_km),

          estimated_time: form.estimated_time,

        }),

      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        setEditingId(null);

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

    setLoading(false);

  };

  const editRoute = (route) => {

    setEditingId(route.id);

    setForm({

      source: route.source,

      destination: route.destination,

      distance_km: route.distance_km,

      estimated_time: route.estimated_time,

    });

  };

  const deleteRoute = async (id) => {

    if (!window.confirm("Delete this route?")) return;

    try {

      const res = await fetch(`${API}/${id}`, {

        method: "DELETE",

      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        loadRoutes();

      }

    } catch (err) {

      console.error(err);

    }

  };

  return (

    <div style={{ padding: "20px" }}>

      <h2>🛣 Route Management</h2>

      <form onSubmit={saveRoute}>
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
          required
        />

        <br /><br />

        <input
          type="text"
          name="estimated_time"
          placeholder="Estimated Time"
          value={form.estimated_time}
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
            ? "Update Route"
            : "Add Route"}
        </button>

        {editingId && (

          <button
            type="button"
            onClick={() => {

              setEditingId(null);

              setForm({

                source: "",

                destination: "",

                distance_km: "",

                estimated_time: "",

              });

            }}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>

        )}

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

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>
          {routes.length === 0 ? (

            <tr>
              <td colSpan="6">No Routes Found</td>
            </tr>

          ) : (

            routes.map((route) => (

              <tr key={route.id}>

                <td>{route.id}</td>

                <td>{route.source}</td>

                <td>{route.destination}</td>

                <td>{route.distance_km} KM</td>

                <td>{route.estimated_time}</td>

                <td>

                  <button
                    onClick={() => editRoute(route)}
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
                    onClick={() => deleteRoute(route.id)}
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

export default AdminRoute;

