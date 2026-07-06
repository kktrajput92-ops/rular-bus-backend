import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../api/api";

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
            👨‍✈️ Driver Management
          </h1>

          <p style={{ color: "#666" }}>
            Rular Bus Admin ERP
          </p>
          <input
  type="text"
  placeholder="Search Driver..."
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
      </div>   
       <form
        onSubmit={saveDriver}
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
            name="full_name"
            placeholder="Driver Name"
            value={form.full_name}
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
            name="phone"
            placeholder="Phone"
            value={form.phone}
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
            name="license_number"
            placeholder="License Number"
            value={form.license_number}
            onChange={handleChange}
  
style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  outline: "none",
}}        />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
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
          {editingId ? "Update Driver" : "Add Driver"}
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
              <th>Name</th>
              <th>Phone</th>
              <th>License</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredDrivers.length === 0 ? (

              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "25px",
                  }}
                >
                  No Driver Found
                </td>
              </tr>

            ) : (

              filteredDrivers.map((driver) => (

                <tr
                  key={driver.id}
                  style={{
                    borderBottom: "1px solid #eee",
                  }}
                >

                  <td style={{ padding: "14px" }}>{driver.id}</td>
                  <td>{driver.full_name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.license_number}</td>
                  <td>{driver.address}</td>

                  <td>
                    <button
                      onClick={() => editDriver(driver)}
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
                      onClick={() => deleteDriver(driver.id)}
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

export default AdminDriver;

