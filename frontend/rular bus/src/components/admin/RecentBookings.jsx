export default function RecentBookings({ bookings = [] }) {
  const cellStyle = {
    padding: 12,
    borderBottom: "1px solid var(--erp-border)",
    color: "var(--erp-text)",
    textAlign: "left",
  };

  return (
    <section
      style={{
        marginTop: 30,
        padding: 20,
        background: "var(--erp-surface)",
        border: "1px solid var(--erp-border)",
        borderRadius: "var(--erp-radius-lg)",
        boxShadow: "var(--erp-shadow-sm)",
      }}
    >
      <h3
        style={{
          margin: "0 0 20px",
          color: "var(--erp-heading)",
        }}
      >
        📚 Recent Bookings
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 650,
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--erp-primary)",
                color: "#fff",
              }}
            >
              <th style={{ padding: 12, textAlign: "left" }}>Booking ID</th>
              <th style={{ padding: 12, textAlign: "left" }}>Passenger</th>
              <th style={{ padding: 12, textAlign: "left" }}>Route</th>
              <th style={{ padding: 12, textAlign: "left" }}>Seat</th>
              <th style={{ padding: 12, textAlign: "left" }}>Status</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    ...cellStyle,
                    padding: 25,
                    textAlign: "center",
                    color: "var(--erp-text-secondary)",
                  }}
                >
                  No Bookings Found
                </td>
              </tr>
            ) : (
              bookings.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>{item.passenger_name}</td>
                  <td style={cellStyle}>
                    {item.source} ➜ {item.destination}
                  </td>
                  <td style={cellStyle}>{item.seat_number}</td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "#22c55e",
                      fontWeight: 700,
                    }}
                  >
                    {item.booking_status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
