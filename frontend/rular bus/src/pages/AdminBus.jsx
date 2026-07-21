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
  rto_approved_seats: "",
  physical_seats: "",
  registration_number: "",
  operator_name: "",
  bus_status: "Active",
  is_ac: false,
  is_sleeper: false,
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
  [e.target.name]:
    e.target.type === "checkbox"
      ? e.target.checked
      : e.target.value,
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
     console.log("FORM DATA:", form);
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  ...form,
  rto_approved_seats: Number(form.rto_approved_seats || 0),
  physical_seats: Number(form.physical_seats || 0),
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
  rto_approved_seats: "",
physical_seats: "",
  registration_number: "",
  operator_name: "",
  bus_status: "Active",
  is_ac: false,
  is_sleeper: false,
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
  rto_approved_seats: bus.rto_approved_seats || "",
physical_seats: bus.physical_seats || "",
registration_number: bus.registration_number || "",
  operator_name: bus.operator_name,
  bus_status: bus.bus_status,
  is_ac: bus.is_ac,
  is_sleeper: bus.is_sleeper,
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
  key: "rto_approved_seats",
  title: "RTO Approved",
},
{
  key: "physical_seats",
  title: "Physical Seats",
},
{
  key: "registration_number",
  title: "Registration No",
},
{
  key: "operator_name",
  title: "Operator",
},
{
  key: "bus_status",
  title: "Status",
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
<RBButton
  variant="primary"
  onClick={() => window.location.href = `/admin/seat-layout/${bus.id}`}
  style={{ marginLeft: 8 }}
>
  Design Layout
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

        <select
  name="bus_type"
  value={form.bus_type}
  onChange={handleChange}
  style={{
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  }}
>
  <option value="">Select Bus Type</option>
  <option value="Seater">Seater</option>
  <option value="Sleeper">Sleeper</option>
  <option value="Semi Sleeper">Semi Sleeper</option>
</select>



<RBInput
  type="number"
  name="rto_approved_seats"
  placeholder="RTO Approved Seats"
  value={form.rto_approved_seats}
  onChange={handleChange}
/>

<RBInput
  type="number"
  name="physical_seats"
  placeholder="Physical Seats"
  value={form.physical_seats}
  onChange={handleChange}
/>

         

<RBInput
  name="registration_number"
  placeholder="Registration Number"
  value={form.registration_number}
  onChange={handleChange}
/>

<RBInput
  name="operator_name"
  placeholder="Operator Name"
  value={form.operator_name}
  onChange={handleChange}
/>

<RBInput
  name="bus_status"
  placeholder="Bus Status (Active/Inactive)"
  value={form.bus_status}
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

