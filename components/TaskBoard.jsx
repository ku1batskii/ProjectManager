"use client";

import React, { useState } from "react";

const PRIORITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#22C55E",
};

const PRIORITY_LABELS = {
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

const DESKTOP_RESPONSIVE = {
  boardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '12px',
    '@media (min-width: 1920px)': {
      marginLeft: '280px',
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
  },
  taskCard: {
    minWidth: '100%',
    '@media (min-width: 1920px)': {
      minWidth: '280px',
    },
  },
};

const ROLE_COLORS = {
  "Nikita": "#3B82F6",
  "Pavel": "#8B5CF6",
  "Artem": "#06B6D4",
  "Maria": "#EC4899",
  "Daria": "#F97316",
  "Eduard": "#F59E0B",
  "Olga": "#10B981",
  "Sergey": "#EF4444",
  "Ivan": "#6366F1",
  "Anna": "#14B8A6",
};

const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : "?";

export default function TaskBoard({ tasks = [], setTasks = () => {} }) {
  const [filter, setFilter] = useState("all");

  const deleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    try { localStorage.setItem("pm_tasks", JSON.stringify(updated)); } catch {}
  };

  const people = ["all", ...Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean)))];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.assignee === filter);

  return (
    <div style={{ minHeight: "100svh", background: "#0C0C14", fontFamily: "'Sora', 'Segoe UI', sans-serif", color: "#E2E8F0", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1E293B", background: "#0E0E1A", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>To Do</div>
        <div style={{ fontSize: 10, color: "#475569", background: "#161622", border: "1px solid #1E293B", borderRadius: 20, padding: "2px 8px" }}>{filtered.length} задач</div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#334155", letterSpacing: 2 }}>PROJECT MIND</div>
      </div>

      {tasks.length > 0 && (
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B", display: "flex", gap: 6, overflowX: "auto", background: "#0E0E1A" }}>
          {people.map(p => (
            <button key={p} onClick={() => setFilter(p)} style={{ background: filter === p ? (ROLE_COLORS[p] || "#334155") : "transparent", border: `1px solid ${filter === p ? (ROLE_COLORS[p] || "#334155") : "#1E293B"}`, color: filter === p ? "#fff" : "#64748B", padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {p === "all" ? "Все" : p}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "60px 20px", lineHeight: 1.7 }}>
            {tasks.length === 0 ? "Задач пока нет — расскажи Эдуарду что нужно сделать" : "Нет задач для этого человека"}
          </div>
        )}

        {filtered.map((task) => (
          <div key={task.id} style={{ background: "#0E0E1A", border: "1px solid #1E293B", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: PRIORITY_COLORS[task.priority] || "#475569", background: `${PRIORITY_COLORS[task.priority] || "#475569"}15`, border: `1px solid ${PRIORITY_COLORS[task.priority] || "#475569"}30`, borderRadius: 4, padding: "2px 5px", flexShrink: 0, marginTop: 1 }}>
                {PRIORITY_LABELS[task.priority] || "MED"}
              </span>
              <span style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.5, flex: 1 }}>{task.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {task.assignee && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: ROLE_COLORS[task.assignee] || "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                    {getInitials(task.assignee)}
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{task.assignee}</span>
                </div>
              )}
              <button onClick={() => deleteTask(task.id)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#334155", fontSize: 11, cursor: "pointer", padding: "2px 6px", borderRadius: 4, fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                onMouseLeave={e => e.currentTarget.style.color = "#334155"}
              >✕</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
      `}</style>
    </div>
  );
}