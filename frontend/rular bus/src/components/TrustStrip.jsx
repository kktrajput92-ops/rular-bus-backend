export default function TrustStrip() {
  const items = [
    {
      icon: "🛡️",
      title: "Safety first",
      text: "Verified operators and dependable journeys.",
    },
    {
      icon: "💺",
      title: "Travel in comfort",
      text: "A smoother experience from booking to arrival.",
    },
    {
      icon: "📍",
      title: "Stay informed",
      text: "Helpful journey updates when you need them.",
    },
    {
      icon: "🤝",
      title: "Support that cares",
      text: "Real assistance throughout your journey.",
    },
  ];

  return (
    <section className="trust-strip">
      {items.map((item) => (
        <article className="trust-strip-item" key={item.title}>
          <div className="trust-strip-icon">{item.icon}</div>

          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
