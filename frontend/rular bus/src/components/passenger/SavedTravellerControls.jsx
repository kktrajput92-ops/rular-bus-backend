const CATEGORY_LABELS = {
  INFANT: "Infant",
  CHILD: "Child",
  ADULT: "Adult",
  SENIOR: "Senior",
};

const RELATIONSHIP_LABELS = {
  SELF: "Self",
  SPOUSE: "Spouse",
  SON: "Son",
  DAUGHTER: "Daughter",
  FATHER: "Father",
  MOTHER: "Mother",
  BROTHER: "Brother",
  SISTER: "Sister",
  RELATIVE: "Relative",
  FRIEND: "Friend",
  OTHER: "Other",
};

function SavedTravellerControls({
  passenger,
  index,
  savedTravellers,
  familyLoading,
  familyLoaded,
  contactReady,
  onModeChange,
  onSavedTravellerSelect,
}) {
  const mode =
    passenger.traveller_mode || "NEW";

  return (
    <div
      style={{
        padding: 14,
        marginBottom: 18,
        borderRadius: 14,
        border: "1px solid #cfe0f5",
        background:
          "linear-gradient(135deg,#f8fbff,#eef6ff)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <strong
            style={{
              color: "#102a56",
            }}
          >
            Traveller Source
          </strong>

          <small
            style={{
              display: "block",
              marginTop: 3,
              color: "#64748b",
            }}
          >
            Saved family member चुनें या नया यात्री जोड़ें।
          </small>
        </div>

        {passenger.saved_traveller_id && (
          <span
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "#dcfce7",
              color: "#166534",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Saved Traveller ✓
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 9,
          marginBottom:
            mode === "SAVED"
              ? 13
              : 0,
        }}
      >
        <button
          type="button"
          onClick={() =>
            onModeChange(index, "SAVED")
          }
          style={{
            minHeight: 44,
            padding: "10px 12px",
            borderRadius: 10,
            border:
              mode === "SAVED"
                ? "1px solid #0B3D91"
                : "1px solid #cbd5e1",
            background:
              mode === "SAVED"
                ? "#0B3D91"
                : "#ffffff",
            color:
              mode === "SAVED"
                ? "#ffffff"
                : "#334155",
            fontWeight: 800,
          }}
        >
          Saved Passenger
        </button>

        <button
          type="button"
          onClick={() =>
            onModeChange(index, "NEW")
          }
          style={{
            minHeight: 44,
            padding: "10px 12px",
            borderRadius: 10,
            border:
              mode === "NEW"
                ? "1px solid #0B3D91"
                : "1px solid #cbd5e1",
            background:
              mode === "NEW"
                ? "#0B3D91"
                : "#ffffff",
            color:
              mode === "NEW"
                ? "#ffffff"
                : "#334155",
            fontWeight: 800,
          }}
        >
          New Passenger
        </button>
      </div>

      {mode === "SAVED" && (
        <>
          {!contactReady ? (
            <div
              style={{
                padding: 11,
                borderRadius: 9,
                color: "#92400e",
                background: "#fffbeb",
                border:
                  "1px solid #fde68a",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Saved travellers देखने के लिए यात्री अकाउंट में लॉगिन करें।
            </div>
          ) : familyLoading ? (
            <div
              style={{
                padding: 11,
                color: "#475569",
              }}
            >
              Saved travellers load हो रहे हैं...
            </div>
          ) : familyLoaded &&
            savedTravellers.length === 0 ? (
            <div
              style={{
                padding: 11,
                borderRadius: 9,
                color: "#475569",
                background: "#ffffff",
                border:
                  "1px dashed #cbd5e1",
              }}
            >
              आपके अकाउंट में कोई saved traveller नहीं मिला। New Passenger चुनकर यात्री सेव करें।
            </div>
          ) : (
            <select
              value={
                passenger.saved_traveller_id ||
                ""
              }
              onChange={(event) =>
                onSavedTravellerSelect(
                  index,
                  event.target.value
                )
              }
              style={{
                width: "100%",
                minHeight: 50,
                padding: 12,
                borderRadius: 10,
                border:
                  "1px solid #9dbfe8",
                background: "#ffffff",
              }}
            >
              <option value="">
                Select Saved Traveller
              </option>

              {savedTravellers.map(
                (traveller) => (
                  <option
                    key={traveller.id}
                    value={traveller.id}
                  >
                    {traveller.full_name}
                    {" • "}
                    {RELATIONSHIP_LABELS[
                      traveller.relationship
                    ] ||
                      traveller.relationship}
                    {" • "}
                    {CATEGORY_LABELS[
                      traveller.passenger_category
                    ] ||
                      traveller.passenger_category}
                    {" • Age "}
                    {traveller.age}
                  </option>
                )
              )}
            </select>
          )}
        </>
      )}
    </div>
  );
}

export default SavedTravellerControls;
