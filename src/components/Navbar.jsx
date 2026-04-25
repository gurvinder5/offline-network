import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Overview" },
  { to: "/create", label: "Create" },
  { to: "/messages", label: "Vault" },
  { to: "/connect", label: "Connect" },
  { to: "/qr", label: "QR Drop" },
  { to: "/alerts", label: "Alerts" },
];

function Navbar({ nodeToken, stats, onReset }) {
  return (
    <header className="top-shell">
      <div className="brand-row">
        <div>
          <p className="eyebrow">Offline mesh relay</p>
          <strong className="brand-mark">Signal Cache</strong>
        </div>
        <div className="status-strip">
          <span className="node-badge">node:{nodeToken}</span>
          <span>{stats.total} msgs</span>
          {stats.critical > 0 && <span style={{ color: "var(--red)" }}>⚠ {stats.critical}</span>}
          <button className="ghost-button" type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
      <nav className="nav-row">
        <div className="nav-links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
