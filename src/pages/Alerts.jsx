import { useState } from "react";
import { formatRelativeTime } from "../lib/mesh";

const ALERT_TEMPLATES = [
  { title: "Area unsafe — avoid", body: "Active danger reported in this area. Seek alternative routes.", priority: "critical" },
  { title: "Checkpoint relocated", body: "The checkpoint at this location has moved. Route may be passable.", priority: "high" },
  { title: "Medical emergency", body: "Medical assistance needed urgently at this location.", priority: "critical" },
  { title: "All clear", body: "Previously reported danger has passed. Area appears safe for now.", priority: "medium" },
  { title: "Water available", body: "Clean water distribution at this location. Bring containers.", priority: "high" },
  { title: "Shelter open", body: "Emergency shelter accepting people at this location.", priority: "high" },
];

function Alerts({ messages, onCreate }) {
  const [area, setArea] = useState("");
  const [notice, setNotice] = useState("");

  const criticalMessages = messages.filter((m) => m.priority === "critical");
  const highMessages = messages.filter((m) => m.priority === "high" && m.kind === "alert");

  function quickAlert(tpl) {
    if (!area.trim()) {
      setNotice("Enter an area name first.");
      return;
    }
    onCreate({
      kind: "alert",
      title: tpl.title,
      body: tpl.body,
      area: area.trim(),
      priority: tpl.priority,
      ttlHours: "4",
    });
    setNotice(`Alert created: "${tpl.title}" for ${area.trim()}`);
  }

  return (
    <section className="stack-page">
      <div className="panel-heading">
        <p className="eyebrow">Emergency broadcast</p>
        <h1>Alerts & urgent messages</h1>
        <p className="lead">
          Quickly create and broadcast critical alerts. These are prioritized in all relay bundles.
        </p>
      </div>

      {criticalMessages.length > 0 && (
        <div className="info-panel" style={{ borderColor: "rgba(239,68,68,0.25)" }}>
          <h2 style={{ color: "var(--red)" }}>⚠ Active Critical Alerts</h2>
          <div className="message-list">
            {criticalMessages.map((msg) => (
              <div key={msg.id} className="alert-banner">
                <span className="pulse-dot red" />
                <div>
                  <strong>{msg.title}</strong>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    {msg.area} · Expires {formatRelativeTime(msg.expiresAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <article className="info-panel">
        <h2>Quick Alert</h2>
        <label style={{ display: "grid", gap: 6, color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 14 }}>
          Area / Location
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="East Market, River Gate, etc."
            style={{
              padding: "10px 14px", background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
              color: "var(--text)", width: "100%",
            }}
          />
        </label>

        <div className="templates-grid">
          {ALERT_TEMPLATES.map((tpl, i) => (
            <button key={i} className="template-card" type="button" onClick={() => quickAlert(tpl)}>
              <h4>{tpl.priority === "critical" ? "🔴" : "🟠"} {tpl.title}</h4>
              <p>{tpl.body.slice(0, 55)}…</p>
            </button>
          ))}
        </div>

        {notice && <p className="notice success" style={{ marginTop: 12 }}>{notice}</p>}
      </article>

      {highMessages.length > 0 && (
        <article className="info-panel">
          <h2>High Priority Alerts</h2>
          <div className="message-list">
            {highMessages.map((msg) => (
              <div key={msg.id} className="message-card priority-high" style={{ padding: 14 }}>
                <strong>{msg.title}</strong>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{msg.body}</p>
                <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  {msg.area} · {msg.hopCount} hops · Expires {formatRelativeTime(msg.expiresAt)}
                </span>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}

export default Alerts;
