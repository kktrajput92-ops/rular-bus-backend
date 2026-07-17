import { useEffect, useState } from "react";
import api from "../api/api";
import { usePermission } from "../context/PermissionContext";
import {
  RBButton,
  RBInput,
  RBBadge,
  RBTable,
} from "../rds/components";
export default function AdminUser() {
  const [users, setUsers] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);
const { hasPermission } = usePermission();
const [form, setForm] = useState({
  company_id: "",
  role_id: "",
  region_id: "",
  branch_id: "",
  office_id: "",
  counter_id: "",
  full_name: "",
  username: "",
  email: "",
  mobile: "",
  password: "",
});

const [roles, setRoles] = useState([]);
 useEffect(() => {
  loadUsers();
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
  const loadUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
const editUser = (item) => {
  setEditingId(item.id);

  setForm({
    company_id: item.company_id || "",
    role_id: item.role_id || "",
    region_id: item.region_id || "",
    branch_id: item.branch_id || "",
    office_id: item.office_id || "",
    counter_id: item.counter_id || "",
    full_name: item.full_name || "",
    username: item.username || "",
    email: item.email || "",
    mobile: item.mobile || "",
    password: "",
  });

  setShowForm(true);
};

const deleteUser = async (id) => {

  if (!window.confirm("Delete this user?")) return;

  try {

    await api.delete(`/users/${id}`);

    alert("User deleted successfully");

    loadUsers();

  } catch (err) {

    alert(
      err.response?.data?.message || "Delete failed"
    );

  }

};

const saveUser = async () => {
  try {
    const payload = { ...form };

    if (editingId) {
      await api.put(`/users/${editingId}`, payload);
    } else {
      await api.post("/users", payload);
    }

    alert("User Saved Successfully");

    setShowForm(false);
    setEditingId(null);

    setForm({
      company_id: "",
      role_id: "",
      region_id: "",
      branch_id: "",
      office_id: "",
      counter_id: "",
      full_name: "",
      username: "",
      email: "",
      mobile: "",
      password: "",
    });

    loadUsers();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to save user");
  }
};
const columns = [
  { key: "id", header: "ID" },
  { key: "full_name", header: "Full Name" },
  { key: "username", header: "Username" },
  { key: "email", header: "Email" },
  { key: "mobile", header: "Mobile" },
  { key: "role_name", header: "Role" },
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
        {hasPermission("user.update") && (
          <RBButton
            variant="secondary"
            onClick={() => editUser(item)}
            style={{ marginRight: 8 }}
          >
            Edit
          </RBButton>
        )}

        {hasPermission("user.delete") && (
          <RBButton
            variant="danger"
            onClick={() => deleteUser(item.id)}
          >
            Delete
          </RBButton>
        )}
      </>
    ),
  },
];
  return (
    <div style={{ padding: 30 }}>
      <h1>👤 User Management</h1>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "20px 0",
  }}
>
  <RBInput
  placeholder="🔍 Search user..."
/>

  {hasPermission("user.create") && (
  
  <RBButton
    variant="success"
    onClick={() => {
      setEditingId(null);

      setForm({
        company_id: "",
        role_id: "",
        region_id: "",
        branch_id: "",
        office_id: "",
        counter_id: "",
        full_name: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
      });

      setShowForm(true);
    }}
  >
    ➕ Add User
  </RBButton>
)}

</div>

<RBTable
  columns={columns}
  data={users}
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
        width: 550,
      }}
    >
      <h2>{editingId ? "✏️ Edit User" : "➕ Add User"}</h2>

     <RBInput
  placeholder="Full Name"
  value={form.full_name}
  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
/>

    <RBInput
  placeholder="Username"
  value={form.username}
  onChange={(e) => setForm({ ...form, username: e.target.value })}
/>

      <RBInput
  placeholder="Email"
  value={form.email}
  onChange={(e) => setForm({ ...form, email: e.target.value })}
/>

     <RBInput
  placeholder="Mobile"
  value={form.mobile}
  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
/>

     <RBInput
  type="password"
  placeholder="Password"
  value={form.password}
  onChange={(e) => setForm({ ...form, password: e.target.value })}
/>

      <select
        value={form.role_id}
        onChange={(e) => setForm({ ...form, role_id: e.target.value })}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      >
        <option value="">Select Role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.role_name}
          </option>
        ))}
      </select>

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
  onClick={saveUser}
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

