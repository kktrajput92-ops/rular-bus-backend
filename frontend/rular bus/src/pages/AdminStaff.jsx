import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);

  const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    employee_code: "",
    full_name: "",
    mobile: "",
    email: "",
    gender: "Male",
    employment_type: "PERMANENT",
    salary: "",
    address: "",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaff(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
const editStaff = (item) => {
  setEditingId(item.id);

  setForm({
    employee_code: item.employee_code || "",
    full_name: item.full_name || "",
    mobile: item.mobile || "",
    email: item.email || "",
    gender: item.gender || "Male",
    employment_type: item.employment_type || "PERMANENT",
    salary: item.salary || "",
    address: item.address || "",
  });

  setShowForm(true);
};
  const saveStaff = async () => {
    try {
      const payload = {
  company_id: 1,
  region_id: 1,
  branch_id: 1,
  office_id: 1,
  department_id: 1,
  designation_id: 1,
  role_id: 1,

  employee_code: form.employee_code,
  full_name: form.full_name,
  mobile: form.mobile,
  email: form.email,

  gender: form.gender,
  joining_date: new Date().toISOString().slice(0, 10),
  employment_type: form.employment_type,
  salary: Number(form.salary || 0),
  address: form.address,
};

if (editingId) {
  await api.put(`/staff/${editingId}`, payload);
} else {
  await api.post("/staff", payload);
}

      alert(editingId ? "Staff Updated Successfully" : "Staff Added Successfully");

        setEditingId(null);

      setShowForm(false);

      loadStaff();
    } catch (err) {
     console.log("STATUS =", err.response?.status);
console.log("DATA =", err.response?.data);
console.log("ERROR =", err);

alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
<div style={{ padding: 30 }}>
  <h1>👥 Staff Management</h1>

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
      placeholder="🔍 Search staff..."
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
    employee_code: "",
    full_name: "",
    mobile: "",
    email: "",
    gender: "Male",
    employment_type: "PERMANENT",
    salary: "",
    address: "",
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
      ➕ Add Staff
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
        <th>Employee Code</th>
        <th>Name</th>
        <th>Mobile</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {staff.map((item) => (
        <tr key={item.id}>
          <td>{item.id}</td>
          <td>{item.employee_code}</td>
          <td>{item.full_name}</td>
          <td>{item.mobile}</td>
          <td>{item.status}</td>
          <td>
            <button
  onClick={() => editStaff(item)}
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
      }}
    >
      <div
        style={{
          width: 420,
          background: "#fff",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2>Add Staff</h2>

        <input
          placeholder="Employee Code"
          value={form.employee_code}
          onChange={(e) =>
            setForm({ ...form, employee_code: e.target.value })
          }
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) =>
            setForm({ ...form, full_name: e.target.value })
          }
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value })
          }
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
           
            gap: 10,
            marginTop: 15,
          }}
        >
          <button onClick={() => setShowForm(false)}>
            Cancel
          </button>

          <button
            onClick={saveStaff}
            style={{
              background: "#198754",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 6,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
}
