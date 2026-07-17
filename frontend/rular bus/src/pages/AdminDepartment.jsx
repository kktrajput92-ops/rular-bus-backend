import { useEffect, useState } from "react";
import api from "../api/api";
import {
  RBButton,
  RBInput,
  RBCard,
  RBBadge,
  RBTable,
} from "../rds/components";
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
const columns = [
  { key: "id", title: "ID" },
  { key: "department_code", title: "Department Code" },
  { key: "department_name", title: "Department Name" },
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
          onClick={() => editDepartment(item)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton
          variant="danger"
          onClick={() => deleteDepartment(item.id)}
        >
          Delete
        </RBButton>
      </>
    ),
  },
];
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
 <RBInput
  placeholder="🔍 Search department..."
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
     <RBTable
  columns={columns}
  data={departments}
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
        width: 420,
      }}
    >
      <h2>{editingId ? "Edit Department" : "Add Department"}</h2>

      <RBInput
  placeholder="Department Code"
  value={form.department_code}
  onChange={(e) =>
    setForm({ ...form, department_code: e.target.value })
  }
/>

      <RBInput
  placeholder="Department Name"
  value={form.department_name}
  onChange={(e) =>
    setForm({ ...form, department_name: e.target.value })
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
        <RBButton
  variant="secondary"
  onClick={() => setShowForm(false)}
>
  Cancel
</RBButton>

        <RBButton
  variant="success"
  onClick={saveDepartment}
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
