"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const ROLE_COLORS = {
  Frontend: "#3B82F6",
  Backend: "#8B5CF6",
  Mobile: "#06B6D4",
  Design: "#EC4899",
  Motion: "#F97316",
  Analytics: "#10B981",
  QA: "#EF4444",
  DevOps: "#6366F1",
  Content: "#14B8A6",
  PM: "#F59E0B",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

const safeParse = (v, fallback) => {
  try { return JSON.parse(v) || fallback; } catch { return fallback; }
};

const getInitials = (name) =>
  name ? name.slice(0, 2).toUpperCase() : "?";

// ─── Sub-components ───────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
  const color = PRIORITY_COLORS[priority] || "#475569";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 1,
      color, background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 4, padding: "2px 5px",
      flexShrink: 0, marginTop: 1,
    }}>
      {PRIORITY_LABELS[priority] || "MED"}
    </span>
  );
};

const RoleAvatar = ({ role }) => {
  const color = ROLE_COLORS[role] || "#334155";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, color: "#fff",
      }}>
        {getInitials(role)}
      </div>
      <span style={{ fontSize: 11, color: "#64748B" }}>{role}</span>
    </div>
  );
};

const TaskCard = ({ task, onDelete }) => (
  <div style={{
    background: "#0E0E1A", border: "1px solid #1E293B",
    borderRadius: 10, padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: 8,
  }}>
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <PriorityBadge priority={task.priority} />
      <span style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.5, flex: 1 }}>
        {task.title}
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {task.role && <RoleAvatar role={task.role} />}
      <button
        onClick={() => onDelete(task.id)}
        onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
        onMouseLeave={e => e.currentTarget.style.color = "#334155"}
        style={{
          marginLeft: "auto", background: "transparent",
          border: "none", color: "#334155",
          fontSize: 11, cursor: "pointer",
          padding: "2px 6px", borderRadius: 4, fontFamily: "inherit",
        }}
      >✕</button>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setTasks(safeParse(localStorage.getItem("pm_tasks"), []));
  }, []);

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    try { localStorage.setItem("pm_tasks", JSON.stringify(updated)); } catch {}
  };

  const roles = ["all", ...Array.from(new Set(tasks.map(t => t.role).filter(Boolean)))];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.role === filter);

  return (
    <div style={{
      height: "100dvh", background: "#0C0C14",
      fontFamily: "Sora, Segoe UI, sans-serif",
      color: "#E2E8F0", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: "1px solid #1E293B",
        background: "#0E0E1A", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>To Do</div>
        <div style={{
          fontSize: 10, color: "#475569",
          background: "#161622", border: "1px solid #1E293B",
          borderRadius: 20, padding: "2px 8px",
        }}>
          {filtered.length} tasks
        </div>
        <Link href="/pm-agent" style={{
          marginLeft: "auto", textDecoration: "none",
          border: "1px solid #1E293B", color: "#64748B",
          padding: "5px 12px", borderRadius: 8, fontSize: 11,
        }}>← Chat</Link>
      </div>

      {/* Role filter */}
      {tasks.length > 0 && (
        <div style={{
          padding: "10px 14px", borderBottom: "1px solid #1E293B",
          display: "flex", gap: 6, overflowX: "auto", background: "#0E0E1A",
        }}>
          {roles.map(r => {
            const active = filter === r;
            const color = ROLE_COLORS[r] || "#334155";
            return (
              <button key={r} onClick={() => setFilter(r)} style={{
                background: active ? color : "transparent",
                border: `1px solid ${active ? color : "#1E293B"}`,
                color: active ? "#fff" : "#64748B",
                padding: "4px 10px", borderRadius: 20,
                fontSize: 11, cursor: "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
                {r === "all" ? "All" : r}
              </button>
            );
          })}
        </div>
      )}

      {/* Tasks */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", color: "#334155",
            fontSize: 13, padding: "60px 20px", lineHeight: 1.8,
          }}>
            {tasks.length === 0
              ? "No tasks yet\nTell Eduard to create tasks"
              : "No tasks for this role"}
          </div>
        ) : (
          filtered.map(task => (
            <TaskCard key={task.id} task={task} onDelete={deleteTask} />
          ))
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
      `}</style>
    </div>
  );
}