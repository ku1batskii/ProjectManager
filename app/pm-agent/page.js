"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "pm_chat";
const TASKS_KEY = "pm_tasks";

const safeParse = (v, fallback) => {
  try { const r = JSON.parse(v); return r || fallback; } catch { return fallback; }
};

let msgCounter = 0;
const createMsg = (role, content) => ({
  id: `msg_${++msgCounter}_${Date.now()}`,
  role,
  content,
});

// Sanitize loaded messages — ensure they all have id
const sanitizeMsgs = (msgs) => {
  if (!Array.isArray(msgs)) return [];
  return msgs.map((m, i) => ({
    id: m.id || `old_${i}`,
    role: m.role || "assistant",
    content: typeof m.content === "string" ? m.content : "",
  })).filter(m => m.content);
};

const Avatar = () => (
  <div style={{
    width: 34, height: 34, borderRadius: "50%",
    background: "#161622", border: "2px solid #334155",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#94A3B8",
    flexShrink: 0, fontFamily: "Georgia, serif",
  }}>E</div>
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

const cleanText = (text) => {
  if (!text) return "";
  const t = text.trim();
  // If looks like JSON — extract text field
  if (t.startsWith("{")) {
    try {
      const parsed = JSON.parse(t);
      return parsed.text || t;
    } catch {}
  }
  return t;
};

const formatText = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line === "") return <div key={i} style={{ height: 6 }} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : p
    );
    return <span key={i} style={{ display: "block" }}>{parts}</span>;
  });
};

export default function PMAgent() {
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [tasksBadge, setTasksBadge] = useState(0);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    const savedMsgs = sanitizeMsgs(safeParse(localStorage.getItem(STORAGE_KEY), []));
    const savedTasks = safeParse(localStorage.getItem(TASKS_KEY), []);

    if (Array.isArray(savedTasks)) setTasks(savedTasks);

    if (savedMsgs.length > 0) {
      setMessages(savedMsgs);
      setLoading(false);
      return;
    }

    // First visit
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "start" }], tasks: [] }),
    })
      .then(r => r.json())
      .then(data => {
        const initial = [createMsg("assistant", data.text || "Привет. Над чем работаем сегодня?")];
        setMessages(initial);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch {}
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      })
      .catch(() => {
        setMessages([createMsg("assistant", "Привет. Я Эдуард — PM ассистент. Над чем работаем?")]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages, suggestions]);

  const saveMessages = (m) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m.slice(-50))); } catch {}
  };

  const saveTasks = (t) => {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(t)); } catch {}
  };

  const send = async (text) => {
    const t = (text !== undefined ? text : input).trim();
    if (!t || loading) return;

    const userMsg = createMsg("user", t);
    const history = [...messages, userMsg].slice(-20);

    setMessages(history);
    saveMessages(history);
    setInput("");
    if (taRef.current) taRef.current.style.height = "44px";
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, tasks }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updated = [...history, createMsg("assistant", data.text || "...")];
      setMessages(updated);
      saveMessages(updated);

      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        const added = data.tasks.length - tasks.length;
        setTasks(data.tasks);
        saveTasks(data.tasks);
        if (added > 0) {
          setTasksBadge(added);
          setTimeout(() => setTasksBadge(0), 3000);
        }
      }

      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : []);
    } catch {
      const updated = [...history, createMsg("assistant", "Ошибка. Попробуй снова.")];
      setMessages(updated);
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
      }}>
        <div style={{ position: "relative" }}>
          <Avatar />
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            width: 8, height: 8, borderRadius: "50%",
            background: loading ? "#F59E0B" : "#22C55E",
            border: "2px solid #0E0E1A",
          }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Эдуард</div>
          <div style={{ fontSize: 11, color: loading ? "#F59E0B" : "#22C55E" }}>
            {loading ? "печатает..." : "PM AGENT · online"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/taskboard" style={{
            textDecoration: "none", border: "1px solid #1E293B",
            color: "#64748B", padding: "5px 12px", borderRadius: 8,
            fontSize: 11, display: "flex", alignItems: "center", gap: 6,
          }}>
            Tasks
            {tasks.length > 0 && (
              <span style={{
                background: tasksBadge > 0 ? "#F59E0B" : "#334155",
                color: tasksBadge > 0 ? "#0C0C14" : "#94A3B8",
                borderRadius: 10, padding: "0 5px", fontSize: 9, fontWeight: 700,
              }}>
                {tasksBadge > 0 ? `+${tasksBadge}` : tasks.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} style={{
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
              }}>
                {isUser ? m.content : formatText(cleanText(m.content))}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Avatar />
            <div style={{ background: "#161622", border: "1px solid #1E293B", borderRadius: "18px 18px 18px 4px", padding: "13px 18px" }}>
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
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94A3B8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#64748B"; }}
              >{s}</button>
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
          placeholder="Расскажи что происходит..."
          disabled={loading}
          style={{
            flex: 1, background: "#161622", border: "1px solid #1E293B",
            borderRadius: 22, padding: "11px 16px", color: "#E2E8F0",
            fontSize: 14, fontFamily: "inherit", outline: "none",
            resize: "none", lineHeight: 1.5, height: 44, maxHeight: 140, overflow: "auto",
          }}
          onFocus={e => e.target.style.borderColor = "#334155"}
          onBlur={e => e.target.style.borderColor = "#1E293B"}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: input.trim() && !loading ? "#1D4ED8" : "#161622",
          border: "1px solid " + (input.trim() && !loading ? "#1D4ED8" : "#1E293B"),
          cursor: input.trim() && !loading ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
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
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
        textarea::placeholder { color: #334155; }
        a { color: inherit; }
      `}</style>
    </div>
  );
}