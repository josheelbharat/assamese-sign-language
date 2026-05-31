/**
 * Header
 *
 * Props:
 *   connected — bool
 *   status    — string label shown in the badge
 */
export default function Header({ connected, status }) {
  const badgeClass = connected
    ? "connected"
    : status === "Connecting…"
    ? "connecting"
    : "disconnected";

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo" aria-hidden="true">🤟</div>
        <div>
          <div className="header-title">SignBridge</div>
          <div className="header-subtitle">Assamese Speech → Indian Sign Language</div>
        </div>
      </div>

      <div
        className={`badge ${badgeClass}`}
        role="status"
        aria-live="polite"
        aria-label={`Connection status: ${status}`}
      >
        <span className="badge-dot" aria-hidden="true" />
        {status}
      </div>
    </header>
  );
}
