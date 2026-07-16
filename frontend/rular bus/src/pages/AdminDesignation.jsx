import { useEffect, useState } from "react";
import api from "../api/api";
import {
  RBButton,
  RBInput,
  RBBadge,
  RBTable,
} from "../rds/components";
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
const deleteDesignation = async (id) => {
  if (!window.confirm("Delete this designation?")) return;

  try {
    await api.delete(`/designations/${id}`);
    loadDesignations();
  } catch (err) {
    console.log(err);
    alert(err.response?.data?.message || "Failed to delete designation");
  }
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
const columns = [
  { key: "id", title: "ID" },
  { key: "designation_code", title: "Designation Code" },
  { key: "designation_name", title: "Designation Name" },
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
          onClick={() => editDesignation(item)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton
          variant="danger"
          onClick={() => deleteDesignation(item.id)}
        >
          Delete
        </RBButton>
      </>
    ),
  },
];
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

<RBInput
  placeholder="🔍 Search designation..."
/>
</div>
      <RBTable
  columns={columns}
  data={designations}
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
        {editingId ? "✏️ Edit Designation" : "➕ Add Designation"}
      </h2>

     <RBInput
  placeholder="Designation Code"
  value={form.designation_code}
  onChange={(e) =>
    setForm({ ...form, designation_code: e.target.value })
  }
/>

     <RBInput
  placeholder="Designation Name"
  value={form.designation_name}
  onChange={(e) =>
    setForm({ ...form, designation_name: e.target.value })
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
  onClick={saveDesignation}
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
