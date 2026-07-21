import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import StaffIDCard from "../components/staff/StaffIDCard";
import {
  RBButton,
  RBInput,
  RBCard,
  RBBadge,
  RBTable,
} from "../rds/components";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
const [search, setSearch] = useState("");
const [companyFilter, setCompanyFilter] = useState("");
const [regionFilter, setRegionFilter] = useState("");
const [branchFilter, setBranchFilter] = useState("");
const [officeFilter, setOfficeFilter] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [selectedStaff, setSelectedStaff] = useState(null);
const [showView, setShowView] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
const [editingId, setEditingId] = useState(null);
const [companies, setCompanies] = useState([]);
const [regions, setRegions] = useState([]);
const [branches, setBranches] = useState([]);
const [offices, setOffices] = useState([]);
const [departments, setDepartments] = useState([]);
const [designations, setDesignations] = useState([]);
const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
company_id: "",  
region_id: "",
branch_id: "",
office_id: "",
department_id: "",
designation_id: "",
role_id: "",  
employee_code: "",
    full_name: "",
    mobile: "",
    email: "",
    gender: "Male",
    employment_type: "PERMANENT",
status: "ACTIVE",
salary: "",
address: "",
  });

 useEffect(() => {
  loadStaff();
  loadCompanies();
  loadRegions(1);
  loadBranches(1);
}, []);

useEffect(() => {
  if (showForm && form.company_id) {
    loadRegions(form.company_id);
  }
}, [showForm, form.company_id]);

useEffect(() => {
  if (showForm && form.region_id) {
    loadBranches(form.region_id);
  }
}, [showForm, form.region_id]);

useEffect(() => {
  if (showForm && form.branch_id) {
    loadOffices(form.branch_id);
  }
}, [showForm, form.branch_id]);

useEffect(() => {
  if (showForm && form.office_id) {
    loadDepartments(form.office_id);
  }
}, [showForm, form.office_id]);

useEffect(() => {
  if (showForm && form.department_id) {
    loadDesignations(form.department_id);
    loadRoles(form.department_id);
  }
}, [showForm, form.department_id]);
 const loadStaff = async () => {
  try {
    const res = await api.get("/staff");
    setStaff(res.data.data);
  } catch (err) {
    console.log(err);
  }
};
const loadCompanies = async () => {
  try {
    const res = await api.get("/companies");

    setCompanies(res.data.data);
  } catch (err) {
    console.log(err);
  }
};

const loadRegions = async (companyId) => {
  if (!companyId) {
    setRegions([]);
    return;
  }

  try {
   const res = await api.get(`/regions?company_id=${companyId}`);

console.log("API Response =", JSON.stringify(res.data));

const regionList = res.data?.data || [];

console.log("Region List =", regionList);

setRegions(regionList);
  } catch (err) {
    console.log(err);
  }
};
const loadBranches = async (regionId) => {
  if (!regionId) {
    setBranches([]);
    return;
  }

  try {
    const res = await api.get(`/branches?region_id=${regionId}`);
    setBranches(res.data.data);
  } catch (err) {
    console.log(err);
  }
};
const loadOffices = async (branchId) => {
  if (!branchId) {
    setOffices([]);
    return;
  }

  try {
    const res = await api.get(`/offices?branch_id=${branchId}`);
    setOffices(res.data.data);
  } catch (err) {
    console.log(err);
  }
};
const loadDepartments = async (officeId) => {
  if (!officeId) {
    setDepartments([]);
    return;
  }

  try {
    const res = await api.get(`/departments?office_id=${officeId}`);
    setDepartments(res.data.data);
  } catch (err) {
    console.log(err);
  }
};
const loadDesignations = async (departmentId) => {
  if (!departmentId) {
    setDesignations([]);
    return;
  }

  try {
    const res = await api.get(`/designations?department_id=${departmentId}`);
    setDesignations(res.data.data);
  } catch (err) {
    console.log(err);
  }
};
const loadRoles = async (departmentId) => {
  if (!departmentId) {
    setRoles([]);
    return;
  }

  try {
    const res = await api.get(`/roles?department_id=${departmentId}`);
    setRoles(res.data.data);
  } catch (err) {
    console.log(err);
  }
};
const editStaff = async (item) => {
  setEditingId(item.id);
console.log("Edit Item =", item);

  setForm({
   company_id: String(item.company_id || ""),
region_id: String(item.region_id || ""),
branch_id: String(item.branch_id || ""),
office_id: String(item.office_id || ""),
department_id: String(item.department_id || ""),
designation_id: String(item.designation_id || ""),
role_id: String(item.role_id || ""),

employee_code: item.employee_code || "",
full_name: item.full_name || "",
mobile: item.mobile || "",
email: item.email || "",
gender: item.gender || "Male",
employment_type: item.employment_type || "PERMANENT",
status: item.status || "ACTIVE",
salary: item.salary || "",
address: item.address || "",
  });

  setShowForm(true);
};
 
