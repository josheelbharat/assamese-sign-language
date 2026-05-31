/**
 * MicButton
 *
 * Props:
 *   recording — bool: is actively recording
 *   connected — bool: backend reachable (button enabled)
 *   onStart   — fn: called to begin recording
 *   onStop    — fn: called to stop recording
 */
export default function MicButton({ recording, connected, onStart, onStop }) {
  const handleClick = () => (recording ? onStop() : onStart());

  return (
    <section className="mic-section" aria-label="Recording controls">
      <div className={`mic-wrapper ${recording ? "recording" : ""}`}>
        <span className="mic-ring mic-ring-1" aria-hidden="true" />
        <span className="mic-ring mic-ring-2" aria-hidden="true" />
        <span className="mic-ring mic-ring-3" aria-hidden="true" />

        <button
          id="mic-toggle-btn"
          className={`mic-btn ${recording ? "recording" : ""}`}
          onClick={handleClick}
          disabled={!connected}
          aria-label={recording ? "Stop recording" : "Start recording"}
          aria-pressed={recording}
        >
          {recording ? "⏹" : "🎤"}
        </button>
      </div>

      <p className={`mic-label ${recording ? "active" : ""}`}>
        {!connected
          ? "Connecting to server…"
          : recording
          ? "Listening — speak Assamese"
          : "Tap to start speaking"}
      </p>
    </section>
  );
}
