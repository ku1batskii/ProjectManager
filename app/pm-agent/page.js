"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const parseText = (text) => {
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    return parsed.text || text;
  } catch {
    return text.trim();
  }
};

const callAPI = async (messages, tasks = []) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, tasks }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export default function PMAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pm_chats");
    if (saved) {
      try {
        setChats(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await callAPI(newMessages);
      const assistantMessage = {
        role: "assistant",
        content: parseText(data.message),
      };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save chat
      const chatId = currentChatId || Date.now().toString();
      const title = input.slice(0, 30) + "...";
      const chat = {
        id: chatId,
        title,
        messages: finalMessages,
        created: new Date().toISOString(),
      };

      let updatedChats;
      if (currentChatId) {
        updatedChats = chats.map((c) => (c.id === chatId ? chat : c));
      } else {
        updatedChats = [chat, ...chats];
        setCurrentChatId(chatId);
      }

      setChats(updatedChats);
      localStorage.setItem("pm_chats", JSON.stringify(updatedChats));
    } catch (err) {
      console.error("Error:", err);
      alert("Ошибка: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const loadChat = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0C0C14" }}>
      {/* ─── ЛЕВАЯ ПАНЕЛЬ (SIDEBAR) ─── */}
      <div
        style={{
          width: "280px",
          borderRight: "1px solid #2a2a3e",
          background: "#0C0C14",
          display: "flex",
          flexDirection: "column",
          padding: "12px",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <button
          onClick={startNewChat}
          style={{
            background: "#1a1a2e",
            border: "1px solid #2a2a3e",
            color: "#E2E8F0",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            marginBottom: "20px",
            fontWeight: 600,
          }}
        >
          + New chat
        </button>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              style={{
                padding: "10px 12px",
                margin: "4px 0",
                background:
                  currentChatId === chat.id ? "#1a1a2e" : "transparent",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#B0BAC9",
                borderLeft:
                  currentChatId === chat.id ? "3px solid #60A5FA" : "none",
                paddingLeft:
                  currentChatId === chat.id ? "10px" : "12px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#1a1a2e";
              }}
              onMouseLeave={(e) => {
                if (currentChatId !== chat.id) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              {chat.title}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #2a2a3e",
            paddingTop: "12px",
            marginTop: "12px",
            fontSize: "12px",
            color: "#64748B",
          }}
        >
          <div style={{ margin: "6px 0" }}>
            <Link href="/taskboard" style={{ color: "#60A5FA", textDecoration: "none" }}>
              Taskboard
            </Link>
          </div>
          <div style={{ margin: "6px 0" }}>
            <Link href="/profile" style={{ color: "#60A5FA", textDecoration: "none" }}>
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ОСНОВНОЙ КОНТЕНТ (MAIN AREA) ─── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0C0C14",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: "60px",
            borderBottom: "1px solid #2a2a3e",
            display: "flex",
            alignItems: "center",
            paddingLeft: "20px",
            fontSize: "14px",
            color: "#B0BAC9",
            fontWeight: 600,
          }}
        >
          {currentChatId ? "Current chat" : "New conversation"}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#64748B",
                fontSize: "16px",
              }}
            >
              Начните новый разговор
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "8px",
              }}
            >
              <div
                style={{
                  maxWidth: "60%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background:
                    msg.role === "user" ? "#1e40af" : "#1a1a2e",
                  color: "#E2E8F0",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  wordWrap: "break-word",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#64748B", fontSize: "13px" }}>
              Agent thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            height: "80px",
            borderTop: "1px solid #2a2a3e",
            padding: "12px 20px",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Скажите мне о ваших целях..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#1a1a2e",
              border: "1px solid #2a2a3e",
              borderRadius: "6px",
              color: "#E2E8F0",
              fontSize: "14px",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 20px",
              background: loading ? "#475569" : "#1e40af",
              color: "#E2E8F0",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "default" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) {
                e.target.style.background = "#1e3a8a";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#1e40af";
              }
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
