import { Link } from "react-router-dom";
import { formatTimestamp } from "../lib/mesh";

function Home({ state, stats }) {
  const criticalMsgs = state.messages.filter((m) => m.priority === "critical");

  return (
    <div className="stack-page">
      {criticalMsgs.length > 0 && (
        <div className="alert-banner">
          <span className="pulse-dot red" />
          <strong>{criticalMsgs.length} critical alert{criticalMsgs.length > 1 ? "s" : ""} active</strong>
          <span style={{ marginLeft: "auto", fontSize: "0.82rem" }}>
            <Link to="/alerts" style={{ color: "var(--red)", textDecoration: "underline" }}>View →</Link>
          </span>
        </div>
      )}

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Offline mesh communication</p>
          <h1>Critical updates keep moving when infrastructure stops.</h1>
          <p className="lead">
            Each device stores a local slice, relays compact bundles during encounters, and
            leaves scannable QR drops in shared spaces. No accounts. No servers. No trace.
          </p>
          <div className="action-row" style={{ marginTop: 16 }}>
            <Link to="/create" className="primary-button">Create update</Link>
            <Link to="/connect" className="secondary-button">Connect to peer</Link>
          </div>
        </div>
        <div className="signal-card">
          <span className="signal-label">This node</span>
          <strong style={{ fontSize: "1.2rem", fontFamily: "'JetBrains Mono', monospace" }}>
            {state.nodeToken}
          </strong>
          <div className="signal-grid">
            <div>
              <span>Messages</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>Relayed</span>
              <strong>{stats.relayed}</strong>
            </div>
            <div>
              <span>Expiring</span>
              <strong>{stats.expiringSoon}</strong>
            </div>
            <div>
              <span>Local</span>
              <strong>{stats.local}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-row">
        <div className="stat-card critical">
          <div className="stat-value">{stats.critical}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-value">{stats.high}</div>
          <div className="stat-label">High</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-value">{stats.relayed}</div>
          <div className="stat-label">Relayed</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      <section className="panel-grid">
        <article className="info-panel">
          <h2>Demo Flow</h2>
          <ol className="steps">
            <li>Create an alert, safe-route update, or community drop.</li>
            <li>Open <strong>QR Drop</strong> to generate a scannable payload card.</li>
            <li>Another device scans the QR → messages imported (hop +1).</li>
            <li>Open <strong>Connect</strong> for live WebRTC peer sync or clipboard relay.</li>
            <li>Third device receives via relay → multi-hop propagation complete.</li>
          </ol>
        </article>

        <article className="info-panel">
          <h2>Security Design</h2>
          <ul className="bullet-list">
            <li>No accounts, no login, no persistent identity.</li>
            <li>Node tokens regenerated each session.</li>
            <li>Message origins use random one-time tokens.</li>
            <li>Messages auto-expire and are pruned locally.</li>
            <li>Bundles carry only compact records, not full history.</li>
            <li>App works entirely offline after first load.</li>
          </ul>
        </article>
      </section>

      {state.syncLog.length > 0 && (
        <section className="info-panel">
          <h2>Recent Sync Activity</h2>
          <div className="sync-log">
            {state.syncLog.slice(0, 6).map((entry) => (
              <div key={entry.id} className="sync-entry">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`sync-direction ${entry.direction}`}>{entry.direction}</span>
                  <span>{entry.mode}</span>
                </div>
                <span style={{ color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}>
                  {entry.direction === "in"
                    ? `+${entry.importedCount} new, ${entry.updatedCount} updated`
                    : `${entry.exportedCount || 0} sent`}
                </span>
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

export default Home;
