"use client";

import { useEffect, useMemo, useState } from "react";
import TaskDetail from "./TaskDetail";

// ─── Config ─────────────────────────────────────────

const STORAGE_KEY = "pm_tasks_v1";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "inprogress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const ROLE_COLORS = {
  Frontend: "#3B82F6", Backend: "#8B5CF6", Mobile: "#06B6D4",
  Design: "#EC4899", Motion: "#F97316", Analytics: "#10B981",
  QA: "#EF4444", DevOps: "#6366F1", Content: "#14B8A6",
  PM: "#F59E0B", Creator: "#E879F9", Growth: "#34D399",
};

// ─── Utils ──────────────────────────────────────────

const safeParse = (v, fallback) => {
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const getDayIndex = (date) => {
  if (!date) return null;
  const d = new Date(date).getDay(); // 0–6
  return d === 0 ? null : d - 1; // Mon=0
};

// ─── Page ───────────────────────────────────────────

export default function Page() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  // ─── Load / Save ─────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTasks(safeParse(stored, []));
  }, []);

  const saveTasks = (next) => {
    setTasks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // ─── CRUD ───────────────────────────────

  const createTask = (status) => {
    const newTask = {
      id: crypto.randomUUID(),
      title: "New task",
      status,
      priority: "medium",
      role: "PM",
      subtasks: [],
    };

    const next = [...tasks, newTask];
    saveTasks(next);
  };

  const updateTask = (updated) => {
    const next = tasks.map(t => t.id === updated.id ? updated : t);
    saveTasks(next);

    const fresh = next.find(t => t.id === updated.id);
    setSelected(fresh);
  };

  const deleteTask = (id) => {
    const next = tasks.filter(t => t.id !== id);
    saveTasks(next);
    setSelected(null);
  };

  // ─── Filters ────────────────────────────

  const roles = useMemo(() => {
    return ["all", ...new Set(tasks.map(t => t.role).filter(Boolean))];
  }, [tasks]);

  const filteredTasks = tasks.filter(t => {
    if (roleFilter === "all") return true;
    return t.role === roleFilter;
  });

  // ─── UI ────────────────────────────────

  return (
    <div style={{ padding: 20, color: "#fff" }}>
      
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        {roles.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            style={{
              padding: "6px 10px",
              background: roleFilter === r ? "#1E293B" : "#0E0E1A",
              border: "1px solid #1E293B",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 12 }}>
        {COLUMNS.map(col => (
          <div key={col.id} style={{ flex: 1 }}>
            
            <div style={{ marginBottom: 10 }}>{col.label}</div>

            <div style={{
              background: "#0E0E1A",
              border: "1px solid #1E293B",
              borderRadius: 12,
              padding: 10,
              minHeight: 200,
            }}>
              
              {filteredTasks
                .filter(t => t.status === col.id)
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{
                      background: "#161622",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 14 }}>{t.title}</div>

                    <div style={{
                      fontSize: 12,
                      color: ROLE_COLORS[t.role] || "#888",
                    }}>
                      {t.role}
                    </div>
                  </div>
                ))}

              <button
                onClick={() => createTask(col.id)}
                style={{ marginTop: 10 }}
              >
                + Add task
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ marginTop: 30 }}>
        <div>Timeline (Mon–Fri)</div>

        <div style={{ display: "flex", gap: 6 }}>
          {[0,1,2,3,4].map(day => (
            <div key={day} style={{ flex: 1 }}>
              <div style={{ marginBottom: 6 }}>Day {day+1}</div>

              {tasks
                .filter(t => getDayIndex(t.startDate) === day)
                .map(t => (
                  <div key={t.id} style={{
                    background: "#161622",
                    padding: 6,
                    marginBottom: 4,
                    fontSize: 12,
                  }}>
                    {t.title}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

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