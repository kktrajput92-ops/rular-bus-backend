import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminPermission() {
  const [permissions, setPermissions] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);

const [form, setForm] = useState({
  permission_code: "",
  permission_name: "",
  module_name: "",
  description: "",
});
  useEffect(() => {
  loadPermissions();
}, []);

  const loadPermissions = async () => {
    try {
      const res = await api.get("/permissions");
      setPermissions(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
const editPermission = (item) => {
  setEditingId(item.id);

  setForm({
    permission_code: item.permission_code || "",
    permission_name: item.permission_name || "",
    module_name: item.module_name || "",
    description: item.description || "",
  });

  setShowForm(true);
};

const savePermission = async () => {
  try {
    const payload = {
      permission_code: form.permission_code,
      permission_name: form.permission_name,
      module_name: form.module_name,
      description: form.description,
    };

    if (editingId) {
      await api.put(`/permissions/${editingId}`, payload);
    } else {
      await api.post("/permissions", payload);
    }

    alert("Permission Saved Successfully");

    setShowForm(false);
    setEditingId(null);

    setForm({
      permission_code: "",
      permission_name: "",
      module_name: "",
      description: "",
    });

    loadPermissions();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to save permission");
  }
};
  return (
    <div style={{ padding: 30 }}>
      <h1>🔑 Permission Management</h1>
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
    placeholder="🔍 Search permission..."
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
        permission_code: "",
        permission_name: "",
        module_name: "",
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
    ➕ Add Permission
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
            <th>Permission Code</th>
            <th>Permission Name</th>
            <th>Module</th>
            <th>Status</th>
             <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {permissions.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.permission_code}</td>
              <td>{item.permission_name}</td>
              <td>{item.module_name}</td>
              <td>{item.status}</td>
<td>
  <button
    onClick={() => editPermission(item)}
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
        {editingId ? "✏️ Edit Permission" : "➕ Add Permission"}
      </h2>

      <input
        placeholder="Permission Code"
        value={form.permission_code}
        onChange={(e) =>
          setForm({ ...form, permission_code: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Permission Name"
        value={form.permission_name}
        onChange={(e) =>
          setForm({ ...form, permission_name: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Module Name"
        value={form.module_name}
        onChange={(e) =>
          setForm({ ...form, module_name: e.target.value })
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

        <button onClick={savePermission}>
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
