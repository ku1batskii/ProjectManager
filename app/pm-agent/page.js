"use client";

import React, { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "project_mind_history";

/* ---------------- UTILS ---------------- */

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSuggestions = (sugg) => {
  if (!Array.isArray(sugg)) return [];
  return sugg.slice(0, 5).filter((s) => typeof s === "string");
};

const createMsg = (role, content) => ({
  id: crypto.randomUUID(),
  role,
  content,
});

/* ---------------- UI COMPONENTS ---------------- */

const Avatar = React.memo(() => (
  <div
    style={{
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "#161622",
      border: "2px solid #334155",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "#94A3B8",
      flexShrink: 0,
      fontFamily: "Georgia, serif",
    }}
  >
    A
  </div>
));

const Dots = () => (
  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#475569",
          animation: `tdot 1.4s ${i * 0.2}s ease-in-out infinite`,
        }}
      />
    ))}
  </div>
);

const formatText = (text) =>
  text.split("\n").map((line, i) => {
    if (line === "") return <div key={i} style={{ height: 6 }} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j}>{p.slice(2, -2)}</strong>
      ) : (
        p
      )
    );
    return (
      <span key={i} style={{ display: "block" }}>
        {parts}
      </span>
    );
  });

/* ---------------- MAIN ---------------- */

export default function PMAgent() {
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showClear, setShowClear] = useState(false);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = safeParse(saved, []);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "start" }] }),
        });

        const data = await res.json();

        const initial = [createMsg("assistant", data.text)];

        setMessages(initial);
        setSuggestions(normalizeSuggestions(data.suggestions));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      } catch {
        const fallback = [
          createMsg("assistant", "Привет. Я Алекс — Senior PM. Над чем работаешь?"),
        ];
        setMessages(fallback);
      }

      setLoading(false);
    };

    init();
  }, []);

  /* ---------------- SCROLL ---------------- */

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages, loading, suggestions]);

  /* ---------------- FOCUS ---------------- */

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  /* ---------------- STORAGE ---------------- */

  const saveMessages = (msgs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
    } catch {}
  };

  /* ---------------- SEND ---------------- */

  const send = async (text) => {
    const t = (text !== undefined ? text : input).trim();
    if (!t || loading) return;

    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    const userMsg = createMsg("user", t);
    const history = [...messages, userMsg];

    setMessages(history);
    saveMessages(history);

    setInput("");
    if (taRef.current) taRef.current.style.height = "44px";

    setLoading(true);
    setSuggestions([]);

    // typing placeholder
    const typingMsg = createMsg("assistant", "...");
    setMessages([...history, typingMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (requestId !== requestIdRef.current) return;

      if (data.error) throw new Error(data.error);

      const updated = [...history, createMsg("assistant", data.text)];

      setMessages(updated);
      saveMessages(updated);
      setSuggestions(normalizeSuggestions(data.suggestions));
    } catch (err) {
      if (err.name === "AbortError") return;

      const updated = [
        ...history,
        createMsg("assistant", "Ошибка сети. Попробуй ещё раз."),
      ];

      setMessages(updated);
    }

    setLoading(false);
  };

  /* ---------------- CLEAR ---------------- */

  const clearHistory = async () => {
    setShowClear(false);

    localStorage.removeItem(STORAGE_KEY);

    setMessages([]);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "start" }] }),
      });

      const data = await res.json();

      const initial = [createMsg("assistant", data.text)];

      setMessages(initial);
      setSuggestions(normalizeSuggestions(data.suggestions));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {
      setMessages([
        createMsg("assistant", "Привет. Я Алекс — Senior PM. Над чем работаешь?"),
      ]);
    }

    setLoading(false);
  };

  /* ---------------- INPUT ---------------- */

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div
      style={{
        height: "100svh",
        background: "#0C0C14",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Sora', sans-serif",
        color: "#E2E8F0",
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#0E0E1A",
          borderBottom: "1px solid #1E293B",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Avatar />
        <div>
          <div style={{ fontWeight: 700 }}>Алекс</div>
          <div style={{ fontSize: 11, color: loading ? "#F59E0B" : "#22C55E" }}>
            {loading ? "печатает..." : "Senior PM"}
          </div>
        </div>

        <button
          onClick={() => setShowClear(true)}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "1px solid #1E293B",
            color: "#64748B",
            padding: "4px 8px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          сброс
        </button>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: isUser ? "row-reverse" : "row",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {!isUser && <Avatar />}

              <div
                style={{
                  maxWidth: "80%",
                  background: isUser ? "#1D4ED8" : "#161622",
                  padding: "10px 14px",
                  borderRadius: 14,
                }}
              >
                {isUser ? m.content : formatText(m.content)}
              </div>
            </div>
          );
        })}

        {loading && <Dots />}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: 12, display: "flex", gap: 10 }}>
        <textarea
          ref={taRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="Напиши..."
          style={{
            flex: 1,
            background: "#161622",
            border: "1px solid #1E293B",
            borderRadius: 12,
            padding: 10,
            color: "#fff",
          }}
        />

        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
        >
          →
        </button>
      </div>
    </div>
  );
}