const viewStaff = async (row) => {
  console.log("Clicked Row:", row);

  try {
    const { data } = await api.get(`/staff/${row.id}`);

    console.log("API Response:", data);

    setSelectedStaff(data.data);
    setShowView(true);
  } catch (err) {
    console.log("View Error:", err);
    alert(err.response?.data?.message || err.message);
  }
};
const deleteStaff = async (id) => {
  if (!window.confirm("Are you sure you want to delete this staff?")) {
    return;
  }

  try {
    await api.delete(`/staff/${id}`);
    alert("Staff deleted successfully.");

    loadStaff();
  } catch (err) {
    alert(err.response?.data?.message || err.message);
  }
};
   const saveStaff = async () => {
  try {
    const payload = {
  company_id: Number(form.company_id),
  region_id: Number(form.region_id),
  branch_id: Number(form.branch_id),
  office_id: Number(form.office_id),
  department_id: Number(form.department_id),
  designation_id: Number(form.designation_id),
 role_id: Number(form.role_id),

  employee_code: form.employee_code,
  full_name: form.full_name,
  mobile: form.mobile,
  email: form.email,

  gender: form.gender,
joining_date: new Date().toISOString().slice(0, 10),
employment_type: form.employment_type,
status: form.status,
salary: Number(form.salary || 0),
address: form.address,
};

let staffId;

if (editingId) {
  await api.put(`/staff/${editingId}`, payload);
  staffId = editingId;
} else {
  const { data } = await api.post("/staff", payload);
  staffId = data.data.id;
}

if (photoFile) {
  const formData = new FormData();
  formData.append("photo", photoFile);

  await api.post(`/staff/${staffId}/photo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
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
const printRef = useRef(null);
const handlePrint = useReactToPrint({
  contentRef: printRef,
  documentTitle: "Staff ID Card",
});

const debugPrint = () => {
  alert(printRef.current ? "REF OK" : "REF NULL");
  if (printRef.current) {
    handlePrint();
  }
};

const generatePDF = async () => {
  if (!printRef.current) return;

  const canvas = await html2canvas(printRef.current, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save("Staff_ID_Card.pdf");
};

const filteredStaff = staff.filter((item) => {
  
  const q = search.toLowerCase();

 const matchesSearch =
  item.employee_code?.toLowerCase().includes(q) ||
  item.full_name?.toLowerCase().includes(q) ||
  item.mobile?.toLowerCase().includes(q);

const matchesCompany =
  !companyFilter || String(item.company_id) === companyFilter;

const matchesRegion =
  !regionFilter || String(item.region_id) === regionFilter;

const matchesBranch =
  !branchFilter || String(item.branch_id) === branchFilter;

const matchesOffice =
  !officeFilter || String(item.office_id) === officeFilter;

const matchesStatus =
  !statusFilter || item.status === statusFilter;

return (
  matchesSearch &&
  matchesCompany &&
  matchesRegion &&
  matchesBranch &&
  matchesOffice &&
  matchesStatus
);
});
const columns = [
{
  key: "photo",
  title: "Photo",
  render: (row) => (
    <img
      src={
        row.photo
          ? `${import.meta.env.VITE_API_URL}${row.photo}`
          : "https://via.placeholder.com/45?text=👤"
      }
      alt="Staff"
      onError={(e) => {
        e.target.src = "https://via.placeholder.com/45?text=👤";
      }}
      style={{
        width: 45,
        height: 45,
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid #ddd",
      }}
    />
  ),
},
  { key: "employee_code", title: "Employee Code" },
  { key: "full_name", title: "Name" },
  { key: "company_name", title: "Company" },
  { key: "region_name", title: "Region" },
  { key: "branch_name", title: "Branch" },
  { key: "office_name", title: "Office" },
  { key: "department_name", title: "Department" },
  { key: "designation_name", title: "Designation" },
  { key: "role_name", title: "Role" },
  { key: "mobile", title: "Mobile" },

  {
    key: "status",
    title: "Status",
    render: (row) => (
      <RBBadge
        variant={
          row.status === "ACTIVE"
            ? "success"
            : row.status === "INACTIVE"
            ? "warning"
            : "danger"
        }
      >
        {row.status}
      </RBBadge>
    ),
  },

  {
    key: "actions",
    title: "Actions",
    render: (row) => (
      <>
<RBButton
  variant="primary"
  onClick={() => viewStaff(row)}
  style={{ marginRight: 8 }}
>
  View
</RBButton>
  

        <RBButton
          variant="secondary"
          onClick={() => editStaff(row)}
          style={{ marginRight: 8 }}
        >
          Edit
        </RBButton>

        <RBButton
  variant="danger"
  onClick={() => deleteStaff(row.id)}
>
  Delete
</RBButton>
      </>
    ),
  },
];
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
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    width: "320px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  }}
/>

   <select
  value={companyFilter}
  onChange={(e) => {
  const companyId = e.target.value;

  setCompanyFilter(companyId);
  setRegionFilter("");
  setBranchFilter("");

  if (companyId) {
    loadRegions(companyId);
  } else {
    setRegions([]);
    setBranches([]);
  }
}}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginLeft: "10px",
  }}
>
  <option value="">All Companies</option>
  {companies.map((c) => (
    <option key={c.id} value={c.id}>
     {c.company_name}
    </option>
  ))}
</select>
<select
  value={regionFilter}
  onChange={(e) => {
  const regionId = e.target.value;

  setRegionFilter(regionId);
  setBranchFilter("");

  if (regionId) {
    loadBranches(regionId);
  } else {
    setBranches([]);
  }
}}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginLeft: "10px",
  }}
>
  <option value="">All Regions</option>
  {regions.map((r) => (
    <option key={r.id} value={r.id}>
      {r.region_name}
    </option>
  ))}
</select>
<select
  value={branchFilter}
  onChange={(e) => {
  const branchId = e.target.value;

  setBranchFilter(branchId);
  setOfficeFilter("");

  if (branchId) {
    loadOffices(branchId);
  } else {
    setOffices([]);
  }
}}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginLeft: "10px",
  }}
>
  <option value="">All Branches</option>
  {branches.map((b) => (
    <option key={b.id} value={b.id}>
      {b.branch_name}
    </option>
  ))}
</select>
<select
  value={officeFilter}
  onChange={(e) => setOfficeFilter(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginLeft: "10px",
  }}
>
  <option value="">All Offices</option>

  {offices.map((o) => (
    <option key={o.id} value={o.id}>
      {o.office_name}
    </option>
  ))}
</select>
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginLeft: "10px",
  }}
>
 <option value="">All Status</option>
<option value="ACTIVE">Active</option>
<option value="INACTIVE">Inactive</option>
</select>
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
<button
  onClick={() => {
    setSearch("");
    setCompanyFilter("");
    setRegionFilter("");
    setBranchFilter("");
    setStatusFilter("");
  }}
  style={{
    background: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginLeft: "10px",
  }}
>
  🔄 Reset
</button>
  </div>

  <RBTable
  columns={columns}
  data={filteredStaff}
/>
{showView && selectedStaff && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: "700px",
        maxWidth: "95%",
        background: "#fff",
        borderRadius: 12,
        padding: 24,
      }}
    >
     <h2>👤 Staff Details</h2>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  }}
>
  <div ref={printRef}>
    <StaffIDCard staff={selectedStaff} />
  </div>

  <div>
    <RBButton
    onClick={generatePDF}
    >
      🖨 Print ID Card
    </RBButton>

    <RBButton
      variant="secondary"
      onClick={() => {
        setShowView(false);
        setSelectedStaff(null);
      }}
    >
      Close
    </RBButton>
  </div>
</div>
    
  </div>
</div>
)}
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
<select
  value={form.company_id}
  onChange={(e) => {
  const companyId = e.target.value;

 setForm((prev) => ({
  ...prev,
  company_id: companyId,
  region_id: "",
}));

console.log("Company Selected =", companyId);

loadRegions(companyId);
}}
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Company</option>

  {companies.map((c) => (
    <option key={c.id} value={c.id}>
      {c.company_name}
    </option>
  ))}
</select>
<p>Regions Count: {regions.length}</p>
<select
  value={form.region_id}
  onChange={(e) => {
  const regionId = e.target.value;

  setForm((prev) => ({
    ...prev,
    region_id: regionId,
    branch_id: "",
  }));

  loadBranches(regionId);
}}
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Region</option>

  {regions.map((r) => (

    <option key={r.id} value={r.id}>
      {r.region_name}
    </option>
  ))}
</select>
<p>Branches Count: {branches.length}</p>

<select
  value={form.branch_id}
  onChange={(e) => {
  const branchId = e.target.value;

  setForm((prev) => ({
    ...prev,
    branch_id: branchId,
    office_id: "",
  }));

  loadOffices(branchId);
}}
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Branch</option>

  {branches.map((b) => (
    <option key={b.id} value={b.id}>
      {b.branch_name}
    </option>
  ))}
</select>
<p>Offices Count: {offices.length}</p>

<select
  value={form.office_id}
  onChange={(e) => {
  const officeId = e.target.value;

  setForm((prev) => ({
    ...prev,
    office_id: officeId,
    department_id: "",
  }));

  loadDepartments(officeId);
}}
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Office</option>

  {offices.map((o) => (
    <option key={o.id} value={o.id}>
      {o.office_name}
    </option>
  ))}
</select>
<p>Departments Count: {departments.length}</p>

<select
  value={form.department_id}
  onChange={(e) => {
  const departmentId = e.target.value;

  setForm((prev) => ({
    ...prev,
    department_id: departmentId,
    designation_id: "",
  }));

  loadDesignations(departmentId);
}}
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Department</option>

  {departments.map((d) => (
    <option key={d.id} value={d.id}>
      {d.department_name}
    </option>
  ))}
</select>
<p>Designations Count: {designations.length}</p>

<select
  value={form.designation_id}
  onChange={(e) => {
  const designationId = e.target.value;

  setForm((prev) => ({
    ...prev,
    designation_id: designationId,
    role_id: "",
  }));

  loadRoles(form.department_id);
}}
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Designation</option>

  {designations.map((d) => (
    <option key={d.id} value={d.id}>
      {d.designation_name}
    </option>
  ))}
</select>
<p>Roles Count: {roles.length}</p>

<select
  value={form.role_id}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      role_id: e.target.value,
    }))
  }
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="">Select Role</option>

  {roles.map((r) => (
    <option key={r.id} value={r.id}>
      {r.role_name}
    </option>
  ))}
</select>
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
<select
  value={form.status}
  onChange={(e) =>
    setForm({ ...form, status: e.target.value })
  }
  style={{
    width: "100%",
    padding: 10,
    marginBottom: 10,
  }}
>
  <option value="ACTIVE">Active</option>
  <option value="INACTIVE">Inactive</option>
  <option value="SUSPENDED">Suspended</option>
</select>
<div style={{ marginBottom: 10 }}>
  <label style={{ display: "block", marginBottom: 6 }}>
    Staff Photo
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
  />

  {photoFile && (
    <p style={{ marginTop: 5, color: "green" }}>
      Selected: {photoFile.name}
    </p>
  )}
</div>
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

