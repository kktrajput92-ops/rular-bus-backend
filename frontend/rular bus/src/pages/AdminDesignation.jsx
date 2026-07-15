import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminDesignation() {
  const [designations, setDesignations] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);

const [form, setForm] = useState({
  designation_code: "",
  designation_name: "",
  description: "",
});
  useEffect(() => {
    loadDesignations();
  }, []);

  const loadDesignations = async () => {
    try {
      const res = await api.get("/designations");
      setDesignations(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
const editDesignation = (item) => {
  setEditingId(item.id);

  setForm({
    designation_code: item.designation_code || "",
    designation_name: item.designation_name || "",
    description: item.description || "",
  });

  setShowForm(true);
};

const saveDesignation = async () => {
  try {
    const payload = {
      company_id: 1,
      department_id: 1,
      designation_code: form.designation_code,
      designation_name: form.designation_name,
      description: form.description,
    };

    if (editingId) {
      await api.put(`/designations/${editingId}`, payload);
    } else {
      await api.post("/designations", payload);
    }

    alert("Designation Saved Successfully");

    setShowForm(false);
    setEditingId(null);

    setForm({
      designation_code: "",
      designation_name: "",
      description: "",
    });

    loadDesignations();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to save designation");
  }
};
  return (
    <div style={{ padding: 30 }}>
      <h1>🏷️ Designation Management</h1>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "20px 0",
  }}
>
  <input
    type="text"
    placeholder="🔍 Search designation..."
    style={{
      width: "320px",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #ccc",
    }}
  />

  <button
    onClick={() => {
      setEditingId(null);

      setForm({
        designation_code: "",
        designation_name: "",
        description: "",
      });

      setShowForm(true);
    }}
    style={{
      background: "#198754",
      color: "#fff",
      border: "none",
      padding: "10px 18px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    ➕ Add Designation
  </button>
</div>
      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Designation Code</th>
            <th>Designation Name</th>
            <th>Status</th>
             <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {designations.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.designation_code}</td>
              <td>{item.designation_name}</td>
              <td>{item.status}</td>
<td>
  <button
    onClick={() => editDesignation(item)}
    style={{ marginRight: 8 }}
  >
    ✏️ Edit
  </button>

  <button>
    🗑 Delete
  </button>
</td>
            </tr>
          ))}
        </tbody>
      </table>
{showForm && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: 25,
        borderRadius: 12,
        width: 500,
      }}
    >
      <h2>
        {editingId ? "✏️ Edit Designation" : "➕ Add Designation"}
      </h2>

      <input
        placeholder="Designation Code"
        value={form.designation_code}
        onChange={(e) =>
          setForm({ ...form, designation_code: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Designation Name"
        value={form.designation_name}
        onChange={(e) =>
          setForm({ ...form, designation_name: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        style={{
          width: "100%",
          padding: 10,
          marginTop: 10,
          height: 90,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button onClick={() => setShowForm(false)}>
          Cancel
        </button>

        <button onClick={saveDesignation}>
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
