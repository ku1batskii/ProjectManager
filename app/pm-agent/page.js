"use client";

import { useState, useRef, useEffect } from "react";

const callAPI = async (messages) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
};

const Avatar = () => (
  <div style={{
    width: 34, height: 34, borderRadius: "50%",
    background: "#161622", border: "2px solid #334155",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#94A3B8",
    flexShrink: 0, fontFamily: "Georgia, serif",
  }}>A</div>
);

const Dots = () => (
  <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{
        width: 6, height: 6, borderRadius: "50%", background: "#475569",
        animation: `tdot 1.4s ${i * 0.2}s ease-in-out infinite`,
      }} />
    ))}
  </div>
);

const formatText = (text) =>
  text.split("\n").map((line, i) => {
    if (line === "") return <div key={i} style={{ height: 6 }} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : p
    );
    return <span key={i} style={{ display: "block" }}>{parts}</span>;
  });

export default function PMAgent() {
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { text, suggestions: sugg } = await callAPI([
          { role: "user", content: "start" },
        ]);
        setMessages([{ role: "assistant", content: text }]);
        setSuggestions(sugg);
      } catch {
        setMessages([{ role: "assistant", content: "Привет. Я Алекс — Senior PM. Над чем работаешь?" }]);
        setSuggestions(["Строю Telegram Mini App", "Хочу прокачать приоритизацию", "Расскажу про проект"]);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, suggestions]);

  const send = async (text) => {
    const t = (text !== undefined ? text : input).trim();
    if (!t || loading) return;
    setSuggestions([]);
    const userMsg = { role: "user", content: t };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    if (taRef.current) taRef.current.style.height = "44px";
    setLoading(true);
    try {
      const { text: reply, suggestions: sugg } = await callAPI(history);
      setMessages([...history, { role: "assistant", content: reply }]);
      setSuggestions(sugg);
    } catch {
      setMessages([...history, { role: "assistant", content: "Что-то пошло не так. Попробуй ещё раз." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <div style={{
      height: "100svh", background: "#0C0C14",
      display: "flex", flexDirection: "column",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      color: "#E2E8F0", maxWidth: 680, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        background: "#0E0E1A", borderBottom: "1px solid #1E293B",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ position: "relative" }}>
          <Avatar />
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            width: 8, height: 8, borderRadius: "50%",
            background: loading ? "#F59E0B" : "#22C55E",
            border: "2px solid #0E0E1A", transition: "background 0.3s",
          }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>Алекс</div>
          <div style={{ fontSize: 11, color: loading ? "#F59E0B" : "#22C55E", transition: "color 0.3s" }}>
            {loading ? "печатает..." : "Senior PM · онлайн"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase" }}>
          PROJECT MIND
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} style={{
              display: "flex", flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-end", gap: 8,
            }}>
              {!isUser && <Avatar />}
              <div style={{
                maxWidth: "80%",
                background: isUser ? "linear-gradient(135deg, #1D4ED8, #1E40AF)" : "#161622",
                border: isUser ? "none" : "1px solid #1E293B",
                borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "11px 15px", fontSize: 14, lineHeight: 1.65,
                color: isUser ? "#EFF6FF" : "#CBD5E1",
                boxShadow: isUser ? "0 4px 20px #1D4ED820" : "none",
              }}>
                {isUser ? m.content : formatText(m.content)}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Avatar />
            <div style={{
              background: "#161622", border: "1px solid #1E293B",
              borderRadius: "18px 18px 18px 4px", padding: "13px 18px",
            }}>
              <Dots />
            </div>
          </div>
        )}

        {suggestions.length > 0 && !loading && (
          <div style={{ paddingLeft: 42, display: "flex", flexDirection: "column", gap: 7, marginTop: 2 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{
                alignSelf: "flex-start", background: "transparent",
                border: "1px solid #1E293B", color: "#64748B",
                padding: "8px 15px", borderRadius: 20, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", transition: "all 0.15s", lineHeight: 1.4,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "#161622"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        background: "#0E0E1A", borderTop: "1px solid #1E293B",
        padding: "12px 16px 24px", display: "flex", alignItems: "flex-end", gap: 10,
      }}>
        <textarea
          ref={taRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder="Напиши Алексу..."
          disabled={loading}
          style={{
            flex: 1, background: "#161622", border: "1px solid #1E293B",
            borderRadius: 22, padding: "11px 16px",
            color: "#E2E8F0", fontSize: 14, fontFamily: "inherit",
            outline: "none", resize: "none", lineHeight: 1.5,
            height: 44, maxHeight: 140, overflow: "auto",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#334155"}
          onBlur={e => e.target.style.borderColor = "#1E293B"}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: input.trim() && !loading ? "#1D4ED8" : "#161622",
            border: "1px solid " + (input.trim() && !loading ? "#1D4ED8" : "#1E293B"),
            cursor: input.trim() && !loading ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke={input.trim() && !loading ? "#fff" : "#334155"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');
        @keyframes tdot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
        textarea::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}