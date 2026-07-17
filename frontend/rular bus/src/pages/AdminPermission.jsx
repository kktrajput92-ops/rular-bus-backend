import { useEffect, useState } from "react";
import api from "../api/api";
import {
  RBButton,
  RBInput,
  RBBadge,
  RBTable,
} from "../rds/components";
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
const columns = [
  { key: "id", header: "ID" },
  { key: "permission_code", header: "Permission Code" },
  { key: "permission_name", header: "Permission Name" },
  { key: "module_name", header: "Module" },
  {
    key: "status",
    header: "Status",
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
    header: "Actions",
    render: (item) => (
      <>
        <RBButton
          variant="secondary"
          onClick={() => editPermission(item)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton variant="danger">
          Delete
        </RBButton>
      </>
    ),
  },
];
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
  <RBInput
  placeholder="🔍 Search permission..."
/>

  <RBButton
  variant="success"
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
>
  ➕ Add Permission
</RBButton>
</div>
       <RBTable
  columns={columns}
  data={permissions}
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
        {editingId ? "✏️ Edit Permission" : "➕ Add Permission"}
      </h2>

      <RBInput
  placeholder="Permission Code"
  value={form.permission_code}
  onChange={(e) =>
    setForm({ ...form, permission_code: e.target.value })
  }
/>

    <RBInput
  placeholder="Permission Name"
  value={form.permission_name}
  onChange={(e) =>
    setForm({ ...form, permission_name: e.target.value })
  }
/>
      <RBInput
  placeholder="Module Name"
  value={form.module_name}
  onChange={(e) =>
    setForm({ ...form, module_name: e.target.value })
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
  onClick={savePermission}
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
