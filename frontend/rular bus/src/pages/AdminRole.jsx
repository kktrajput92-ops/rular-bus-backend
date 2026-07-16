import { useEffect, useState } from "react";
import api from "../api/api";
import {
  RBButton,
  RBInput,
  RBBadge,
  RBTable,
} from "../rds/components";
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
const deleteRole = async (id) => {
  if (!window.confirm("Delete this role?")) return;

  try {
    await api.delete(`/roles/${id}`);
    loadRoles();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to delete role");
  }
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
const columns = [
  { key: "id", title: "ID" },
  { key: "role_code", title: "Role Code" },
  { key: "role_name", title: "Role Name" },
  {
    key: "status",
    title: "Status",
    render: (item) => (
      <RBBadge
        variant={
          item.status === "ACTIVE"
            ? "success"
            : item.status === "INACTIVE"
            ? "warning"
            : "danger"
        }
      >
        {item.status}
      </RBBadge>
    ),
  },
  {
    key: "actions",
    title: "Actions",
    render: (item) => (
      <>
        <RBButton
          variant="secondary"
          onClick={() => editRole(item)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton
          variant="danger"
          onClick={() => deleteRole(item.id)}
        >
          Delete
        </RBButton>
      </>
    ),
  },
];  
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
    <RBInput
  placeholder="🔍 Search role..."
/>

  <RBButton
  variant="success"
  onClick={() => {
    // yahan existing onClick ka pura code same paste karna
  }}
>
  ➕ Add Role
</RBButton>

    
</div>
     <RBTable
  columns={columns}
  data={roles}
/>
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

      <RBInput
  placeholder="Role Name"
  value={form.role_name}
  onChange={(e) =>
    setForm({ ...form, role_name: e.target.value })
  }
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
        <RBButton
  variant="secondary"
  onClick={() => setShowForm(false)}
>
  Cancel
</RBButton>

<RBButton
  variant="success"
  onClick={saveRole}
>
  Save
</RBButton>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

