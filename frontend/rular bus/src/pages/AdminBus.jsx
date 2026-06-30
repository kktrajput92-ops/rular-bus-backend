import { useEffect, useState } from "react";
import { API_BASE } from "../api/api";

function AdminBus() {

  const API = `${API_BASE}/buses`;

  const [buses, setBuses] = useState([]);

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

  const addBus = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(API, {
        method: "POST",
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
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚌 Bus Management</h2>

      <form onSubmit={addBus}>
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

        <button type="submit">
          Add Bus
        </button>

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
          </tr>
        </thead>

        <tbody>
          {buses.length === 0 ? (

            <tr>
              <td colSpan="5">No Buses Found</td>
            </tr>

          ) : (

            buses.map((bus) => (

              <tr key={bus.id}>
                <td>{bus.id}</td>
                <td>{bus.bus_name}</td>
                <td>{bus.bus_number}</td>
                <td>{bus.bus_type}</td>
                <td>{bus.total_seats}</td>
              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}

export default AdminBus;
