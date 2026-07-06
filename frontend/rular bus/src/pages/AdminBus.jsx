import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../api/api";

function AdminBus() {

  const API = `${API_BASE}/buses`;

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    bus_name: "",
    bus_number: "",
    bus_type: "",
    total_seats: "",
  });

  const loadBuses = async () => {

    try {

      const res = await fetch(API);
      const data = await res.json();

      setBuses(data.buses || []);

    } catch (err) {

      console.log(err);

    }

  };

  useEffect(() => {

    loadBuses();

  }, []);

  const filteredBuses = useMemo(() => {

    return buses.filter((bus) => {

      const text =
        `${bus.bus_name} ${bus.bus_number} ${bus.bus_type}`
          .toLowerCase();

      return text.includes(search.toLowerCase());

    });

  }, [buses, search]);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };
  const saveBus = async (e) => {

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
          ...form,
          total_seats: Number(form.total_seats),
        }),
      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        setEditingId(null);

        setForm({
          bus_name: "",
          bus_number: "",
          bus_type: "",
          total_seats: "",
        });

        loadBuses();

      }

    } catch (err) {

      console.log(err);

    }

    setLoading(false);

  };

  const editBus = (bus) => {

    setEditingId(bus.id);

    setForm({
      bus_name: bus.bus_name,
      bus_number: bus.bus_number,
      bus_type: bus.bus_type,
      total_seats: bus.total_seats,
    });

  };

  const deleteBus = async (id) => {

    if (!window.confirm("Delete this bus?")) return;
    try {

      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        loadBuses();

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
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >

        <div>

          <h1 style={{ margin: 0, color: "#0B3D91" }}>
            🚍 Fleet Management
          </h1>

          <p style={{ color: "#666" }}>
            Rular Bus Admin ERP
          </p>

        </div>

        <input
          type="text"
          placeholder="Search Bus..."
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
        onSubmit={saveBus}
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
            name="bus_name"
            placeholder="Bus Name"
            value={form.bus_name}
            onChange={handleChange}
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}
          />

          <input
            name="bus_number"
            placeholder="Bus Number"
            value={form.bus_number}
            onChange={handleChange}
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}  
        />

          <input
            name="bus_type"
            placeholder="Bus Type"
            value={form.bus_type}
            onChange={handleChange}
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}
          />

          <input
            type="number"
            name="total_seats"
            placeholder="Total Seats"
            value={form.total_seats}
            onChange={handleChange}
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
          {editingId ? "Update Bus" : "Add Bus"}
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
              <th>Bus Name</th>
              <th>Bus Number</th>
              <th>Type</th>
              <th>Total Seats</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredBuses.length === 0 ? (

              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "25px",
                  }}
                >
                  No Bus Found
                </td>
              </tr>

            ) : (

              filteredBuses.map((bus) => (

                <tr
                  key={bus.id}
                  style={{
                    borderBottom: "1px solid #eee",
                  }}
                >

                  <td style={{ padding: "14px" }}>{bus.id}</td>
                  <td>{bus.bus_name}</td>
                  <td>{bus.bus_number}</td>
                  <td>{bus.bus_type}</td>
                  <td>{bus.total_seats}</td>

                  <td>
                    <button
                      onClick={() => editBus(bus)}
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
                      onClick={() => deleteBus(bus.id)}
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

export default AdminBus;

