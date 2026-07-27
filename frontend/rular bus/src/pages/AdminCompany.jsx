import { useEffect, useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { API_BASE } from "../config";
import "./AdminCompany.css";
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

    const logoFile =
      company.logo instanceof File ? company.logo : null;

    const signatureFile =
      company.signature instanceof File ? company.signature : null;

    const {
      logo,
      signature,
      ...companyPayload
    } = company;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(companyPayload),
    });

    const responseText = await res.text();

    let json = {};

    try {
      json = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `Invalid server response. HTTP status: ${res.status}`
      );
    }

    if (!res.ok || !json.success) {
      throw new Error(
        json.message ||
          `Company save failed. HTTP status: ${res.status}`
      );
    }

    const companyId = json.data?.id || company.id;

    if (!companyId) {
      throw new Error("Company ID was not returned by server");
    }

    if (logoFile || signatureFile) {
      const formData = new FormData();

      formData.append("company_id", String(companyId));

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      if (signatureFile) {
        formData.append("signature", signatureFile);
      }

      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadResponseText = await uploadRes.text();

      let uploadJson = {};

      try {
        uploadJson = uploadResponseText
          ? JSON.parse(uploadResponseText)
          : {};
      } catch {
        throw new Error(
          `Invalid upload response. HTTP status: ${uploadRes.status}`
        );
      }

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(
          uploadJson.message ||
            `Branding upload failed. HTTP status: ${uploadRes.status}`
        );
      }
    }

    await loadCompany();

    alert(json.message || "Company profile saved successfully");
  } catch (err) {
    console.error("Company Save Error:", err);

    alert(
      err instanceof Error
        ? err.message
        : "Unable to save company profile"
    );
  }
};

  return (
  <div className="admin-company-page">
      <AdminSidebar />

      <div className="admin-company-main">
        <AdminHeader />

        <div className="admin-company-content">
          <h1
            style={{
              color: "var(--erp-heading)",
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
    boxShadow: "var(--erp-shadow-md)",
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
        background: "var(--erp-surface)",
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
  className="admin-company-grid"
>
  <div
    style={{
      background: "var(--erp-surface)",
      padding: 20,
      borderRadius: 12,
      boxShadow: "var(--erp-shadow-sm)",
    }}
  >
            <h2 style={{ color: "var(--erp-heading)", marginBottom: 15 }}>
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
                color: "var(--erp-heading)",
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
            <h2 style={{ color: "var(--erp-heading)", marginTop: 30 }}>
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
                      border: "1px solid var(--erp-border)",
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
                      border: "1px solid var(--erp-border)",
                      borderRadius: 8,
                    }}
                  />
                </div>
              )}
                <div
                  style={{
                    marginBottom: 15,
                    padding: 12,
                    border: "1px solid var(--erp-border)",
                    borderRadius: 8,
                    background: "var(--erp-surface-muted)",
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
    background: "var(--erp-surface-muted)",
    border: "1px solid var(--erp-border)",
    borderRadius: 12,
  }}
>
  <span style={{ color: "var(--erp-text-secondary)", fontWeight: 500 }}>
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
      boxShadow: "var(--erp-shadow-sm)",
    }}
  >
    💾 Save Company Profile
  </button>
</div>
</div>
  

<div
  style={{
  background: "var(--erp-surface)",
  padding: 20,
  borderRadius: 12,
  boxShadow: "var(--erp-shadow-sm)",
  minHeight: 500,
  position: "sticky",
  top: 20,
  alignSelf: "start",
}}
  >
    <h2 style={{ color: "var(--erp-heading)", marginTop: 0 }}>
      Live Preview
    </h2>

   <div style={{ textAlign: "center" }}>
  <img
    src={
      company.logo
        ? URL.createObjectURL(company.logo)
        : company.logo_url
        ? `${API_BASE}${company.logo_url}`
        : "/logo.png"
    }
    alt="Logo"
    style={{
      width: 100,
      height: 100,
      objectFit: "contain",
      marginBottom: 15,
    }}
  />

  <h2 style={{ margin: 0, color: "var(--erp-heading)" }}>
    {company.company_name || "Company Name"}
  </h2>

  <p>{company.short_name || "Short Name"}</p>

  <hr />

  <p><b>GST:</b> {company.gst_number || "-"}</p>
  <p><b>Phone:</b> {company.phone || "-"}</p>
  <p><b>Email:</b> {company.email || "-"}</p>
  <p><b>Website:</b> {company.website || "-"}</p>

  <p style={{ marginTop: 20 }}>
    {company.address}<br />
    {company.city} {company.pincode}<br />
    {company.state}, {company.country}
  </p>
</div>
  </div> 

            </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
          
