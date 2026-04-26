import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Overview" },
  { to: "/create", label: "Create" },
  { to: "/messages", label: "Vault" },
  { to: "/connect", label: "Hardware Sync" },
  { to: "/qr", label: "QR Drop" },
  { to: "/alerts", label: "Alerts" },
];

function Navbar({ nodeToken, stats, onReset }) {
  return (
    <header className="top-shell">
      <div className="brand-row">
        <div onClick={onReset} style={{ cursor: 'pointer' }}>
          <p className="eyebrow">Offline Mesh</p>
          <strong className="brand-mark">Signal Cache</strong>
        </div>
        <div className="status-strip">
          <div className="node-badge">ID: {nodeToken.slice(0, 8)}</div>
          {stats.critical > 0 && (
            <div className="node-badge" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
              ⚠ {stats.critical}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
