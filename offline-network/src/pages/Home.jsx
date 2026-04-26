import { Link } from "react-router-dom";
import { formatTimestamp } from "../lib/mesh";

function Home({ state, stats }) {
  const criticalMsgs = state.messages.filter((m) => m.priority === "critical");

  return (
    <div className="stack-page">
      <section className="hero-panel">
        <h1>Critical updates when infrastructure stops.</h1>
        <p className="lead">
          Relay compact bundles via QR or Hardware Sync. No servers. No trace.
        </p>

        <div className="signal-card">
          <div className="signal-grid">
            <div>
              <span>Vault</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>Hops</span>
              <strong>{stats.relayed}</strong>
            </div>
            <div>
              <span>Alerts</span>
              <strong style={{ color: stats.critical > 0 ? 'var(--red)' : 'inherit' }}>
                {stats.critical}
              </strong>
            </div>
            <div>
              <span>Expiry</span>
              <strong>{stats.expiringSoon}</strong>
            </div>
          </div>
        </div>

        <div className="action-row" style={{ marginTop: 20 }}>
          <Link to="/create" className="primary-button">New Message</Link>
          <Link to="/qr" className="secondary-button">Scan QR Drop</Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="info-panel">
          <h2>Security Design</h2>
          <ul className="bullet-list" style={{ fontSize: '0.8rem' }}>
            <li>No accounts or persistent identity.</li>
            <li>Messages auto-expire and are pruned.</li>
            <li>Works entirely offline.</li>
          </ul>
        </article>
      </section>

      {state.syncLog.length > 0 && (
        <section className="info-panel">
          <h2>Recent Activity</h2>
          <div className="sync-log">
            {state.syncLog.slice(0, 3).map((entry) => (
              <div key={entry.id} className="sync-entry">
                <span className={`sync-direction ${entry.direction}`}>{entry.direction}</span>
                <span style={{ fontSize: "0.75rem" }}>{entry.mode}</span>
                <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>
                  {formatTimestamp(entry.ts)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
}

export default Home;
