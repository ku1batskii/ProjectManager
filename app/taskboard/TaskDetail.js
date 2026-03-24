"use client";

import { useEffect, useMemo, useState } from "react";

const PRIORITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#22C55E",
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
  Creator: "#E879F9",
  Growth: "#34D399",
};

const COLUMNS = [
  { id: "todo", label: "Not Started", color: "#A1A1AA" },
  { id: "inprogress", label: "In Progress", color: "#F59E0B" },
  { id: "review", label: "On Review", color: "#FB7185" },
  { id: "done", label: "Completed", color: "#4ADE80" },
];

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "#64748B",
        fontWeight: 600,
        marginBottom: 7,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </div>
  );
}

function SurfaceInput({ children, style }) {
  return (
    <div
      style={{
        background: "#161622",
        border: "1px solid #1E293B",
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function TaskDetail({ task, onClose, onUpdate, onDelete }) {
  const [t, setT] = useState(task);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    setT(task);
  }, [task]);

  const save = (updated) => {
    setT(updated);
    onUpdate(updated);
  };

  const addSubtask = () => {
    const value = newSubtask.trim();
    if (!value) return;

    const updated = {
      ...t,
      subtasks: [
        ...(t.subtasks || []),
        {
          id: crypto.randomUUID(),
          text: value,
          done: false,
        },
      ],
    };

    save(updated);
    setNewSubtask("");
  };

  const toggleSubtask = (id) => {
    const updated = {
      ...t,
      subtasks: (t.subtasks || []).map((s) =>
        s.id === id ? { ...s, done: !s.done } : s
      ),
    };
    save(updated);
  };

  const deleteSubtask = (id) => {
    const updated = {
      ...t,
      subtasks: (t.subtasks || []).filter((s) => s.id !== id),
    };
    save(updated);
  };

  const statusMeta =
    COLUMNS.find((c) => c.id === (t?.status || "todo")) || COLUMNS[0];

  const doneCount = useMemo(
    () => (t?.subtasks || []).filter((s) => s.done).length,
    [t]
  );

  const totalCount = (t?.subtasks || []).length;
  const progress =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const priorityColor = PRIORITY_COLORS[t?.priority] || "#F59E0B";
  const roleColor = ROLE_COLORS[t?.role] || "#334155";

  if (!t) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#00000090",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 760,
          height: "100dvh",
          background: "#0C0C14",
          borderLeft: "1px solid #1E293B",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 60px rgba(0,0,0,.45)",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #1E293B",
            background: "#0E0E1A",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#64748B",
              fontWeight: 600,
            }}
          >
            Task
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid #1E293B",
                background: "#161622",
                color: "#64748B",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "18px 16px 24px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <FieldLabel>Title</FieldLabel>
            <textarea
              value={t.title || ""}
              onChange={(e) => save({ ...t, title: e.target.value })}
              rows={2}
              placeholder="Task title"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#161622",
                border: "1px solid #1E293B",
                borderRadius: 16,
                padding: "14px 16px",
                color: "#F8FAFC",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.35,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <FieldLabel>Status</FieldLabel>
              <select
                value={t.status || "todo"}
                onChange={(e) => save({ ...t, status: e.target.value })}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  color: statusMeta.color,
                  borderRadius: 12,
                  padding: "11px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <FieldLabel>Priority</FieldLabel>
              <select
                value={t.priority || "medium"}
                onChange={(e) => save({ ...t, priority: e.target.value })}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  color: priorityColor,
                  borderRadius: 12,
                  padding: "11px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <option value="high">HIGH</option>
                <option value="medium">MED</option>
                <option value="low">LOW</option>
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <FieldLabel>Role</FieldLabel>
              <select
                value={t.role || "PM"}
                onChange={(e) => save({ ...t, role: e.target.value })}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  color: roleColor,
                  borderRadius: 12,
                  padding: "11px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {Object.keys(ROLE_COLORS).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <FieldLabel>Start Date</FieldLabel>
              <input
                type="date"
                value={t.startDate || ""}
                onChange={(e) => save({ ...t, startDate: e.target.value })}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  color: "#E2E8F0",
                  borderRadius: 12,
                  padding: "11px 12px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  minHeight: 56,
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <FieldLabel>End Date</FieldLabel>
              <input
                type="date"
                value={t.endDate || ""}
                onChange={(e) => save({ ...t, endDate: e.target.value })}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  color: "#E2E8F0",
                  borderRadius: 12,
                  padding: "11px 12px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  minHeight: 56,
                }}
              />
            </div>

            <div style={{ minWidth: 0, gridColumn: "1 / -1" }}>
              <FieldLabel>Progress</FieldLabel>
              <SurfaceInput style={{ padding: "11px 12px", minHeight: 74 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#94A3B8",
                    marginBottom: 8,
                  }}
                >
                  <span>
                    {doneCount}/{totalCount || 0} done
                  </span>
                  <span>{progress}%</span>
                </div>

                <div
                  style={{
                    height: 5,
                    background: "#0C0C14",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "#22C55E",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </SurfaceInput>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <FieldLabel>Notes / Canvas</FieldLabel>
            <textarea
              value={t.notes || ""}
              onChange={(e) => save({ ...t, notes: e.target.value })}
              placeholder="Goal, context, links, constraints..."
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#161622",
                border: "1px solid #1E293B",
                color: "#E2E8F0",
                borderRadius: 14,
                padding: "13px 14px",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <FieldLabel>Subtasks</FieldLabel>

              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                {doneCount}/{totalCount || 0} · {progress}%
              </div>
            </div>

            {totalCount > 0 && (
              <div
                style={{
                  height: 4,
                  background: "#161622",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#22C55E",
                    borderRadius: 999,
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(t.subtasks || []).map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "#11111B",
                    border: "1px solid #1E293B",
                    borderRadius: 12,
                    padding: "11px 12px",
                  }}
                >
                  <button
                    onClick={() => toggleSubtask(s.id)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `1px solid ${s.done ? "#22C55E" : "#334155"}`,
                      background: s.done ? "#22C55E20" : "transparent",
                      color: s.done ? "#22C55E" : "#64748B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      fontSize: 12,
                    }}
                  >
                    {s.done ? "✓" : ""}
                  </button>

                  <div
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: s.done ? "#64748B" : "#E2E8F0",
                      textDecoration: s.done ? "line-through" : "none",
                      lineHeight: 1.45,
                    }}
                  >
                    {s.text}
                  </div>

                  <button
                    onClick={() => deleteSubtask(s.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#475569",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#EF4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#475569";
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSubtask();
                }}
                placeholder="Add subtask..."
                style={{
                  flex: 1,
                  maxWidth: "100%",
                  background: "#161622",
                  border: "1px solid #1E293B",
                  color: "#E2E8F0",
                  borderRadius: 12,
                  padding: "11px 12px",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />

              <button
                onClick={addSubtask}
                style={{
                  minWidth: 44,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "1px solid #1D4ED8",
                  background: "linear-gradient(135deg, #1D4ED8, #1E40AF)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <FieldLabel>Quick Summary</FieldLabel>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  background: `${statusMeta.color}15`,
                  border: `1px solid ${statusMeta.color}30`,
                  color: statusMeta.color,
                  borderRadius: 999,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {statusMeta.label}
              </div>

              <div
                style={{
                  background: `${priorityColor}15`,
                  border: `1px solid ${priorityColor}30`,
                  color: priorityColor,
                  borderRadius: 999,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {t.priority || "medium"}
              </div>

              <div
                style={{
                  background: `${roleColor}15`,
                  border: `1px solid ${roleColor}30`,
                  color: roleColor,
                  borderRadius: 999,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {t.role || "PM"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid #1E293B",
            background: "#0E0E1A",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <button
            onClick={() => {
              onDelete(t.id);
              onClose();
            }}
            style={{
              background: "transparent",
              border: "1px solid #EF444430",
              color: "#EF4444",
              borderRadius: 12,
              padding: "11px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Delete task
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "#161622",
                border: "1px solid #1E293B",
                color: "#CBD5E1",
                borderRadius: 12,
                padding: "11px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>

        <style>{`
          *, *::before, *::after {
            box-sizing: border-box;
          }

          input, textarea, select, button {
            max-width: 100%;
          }

          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(.7);
            cursor: pointer;
          }

          textarea::placeholder, input::placeholder {
            color: #475569;
          }

          select option {
            background: #161622;
            color: #E2E8F0;
          }
        `}</style>
      </div>
    </div>
  );
}