export default function WhyChooseUs() {
  const features = [
    {
      icon: "🛡️",
      title: "सुरक्षित यात्रा",
      text: "भरोसेमंद बस और सत्यापित ऑपरेटर।",
    },
    {
      icon: "💺",
      title: "आरामदायक सीट",
      text: "लंबे सफर में भी आराम का ध्यान।",
    },
    {
      icon: "💰",
      title: "साफ और सही किराया",
      text: "बुकिंग से पहले पूरा किराया देखें।",
    },
    {
      icon: "🎫",
      title: "फोन में टिकट",
      text: "टिकट सीधे आपके मोबाइल में मिलेगा।",
    },
    {
      icon: "📍",
      title: "सफर की जानकारी",
      text: "बस और यात्रा की जरूरी जानकारी साफ मिलेगी।",
    },
    {
      icon: "☎️",
      title: "मदद हमेशा साथ",
      text: "बुकिंग में परेशानी हो तो सहायता लें।",
    },
  ];

  return (
    <section className="worker-section">
      <div className="worker-section-heading">
        <span>हर यात्री का भरोसा</span>
        <h2>Rular Bus क्यों चुनें?</h2>
        <p>आसान बुकिंग, सही जानकारी और सुरक्षित सफर।</p>
      </div>

      <div className="worker-benefit-grid">
        {features.map((feature) => (
          <article className="worker-benefit-card" key={feature.title}>
            <div className="worker-benefit-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
