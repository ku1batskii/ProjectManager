"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = { high: "#EF4444", medium: "#F59E0B", low: "#22C55E" };
const PRIORITY_LABELS = { high: "HIGH", medium: "MED", low: "LOW" };

const ROLE_COLORS = {
  Frontend: "#3B82F6", Backend: "#8B5CF6", Mobile: "#06B6D4",
  Design: "#EC4899", Motion: "#F97316", Analytics: "#10B981",
  QA: "#EF4444", DevOps: "#6366F1", Content: "#14B8A6",
  PM: "#F59E0B", Creator: "#E879F9", Growth: "#34D399",
};

const COLUMNS = [
  { id: "todo",       label: "To Do",       color: "#64748B" },
  { id: "inprogress", label: "In Progress", color: "#F59E0B" },
  { id: "review",     label: "On Review",   color: "#F97316" },
  { id: "done",       label: "Done",        color: "#22C55E" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// ─── Utils ────────────────────────────────────────────────────────────────────

const safeParse = (v, fallback) => {
  try { return JSON.parse(v) || fallback; } catch { return fallback; }
};

const saveTasks = (tasks) => {
  try { localStorage.setItem("pm_tasks", JSON.stringify(tasks)); } catch {}
};

const today = () => new Date().toISOString().split("T")[0];

// ─── Task Detail Modal ────────────────────────────────────────────────────────

function TaskDetail({ task, onClose, onUpdate, onDelete }) {
  const [t, setT] = useState({ ...task });
  const [newSubtask, setNewSubtask] = useState("");

  const save = (updated) => {
    setT(updated);
    onUpdate(updated);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtasks = [...(t.subtasks || []), { id: Date.now().toString(), text: newSubtask.trim(), done: false }];
    save({ ...t, subtasks });
    setNewSubtask("");
  };

  const toggleSubtask = (id) => {
    const subtasks = (t.subtasks || []).map(s => s.id === id ? { ...s, done: !s.done } : s);
    save({ ...t, subtasks });
  };

  const deleteSubtask = (id) => {
    const subtasks = (t.subtasks || []).filter(s => s.id !== id);
    save({ ...t, subtasks });
  };

  const doneCount = (t.subtasks || []).filter(s => s.done).length;
  const totalCount = (t.subtasks || []).length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "#00000080",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0E0E1A", border: "1px solid #1E293B",
        borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 600,
        maxHeight: "92dvh", overflowY: "auto",
        padding: "20px 20px 40px",
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: "#1E293B", borderRadius: 2, margin: "0 auto 20px" }}/>

        {/* Title */}
        <textarea
          value={t.title}
          onChange={e => save({ ...t, title: e.target.value })}
          style={{
            width: "100%", background: "transparent", border: "none",
            color: "#F8FAFC", fontSize: 18, fontWeight: 700,
            fontFamily: "inherit", resize: "none", outline: "none",
            lineHeight: 1.4, marginBottom: 16,
          }}
          rows={2}
        />

        {/* Status + Priority + Role */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <select value={t.status || "todo"} onChange={e => save({ ...t, status: e.target.value })} style={{
            background: "#161622", border: "1px solid #1E293B", color: COLUMNS.find(c => c.id === (t.status || "todo"))?.color || "#64748B",
            borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
          }}>
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          <select value={t.priority || "medium"} onChange={e => save({ ...t, priority: e.target.value })} style={{
            background: "#161622", border: "1px solid #1E293B",
            color: PRIORITY_COLORS[t.priority] || "#F59E0B",
            borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
          }}>
            <option value="high">HIGH</option>
            <option value="medium">MED</option>
            <option value="low">LOW</option>
          </select>

          <select value={t.role || "PM"} onChange={e => save({ ...t, role: e.target.value })} style={{
            background: "#161622", border: "1px solid #1E293B",
            color: ROLE_COLORS[t.role] || "#F59E0B",
            borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
          }}>
            {Object.keys(ROLE_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Dates */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>START DATE</div>
            <input type="date" value={t.startDate || ""} onChange={e => save({ ...t, startDate: e.target.value })} style={{
              width: "100%", background: "#161622", border: "1px solid #1E293B",
              color: "#E2E8F0", borderRadius: 8, padding: "8px 10px",
              fontSize: 12, fontFamily: "inherit",
            }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>END DATE</div>
            <input type="date" value={t.endDate || ""} onChange={e => save({ ...t, endDate: e.target.value })} style={{
              width: "100%", background: "#161622", border: "1px solid #1E293B",
              color: "#E2E8F0", borderRadius: 8, padding: "8px 10px",
              fontSize: 12, fontFamily: "inherit",
            }}/>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>NOTES</div>
          <textarea
            value={t.notes || ""}
            onChange={e => save({ ...t, notes: e.target.value })}
            placeholder="Add notes, context, links..."
            rows={3}
            style={{
              width: "100%", background: "#161622", border: "1px solid #1E293B",
              color: "#E2E8F0", borderRadius: 8, padding: "10px 12px",
              fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Subtasks */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#475569" }}>SUBTASKS</div>
            {totalCount > 0 && (
              <div style={{ fontSize: 11, color: "#64748B" }}>{doneCount}/{totalCount} · {progress}%</div>
            )}
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div style={{ background: "#161622", borderRadius: 4, height: 4, marginBottom: 12, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#22C55E", borderRadius: 4, transition: "width .3s" }}/>
            </div>
          )}

          {(t.subtasks || []).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1E293B10" }}>
              <div onClick={() => toggleSubtask(s.id)} style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                background: s.done ? "#22C55E20" : "transparent",
                border: `2px solid ${s.done ? "#22C55E" : "#334155"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.done && <span style={{ color: "#22C55E", fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: s.done ? "#475569" : "#CBD5E1", textDecoration: s.done ? "line-through" : "none" }}>
                {s.text}
              </span>
              <button onClick={() => deleteSubtask(s.id)} style={{
                background: "transparent", border: "none", color: "#334155",
                fontSize: 11, cursor: "pointer", padding: 2,
              }}
                onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                onMouseLeave={e => e.currentTarget.style.color = "#334155"}
              >✕</button>
            </div>
          ))}

          {/* Add subtask */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSubtask()}
              placeholder="Add subtask..."
              style={{
                flex: 1, background: "#161622", border: "1px solid #1E293B",
                color: "#E2E8F0", borderRadius: 8, padding: "8px 12px",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={addSubtask} style={{
              background: "#1D4ED8", border: "none", color: "#fff",
              borderRadius: 8, padding: "8px 14px", fontSize: 12,
              cursor: "pointer", fontFamily: "inherit",
            }}>+</button>
          </div>
        </div>

        {/* Delete */}
        <button onClick={() => { onDelete(t.id); onClose(); }} style={{
          width: "100%", background: "transparent",
          border: "1px solid #EF444430", color: "#EF4444",
          borderRadius: 10, padding: "10px", fontSize: 13,
          cursor: "pointer", fontFamily: "inherit",
        }}>Delete task</button>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ task, onClick }) {
  const doneCount = (task.subtasks || []).filter(s => s.done).length;
  const totalCount = (task.subtasks || []).length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const color = PRIORITY_COLORS[task.priority] || "#475569";

  return (
    <div onClick={onClick} style={{
      background: "#161622", border: "1px solid #1E293B",
      borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
      transition: "border-color .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#334155"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1E293B"}
    >
      <div style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.5, marginBottom: 10 }}>{task.title}</div>

      {totalCount > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#475569" }}>{doneCount}/{totalCount} subtasks</span>
            <span style={{ fontSize: 10, color: "#475569" }}>{progress}%</span>
          </div>
          <div style={{ background: "#0C0C14", borderRadius: 3, height: 3, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#22C55E", borderRadius: 3 }}/>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1,
          color, background: `${color}15`, border: `1px solid ${color}30`,
          borderRadius: 4, padding: "2px 5px",
        }}>{PRIORITY_LABELS[task.priority] || "MED"}</span>
        {task.role && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: ROLE_COLORS[task.role] || "#334155",
            background: `${ROLE_COLORS[task.role] || "#334155"}15`,
            border: `1px solid ${ROLE_COLORS[task.role] || "#334155"}30`,
            borderRadius: 4, padding: "2px 6px",
          }}>{task.role}</span>
        )}
        {task.endDate && (
          <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>
            📅 {task.endDate}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView({ tasks }) {
  const grouped = COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => (t.status || "todo") === col.id),
  }));

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {COLUMNS.map(col => {
          const count = tasks.filter(t => (t.status || "todo") === col.id).length;
          return (
            <div key={col.id} style={{ background: "#0E0E1A", border: "1px solid #1E293B", borderRadius: 12, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: col.color, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{col.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#E2E8F0" }}>{count}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>of {tasks.length}</div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ background: "#0E0E1A", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden", overflowX: "auto" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #1E293B", minWidth: 500 }}>
          <div style={{ width: 130, minWidth: 130, padding: "10px 14px", fontSize: 10, color: "#475569", borderRight: "1px solid #1E293B", flexShrink: 0 }}>TASK</div>
          {DAYS.map(d => (
            <div key={d} style={{ flex: 1, padding: "10px 6px", fontSize: 10, color: "#475569", textAlign: "center", borderRight: "1px solid #1E293B" }}>{d}</div>
          ))}
        </div>
        {grouped.filter(g => g.tasks.length > 0).map(group => (
          <div key={group.id}>
            <div style={{ padding: "7px 14px", fontSize: 10, fontWeight: 700, color: group.color, background: `${group.color}08`, borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 6, minWidth: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: group.color, display: "inline-block" }}/>
              {group.label} · {group.tasks.length}
            </div>
            {group.tasks.map((task, ti) => {
              const dayIdx = tasks.indexOf(task) % 5;
              return (
                <div key={task.id} style={{ display: "flex", borderBottom: "1px solid #1E293B", minHeight: 40, minWidth: 500 }}>
                  <div style={{ width: 130, minWidth: 130, padding: "8px 14px", fontSize: 11, color: "#94A3B8", borderRight: "1px solid #1E293B", display: "flex", alignItems: "center", overflow: "hidden", flexShrink: 0 }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
                  </div>
                  {DAYS.map((d, di) => (
                    <div key={d} style={{ flex: 1, borderRight: "1px solid #1E293B", padding: "5px 3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {di === dayIdx && (
                        <div style={{ background: ROLE_COLORS[task.role] || "#334155", borderRadius: 5, padding: "3px 6px", fontSize: 9, color: "#fff", fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.role || "PM"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
        {tasks.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155", fontSize: 12 }}>No tasks yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("kanban");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem("pm_tasks"), []);
    setTasks(saved.map(t => ({ ...t, status: t.status || "todo" })));
  }, []);

  const updateTasks = (updated) => {
    setTasks(updated);
    saveTasks(updated);
  };

  const updateTask = (updated) => {
    const newTasks = tasks.map(t => t.id === updated.id ? updated : t);
    updateTasks(newTasks);
    setSelected(updated);
  };

  const deleteTask = (id) => {
    updateTasks(tasks.filter(t => t.id !== id));
  };

  const roles = ["all", ...Array.from(new Set(tasks.map(t => t.role).filter(Boolean)))];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.role === filter);

  return (
    <div style={{ minHeight: "100dvh", background: "#0C0C14", fontFamily: "Sora, Segoe UI, sans-serif", color: "#E2E8F0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        select option { background: #161622; }
        textarea::placeholder, input::placeholder { color: #334155; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1E293B", background: "#0E0E1A", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/pm-agent" style={{ textDecoration: "none", border: "1px solid #1E293B", color: "#64748B", padding: "5px 10px", borderRadius: 8, fontSize: 11 }}>← Chat</Link>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Tasks</div>
        <div style={{ fontSize: 10, color: "#475569", background: "#161622", border: "1px solid #1E293B", borderRadius: 20, padding: "2px 8px" }}>{tasks.length}</div>
        <div style={{ marginLeft: "auto", display: "flex", background: "#161622", border: "1px solid #1E293B", borderRadius: 8, padding: 2 }}>
          {[{ id: "kanban", label: "Board" }, { id: "timeline", label: "Timeline" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              background: view === v.id ? "#1D4ED8" : "transparent", border: "none",
              color: view === v.id ? "#fff" : "#475569",
              padding: "5px 12px", borderRadius: 6, fontSize: 11,
              cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Role filter */}
      {tasks.length > 0 && (
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B", display: "flex", gap: 6, overflowX: "auto", background: "#0E0E1A" }}>
          {roles.map(r => {
            const active = filter === r;
            const color = ROLE_COLORS[r] || "#334155";
            return (
              <button key={r} onClick={() => setFilter(r)} style={{
                background: active ? color : "transparent",
                border: `1px solid ${active ? color : "#1E293B"}`,
                color: active ? "#fff" : "#64748B",
                padding: "4px 10px", borderRadius: 20, fontSize: 11,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
              }}>{r === "all" ? "All" : r}</button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 14 }}>
        {view === "kanban" ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, alignItems: "flex-start" }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => (t.status || "todo") === col.id);
              return (
                <div key={col.id} style={{ minWidth: 260, width: 260, flexShrink: 0, background: "#0E0E1A", border: "1px solid #1E293B", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }}/>
                    <span style={{ fontWeight: 700, fontSize: 12, color: col.color }}>{col.label}</span>
                    <span style={{ marginLeft: "auto", background: "#161622", border: "1px solid #1E293B", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "#475569" }}>{colTasks.length}</span>
                  </div>
                  <div style={{ padding: 10, minHeight: 60 }}>
                    {colTasks.map(task => (
                      <KanbanCard key={task.id} task={task} onClick={() => setSelected(task)} />
                    ))}
                    {colTasks.length === 0 && (
                      <div style={{ padding: "16px 8px", textAlign: "center", color: "#1E293B", fontSize: 12 }}>empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <TimelineView tasks={filtered} />
        )}

        {tasks.length === 0 && (
          <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "60px 20px", lineHeight: 1.8 }}>
            No tasks yet{"\n"}Tell Eduard to plan your sprint
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
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
  