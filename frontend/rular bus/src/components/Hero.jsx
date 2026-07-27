export default function Hero() {
  return (
    <section className="worker-hero">
      <div className="worker-hero-content">
        <div className="worker-hero-badge">
          🏠 यूपी-बिहार के यात्रियों का भरोसेमंद सफर साथी
        </div>

        <h1>
          घर जाने की टिकट,
          <span> अब और आसान</span>
        </h1>

        <p>
          काम के लिए आप चाहे कितनी भी दूर हों, Rular Bus आपको
          सुरक्षित, आराम से और भरोसे के साथ अपनों तक पहुँचाने में
          साथ है।
        </p>

        <div className="worker-hero-trust">
          <span>🛡️ सुरक्षित यात्रा</span>
          <span>💰 सही किराया</span>
          <span>☎️ फोन पर मदद</span>
        </div>
      </div>

      <div className="worker-hero-visual" aria-hidden="true">
        <div className="worker-sun" />
        <div className="worker-home-icon">🏠</div>
        <div className="worker-route-line" />
        <div className="worker-bus">🚌</div>
        <div className="worker-traveller">🧳</div>
      </div>
    </section>
  );
}
