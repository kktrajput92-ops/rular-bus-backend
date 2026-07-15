import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminUser() {
  const [users, setUsers] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);

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
  <input
    type="text"
    placeholder="🔍 Search user..."
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
    ➕ Add User
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
            <th>Full Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.full_name}</td>
              <td>{item.username}</td>
              <td>{item.email}</td>
              <td>{item.mobile}</td>
              <td>{item.role_name}</td>
              <td>{item.status}</td>
         <td>
  <button
    onClick={() => editUser(item)}
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
        width: 550,
      }}
    >
      <h2>{editingId ? "✏️ Edit User" : "➕ Add User"}</h2>

      <input
        placeholder="Full Name"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        placeholder="Mobile"
        value={form.mobile}
        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        style={{ width: "100%", padding: 10, marginTop: 10 }}
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
        <button onClick={() => setShowForm(false)}>
          Cancel
        </button>

        <button onClick={saveUser}>
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

