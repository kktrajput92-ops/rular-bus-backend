export default function BusContainer({
  children,
  deck = "LOWER",
}) {
  return (
    <section
      className={`premium-bus-shell ${
        deck === "UPPER"
          ? "upper-coach"
          : "lower-coach"
      }`}
    >
      <div className="bus-roof-highlight" />

      <div className="coach-deck-name">
        <span>
          {deck === "UPPER"
            ? "UPPER COACH"
            : "LOWER COACH"}
        </span>
      </div>

      <div className="premium-bus-body">
        <div className="bus-side-window left" />
        <div className="bus-side-window right" />

        {children}

        <div className="coach-rear-section">
          <div className="rear-light left" />

          <span>REAR</span>

          <div className="rear-light right" />
        </div>
      </div>

      <div className="bus-wheel left">
        <span />
      </div>

      <div className="bus-wheel right">
        <span />
      </div>
    </section>
  );
}
