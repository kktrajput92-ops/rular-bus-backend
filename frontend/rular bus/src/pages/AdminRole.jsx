import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminRole() {
  const [roles, setRoles] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);

const [form, setForm] = useState({
  role_code: "",
  role_name: "",
  description: "",
});
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
const editRole = (item) => {
  setEditingId(item.id);

  setForm({
    role_code: item.role_code || "",
    role_name: item.role_name || "",
    description: item.description || "",
  });

  setShowForm(true);
};

const saveRole = async () => {
  try {
    const payload = {
      role_code: form.role_code,
      role_name: form.role_name,
      description: form.description,
    };

    if (editingId) {
      await api.put(`/roles/${editingId}`, payload);
    } else {
      await api.post("/roles", payload);
    }

    alert("Role Saved Successfully");

    setShowForm(false);
    setEditingId(null);

    setForm({
      role_code: "",
      role_name: "",
      description: "",
    });

    loadRoles();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to save role");
  }
};
  return (
    <div style={{ padding: 30 }}>
      <h1>🔐 Role Management</h1>
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
    placeholder="🔍 Search role..."
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
        role_code: "",
        role_name: "",
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
    ➕ Add Role
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
            <th>Role Code</th>
            <th>Role Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {roles.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.role_code}</td>
              <td>{item.role_name}</td>
              <td>{item.status}</td>
<td>
  <button
    onClick={() => editRole(item)}
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
        {editingId ? "✏️ Edit Role" : "➕ Add Role"}
      </h2>

      <input
        placeholder="Role Code"
        value={form.role_code}
        onChange={(e) =>
          setForm({ ...form, role_code: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Role Name"
        value={form.role_name}
        onChange={(e) =>
          setForm({ ...form, role_name: e.target.value })
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

        <button onClick={saveRole}>
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

