import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/api";
import AdminSidebar from "../components/admin/AdminSidebar";
import "./AdminCustomerIntelligence.css";

const EMPTY_OVERVIEW = {
  total_searches: 0,
  unique_users: 0,
  searches_with_buses: 0,
  no_bus_searches: 0,
  converted_searches: 0,
  mobile_web_searches: 0,
  desktop_web_searches: 0,
  android_app_searches: 0,
  ios_app_searches: 0,
  location_granted_searches: 0,
  location_denied_searches: 0,
  conversion_rate: 0,
  no_bus_rate: 0,
};

const toNumber = (value) => Number(value || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(
    toNumber(value)
  );

const formatPercent = (value) =>
  `${toNumber(value).toFixed(2)}%`;

const platformLabel = (channel) => {
  const labels = {
    MOBILE_WEB: "Mobile Web",
    DESKTOP_WEB: "Desktop Web",
    ANDROID_APP: "Android App",
    IOS_APP: "iOS App",
    COUNTER: "Counter",
    AGENT: "Agent",
    CONDUCTOR: "Conductor",
    ADMIN: "Admin",
    OTHER: "Other",
  };

  return labels[channel] || channel || "Unknown";
};

const consentLabel = (status) => {
  const labels = {
    GRANTED: "Granted",
    DENIED: "Denied",
    UNAVAILABLE: "Unavailable",
    TIMEOUT: "Timeout",
  };

  return labels[status] || status || "Unknown";
};

export default function AdminCustomerIntelligence() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] =
    useState(EMPTY_OVERVIEW);
  const [platforms, setPlatforms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [noBusDemand, setNoBusDemand] = useState([]);
  const [consent, setConsent] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const requestConfig = {
      timeout: 12000,
    };

    try {
      const query = `days=${days}`;

      const results = await Promise.allSettled([
        api.get(
          `/customer-analytics/overview?${query}`,
          requestConfig
        ),
        api.get(
          `/customer-analytics/platforms?${query}`,
          requestConfig
        ),
        api.get(
          `/customer-analytics/locations?${query}&limit=20`,
          requestConfig
        ),
        api.get(
          `/customer-analytics/routes?${query}&limit=20`,
          requestConfig
        ),
        api.get(
          `/customer-analytics/no-bus-demand?${query}&limit=20`,
          requestConfig
        ),
        api.get(
          `/customer-analytics/location-consent-summary?${query}`,
          requestConfig
        ),
      ]);

      const [
        overviewResult,
        platformsResult,
        locationsResult,
        routesResult,
        noBusResult,
        consentResult,
      ] = results;

      if (overviewResult.status === "fulfilled") {
        setOverview(
          overviewResult.value.data?.overview ||
            EMPTY_OVERVIEW
        );
      }

      if (platformsResult.status === "fulfilled") {
        setPlatforms(
          platformsResult.value.data?.platforms || []
        );
      }

      if (locationsResult.status === "fulfilled") {
        setLocations(
          locationsResult.value.data?.locations || []
        );
      }

      if (routesResult.status === "fulfilled") {
        setRoutes(
          routesResult.value.data?.routes || []
        );
      }

      if (noBusResult.status === "fulfilled") {
        setNoBusDemand(
          noBusResult.value.data?.no_bus_demand || []
        );
      }

      if (consentResult.status === "fulfilled") {
        setConsent(
          consentResult.value.data?.consent || []
        );
      }

      const failedRequests = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedRequests.length === results.length) {
        throw new Error(
          "All customer analytics requests failed."
        );
      }

      if (failedRequests.length > 0) {
        console.error(
          "Some analytics requests failed:",
          failedRequests.map(
            (result) => result.reason
          )
        );

        setError(
          `${failedRequests.length} analytics section(s) could not be loaded. Other available data is shown.`
        );
      }

      setLastUpdated(new Date());
    } catch (requestError) {
      console.error(
        "Customer intelligence dashboard failed:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Customer intelligence data could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalPlatformUsers = useMemo(
    () =>
      platforms.reduce(
        (total, item) =>
          total + toNumber(item.unique_users),
        0
      ),
    [platforms]
  );

  const totalConsentUsers = useMemo(
    () =>
      consent.reduce(
        (total, item) =>
          total + toNumber(item.unique_users),
        0
      ),
    [consent]
  );

  const cards = [
    {
      label: "Unique Users",
      value: formatNumber(overview.unique_users),
      icon: "👥",
      tone: "blue",
      helper: `Last ${days} days`,
    },
    {
      label: "Total Searches",
      value: formatNumber(overview.total_searches),
      icon: "🔎",
      tone: "purple",
      helper: "Passenger search activity",
    },
    {
      label: "Mobile Web",
      value: formatNumber(
        overview.mobile_web_searches
      ),
      icon: "📱",
      tone: "green",
      helper: "Search events",
    },
    {
      label: "Desktop Web",
      value: formatNumber(
        overview.desktop_web_searches
      ),
      icon: "💻",
      tone: "cyan",
      helper: "Search events",
    },
    {
      label: "Android App",
      value: formatNumber(
        overview.android_app_searches
      ),
      icon: "🤖",
      tone: "lime",
      helper: "Available after app integration",
    },
    {
      label: "iOS App",
      value: formatNumber(
        overview.ios_app_searches
      ),
      icon: "🍎",
      tone: "slate",
      helper: "Available after app integration",
    },
    {
      label: "No Bus Searches",
      value: formatNumber(
        overview.no_bus_searches
      ),
      icon: "⚠️",
      tone: "orange",
      helper: formatPercent(
        overview.no_bus_rate
      ),
    },
    {
      label: "Booking Conversion",
      value: formatPercent(
        overview.conversion_rate
      ),
      icon: "🎫",
      tone: "pink",
      helper: `${formatNumber(
        overview.converted_searches
      )} converted searches`,
    },
  ];

  return (
    <div className="customer-intelligence-shell">
      <AdminSidebar />

      <main className="customer-intelligence-main">
        <header className="customer-intelligence-header">
          <div>
            <span className="customer-intelligence-eyebrow">
              CUSTOMER ANALYTICS
            </span>

            <h1>Customer Intelligence</h1>

            <p>
              Location-wise passengers, platform usage,
              route demand and no-service opportunities.
            </p>
          </div>

          <div className="customer-intelligence-actions">
            <label>
              <span>Analytics Period</span>

              <select
                value={days}
                onChange={(event) =>
                  setDays(Number(event.target.value))
                }
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={180}>Last 180 Days</option>
                <option value={365}>Last 365 Days</option>
              </select>
            </label>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="customer-intelligence-alert error">
            <strong>Dashboard load failed</strong>
            <span>{error}</span>
          </div>
        )}

        {lastUpdated && !error && (
          <div className="customer-intelligence-updated">
            Last updated:{" "}
            {lastUpdated.toLocaleString("en-IN")}
          </div>
        )}

        <section className="customer-intelligence-cards">
          {cards.map((card) => (
            <article
              key={card.label}
              className={`customer-intelligence-card tone-${card.tone}`}
            >
              <div className="customer-intelligence-card-icon">
                {card.icon}
              </div>

              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.helper}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="customer-intelligence-grid two-column">
          <article className="customer-intelligence-panel">
            <div className="customer-intelligence-panel-header">
              <div>
                <span>PLATFORM MIX</span>
                <h2>App vs Web Usage</h2>
              </div>

              <strong>
                {formatNumber(totalPlatformUsers)} users
              </strong>
            </div>

            <div className="customer-intelligence-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Device</th>
                    <th>OS</th>
                    <th>Users</th>
                    <th>Searches</th>
                    <th>Conversions</th>
                  </tr>
                </thead>

                <tbody>
                  {platforms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        No platform analytics available.
                      </td>
                    </tr>
                  ) : (
                    platforms.map((item, index) => (
                      <tr
                        key={`${item.channel}-${item.device_type}-${index}`}
                      >
                        <td>
                          <span className="platform-badge">
                            {platformLabel(item.channel)}
                          </span>
                        </td>
                        <td>{item.device_type}</td>
                        <td>{item.operating_system}</td>
                        <td>
                          {formatNumber(item.unique_users)}
                        </td>
                        <td>
                          {formatNumber(item.total_searches)}
                        </td>
                        <td>
                          {formatNumber(
                            item.converted_searches
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="customer-intelligence-panel">
            <div className="customer-intelligence-panel-header">
              <div>
                <span>LOCATION CONSENT</span>
                <h2>Location Permission Usage</h2>
              </div>

              <strong>
                {formatNumber(totalConsentUsers)} users
              </strong>
            </div>

            <div className="consent-list">
              {consent.length === 0 ? (
                <div className="empty-block">
                  No consent events available.
                </div>
              ) : (
                consent.map((item, index) => (
                  <div
                    className="consent-row"
                    key={`${item.consent_status}-${item.channel}-${index}`}
                  >
                    <div>
                      <span
                        className={`consent-status status-${String(
                          item.consent_status
                        ).toLowerCase()}`}
                      >
                        {consentLabel(
                          item.consent_status
                        )}
                      </span>

                      <small>
                        {platformLabel(item.channel)}
                      </small>
                    </div>

                    <div>
                      <strong>
                        {formatNumber(item.unique_users)}
                      </strong>
                      <small>
                        {formatNumber(item.total_events)} events
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="customer-intelligence-panel">
          <div className="customer-intelligence-panel-header">
            <div>
              <span>GEOGRAPHY</span>
              <h2>Top Passenger Locations</h2>
            </div>

            <p>
              Ranked by unique search users.
            </p>
          </div>

          <div className="customer-intelligence-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>State</th>
                  <th>Unique Users</th>
                  <th>Total Searches</th>
                  <th>Bus Found</th>
                  <th>No Bus</th>
                  <th>Converted</th>
                </tr>
              </thead>

              <tbody>
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No location analytics available.
                    </td>
                  </tr>
                ) : (
                  locations.map((item, index) => (
                    <tr
                      key={
                        item.location_id ||
                        `${item.location_name}-${index}`
                      }
                    >
                      <td>
                        <strong>
                          {item.location_name ||
                            "Unknown location"}
                        </strong>

                        {item.latitude &&
                          item.longitude && (
                            <small className="coordinate-text">
                              {item.latitude},{" "}
                              {item.longitude}
                            </small>
                          )}
                      </td>
                      <td>{item.state_name || "—"}</td>
                      <td>
                        {formatNumber(item.unique_users)}
                      </td>
                      <td>
                        {formatNumber(item.total_searches)}
                      </td>
                      <td>
                        {formatNumber(
                          item.searches_with_buses
                        )}
                      </td>
                      <td>
                        <span className="danger-number">
                          {formatNumber(
                            item.no_bus_searches
                          )}
                        </span>
                      </td>
                      <td>
                        {formatNumber(
                          item.converted_searches
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="customer-intelligence-grid two-column">
          <article className="customer-intelligence-panel">
            <div className="customer-intelligence-panel-header">
              <div>
                <span>ROUTE PERFORMANCE</span>
                <h2>Top Searched Routes</h2>
              </div>
            </div>

            <div className="customer-intelligence-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Users</th>
                    <th>Searches</th>
                    <th>No Bus</th>
                    <th>Conversion</th>
                  </tr>
                </thead>

                <tbody>
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        No route analytics available.
                      </td>
                    </tr>
                  ) : (
                    routes.map((item, index) => (
                      <tr
                        key={`${item.source_text}-${item.destination_text}-${index}`}
                      >
                        <td>
                          <strong>
                            {item.source_text}
                          </strong>
                          <span className="route-arrow">
                            →
                          </span>
                          <strong>
                            {item.destination_text}
                          </strong>
                        </td>
                        <td>
                          {formatNumber(item.unique_users)}
                        </td>
                        <td>
                          {formatNumber(item.total_searches)}
                        </td>
                        <td>
                          <span className="danger-number">
                            {formatNumber(
                              item.no_bus_searches
                            )}
                          </span>
                        </td>
                        <td>
                          {formatPercent(
                            item.conversion_rate
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="customer-intelligence-panel danger-panel">
            <div className="customer-intelligence-panel-header">
              <div>
                <span>BUSINESS OPPORTUNITY</span>
                <h2>No-Bus Demand</h2>
              </div>

              <p>
                Routes where passengers searched but no
                schedule was found.
              </p>
            </div>

            <div className="no-bus-list">
              {noBusDemand.length === 0 ? (
                <div className="empty-block">
                  No unmet route demand found.
                </div>
              ) : (
                noBusDemand.map((item, index) => (
                  <div
                    className="no-bus-item"
                    key={`${item.source_text}-${item.destination_text}-${index}`}
                  >
                    <div>
                      <strong>
                        {item.source_text}
                      </strong>
                      <span>→</span>
                      <strong>
                        {item.destination_text}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {formatNumber(
                          item.affected_users
                        )}{" "}
                        users
                      </span>

                      <strong>
                        {formatNumber(
                          item.no_bus_searches
                        )}{" "}
                        searches
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>


      </main>
    </div>
  );
}
