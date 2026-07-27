export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "The booking was simple and the journey felt safe and comfortable from start to finish.",
      name: "Anjali Sharma",
      route: "Lucknow to Delhi",
      initial: "A",
    },
    {
      quote:
        "Rular Bus made my overnight journey feel much easier. The experience was reliable and reassuring.",
      name: "Rohit Verma",
      route: "Delhi to Kanpur",
      initial: "R",
    },
    {
      quote:
        "Whenever I travel home, I want a service I can trust. Rular Bus has become my preferred choice.",
      name: "Sana Khan",
      route: "Gorakhpur to Lucknow",
      initial: "S",
    },
  ];

  return (
    <section className="public-section testimonial-section">
      <div className="public-section-header">
        <span>Stories from the road</span>
        <h2>Journeys remembered with a smile</h2>
        <p>
          Real experiences from passengers who trusted Rular Bus with their
          important journeys.
        </p>
      </div>

      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <article className="testimonial-card" key={item.name}>
            <div className="testimonial-quote-mark">“</div>

            <p className="testimonial-quote">{item.quote}</p>

            <div className="testimonial-person">
              <div className="testimonial-avatar">{item.initial}</div>

              <div>
                <strong>{item.name}</strong>
                <span>{item.route}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
