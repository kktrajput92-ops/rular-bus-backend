import QRCode from "react-qr-code";

/**
 * StaffIDCard
 * Premium PVC Staff ID Card — CR80 size (53.98mm x 85.6mm), front & back.
 *
 * Sizing strategy:
 *  - The card is authored at a comfortable on-screen size (340 x 540px)
 *    using a base font-size of 15px, with every inner dimension expressed
 *    in `em` via the em() helper below.
 *  - In print (@media print), the card's width/height switch to the exact
 *    physical CR80 dimensions (53.98mm x 85.6mm) and the base font-size
 *    switches to the equivalent physical size (2.38mm). Because every
 *    inner spacing/typography value is `em`-relative, the entire card
 *    (front and back, identically) rescales proportionally and prints
 *    at true CR80 size without any layout breakage or overflow.
 *
 *  All content is budgeted to fit within the 540px true card height
 *  (front and back independently) so nothing is clipped by the card's
 *  overflow:hidden boundary, on screen or on the printed card.
 */

const BASE_FONT_PX = 15;
const em = (px) => `${(px / BASE_FONT_PX).toFixed(3)}em`;

export default function StaffIDCard({ staff }) {
  if (!staff) return null;

  const API = import.meta.env.VITE_API_URL || "";

  const primaryColor = staff.primary_color || "#0F4C81";
  const secondaryColor = staff.secondary_color || "#173F6B";

  const companyName =
    staff.short_name ||
    staff.company_name ||
    "Rural Bus Transport";

  const logo = staff.logo_url ? `${API}${staff.logo_url}` : null;

  const signature = staff.signature_url
    ? `${API}${staff.signature_url}`
    : null;

  const photo = staff.photo
    ? `${API}${staff.photo}`
    : "https://via.placeholder.com/400x400?text=PHOTO";

  const qrValue = staff.qr_base_url
    ? `${staff.qr_base_url.replace(/\/$/, "")}/${staff.employee_code}`
    : `EMP:${staff.employee_code}
NAME:${staff.full_name}
MOBILE:${staff.mobile}`;

  // ---- New fields (front) ----
  const bloodGroup = staff.blood_group || staff.bloodGroup || "—";

  // ---- New fields (back — Company Profile data, used dynamically) ----
  const companyAddress = staff.company_address || staff.address || "";
  const companyCity = staff.company_city || staff.city || "";
  const companyState = staff.company_state || staff.state || "";
  const companyPincode = staff.company_pincode || staff.pincode || "";
  const addressLine =
    [companyAddress, companyCity, companyState, companyPincode]
      .filter(Boolean)
      .join(", ") || "—";

  const companyWebsite = staff.company_website || staff.website || "—";
  const companyEmail = staff.company_email || staff.email || "—";
  const companyMobile = staff.company_mobile || staff.mobile || "—";
  const emergencyContact =
    staff.emergency_contact || staff.company_mobile || staff.mobile || "—";

  // ---- Shared style fragments ----
  const labelStyle = {
    fontSize: em(9),
    color: "#6b7280",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: em(0.7),
    lineHeight: 1.3,
  };

  const valueStyle = {
    marginTop: em(1.5),
    fontSize: em(11),
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.22,
    wordBreak: "break-word",
  };

  const cardShellStyle = {
    position: "relative",
    overflow: "hidden",
    background: "#fff",
    fontFamily: "'Inter', Arial, sans-serif",
    border: `${em(1.4)} solid ${primaryColor}2b`,
    color: "#111827",
    display: "flex",
    flexDirection: "column",
  };

  const watermarkPatternStyle = {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    opacity: 0.045,
    backgroundImage: `repeating-linear-gradient(45deg, ${primaryColor} 0, ${primaryColor} 1px, transparent 1px, transparent ${em(
      14
    )})`,
    pointerEvents: "none",
  };

  const bigWatermarkStyle = {
    position: "absolute",
    right: em(-26),
    bottom: em(46),
    fontSize: em(100),
    fontWeight: 900,
    color: primaryColor,
    opacity: 0.05,
    transform: "rotate(-25deg)",
    userSelect: "none",
    pointerEvents: "none",
    zIndex: 0,
    letterSpacing: em(-3),
  };

  return (
    <>
      <style>{`
        .pvc-wrap {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
          justify-content: center;
          padding: 24px;
        }
        .pvc-card {
          width: 340px;
          height: 540px;
          font-size: ${BASE_FONT_PX}px;
          border-radius: ${em(18)};
          box-shadow: 0 20px 46px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
        }
        .pvc-card * { box-sizing: border-box; }

        @page {
          size: 53.98mm 85.6mm;
          margin: 0;
        }
        @media print {
          .pvc-wrap {
            display: block !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .pvc-card {
            width: 53.98mm !important;
            height: 85.6mm !important;
            font-size: 2.38mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pvc-card-front {
            page-break-after: always;
          }
          .pvc-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="pvc-wrap">
        {/* ================= FRONT CARD ================= */}
        <div className="pvc-card pvc-card-front" style={cardShellStyle} id="staff-id-card-front">
          <div style={watermarkPatternStyle} />
          <div style={bigWatermarkStyle}>ID</div>

          {/* Header */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: `${em(14)} ${em(16)} ${em(50)}`,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              color: "#fff",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: em(140),
                height: em(140),
                borderRadius: "50%",
                background: "rgba(255,255,255,.08)",
                right: em(-45),
                top: em(-45),
              }}
            />
            <div
              style={{
                position: "absolute",
                width: em(70),
                height: em(70),
                borderRadius: "50%",
                background: "rgba(255,255,255,.06)",
                left: em(-24),
                bottom: em(-8),
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: em(11),
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: em(52),
                  height: em(52),
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 18px rgba(0,0,0,.25)",
                  flexShrink: 0,
                }}
              >
                {logo && (
                  <img
                    src={logo}
                    alt={companyName}
                    style={{
                      width: em(40),
                      height: em(40),
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: em(16.5),
                    fontWeight: 900,
                    lineHeight: 1.15,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {companyName}
                </div>
                <div
                  style={{
                    marginTop: em(4),
                    fontSize: em(8.5),
                    letterSpacing: em(2),
                    opacity: 0.95,
                    fontWeight: 600,
                  }}
                >
                  STAFF IDENTITY CARD
                </div>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div
            style={{
              marginTop: em(-42),
              textAlign: "center",
              position: "relative",
              zIndex: 5,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: em(108),
                height: em(108),
                margin: "0 auto",
                borderRadius: "50%",
                padding: em(4),
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 12px 26px ${primaryColor}55`,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#fff",
                  padding: em(3),
                }}
              >
                <img
                  src={photo}
                  alt={staff.full_name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Employee Name */}
          <div
            style={{
              marginTop: em(8),
              textAlign: "center",
              padding: `0 ${em(16)}`,
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: em(15.5),
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.18,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {staff.full_name}
            </div>

            <div
              style={{
                marginTop: em(5),
                display: "inline-block",
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                color: "#fff",
                padding: `${em(3.5)} ${em(12)}`,
                borderRadius: em(50),
                fontWeight: 700,
                fontSize: em(9.5),
                letterSpacing: em(0.5),
                boxShadow: `0 5px 12px ${primaryColor}44`,
              }}
            >
              {staff.designation || "STAFF"}
            </div>
          </div>

          {/* Employee Details — glass panel */}
          <div
            style={{
              margin: `${em(10)} ${em(16)} 0`,
              borderRadius: em(12),
              background: "rgba(248,250,252,.85)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              padding: em(11),
              border: "1px solid #e5e7eb",
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: em(8),
              columnGap: em(8),
              flexShrink: 0,
            }}
          >
            <div>
              <div style={labelStyle}>Employee ID</div>
              <div style={valueStyle}>{staff.employee_code}</div>
            </div>
            <div>
              <div style={labelStyle}>Blood Group</div>
              <div style={{ ...valueStyle, color: "#dc2626" }}>{bloodGroup}</div>
            </div>
            <div>
              <div style={labelStyle}>Department</div>
              <div style={valueStyle}>{staff.department || "-"}</div>
            </div>
            <div>
              <div style={labelStyle}>Designation</div>
              <div style={valueStyle}>{staff.designation || "-"}</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>Mobile</div>
              <div style={valueStyle}>{staff.mobile || "-"}</div>
            </div>
          </div>

          {/* QR Code */}
          <div
            style={{
              marginTop: em(10),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: em(7),
                borderRadius: em(12),
                boxShadow: "0 6px 14px rgba(0,0,0,.12)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ width: em(70), height: em(70) }}>
                <QRCode
                  value={qrValue}
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  viewBox="0 0 256 256"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: em(4),
                fontSize: em(8),
                color: "#6b7280",
                fontWeight: 600,
                letterSpacing: em(0.3),
              }}
            >
              Scan to Verify
            </div>
          </div>

          {/* Signature */}
          <div
            style={{
              marginTop: em(8),
              padding: `0 ${em(18)}`,
              display: "flex",
              justifyContent: "flex-end",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: "center" }}>
              {signature && (
                <img
                  src={signature}
                  alt="Signature"
                  style={{
                    width: em(74),
                    height: em(28),
                    objectFit: "contain",
                  }}
                />
              )}
              <div
                style={{
                  borderTop: "1px solid #9ca3af",
                  marginTop: em(3),
                  paddingTop: em(2),
                  fontSize: em(8),
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                Authorized Signatory
              </div>
            </div>
          </div>

          {/* Footer — pinned to bottom */}
          <div
            style={{
              marginTop: "auto",
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
              color: "#fff",
              textAlign: "center",
              padding: `${em(7)} ${em(10)}`,
              fontWeight: 700,
              letterSpacing: em(0.6),
              fontSize: em(8.5),
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            PROPERTY OF {companyName.toUpperCase()}
          </div>
        </div>
        {/* ===== FRONT CARD END ===== */}

        {/* ================= BACK CARD ================= */}
        <div className="pvc-card pvc-card-back" style={cardShellStyle} id="staff-id-card-back">
          <div style={watermarkPatternStyle} />
          <div style={bigWatermarkStyle}>ID</div>

          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: "#fff",
              padding: em(14),
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: em(15.5),
                fontWeight: 900,
                letterSpacing: em(0.5),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {companyName}
            </div>
            <div
              style={{
                marginTop: em(4),
                fontSize: em(8.5),
                opacity: 0.9,
                letterSpacing: em(1.5),
                fontWeight: 600,
              }}
            >
              STAFF VERIFICATION
            </div>
          </div>

          {/* Company Profile Info */}
          <div
            style={{
              margin: `${em(11)} ${em(16)} 0`,
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              gap: em(7),
              flexShrink: 0,
            }}
          >
            <div>
              <div style={labelStyle}>Registered Address</div>
              <div style={{ ...valueStyle, fontSize: em(9.5), fontWeight: 600, lineHeight: 1.3 }}>
                {addressLine}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: em(8) }}>
              <div>
                <div style={labelStyle}>Website</div>
                <div style={{ ...valueStyle, fontSize: em(9), color: primaryColor }}>
                  {companyWebsite}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Email</div>
                <div style={{ ...valueStyle, fontSize: em(9) }}>{companyEmail}</div>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Mobile Number</div>
              <div style={valueStyle}>{companyMobile}</div>
            </div>
          </div>

          {/* QR */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: em(10),
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: em(8),
                borderRadius: em(13),
                boxShadow: "0 8px 18px rgba(0,0,0,.12)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ width: em(84), height: em(84) }}>
                <QRCode
                  value={qrValue}
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  viewBox="0 0 256 256"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: em(6),
                fontWeight: 700,
                fontSize: em(9.5),
                color: "#374151",
              }}
            >
              Scan QR to Verify Employee
            </div>
          </div>

          {/* Terms */}
          <div
            style={{
              margin: `${em(10)} ${em(16)} 0`,
              padding: em(10),
              background: "rgba(248,250,252,.85)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              borderRadius: em(12),
              border: "1px solid #e5e7eb",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: em(5),
                color: primaryColor,
                fontSize: em(9.5),
              }}
            >
              Terms &amp; Conditions
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: em(13),
                fontSize: em(7.8),
                lineHeight: 1.5,
                color: "#374151",
              }}
            >
              <li>This card remains the property of {companyName}.</li>
              <li>Carry this ID card during duty hours.</li>
              <li>Loss of this card must be reported immediately.</li>
              <li>Misuse of this card is strictly prohibited.</li>
            </ul>
          </div>

          {/* If Found + Emergency Contact */}
          <div
            style={{
              margin: `${em(9)} ${em(16)} 0`,
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                ...labelStyle,
                fontSize: em(8.5),
                color: primaryColor,
                fontWeight: 800,
              }}
            >
              If Found, Please Return To
            </div>
            <div
              style={{
                ...valueStyle,
                fontSize: em(9),
                fontWeight: 600,
                marginTop: em(2),
                lineHeight: 1.3,
              }}
            >
              {companyName}, {addressLine}
            </div>

            <div style={{ marginTop: em(7) }}>
              <div style={labelStyle}>Emergency Contact</div>
              <div style={{ ...valueStyle, color: primaryColor }}>{emergencyContact}</div>
            </div>
          </div>

          {/* Footer — pinned to bottom */}
          <div
            style={{
              marginTop: "auto",
              padding: em(10),
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
              color: "#fff",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <div style={{ fontWeight: 800, letterSpacing: em(0.6), fontSize: em(9.5) }}>
              THANK YOU
            </div>
            <div style={{ marginTop: em(3), fontSize: em(8), opacity: 0.9 }}>
              Please return this card if found.
            </div>
          </div>
        </div>
        {/* ===== BACK CARD END ===== */}
      </div>
    </>
  );
}
