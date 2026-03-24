"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import TaskDetail from "./TaskDetail";

// ─── Constants ─────────────────────────────────────────

const PRIORITY_COLORS = { high: "#EF4444", medium: "#F59E0B", low: "#22C55E" };
const PRIORITY_LABELS = { high: "HIGH", medium: "MED", low: "LOW" };

const ROLE_COLORS = {
  Frontend: "#3B82F6", Backend: "#8B5CF6", Mobile: "#06B6D4",
  Design: "#EC4899", Motion: "#F97316", Analytics: "#10B981",
  QA: "#EF4444", DevOps: "#6366F1", Content: "#14B8A6",
  PM: "#F59E0B", Creator: "#E879F9", Growth: "#34D399",
};

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#64748B" },
  { id: "inprogress", label: "In Progress", color: "#F59E0B" },
  { id: "review", label: "On Review", color: "#F97316" },
  { id: "done", label: "Done", color: "#22C55E" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// ─── Utils ─────────────────────────────────────────────

const safeParse = (v, fb) => {
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : fb;
  } catch {
    return fb;
  }
};

const saveTasks = (tasks) => {
  try {
    localStorage.setItem("pm_tasks", JSON.stringify(tasks));
  } catch {}
};

const getDayIndex = (date) => {
  if (!date) return null;
  const d = new Date(date).getDay();
  return d === 0 ? null : d - 1; // Mon = 0
};

// ─── Components ────────────────────────────────────────

function KanbanCard({ task, onClick }) {
  const done = (task.subtasks || []).filter(s => s.done).length;
  const total = (task.subtasks || []).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const color = PRIORITY_COLORS[task.priority] || "#475569";
  const rc = ROLE_COLORS[task.role] || "#334155";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#161622",
        border: "1px solid #1E293B",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 8,
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 13, color: "#E2E8F0", marginBottom: 10 }}>
        {task.title}
      </div>

      {total > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span>{done}/{total}</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 3, background: "#0C0C14" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#22C55E" }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9,
          color,
          border: `1px solid ${color}30`,
          padding: "2px 5px",
        }}>
          {PRIORITY_LABELS[task.priority] || "MED"}
        </span>

        {task.role && (
          <span style={{ fontSize: 10, color: rc }}>
            {task.role}
          </span>
        )}
      </div>
    </div>
  );
}

function TimelineView({ tasks }) {
  return (
    <div>
      <div style={{ display: "flex" }}>
        <div style={{ width: 120 }}>Task</div>
        {DAYS.map(d => <div key={d} style={{ flex: 1 }}>{d}</div>)}
      </div>

      {tasks.map(task => {
        const dayIdx = getDayIndex(task.startDate);

        return (
          <div key={task.id} style={{ display: "flex" }}>
            <div style={{ width: 120 }}>{task.title}</div>

            {DAYS.map((_, i) => (
              <div key={i} style={{ flex: 1 }}>
                {i === dayIdx && <div>●</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("kanban");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem("pm_tasks"), []);
    setTasks(saved);
  }, []);

  const updateTasks = (updater) => {
    setTasks(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveTasks(next);
      return next;
    });
  };

  const updateTask = (updated) => {
    updateTasks(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t);
      setSelected(next.find(t => t.id === updated.id));
      return next;
    });
  };

  const deleteTask = (id) => {
    updateTasks(prev => prev.filter(t => t.id !== id));
    setSelected(null);
  };

  const createTask = (status) => {
    const newTask = {
      id: crypto.randomUUID(),
      title: "New task",
      status,
      priority: "medium",
      subtasks: [],
    };

    updateTasks(prev => [...prev, newTask]);
  };

  const roles = useMemo(() => {
    return ["all", ...new Set(tasks.map(t => t.role).filter(Boolean))];
  }, [tasks]);

  const filtered = filter === "all"
    ? tasks
    : tasks.filter(t => t.role === filter);

  return (
    <div style={{ padding: 20, background: "#0C0C14", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Link href="/pm-agent">← Chat</Link>

        <button onClick={() => setView("kanban")}>Board</button>
        <button onClick={() => setView("timeline")}>Timeline</button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20 }}>
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <div style={{ display: "flex", gap: 10 }}>
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);

            return (
              <div key={col.id} style={{ width: 250 }}>
                <div>{col.label}</div>

                <button onClick={() => createTask(col.id)}>
                  + Add
                </button>

                {colTasks.map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelected(task)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <TimelineView tasks={filtered} />
      )}

      {/* Modal */}
      {selected && (
        <TaskDetail
          task={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}