import { useEffect, useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { API_BASE } from "../config";

const API = `${API_BASE}/api/companies`;
export default function AdminCompany() {
 const [company, setCompany] = useState({
  company_code: "",
  company_name: "",
  legal_name: "",
  short_name: "",
  company_type: "",

  registration_no: "",
  gst_number: "",
  pan_number: "",

  email: "",
  phone: "",
  alternate_phone: "",
  website: "",

  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",

  status: "ACTIVE",

  primary_color: "#1565C0",
  secondary_color: "#0D47A1",

  logo_url: "",
  signature_url: "",
  qr_base_url: "",
});
useEffect(() => {
  loadCompany();
}, []);

const loadCompany = async () => {
  try {
    const res = await fetch(API);

    if (!res.ok) return;

    const json = await res.json();

    if (json.success && json.data.length > 0) {
      setCompany(json.data[0]);
    }
  } catch (err) {
    console.error("Load Company Error:", err);
  }
};

const handleSave = async () => {
  try {
    const method = company.id ? "PUT" : "POST";
    const url = company.id ? `${API}/${company.id}` : API;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(company),
    });

    const json = await res.json();

   if (json.success) {
  const companyId = json.data?.id || company.id;

  if (company.logo || company.signature) {
    const formData = new FormData();
    formData.append("company_id", companyId);

    if (company.logo) {
      formData.append("logo", company.logo);
    }

    if (company.signature) {
      formData.append("signature", company.signature);
    }

  const uploadRes = await fetch(`${API}/upload`, {
  method: "POST",
  body: formData,
});

const uploadJson = await uploadRes.json();
console.log(uploadJson);

if (!uploadRes.ok) {
  alert(uploadJson.message || "Upload failed");
}
  }

  alert(json.message);
  loadCompany();
} else {
  alert(json.message || "Save failed");
}
  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
};
  return (
    <div style={{ display: "flex", background: "#f4f6f9" }}>
      <AdminSidebar />

      <div style={{ flex: 1 }}>
        <AdminHeader />

        <div style={{ padding: 20 }}>
          <h1
            style={{
              color: "#0B3D91",
              marginBottom: 20,
            }}
          >
            Company Profile
          </h1>
<div
  style={{
    background: "linear-gradient(135deg,#0B3D91,#1565C0)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 8px 20px rgba(0,0,0,.15)",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <img
      src={
        company.logo_url
          ? `${API_BASE}${company.logo_url}`
          : "/logo.png"
      }
      alt="Company Logo"
      style={{
        width: 80,
        height: 80,
        borderRadius: 12,
        background: "#fff",
        objectFit: "contain",
        padding: 6,
      }}
    />

    <div>
      <h2 style={{ margin: 0 }}>
        {company.company_name || "Company Name"}
      </h2>

      <div style={{ opacity: .9 }}>
        {company.short_name || "Short Name"}
      </div>

      <div style={{ marginTop: 8, fontSize: 14 }}>
        📞 {company.phone || "-"} &nbsp; | &nbsp;
        🌐 {company.website || "-"}
      </div>
    </div>
  </div>

  <div
    style={{
      background: "#22c55e",
      padding: "8px 16px",
      borderRadius: 30,
      fontWeight: "bold",
    }}
  >
    {company.status || "ACTIVE"}
  </div>
</div>
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    alignItems: "start",
  }}
>
  <div
    style={{
      background: "#fff",
      padding: 20,
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,.1)",
    }}
  >
            <h2 style={{ color: "#0B3D91", marginBottom: 15 }}>
              Company Information
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: 15,
              }}
            >
              <input
                placeholder="Company Name"
                value={company.company_name}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    company_name: e.target.value,
                  })
                }
              />

              <input
                placeholder="Short Name"
                value={company.short_name}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    short_name: e.target.value,
                  })
                }
              />

              <input
                placeholder="Company Code"
                value={company.company_code}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    company_code: e.target.value,
                  })
                }
              />

              <input
                placeholder="Company Type"
                value={company.company_type}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    company_type: e.target.value,
                  })
                }
              />
              <input
                placeholder="Registration No."
                value={company.registration_no}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    registration_no: e.target.value,
                  })
                }
              />

              <input
                placeholder="GST Number"
                value={company.gst_no}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    gst_no: e.target.value,
                  })
                }
              />

              <input
                placeholder="PAN Number"
                value={company.pan_no}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    pan_no: e.target.value,
                  })
                }
              />

              <input
                placeholder="Website"
                value={company.website}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    website: e.target.value,
                  })
                }
              />
              <input
                placeholder="Email"
                type="email"
                value={company.email}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    email: e.target.value,
                  })
                }
              />

              <input
                placeholder="Phone Number"
                value={company.phone}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    phone: e.target.value,
                  })
                }
              />

              <input
                placeholder="Alternate Phone"
                value={company.alternate_phone}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    alternate_phone: e.target.value,
                  })
                }
              />

            </div>

            <h2
              style={{
                color: "#0B3D91",
                marginTop: 30,
                marginBottom: 15,
              }}
            >
              Address Details
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: 15,
              }}
            >
              <input
                placeholder="Address"
                value={company.address}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    address: e.target.value,
                  })
                }
              />

              <input
                placeholder="City"
                value={company.city}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    city: e.target.value,
                  })
                }
              />

              <input
                placeholder="State"
                value={company.state}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    state: e.target.value,
                  })
                }
              />

              <input
                placeholder="PIN Code"
                value={company.pincode}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    pincode: e.target.value,
                  })
                }
              />
              <input
                placeholder="Country"
                value={company.country}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    country: e.target.value,
                  })
                }
              />

              <div>
                <label>Primary Color</label>
                <input
                  type="color"
                  value={company.primary_color}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      primary_color: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Secondary Color</label>
                <input
                  type="color"
                  value={company.secondary_color}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      secondary_color: e.target.value,
                    })
                  }
                />
              </div>

            </div>
            <h2 style={{ color: "#0B3D91", marginTop: 30 }}>
              Branding
            </h2>

            <div style={{ display: "grid", gap: 15 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCompany({ ...company, logo: e.target.files[0] })
                }
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCompany({
                    ...company,
                    signature: e.target.files[0],
                  })
                }
              />
             {(company.logo || company.logo_url) && (
                <div style={{ marginTop: 15 }}>
                  <p><b>Logo Preview</b></p>
                  <img
                   src={
  company.logo
    ? URL.createObjectURL(company.logo)
    : `${API_BASE}${company.logo_url}`
}
                    alt="Logo"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "contain",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  />
                </div>
              )}

              {(company.signature || company.signature_url) && (
                <div style={{ marginTop: 15 }}>
                  <p><b>Signature Preview</b></p>
                  <img
                    
  src={
  company.signature
    ? URL.createObjectURL(company.signature)
    : `${API_BASE}${company.signature_url}`
}
                    alt="Signature"
                    style={{
                      width: 220,
                      height: 80,
                      objectFit: "contain",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  />
                </div>
              )}
                <div
                  style={{
                    marginBottom: 15,
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    background: "#f8f9fa",
                  }}
                >
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                    color:
  company.status?.toUpperCase() === "ACTIVE"
    ? "green"
    : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {company.status}
                  </span>
                </div>
              <div
  style={{
    marginTop: 25,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    padding: "15px 20px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
  }}
>
  <span style={{ color: "#555", fontWeight: 500 }}>
    Company profile changes are ready to save.
  </span>

  <button
    onClick={handleSave}
    style={{
      background: company.primary_color || "#0B3D91",
      color: "#fff",
      border: "none",
      padding: "12px 28px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 16,
      fontWeight: "bold",
      boxShadow: "0 4px 10px rgba(0,0,0,.15)",
    }}
  >
    💾 Save Company Profile
  </button>
</div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
          
