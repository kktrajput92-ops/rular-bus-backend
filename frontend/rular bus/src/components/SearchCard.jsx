export default function SearchCard({
  source,
  destination,
  journeyDate,
  setSource,
  setDestination,
  setJourneyDate,
  searchBus,
  loading,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "25px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        margin: "20px auto",
        maxWidth: "700px",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          color: "#0B3D91",
          marginBottom: "20px",
        }}
      >
        Search Your Journey
      </h3>

      <input
        type="text"
        placeholder="📍 From City"
   value={source}
onChange={(e) =>
 setSource(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      <input
        type="text"
        placeholder="📍 To City"
value={destination}
onChange={(e) => 
setDestination(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      <input
        type="date"
value={journeyDate}
onChange={(e) =>
 setJourneyDate(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

     <button
  onClick={searchBus}
  disabled={loading}
  style={{
    width: "100%",
    padding: "14px",
    background: "#0B3D91",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  {loading ? "Searching..." : "🔍 Search Buses"}
</button>
    </div>
  );
}

