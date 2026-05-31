/**
 * TranscriptionPanel
 *
 * Props:
 *   transcript  — latest recognised phrase (string)
 *   words       — [{assamese, english, has_video}]
 *   totalWords  — cumulative word count (number)
 *   videoCount  — cumulative matched-video count (number)
 */
export default function TranscriptionPanel({ transcript, words, totalWords, videoCount }) {
  const coverage = totalWords > 0 ? Math.round((videoCount / totalWords) * 100) : 0;

  return (
    <section className="card transcription-section" aria-label="Transcription output">
      <p className="video-section-title">Recognized Speech</p>

      {transcript ? (
        <>
          <p className="transcription-text" lang="as" aria-live="polite">
            {transcript}
          </p>

          <div className="divider" />

          {words.length > 0 && (
            <div className="word-chips" role="list" aria-label="Word breakdown">
              {words.map((w, i) => (
                <span
                  key={i}
                  role="listitem"
                  className={`chip ${w.has_video ? "has-video" : "no-video"}`}
                  title={w.has_video ? "Has sign video" : "No sign video available"}
                >
                  <span className="chip-dot" aria-hidden="true" />
                  {w.english || w.assamese}
                </span>
              ))}
            </div>
          )}

          <div className="stats-row" style={{ marginTop: "20px" }}>
            <div className="stat-card">
              <div className="stat-value">{totalWords}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{videoCount}</div>
              <div className="stat-label">Signs Found</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{coverage}%</div>
              <div className="stat-label">Coverage</div>
            </div>
          </div>
        </>
      ) : (
        <div className="transcription-empty" aria-label="No transcription yet">
          <span className="transcription-empty-icon" aria-hidden="true">💬</span>
          <span className="transcription-empty-text">
            Transcription will appear as you speak
          </span>
        </div>
      )}
    </section>
  );
}
