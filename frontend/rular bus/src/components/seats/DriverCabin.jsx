export default function DriverCabin({
  showDoor = true,
  deck = "LOWER",
}) {
  return (
    <>
      <div className="coach-front-label">
        FRONT
      </div>

      <div className="driver-cabin">
        <div className="conductor-zone">
          {showDoor ? (
            <>
              <span className="cabin-main-icon">
                🚪
              </span>

              <div>
                <strong>
                  CONDUCTOR
                </strong>

                <small>
                  Door
                </small>
              </div>
            </>
          ) : (
            <>
              <span className="cabin-main-icon">
                🪟
              </span>

              <div>
                <strong>
                  FRONT WINDOW
                </strong>

                <small>
                  Upper Deck
                </small>
              </div>
            </>
          )}
        </div>

        <div className="cabin-center">
          <span>
            {deck === "UPPER"
              ? "PANORAMIC VIEW"
              : "ENTRY AREA"}
          </span>
        </div>

        <div className="driver-zone">
          <div>
            <strong>
              DRIVER
            </strong>

            <small>
              Cabin
            </small>
          </div>

          <span className="steering-wheel">
            <i />
          </span>
        </div>
      </div>

      <div className="coach-window-strip">
        <span />
        <span />
        <span />
        <span />
      </div>
    </>
  );
}
