import { useEffect, useState } from "react";
import { API_BASE } from "../api/api";

function AdminBus() {

  const API = `${API_BASE}/buses`;

  const [buses, setBuses] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

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

      console.error(err);

    }

  };

  useEffect(() => {

    loadBuses();

  }, []);

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

      console.error(err);

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

      console.error(err);

    }

  };

  return (

    <div style={{ padding: "20px" }}>

      <h2>🚌 Bus Management</h2>

      <form onSubmit={saveBus}>
        <input
          type="text"
          name="bus_name"
          placeholder="Bus Name"
          value={form.bus_name}
          onChange={handleChange}
          required
        />

        <br /><br />

        <input
          type="text"
          name="bus_number"
          placeholder="Bus Number"
          value={form.bus_number}
          onChange={handleChange}
          required
        />

        <br /><br />

        <input
          type="text"
          name="bus_type"
          placeholder="Bus Type"
          value={form.bus_type}
          onChange={handleChange}
          required
        />

        <br /><br />

        <input
          type="number"
          name="total_seats"
          placeholder="Total Seats"
          value={form.total_seats}
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
            ? "Update Bus"
            : "Add Bus"}
        </button>

        {editingId && (

          <button
            type="button"
            onClick={() => {

              setEditingId(null);

              setForm({

                bus_name: "",

                bus_number: "",

                bus_type: "",

                total_seats: "",

              });

            }}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>

        )}

      </form>

      <hr />

      <h3>Bus List</h3>

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

            <th>Bus Name</th>

            <th>Bus Number</th>

            <th>Type</th>

            <th>Total Seats</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>
          {buses.length === 0 ? (

            <tr>
              <td colSpan="6">No Buses Found</td>
            </tr>

          ) : (

            buses.map((bus) => (

              <tr key={bus.id}>

                <td>{bus.id}</td>

                <td>{bus.bus_name}</td>

                <td>{bus.bus_number}</td>

                <td>{bus.bus_type}</td>

                <td>{bus.total_seats}</td>

                <td>

                  <button
                    onClick={() => editBus(bus)}
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
                    onClick={() => deleteBus(bus.id)}
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

export default AdminBus;

