export default function RecentBookings({ bookings = [] }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
        marginTop: 30,
      }}
    >
      <h3
        style={{
          marginBottom: 20,
          color: "#0B3D91",
        }}
      >
        📚 Recent Bookings
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#0B3D91",
                color: "#fff",
              }}
            >
              <th style={{ padding: 12 }}>Booking ID</th>
              <th style={{ padding: 12 }}>Passenger</th>
              <th style={{ padding: 12 }}>Route</th>
              <th style={{ padding: 12 }}>Seat</th>
              <th style={{ padding: 12 }}>Status</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: 25,
                    textAlign: "center",
                  }}
                >
                  No Bookings Found
                </td>
              </tr>
            ) : (
              bookings.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: 12 }}>{item.id}</td>
                  <td style={{ padding: 12 }}>{item.passenger_name}</td>
                  <td style={{ padding: 12 }}>
                    {item.source} ➜ {item.destination}
                  </td>
                  <td style={{ padding: 12 }}>{item.seat_number}</td>
                  <td
                    style={{
                      padding: 12,
                      color: "#198754",
                      fontWeight: "bold",
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
    </div>
  );
}
