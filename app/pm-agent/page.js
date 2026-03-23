"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, SignInButton, useUser } from "@clerk/nextjs";
import { supabase } from "../../lib/supabase";

// Fix #2: UUID instead of counter
const createMsg = (role, content, id) => ({
  id: id || crypto.randomUUID(),
  role,
  content,
});

// Fix #3: Safe cleanText
const cleanText = (text) => {
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    return parsed.text || text;
  } catch {
    return text.trim();
  }
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
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [tasksBadge, setTasksBadge] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef(null);
  const taRef = useRef(null);
  const initialized = useRef(false); // Fix #4: prevent double init
  const sendingRef = useRef(false);  // Fix #5: prevent race condition

  const loadSessions = useCallback(async (uid) => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setSessions(data);
    return data || [];
  }, []);

  const loadMessages = useCallback(async (sessionId) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) {
      // Fix #7: use real DB ids
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })));
    }
  }, []);

  const createSession = useCallback(async (uid, title = "New Chat") => {
    const { data } = await supabase
      .from("sessions")
      .insert({ user_id: uid, title: title.slice(0, 40) })
      .select()
      .single();
    return data;
  }, []);

  const saveMessageToDB = useCallback(async (sessionId, role, content) => {
    const { data } = await supabase
      .from("messages")
      .insert({ session_id: sessionId, role, content })
      .select()
      .single();
    return data;
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    // Fix #8: manual cascade delete
    await supabase.from("messages").delete().eq("session_id", sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
    // Fix #10: update locally instead of refetch
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (sessionId === currentSessionId) {
      setMessages([]);
      setSuggestions([]);
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  // Fix #4: Strict Mode safe init
  useEffect(() => {
    if (initialized.current) return;
    if (!isLoaded || !isSignedIn) return;
    initialized.current = true;

    const init = async () => {
      const existingSessions = await loadSessions(userId);
      if (existingSessions.length > 0) {
        const latest = existingSessions[0];
        setCurrentSessionId(latest.id);
        await loadMessages(latest.id);
        setLoading(false);
      } else {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
             messages: [{ role: "user", content: "начни" }],
              tasks: [],
              userId,
            }),
          });
          const data = await res.json();
          const greetingText = data.text || "Hey. What are we working on today?";
          const session = await createSession(userId, "New Chat");
          setCurrentSessionId(session.id);
          await saveMessageToDB(session.id, "assistant", greetingText);
          setMessages([createMsg("assistant", greetingText)]);
          setSuggestions(data.suggestions || []);
          setSessions([session]);
        } catch {
          setMessages([createMsg("assistant", "Hey. I'm Eduard — your PM.")]);
        }
        setLoading(false);
      }
    };

    init();
  }, [isLoaded, isSignedIn]); // eslint-disable-line

  // Fix #9: autofocus input
  useEffect(() => {
    if (!loading) taRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, suggestions]);

  const startNewChat = async () => {
    setSidebarOpen(false);
    setMessages([]);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "start" }],
          tasks: [],
          userId,
        }),
      });
      const data = await res.json();
      const greetingText = data.text || "Hey. What are we working on today?";
      const session = await createSession(userId, "New Chat");
      setCurrentSessionId(session.id);
      await saveMessageToDB(session.id, "assistant", greetingText);
      setMessages([createMsg("assistant", greetingText)]);
      setSuggestions(data.suggestions || []);
      // Fix #10: update locally
      setSessions(prev => [session, ...prev]);
    } catch {
      setMessages([createMsg("assistant", "New session. What are we working on?")]);
    }
    setLoading(false);
  };

  const switchSession = async (session) => {
    setSidebarOpen(false);
    if (session.id === currentSessionId) return;
    setLoading(true);
    setSuggestions([]);
    setCurrentSessionId(session.id);
    await loadMessages(session.id);
    setLoading(false);
  };

  const send = async (text) => {
    const t = (text !== undefined ? text : input).trim();
    // Fix #5: race condition guard
    if (!t || sendingRef.current) return;
    sendingRef.current = true;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = await createSession(userId, t);
      sessionId = session.id;
      setCurrentSessionId(sessionId);
      setSessions(prev => [session, ...prev]);
    }

    const userMsg = createMsg("user", t);
    // Fix #6: increased context to 40 messages
    const history = [...messages, userMsg].slice(-40);
    setMessages(history);

    const saved = await saveMessageToDB(sessionId, "user", t);
    if (saved) {
      setMessages(prev => prev.map(m =>
        m.id === userMsg.id ? { ...m, id: saved.id } : m
      ));
    }

    setInput("");
    if (taRef.current) taRef.current.style.height = "44px";
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, tasks, userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const replyText = data.text || "...";
      const replyMsg = createMsg("assistant", replyText);
      setMessages(prev => [...prev, replyMsg]);

      const savedReply = await saveMessageToDB(sessionId, "assistant", replyText);
      if (savedReply) {
        setMessages(prev => prev.map(m =>
          m.id === replyMsg.id ? { ...m, id: savedReply.id } : m
        ));
      }

      // Update title with first user message
      if (history.length === 1) {
        await supabase.from("sessions")
          .update({ title: t.slice(0, 40) })
          .eq("id", sessionId);
        // Fix #10: update locally
        setSessions(prev => prev.map(s =>
          s.id === sessionId ? { ...s, title: t.slice(0, 40) } : s
        ));
      }

      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        const added = data.tasks.length - tasks.length;
        setTasks(data.tasks);
        try { localStorage.setItem("pm_tasks", JSON.stringify(data.tasks)); } catch {}
        if (added > 0) {
          setTasksBadge(added);
          setTimeout(() => setTasksBadge(0), 3000);
        }
      }

      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : []);
    } catch {
      setMessages(prev => [...prev, createMsg("assistant", "Error. Try again.")]);
    }

    setLoading(false);
    sendingRef.current = false; // Fix #5: release lock
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  if (!isLoaded) {
    return (
      <div style={{ height: "100dvh", background: "#0C0C14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#334155", fontSize: 13, fontFamily: "Sora, sans-serif" }}>Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{
        height: "100dvh", background: "#0C0C14",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "Sora, Segoe UI, sans-serif",
        gap: 16, padding: 24,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "#161622", border: "2px solid #334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, color: "#94A3B8",
        }}>E</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>PROJECT MIND</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Your personal AI Project Manager</div>
        </div>
        <SignInButton mode="modal">
          <button style={{
            background: "#1D4ED8", border: "none",
            color: "#fff", padding: "12px 28px",
            borderRadius: 10, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
          }}>Sign In</button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div style={{
      height: "100dvh", background: "#0C0C14",
      display: "flex", position: "relative",
      fontFamily: "Sora, Segoe UI, sans-serif",
      color: "#E2E8F0", overflow: "hidden",
    }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "#00000080" }} />
          <div style={{
            position: "relative", zIndex: 1,
            width: 280, height: "100%",
            background: "#0E0E1A", borderRight: "1px solid #1E293B",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "16px", borderBottom: "1px solid #1E293B",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Chats</span>
              <button onClick={startNewChat} style={{
                background: "#1D4ED8", border: "none", color: "#fff",
                padding: "6px 12px", borderRadius: 8, fontSize: 11,
                cursor: "pointer", fontFamily: "inherit",
              }}>+ New</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {sessions.map(s => (
                <div key={s.id} style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 4 }}>
                  <button onClick={() => switchSession(s)} style={{
                    flex: 1, textAlign: "left",
                    background: s.id === currentSessionId ? "#161622" : "transparent",
                    border: s.id === currentSessionId ? "1px solid #1E293B" : "1px solid transparent",
                    color: s.id === currentSessionId ? "#E2E8F0" : "#64748B",
                    padding: "10px 32px 10px 12px", borderRadius: 8,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {s.title || "New Chat"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} style={{
                    position: "absolute", right: 6,
                    background: "transparent", border: "none",
                    color: "#334155", fontSize: 12,
                    cursor: "pointer", padding: "4px", lineHeight: 1,
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                    onMouseLeave={e => e.currentTarget.style.color = "#334155"}
                  >✕</button>
                </div>
              ))}
            </div>

            <Link href="/profile" onClick={() => setSidebarOpen(false)} style={{
              textDecoration: "none", padding: "14px 16px",
              borderTop: "1px solid #1E293B",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#1D4ED8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "EK"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.fullName || "User"}
                </div>
                <div style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.primaryEmailAddress?.emailAddress || ""}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{
          background: "#0E0E1A", borderBottom: "1px solid #1E293B",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: "transparent", border: "1px solid #1E293B",
            color: "#64748B", width: 34, height: 34, borderRadius: 8,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
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
            <div style={{ fontWeight: 700, fontSize: 15 }}>Eduard</div>
            <div style={{ fontSize: 11, color: loading ? "#F59E0B" : "#22C55E" }}>
              {loading ? "typing..." : "online"}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
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
            placeholder="Tell me what's going on..."
            disabled={loading}
            style={{
              flex: 1, background: "#161622", border: "1px solid #1E293B",
              borderRadius: 22, padding: "11px 16px", color: "#E2E8F0",
              fontSize: 16, fontFamily: "inherit", outline: "none",
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
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke={input.trim() && !loading ? "#fff" : "#334155"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
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