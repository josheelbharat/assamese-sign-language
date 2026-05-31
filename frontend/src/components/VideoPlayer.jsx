/**
 * VideoPlayer — uses a stable <video> ref owned by App.jsx
 * so we never remount (avoids black-screen flicker between signs).
 */
export default function VideoPlayer({ videoRef, currentVideo, videoQueue }) {
  return (
    <section className="card video-section" aria-label="Sign language video">
      <p className="video-section-title">Sign Language Output</p>

      <div className="video-wrapper" style={{ position: "relative" }}>
        {/* Always rendered — never unmounted */}
        <video
          ref={videoRef}
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            background: "#000",
          }}
          aria-label={
            currentVideo
              ? `Sign language video for: ${currentVideo.replace(".mp4", "")}`
              : "Sign language video player"
          }
        />

        {/* Overlay label when playing */}
        {currentVideo && (
          <div className="video-label">
            {currentVideo.replace(".mp4", "")}
          </div>
        )}

        {/* Placeholder when idle */}
        {!currentVideo && (
          <div
            className="video-placeholder"
            style={{ position: "absolute", inset: 0 }}
          >
            <span className="video-placeholder-icon" aria-hidden="true">🤲</span>
            <span className="video-placeholder-text">
              Sign language videos will appear here
            </span>
          </div>
        )}
      </div>

      {videoQueue.length > 0 && (
        <div className="queue-bar" aria-label="Video queue">
          <span className="queue-label">Up next</span>
          {videoQueue.slice(0, 6).map((v, i) => (
            <span key={i} className="queue-pill">
              {v.replace(".mp4", "")}
            </span>
          ))}
          {videoQueue.length > 6 && (
            <span className="queue-label">+{videoQueue.length - 6} more</span>
          )}
        </div>
      )}
    </section>
  );
}
