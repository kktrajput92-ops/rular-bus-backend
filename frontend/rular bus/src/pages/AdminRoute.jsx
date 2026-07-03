import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../api/api";

function AdminRoute() {

  const API = `${API_BASE}/routes`;

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

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

      console.log(err);

    }

  };

  useEffect(() => {

    loadRoutes();

  }, []);

  const filteredRoutes = useMemo(() => {

    return routes.filter((route) => {

      const text =
        `${route.source} ${route.destination}`
          .toLowerCase();

      return text.includes(search.toLowerCase());

    });

  }, [routes, search]);

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

      console.log(err);

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

      console.log(err);

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

          <h1 style={{ margin: 0, color: "#0B3D91" }}>
            🛣 Route Management
          </h1>

          <p style={{ color: "#666" }}>
            Rular Bus Admin ERP
          </p>

        </div>

        <input
          type="text"
          placeholder="Search Route..."
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
        onSubmit={saveRoute}
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

          <input
            name="source"
            placeholder="Source"
            value={form.source}
            onChange={handleChange}
          />

          <input
            name="destination"
            placeholder="Destination"
            value={form.destination}
            onChange={handleChange}
          />

          <input
            type="number"
            name="distance_km"
            placeholder="Distance (KM)"
            value={form.distance_km}
            onChange={handleChange}
          />

          <input
            name="estimated_time"
            placeholder="Estimated Time"
            value={form.estimated_time}
            onChange={handleChange}
          />

        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {editingId ? "Update Route" : "Add Route"}
        </button>

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
              <th style={{ padding: "14px" }}>ID</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Distance</th>
              <th>Estimated Time</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredRoutes.length === 0 ? (

              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "25px",
                  }}
                >
                  No Route Found
                </td>
              </tr>

            ) : (

              filteredRoutes.map((route) => (

                <tr
                  key={route.id}
                  style={{
                    borderBottom: "1px solid #eee",
                  }}
                >

                  <td style={{ padding: "14px" }}>{route.id}</td>
                  <td>{route.source}</td>
                  <td>{route.destination}</td>
                  <td>{route.distance_km} KM</td>
                  <td>{route.estimated_time}</td>

                  <td>
                    <button
                      onClick={() => editRoute(route)}
                      style={{
                        background: "#0B3D91",
                        color: "#fff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "10px",
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteRoute(route.id)}
                      style={{
                        background: "#D62828",
                        color: "#fff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "6px",
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

export default AdminRoute;


