import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Webcam from "react-webcam";

// ── Constants ─────────────────────────────────────────────────────────────────
const EMOTION_API = "http://localhost:8000";
// const WS_URL      = "ws://localhost:8000/ws";


const EMOTION_META = {
  sadness:  { emoji: "😢", color: "#3b82f6",  bg: "#eff6ff",  label: "Sad"      },
  joy:      { emoji: "😊", color: "#22c55e",  bg: "#f0fdf4",  label: "Happy"    },
  anger:    { emoji: "😡", color: "#ef4444",  bg: "#fef2f2",  label: "Angry"    },
  fear:     { emoji: "😨", color: "#a855f7",  bg: "#faf5ff",  label: "Anxious"  },
  surprise: { emoji: "😲", color: "#f59e0b",  bg: "#fffbeb",  label: "Surprised"},
  disgust:  { emoji: "🤢", color: "#84cc16",  bg: "#f7fee7",  label: "Uneasy"   },
  neutral:  { emoji: "😐", color: "#6b7280",  bg: "#f9fafb",  label: "Neutral"  },
};

const meta = (e) => EMOTION_META[e] ?? EMOTION_META.neutral;

// ── Emotion Badge ─────────────────────────────────────────────────────────────
function EmotionBadge({ label, emotion, score }) {
  const m = meta(emotion);
  return (
    <div style={{
      background: m.bg,
      border: `1px solid ${m.color}33`,
      borderRadius: 12,
      padding: "8px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{ fontSize: 20 }}>{m.emoji}</span>
      <div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>
          {emotion ? m.label : "—"}
          {score ? <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 4 }}>
            {Math.round(score * 100)}%
          </span> : null}
        </div>
      </div>
    </div>
  );
}

