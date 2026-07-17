import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBInput,
  RBTable,
} from "../rds/components";
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


const columns = [
  {
    key: "bus_name",
    title: "Bus Name",
  },
  {
    key: "bus_number",
    title: "Bus Number",
  },
  {
    key: "bus_type",
    title: "Bus Type",
  },
  {
    key: "total_seats",
    title: "Seats",
  },
  {
    key: "actions",
    title: "Actions",
    render: (bus) => (
      <>
        <RBButton
          variant="secondary"
          onClick={() => editBus(bus)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton
          variant="danger"
          onClick={() => deleteBus(bus.id)}
        >
          Delete
        </RBButton>
      </>
    ),
  },  
];

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

        <RBInput
  placeholder="Search Bus..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
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

          <RBInput
  name="bus_name"
  placeholder="Bus Name"
  value={form.bus_name}
  onChange={handleChange}
/>

          <RBInput
  name="bus_number"
  placeholder="Bus Number"
  value={form.bus_number}
  onChange={handleChange}
/>

         <RBInput
  name="bus_type"
  placeholder="Bus Type"
  value={form.bus_type}
  onChange={handleChange}
/>

          <RBInput
  type="number"
  name="total_seats"
  placeholder="Total Seats"
  value={form.total_seats}
  onChange={handleChange}
/>

        </div>

       <RBButton
  type="submit"
  variant="primary"
  disabled={loading}
  style={{ width: "100%", marginTop: 20 }}
>
  {editingId ? "Update Bus" : "Add Bus"}
</RBButton>
           </form>
      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 4px 10px rgba(0,0,0,.08)",
        }}
      >

      {filteredBuses.length === 0 ? (
  <div
    style={{
      padding: "25px",
      textAlign: "center",
      background: "#fff",
      borderRadius: "10px",
    }}
  >
    No Bus Found
  </div>
) : (
  <RBTable
    columns={columns}
    data={filteredBuses}
  />
)}
      </div>

    </div>

  );

}

export default AdminBus;

