import { useEffect, useState } from "react";
import api from "../api/api";

export default function AdminDepartment() {
  const [departments, setDepartments] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);

const [form, setForm] = useState({
  department_code: "",
  department_name: "",
  description: "",
});
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };
const editDepartment = (item) => {
  setEditingId(item.id);

  setForm({
    department_code: item.department_code || "",
    department_name: item.department_name || "",
    description: item.description || "",
  });

  setShowForm(true);
};

const deleteDepartment = async (id) => {

  if (!window.confirm("Delete this department?")) return;

  try {

    await api.delete(`/departments/${id}`);

    alert("Department deleted successfully");

    loadDepartments();

  } catch (err) {

    alert(
      err.response?.data?.message || "Delete failed"
    );

  }

};

const saveDepartment = async () => {
  try {
    const payload = {
      company_id: 1,
      department_code: form.department_code,
      department_name: form.department_name,
      description: form.description,
    };

    if (editingId) {
      await api.put(`/departments/${editingId}`, payload);
    } else {
      await api.post("/departments", payload);
    }

    alert("Department Saved Successfully");

    setShowForm(false);
    setEditingId(null);

    setForm({
      department_code: "",
      department_name: "",
      description: "",
    });

    loadDepartments();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to save department");
  }
};
  return (
    <div style={{ padding: 30 }}>
      <h1>🏢 Department Management</h1>
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
    placeholder="🔍 Search department..."
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
        department_code: "",
        department_name: "",
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
    ➕ Add Department
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
<th>Department Code</th>
<th>Department Name</th>
<th>Status</th>
<th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.department_code}</td>
              <td>{item.department_name}</td>
              <td>{item.status}</td>
<td>
  <button
    onClick={() => editDepartment(item)}
    style={{ marginRight: 8 }}
  >
    ✏️ Edit
  </button>

  <button
  onClick={() => deleteDepartment(item.id)}
>
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
        width: 420,
      }}
    >
      <h2>{editingId ? "Edit Department" : "Add Department"}</h2>

      <input
        placeholder="Department Code"
        value={form.department_code}
        onChange={(e) =>
          setForm({ ...form, department_code: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        placeholder="Department Name"
        value={form.department_name}
        onChange={(e) =>
          setForm({ ...form, department_name: e.target.value })
        }
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
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
          marginBottom: 10,
          minHeight: 90,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <button onClick={() => setShowForm(false)}>
          Cancel
        </button>

        <button
          onClick={saveDepartment}
          style={{
            background: "#198754",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 8,
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