// ── Chat Message ──────────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.sender === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, marginRight: 8, flexShrink: 0, marginTop: 4,
        }}>🤝</div>
      )}
      <div style={{
        maxWidth: "72%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg, #667eea, #764ba2)"
          : "white",
        color: isUser ? "white" : "#1f2937",
        fontSize: 14,
        lineHeight: 1.55,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        whiteSpace: "pre-wrap",
      }}>
        {msg.text}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [messages,   setMessages]   = useState([
    { sender: "bot", text: "Hi! I'm your wellness companion 🌿 I can sense how you're feeling and I'm here to chat. How are you doing today?" }
  ]);
  const [input,      setInput]      = useState("");
  const [emotionData, setEmotionData] = useState({});
  const [recording,  setRecording]  = useState(false);
  const [thinking,   setThinking]   = useState(false);
  const [advice,     setAdvice]     = useState("");

  const webcamRef   = useRef(null);
  const chatEndRef  = useRef(null);
  const socketRef   = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // WebSocket setup
  // useEffect(() => {
  //   const connect = () => {
  //     socketRef.current = new WebSocket(WS_URL);

  //     socketRef.current.onopen  = () => console.log("✅ WS connected");
  //     socketRef.current.onclose = () => setTimeout(connect, 2000); // auto-reconnect

  //     socketRef.current.onmessage = (event) => {
  //       if (event.data === "[END]") { setThinking(false); return; }

  //       setMessages((prev) => {
  //         const last = prev[prev.length - 1];
  //         if (last?.sender === "bot") {
  //           return [...prev.slice(0, -1), { sender: "bot", text: last.text + event.data }];
  //         }
  //         return [...prev, { sender: "bot", text: event.data }];
  //       });
  //     };
  //   };
  //   connect();
  //   return () => socketRef.current?.close();
  // }, []);

  // Auto face capture every 4s
  useEffect(() => {
    const id = setInterval(captureFace, 4000);
    return () => clearInterval(id);
  }, []);

  // ── Face ─────────────────────────────────────────────────────────────────────
  const captureFace = async () => {
    try {
      const img = webcamRef.current?.getScreenshot();
      if (!img) return;
      const blob = await fetch(img).then((r) => r.blob());
      const form = new FormData();
      form.append("file", blob, "image.jpg");
      const res = await axios.post(`${EMOTION_API}/face`, form);
      setEmotionData((p) => ({ ...p, face: res.data }));
    } catch (_) {}
  };

  // ── Voice ─────────────────────────────────────────────────────────────────────
  const recordVoice = async () => {
    try {
      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        setRecording(false);
        const blob = new Blob(chunks, { type: "audio/webm" });
        const form = new FormData();
        form.append("file", blob, "audio.webm");
        const res = await axios.post(`${EMOTION_API}/voice`, form);
        setEmotionData((p) => ({ ...p, voice: res.data }));
      };
      recorder.start();
      setTimeout(() => recorder.stop(), 3000);
    } catch (_) {
      setRecording(false);
      alert("Microphone permission denied");
    }
  };

  // ── Send Message ──────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || thinking) return;
    const text = input.trim();
    setMessages((p) => [...p, { sender: "user", text }]);
    setInput("");
    setThinking(true);

    try {
      // 1. Text emotion
      const textRes = await axios.post(`${EMOTION_API}/text`, null, {
        params: { text },
      });

      // 2. Fusion
      const fusionRes = await axios.post(`${EMOTION_API}/fusion`, {
        text:  textRes.data,
        face:  emotionData?.face  || {},
        voice: emotionData?.voice || {},
      });

      const { final_emotion, confidence, advice: newAdvice } = fusionRes.data;

      setEmotionData((p) => ({ ...p, text: textRes.data, final: final_emotion, confidence }));
      setAdvice(newAdvice);

      // 3. Chat via WebSocket
      setThinking(false);
      setMessages((p) => [
        ...p,
        { sender: "bot", text: newAdvice || "I'm here for you 💙" }
      ]);
    } catch (err) {
      setThinking(false);
      console.error(err);
    }
  };

  const finalMeta = meta(emotionData?.final);

  return (
    <div style={{
      height: "100vh", display: "flex",
      background: "linear-gradient(135deg, #f0f4ff 0%, #faf0ff 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div style={{
        width: 320, padding: 20, display: "flex", flexDirection: "column", gap: 16,
        borderRight: "1px solid #e5e7eb",
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(12px)",
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1f2937" }}>
          🎭 Emotion Radar
        </h2>

        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ borderRadius: 16, width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <EmotionBadge label="Face"  emotion={emotionData?.face?.emotion}  score={emotionData?.face?.score} />
          <EmotionBadge label="Voice" emotion={emotionData?.voice?.emotion} score={emotionData?.voice?.score} />
          <EmotionBadge label="Text"  emotion={emotionData?.text?.emotion}  score={emotionData?.text?.score} />
        </div>

        {/* Final emotion card */}
        <div style={{
          background: finalMeta.bg,
          border: `2px solid ${finalMeta.color}44`,
          borderRadius: 16, padding: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 36 }}>{finalMeta.emoji}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Overall Mood</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: finalMeta.color }}>
            {emotionData?.final ? finalMeta.label : "Detecting…"}
          </div>
          {emotionData?.confidence && (
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              {Math.round(emotionData.confidence * 100)}% confidence
            </div>
          )}
        </div>

        {/* Health tip */}
        {advice && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 12, padding: 12,
            fontSize: 13, color: "#92400e", lineHeight: 1.5,
          }}>
            💡 {advice}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL (Chat) ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>🤝</div>
          <div>
            <div style={{ fontWeight: 700, color: "#1f2937" }}>Wellness Companion</div>
            <div style={{ fontSize: 12, color: "#22c55e" }}>● Online</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}

          {thinking && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>🤝</div>
              <div style={{
                padding: "10px 16px", borderRadius: "18px 18px 18px 4px",
                background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                display: "flex", gap: 4, alignItems: "center",
              }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: "#9ca3af",
                    display: "inline-block",
                    animation: "bounce 1s infinite",
                    animationDelay: `${d}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: "12px 20px",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #e5e7eb",
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <input
            style={{
              flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 24,
              padding: "10px 18px", fontSize: 14, outline: "none",
              background: "white",
              transition: "border-color 0.2s",
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How are you feeling? Type here…"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            onFocus={(e) => e.target.style.borderColor = "#667eea"}
            onBlur={(e)  => e.target.style.borderColor = "#e5e7eb"}
          />

          <button
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: recording ? "#ef4444" : "#f3f4f6",
              cursor: "pointer", fontSize: 20,
              transition: "background 0.2s",
            }}
            onClick={recordVoice}
            title={recording ? "Recording…" : "Record voice (3s)"}
          >
            {recording ? "⏹" : "🎤"}
          </button>

          <button
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: thinking || !input.trim()
                ? "#e5e7eb"
                : "linear-gradient(135deg, #667eea, #764ba2)",
              cursor: thinking || !input.trim() ? "default" : "pointer",
              color: "white", fontSize: 18,
              transition: "background 0.2s",
            }}
            onClick={sendMessage}
            disabled={thinking || !input.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}