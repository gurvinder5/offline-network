import { useMemo, useState } from "react";
import { formatRelativeTime } from "../lib/mesh";

function Messages({ messages, onDelete }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (filter === "all") return messages.map(msg => ({ ...msg, isExpiring: new Date(msg.expiresAt).getTime() - now < 7200000 }));
    return messages.filter((m) => m.kind === filter).map(msg => ({ ...msg, isExpiring: new Date(msg.expiresAt).getTime() - now < 7200000 }));
  }, [filter, messages]);

  const kinds = ["all", "alert", "route", "medical", "news", "drop", "dm"];

  return (
    <section className="stack-page">
      <div className="panel-heading">
        <p className="eyebrow">Local vault</p>
        <h1>Messages on this node</h1>
        <p className="lead">
          {messages.length} message{messages.length !== 1 ? "s" : ""} stored locally.
          All messages auto-expire.
        </p>
      </div>

      <div className="filter-row">
        {kinds.map((opt) => (
          <button
            key={opt}
            className={filter === opt ? "filter-chip active" : "filter-chip"}
            type="button"
            onClick={() => setFilter(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="message-list">
        {filtered.length ? (
          filtered.map((msg) => (
            <article key={msg.id} className={`message-card priority-${msg.priority}`}>
              <div className="message-topline">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`source-badge ${msg.source}`}>{msg.source}</span>
                  <span>{msg.kind}</span>
                </div>
                <span className={`priority-badge ${msg.priority}`}>{msg.priority}</span>
              </div>

              <h2>{msg.title}</h2>
              <p>{msg.body}</p>

              {msg.hops && msg.hops.length > 0 && (
                <div className="hop-chain">
                  <span style={{ color: "var(--text-dim)", marginRight: 4 }}>path:</span>
                  {msg.hops.map((hop, i) => (
                    <span key={i}>
                      {i > 0 && <span className="hop-arrow"> → </span>}
                      {hop}
                    </span>
                  ))}
                  {msg.hopCount > 0 && (
                    <span style={{ color: "var(--text-dim)", marginLeft: 4 }}>
                      ({msg.hopCount} hop{msg.hopCount > 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              )}

              <div className="meta-grid">
                <span>📍 {msg.area}</span>
                <span>Origin: {msg.originToken}</span>
                <span className={`expiry-badge ${msg.isExpiring ? "expiring" : ""}`}>
                  Expires: {formatRelativeTime(msg.expiresAt)}
                </span>
              </div>

              {onDelete && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => onDelete(msg.id)}
                    style={{ fontSize: "0.72rem" }}
                  >
                    Remove from vault
                  </button>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="empty-state">No messages match this filter.</div>
        )}
      </div>
    </section>
  );
}

export default Messages;
