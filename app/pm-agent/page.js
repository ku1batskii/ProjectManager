"use client";

import React, { useState, useRef, useEffect } from "react";

/* ---------------- CONFIG ---------------- */

const STORAGE_KEY = "pm_chat";
const TASKS_KEY = "pm_tasks";
const MAX_CONTEXT = 20;

/* ---------------- HELPERS ---------------- */

const safeParse = (v, fallback) => {
  try { return JSON.parse(v); } catch { return fallback; }
};

const createMsg = (role, content) => ({
  id: crypto.randomUUID(),
  role,
  content,
});

/* ---------------- MAIN ---------------- */

export default function PMAgent() {
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  const taRef = useRef(null);
  const bottomRef = useRef(null);
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    const savedMessages = safeParse(localStorage.getItem(STORAGE_KEY), []);
    const savedTasks = safeParse(localStorage.getItem(TASKS_KEY), []);

    if (savedMessages.length) setMessages(savedMessages);
    if (savedTasks.length) setTasks(savedTasks);

    setLoading(false);
  }, []);

  /* ---------------- SAVE ---------------- */

  const saveMessages = (m) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m.slice(-50)));

  const saveTasks = (t) =>
    localStorage.setItem(TASKS_KEY, JSON.stringify(t));

  /* ---------------- SCROLL ---------------- */

  useEffect(() => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }, [messages, suggestions]);

  /* ---------------- SEND ---------------- */

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;

    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    const userMsg = createMsg("user", t);
    const history = [...messages, userMsg].slice(-MAX_CONTEXT);

    setMessages(history);
    saveMessages(history);

    setInput("");
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: history,
          tasks,
        }),
      });

      const data = await res.json();

      if (requestId !== requestIdRef.current) return;

      const updated = [...history, createMsg("assistant", data.text)];

      setMessages(updated);
      saveMessages(updated);

      if (data.tasks) {
        setTasks(data.tasks);
        saveTasks(data.tasks);
      }

      setSuggestions(data.suggestions || []);
    } catch {
      setMessages([
        ...history,
        createMsg("assistant", "Ошибка. Попробуй снова."),
      ]);
    }

    setLoading(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={{ height: "100svh", display: "flex", flexDirection: "column", background: "#0C0C14" }}>
      
      {/* HEADER */}
      <div style={{ padding: 16, borderBottom: "1px solid #1E293B" }}>
        Алекс · AI Project Manager
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 10 }}>
            <b>{m.role === "user" ? "Ты" : "Алекс"}:</b>
            <div>{m.content}</div>
          </div>
        ))}

        {loading && <div>Алекс печатает...</div>}

        {suggestions.map((s, i) => (
          <button key={i} onClick={() => send(s)}>{s}</button>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", padding: 10, gap: 10 }}>
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, borderRadius: 999, padding: 10 }}
        />

        <button
          onClick={() => send()}
          style={{ width: 44, height: 44, borderRadius: "50%" }}
        >
          →
        </button>
      </div>
    </div>
  );
}