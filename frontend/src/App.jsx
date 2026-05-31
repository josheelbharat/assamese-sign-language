import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL    = "ws://localhost:8000/ws/audio";
const SAMPLE_RATE = 16000;

export default function App() {
  const [status, setStatus]       = useState("idle"); // idle | listening | stopped
  const [transcript, setTranscript] = useState([]);
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [error, setError]         = useState("");

  const wsRef             = useRef(null);
  const mediaStreamRef    = useRef(null);
  const processorRef      = useRef(null);
  const audioCtxRef       = useRef(null);
  const videoRef          = useRef(null);
  const playingRef        = useRef(false);
  const queueRef          = useRef([]);

  // ── Video queue player ─────────────────────────────────────────────── //
  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      playingRef.current = false;
      setCurrentVideo(null);
      return;
    }
    const next = queueRef.current.shift();
    setCurrentVideo(next);
    setVideoQueue([...queueRef.current]);
    playingRef.current = true;
  }, []);

  useEffect(() => {
    if (!currentVideo || !videoRef.current) return;
    const v = videoRef.current;
    v.src = `/sign_videos/${currentVideo}`;
    v.load();
    v.oncanplay = () => v.play().catch(() => {});
    v.onended   = () => setTimeout(playNext, 200);
    v.onerror   = () => setTimeout(playNext, 200);
  }, [currentVideo, playNext]);

  const addToQueue = useCallback((videos) => {
    queueRef.current.push(...videos);
    setVideoQueue([...queueRef.current]);
    if (!playingRef.current) playNext();
  }, [playNext]);

  // ── WebSocket ──────────────────────────────────────────────────────── //
  const connectWS = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const ws = new WebSocket(WS_URL);
    ws.onopen    = () => setError("");
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "recognition") {
        setTranscript(prev => [
          { text: msg.text, videos: msg.videos, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19),
        ]);
        if (msg.videos?.length > 0) addToQueue(msg.videos);
      }
    };
    ws.onerror = () => setError("WebSocket error — is the backend running?");
    ws.onclose = () => {};
    wsRef.current = ws;
  }, [addToQueue]);

  // ── Audio capture ──────────────────────────────────────────────────── //
  const startListening = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ctx       = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = ctx;

      const source    = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const int16   = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
        }
        wsRef.current.send(int16.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      connectWS();
      setStatus("listening");
    } catch (err) {
      setError("Microphone access denied: " + err.message);
    }
  }, [connectWS]);

  const stopListening = useCallback(() => {
    processorRef.current?.disconnect();
    audioCtxRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    setStatus("stopped");
  }, []);

  const clearAll = useCallback(() => {
    queueRef.current = [];
    setVideoQueue([]);
    setCurrentVideo(null);
    setTranscript([]);
    playingRef.current = false;
  }, []);

  // ── UI ─────────────────────────────────────────────────────────────── //
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Speech to sign Language By ~ CSB23207</h1>
      <p style={styles.subtitle}>Real-time Speech to Sign Language</p>

      {error && <div style={styles.error}>{error}</div>}

      {/* Controls */}
      <div style={styles.controls}>
        {status !== "listening" ? (
          <button style={styles.btnStart} onClick={startListening}>
            🎤 Start Listening
          </button>
        ) : (
          <button style={styles.btnStop} onClick={stopListening}>
            ⏹ Stop
          </button>
        )}
        <button style={styles.btnClear} onClick={clearAll}>
          🗑 Clear
        </button>
      </div>

      {/* Status */}
      <div style={styles.statusBar}>
        {status === "listening" && <span style={styles.dot} />}
        <span style={{ color: status === "listening" ? "#4ade80" : "#94a3b8" }}>
          {status === "listening" ? "Listening..." : status === "stopped" ? "Stopped" : "Ready"}
        </span>
      </div>

      {/* Video player */}
      <div style={styles.videoSection}>
        <video
          ref={videoRef}
          style={styles.video}
          playsInline
          muted={false}
        />
        {videoQueue.length > 0 && (
          <div style={styles.queueInfo}>
            {videoQueue.length} video(s) in queue
          </div>
        )}
      </div>

      {/* Transcript */}
      <div style={styles.transcriptBox}>
        <h3 style={styles.transcriptTitle}>Recognized Words</h3>
        {transcript.length === 0 && (
          <p style={styles.placeholder}>Speak Assamese to see results...</p>
        )}
        {transcript.map((item, i) => (
          <div key={i} style={styles.transcriptItem}>
            <span style={styles.transcriptText}>{item.text}</span>
            <span style={styles.transcriptMeta}>
              {item.videos?.length > 0 ? `📹 ${item.videos.join(", ")}` : "✗ no video"}
              {" · "}{item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#f1f5f9",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    textAlign: "center",
    background: "linear-gradient(90deg, #818cf8, #34d399)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.25rem",
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: "2rem",
  },
  error: {
    background: "#7f1d1d",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    color: "#fca5a5",
  },
  controls: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  btnStart: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "0.75rem 2rem",
    fontSize: "1.1rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  btnStop: {
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "0.75rem 2rem",
    fontSize: "1.1rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  btnClear: {
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    cursor: "pointer",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4ade80",
    animation: "pulse 1s infinite",
  },
  videoSection: {
    background: "#0f172a",
    borderRadius: "16px",
    padding: "1rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    border: "1px solid #1e293b",
  },
  video: {
    width: "100%",
    maxWidth: "640px",
    borderRadius: "12px",
    background: "#000",
    minHeight: "200px",
  },
  queueInfo: {
    marginTop: "0.5rem",
    color: "#94a3b8",
    fontSize: "0.875rem",
  },
  transcriptBox: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "1.5rem",
    border: "1px solid #334155",
  },
  transcriptTitle: {
    color: "#818cf8",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  placeholder: {
    color: "#475569",
    fontStyle: "italic",
  },
  transcriptItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: "1px solid #334155",
    gap: "1rem",
  },
  transcriptText: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  transcriptMeta: {
    fontSize: "0.75rem",
    color: "#64748b",
    textAlign: "right",
    flexShrink: 0,
  },
};