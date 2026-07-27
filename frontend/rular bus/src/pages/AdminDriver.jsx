import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../api/api";
import {
  RBButton,
  RBInput,
  RBTable,
} from "../rds/components";
function AdminDriver() {

  const API = `${API_BASE}/drivers`;

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    license_number: "",
    address: "",
  });

  const loadDrivers = async () => {

    try {

      const res = await fetch(API);
      const data = await res.json();

      setDrivers(data.drivers || []);

    } catch (err) {

      console.log(err);

    }

  };

  useEffect(() => {

    loadDrivers();

  }, []);

  const filteredDrivers = useMemo(() => {

    return drivers.filter((driver) => {

      const text =
        `${driver.full_name} ${driver.phone} ${driver.license_number}`
          .toLowerCase();

      return text.includes(search.toLowerCase());

    });

  }, [drivers, search]);
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const saveDriver = async (e) => {

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
        body: JSON.stringify(form),
      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        setEditingId(null);

        setForm({
          full_name: "",
          phone: "",
          license_number: "",
          address: "",
        });

        loadDrivers();

      }

    } catch (err) {

      console.log(err);

    }

    setLoading(false);

  };

  const editDriver = (driver) => {

    setEditingId(driver.id);

    setForm({
      full_name: driver.full_name,
      phone: driver.phone,
      license_number: driver.license_number,
      address: driver.address,
    });

  };
  const deleteDriver = async (id) => {

    if (!window.confirm("Delete this driver?")) return;

    try {

      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {

        loadDrivers();

      }

    } catch (err) {

      console.log(err);

    }

  };

const columns = [
  {
    key: "full_name",
    title: "Name",
  },
  {
    key: "phone",
    title: "Phone",
  },
  {
    key: "license_number",
    title: "License",
  },
  {
    key: "address",
    title: "Address",
  },
  {
    key: "actions",
    title: "Action",
    render: (driver) => (
      <>
        <RBButton
          variant="secondary"
          onClick={() => editDriver(driver)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton
          variant="danger"
          onClick={() => deleteDriver(driver.id)}
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
        background: "var(--erp-bg)",
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

          <h1 style={{ margin: 0, color: "var(--erp-heading)" }}>
            👨‍✈️ Driver Management
          </h1>

          <p style={{ color: "var(--erp-text-muted)" }}>
            Rular Bus Admin ERP
          </p>
          <RBInput
  placeholder="Search Driver..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

      </div>
      </div>   
       <form
        onSubmit={saveDriver}
        style={{
          background: "var(--erp-surface)",
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
  name="driver_name"
  placeholder="Driver Name"
  value={form.driver_name}
  onChange={handleChange}
/>

        <RBInput
  name="phone"
  placeholder="Phone"
  value={form.phone}
  onChange={handleChange}
/>

       <RBInput
  name="license_number"
  placeholder="License Number"
  value={form.license_number}
  onChange={handleChange}
/>

         <RBInput
  name="address"
  placeholder="Address"
  value={form.address}
  onChange={handleChange}
/>

        </div>

        <RBButton
  type="submit"
  variant="primary"
  disabled={loading}
  style={{ width: "100%", marginTop: 20 }}
>
  {editingId ? "Update Driver" : "Add Driver"}
</RBButton>

          

      </form>
      <div
        style={{
          background: "var(--erp-surface)",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 4px 10px rgba(0,0,0,.08)",
        }}
      >

        {filteredDrivers.length === 0 ? (
  <div
    style={{
      padding: "25px",
      textAlign: "center",
      background: "var(--erp-surface)",
      borderRadius: "10px",
    }}
  >
    No Driver Found
  </div>
) : (
  <RBTable
    columns={columns}
    data={filteredDrivers}
  />
)}
         
          
      </div>

    </div>

  );

}

export default AdminDriver;

