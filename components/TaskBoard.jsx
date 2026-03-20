"use client";

import React from "react";

const COLUMNS = [
  { id: "planned", label: "Planned", color: "#475569" },
  { id: "in_progress", label: "In Progress", color: "#F59E0B" },
  { id: "done", label: "Done", color: "#22C55E" },
];

const PRIORITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#22C55E",
};

export default function TaskBoard({ tasks, setTasks }) {
  const moveTask = (id, newStatus) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t
    );
    setTasks(updated);
    try {
      localStorage.setItem("pm_tasks", JSON.stringify(updated));
    } catch {}
  };

  const deleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    try {
      localStorage.setItem("pm_tasks", JSON.stringify(updated));
    } catch {}
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#0C0C14",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid #1E293B",
        background: "#0E0E1A",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>Task Board</div>
        <div style={{
          fontSize: 10, color: "#475569",
          background: "#161622", border: "1px solid #1E293B",
          borderRadius: 20, padding: "2px 8px",
        }}>
          {tasks.length} задач
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase" }}>
          PROJECT MIND
        </div>
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        gap: 10,
        padding: 12,
        overflowX: "auto",
        overflowY: "hidden",
      }}>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} style={{
              flex: 1,
              minWidth: 200,
              background: "#0E0E1A",
              border: "1px solid #1E293B",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1E293B",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: col.color,
                  boxShadow: `0 0 6px ${col.color}60`,
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
                  {col.label}
                </span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 10, color: "#334155",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  borderRadius: 10, padding: "1px 6px",
                }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{
                flex: 1, overflowY: "auto",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                {colTasks.length === 0 && (
                  <div style={{
                    textAlign: "center", color: "#1E293B",
                    fontSize: 11, padding: "20px 0",
                  }}>
                    пусто
                  </div>
                )}

                {colTasks.map((task) => (
                  <div key={task.id} style={{
                    background: "#161622",
                    border: "1px solid #1E293B",
                    borderRadius: 8,
                    padding: "10px 10px 8px",
                  }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                        background: PRIORITY_COLORS[task.priority] || "#475569",
                      }} />
                      <span style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>
                        {task.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                      {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                        <button key={c.id} onClick={() => moveTask(task.id, c.id)} style={{
                          background: "transparent",
                          border: "1px solid #1E293B",
                          color: "#475569",
                          fontSize: 9, padding: "2px 7px",
                          borderRadius: 4, cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.color = c.color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#475569"; }}
                        >
                          → {c.label}
                        </button>
                      ))}
                      <button onClick={() => deleteTask(task.id)} style={{
                        marginLeft: "auto",
                        background: "transparent", border: "none",
                        color: "#334155", fontSize: 10,
                        cursor: "pointer", padding: "2px 4px",
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "#334155"}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
      `}</style>
    </div>
  );
}