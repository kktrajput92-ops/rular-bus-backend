export default function WhyChooseUs() {
  const features = [
    {
      icon: "🛡️",
      title: "Safe Journey",
      desc: "Verified buses and trusted operators.",
    },
    {
      icon: "⚡",
      title: "Fast Booking",
      desc: "Book your ticket in just a few clicks.",
    },
    {
      icon: "📍",
      title: "Live Tracking",
      desc: "Track your bus in real time.",
    },
    {
      icon: "🎧",
      title: "24×7 Support",
      desc: "We're here whenever you need help.",
    },
  ];

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#0B3D91",
          marginBottom: "20px",
        }}
      >
        🛡️ Why Choose Rular Bus?
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: "20px",
        }}
      >
        {features.map((item) => (
          <div
            key={item.title}
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "14px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            }}
          >
            <div style={{ fontSize: "34px" }}>{item.icon}</div>

            <h3>{item.title}</h3>

            <p
              style={{
                color: "#666",
                fontSize: "14px",
              }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
