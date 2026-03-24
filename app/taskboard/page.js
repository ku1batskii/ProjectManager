"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TaskDetail from "./TaskDetail";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STORAGE_KEY = "pm_tasks";

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
  Creator: "#E879F9",
  Growth: "#34D399",
};

const COLUMNS = [
  { id: "todo", label: "Not Started", color: "#A1A1AA", empty: "Nothing planned yet" },
  { id: "inprogress", label: "In Progress", color: "#F59E0B", empty: "No active execution" },
  { id: "review", label: "On Review", color: "#FB7185", empty: "Nothing waiting review" },
  { id: "done", label: "Completed", color: "#4ADE80", empty: "Nothing shipped yet" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
};

const getDayIndex = (date) => {
  if (!date) return null;
  const d = new Date(date).getDay();
  return d === 0 || d === 6 ? null : d - 1;
};

function Avatar() {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#161622",
        border: "2px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        color: "#94A3B8",
        flexShrink: 0,
        fontFamily: "Georgia, serif",
      }}
    >
      E
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: "#161622",
        border: "1px solid #1E293B",
        width: 36,
        height: 36,
        borderRadius: 10,
        cursor: "pointer",
        color: "#64748B",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#334155";
        e.currentTarget.style.color = "#CBD5E1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1E293B";
        e.currentTarget.style.color = "#64748B";
      }}
    >
      {children}
    </button>
  );
}

function TopStat({ label, value, total, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 120 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", lineHeight: 1.1 }}>
        {value} of {total}
      </div>
    </div>
  );
}

function KanbanCardContent({ task }) {
  const doneCount = (task.subtasks || []).filter((s) => s.done).length;
  const totalCount = (task.subtasks || []).length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const priorityColor = PRIORITY_COLORS[task.priority] || "#475569";
  const roleColor = ROLE_COLORS[task.role] || "#334155";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: priorityColor,
            marginTop: 5,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#F8FAFC",
            lineHeight: 1.45,
            flex: 1,
          }}
        >
          {task.title}
        </div>
      </div>

      {task.notes && (
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            lineHeight: 1.5,
            marginBottom: 12,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {task.notes}
        </div>
      )}

      {totalCount > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 10, color: "#64748B" }}>
              {doneCount}/{totalCount} subtasks
            </span>
            <span style={{ fontSize: 10, color: "#64748B" }}>{progress}%</span>
          </div>

          <div
            style={{
              height: 4,
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
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1,
            color: priorityColor,
            background: `${priorityColor}15`,
            border: `1px solid ${priorityColor}30`,
            borderRadius: 999,
            padding: "3px 7px",
          }}
        >
          {PRIORITY_LABELS[task.priority] || "MED"}
        </span>

        {task.role && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: roleColor,
              background: `${roleColor}15`,
              border: `1px solid ${roleColor}30`,
              borderRadius: 999,
              padding: "3px 8px",
            }}
          >
            {task.role}
          </span>
        )}

        {task.endDate && (
          <span
            style={{
              fontSize: 10,
              color: "#64748B",
              marginLeft: "auto",
            }}
          >
            {task.endDate}
          </span>
        )}
      </div>
    </>
  );
}

function SortableKanbanCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      taskId: task.id,
      columnId: task.status || "todo",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={onClick}
        {...attributes}
        {...listeners}
        style={{
          background: "#161622",
          border: "1px solid #1E293B",
          borderRadius: 16,
          padding: "14px 14px 12px",
          cursor: "grab",
          transition: "border-color .15s ease, transform .15s ease, box-shadow .15s ease",
          boxShadow: isDragging
            ? "0 14px 28px rgba(0,0,0,.24)"
            : "0 1px 0 rgba(255,255,255,0.02) inset",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = "#334155";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,.18)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = "#1E293B";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.02) inset";
          }
        }}
      >
        <KanbanCardContent task={task} />
      </div>
    </div>
  );
}

function EmptyColumnState({ text, onCreate }) {
  return (
    <div
      style={{
        border: "1px dashed #2A3445",
        background: "rgba(255,255,255,.015)",
        borderRadius: 14,
        padding: "18px 14px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>{text}</div>
      <button
        onClick={onCreate}
        style={{
          background: "transparent",
          border: "1px solid #1E293B",
          color: "#94A3B8",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Create first task
      </button>
    </div>
  );
}

function Column({ column, tasks, onCreate, onSelect }) {
  return (
    <div
      style={{
        minWidth: 290,
        width: 290,
        flexShrink: 0,
        background: "#0E0E1A",
        border: "1px solid #1E293B",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "11px 14px",
          borderBottom: "1px solid #1E293B",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: `${column.color}18`,
        }}
      >
        <span style={{ color: column.color, fontSize: 11 }}>▼</span>

        <span style={{ color: column.color, fontWeight: 700, fontSize: 12 }}>
          {column.label}
        </span>

        <span style={{ marginLeft: "auto", color: "#94A3B8", fontSize: 12 }}>
          {tasks.length}
        </span>

        <button
          onClick={onCreate}
          style={{
            background: "transparent",
            border: "none",
            color: "#E2E8F0",
            fontSize: 24,
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          padding: 10,
          minHeight: 420,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((task) => (
                <SortableKanbanCard
                  key={task.id}
                  task={task}
                  onClick={() => onSelect(task)}
                />
              ))}
            </div>
          ) : (
            <EmptyColumnState text={column.empty} onCreate={onCreate} />
          )}
        </SortableContext>

        <button
          onClick={onCreate}
          style={{
            width: "100%",
            marginTop: 10,
            background: "transparent",
            border: "1px dashed #2A3445",
            color: "#64748B",
            borderRadius: 14,
            padding: "12px 14px",
            textAlign: "left",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#334155";
            e.currentTarget.style.color = "#94A3B8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2A3445";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          + New card
        </button>
      </div>
    </div>
  );
}

function EmptyBoardState({ onCreate, hasFilter }) {
  return (
    <div
      style={{
        background: "#0E0E1A",
        border: "1px solid #1E293B",
        borderRadius: 20,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 10 }}>✦</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>
        {hasFilter ? "Nothing matches this filter" : "No tasks yet"}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#64748B",
          lineHeight: 1.6,
          maxWidth: 420,
          margin: "0 auto 16px",
        }}
      >
        {hasFilter
          ? "Try another role or search query, or create a new task directly on the board."
          : "Start with one real task, then break it down in the PM chat and manage execution here."}
      </div>

      <button
        onClick={() => onCreate("todo")}
        style={{
          background: "linear-gradient(135deg, #1D4ED8, #1E40AF)",
          border: "1px solid #1D4ED8",
          color: "#fff",
          borderRadius: 12,
          padding: "11px 16px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        + Create task
      </button>
    </div>
  );
}

function TimelineView({ tasks }) {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => (t.status || "todo") === col.id),
  }));

  return (
    <div
      style={{
        background: "#0E0E1A",
        border: "1px solid #1E293B",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1E293B",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⏳</span>
          <span>Timeline</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {["Month", "Today", "Fit"].map((item) => (
            <button
              key={item}
              style={{
                background: "#161622",
                border: "1px solid #1E293B",
                color: "#CBD5E1",
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 980 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "210px repeat(5, 1fr)",
              borderBottom: "1px solid #1E293B",
              background: "#0C0C14",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderRight: "1px solid #1E293B",
                color: "#64748B",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              TASK
            </div>

            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  padding: "12px 10px",
                  textAlign: "center",
                  color: "#64748B",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRight: "1px solid #1E293B",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {grouped.map((group) => (
            <div key={group.id}>
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: group.color,
                  borderBottom: "1px solid #1E293B",
                  background: `${group.color}08`,
                }}
              >
                ▼ {group.label}
              </div>

              {group.tasks.length === 0 ? (
                <div
                  style={{
                    padding: "14px 16px",
                    color: "#334155",
                    borderBottom: "1px solid #1E293B",
                    fontSize: 12,
                  }}
                >
                  No tasks
                </div>
              ) : (
                group.tasks.map((task) => {
                  const roleColor = ROLE_COLORS[task.role] || "#334155";
                  const startIdx = getDayIndex(task.startDate);
                  const fallbackIdx = tasks.indexOf(task) % 5;
                  const position = startIdx ?? fallbackIdx;

                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "210px repeat(5, 1fr)",
                        borderBottom: "1px solid #1E293B",
                        minHeight: 52,
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 16px",
                          borderRight: "1px solid #1E293B",
                          color: "#E2E8F0",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.title}
                      </div>

                      {DAYS.map((day, i) => (
                        <div
                          key={day}
                          style={{
                            borderRight: "1px solid #1E293B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 8,
                          }}
                        >
                          {i === position && (
                            <div
                              style={{
                                width: "100%",
                                maxWidth: 140,
                                background: `${roleColor}18`,
                                border: `1px solid ${roleColor}40`,
                                color: "#F8FAFC",
                                borderRadius: 10,
                                padding: "7px 10px",
                                fontSize: 11,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {task.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id) || null;
}

function getColumnIdByTarget(tasks, overId) {
  if (!overId) return null;

  const column = COLUMNS.find((c) => c.id === overId);
  if (column) return column.id;

  const overTask = findTaskById(tasks, overId);
  return overTask?.status || null;
}

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("board");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY), []);
    setTasks(saved.map((t) => ({ ...t, status: t.status || "todo" })));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateTasks = (updated) => {
    setTasks(updated);
    saveTasks(updated);
  };

  const createTask = (status = "todo") => {
    const newTask = {
      id: crypto.randomUUID(),
      title: "New task",
      status,
      priority: "medium",
      role: "PM",
      startDate: "",
      endDate: "",
      notes: "",
      subtasks: [],
    };

    const next = [newTask, ...tasks];
    updateTasks(next);
    setSelected(newTask);
  };

  const updateTask = (updated) => {
    const next = tasks.map((t) => (t.id === updated.id ? updated : t));
    updateTasks(next);
    setSelected(next.find((t) => t.id === updated.id) || null);
  };

  const deleteTask = (id) => {
    const next = tasks.filter((t) => t.id !== id);
    updateTasks(next);
    setSelected(null);
  };

  const roles = useMemo(() => {
    return ["all", ...new Set(tasks.map((t) => t.role).filter(Boolean))];
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tasks.filter((t) => {
      const roleOk = filter === "all" ? true : t.role === filter;
      const queryOk =
        !q ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q) ||
        (t.role || "").toLowerCase().includes(q);

      return roleOk && queryOk;
    });
  }, [tasks, filter, query]);

  const counts = {
    todo: tasks.filter((t) => (t.status || "todo") === "todo").length,
    inprogress: tasks.filter((t) => (t.status || "todo") === "inprogress").length,
    review: tasks.filter((t) => (t.status || "todo") === "review").length,
    done: tasks.filter((t) => (t.status || "todo") === "done").length,
  };

  const hasFilters = filter !== "all" || query.trim().length > 0;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = findTaskById(tasks, active.id);
    if (!activeTask) return;

    const targetColumnId = getColumnIdByTarget(tasks, over.id);
    if (!targetColumnId) return;

    const nextTasks = [...tasks];
    const activeIndex = nextTasks.findIndex((task) => task.id === active.id);
    const overTask = findTaskById(nextTasks, over.id);

    if (!overTask) {
      nextTasks[activeIndex] = { ...nextTasks[activeIndex], status: targetColumnId };
      updateTasks(nextTasks);
      return;
    }

    const overIndex = nextTasks.findIndex((task) => task.id === over.id);

    if (activeTask.status === overTask.status) {
      const reordered = arrayMove(nextTasks, activeIndex, overIndex);
      updateTasks(reordered);
      return;
    }

    nextTasks[activeIndex] = { ...nextTasks[activeIndex], status: overTask.status };
    const moved = arrayMove(nextTasks, activeIndex, overIndex);
    updateTasks(moved);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0C0C14",
        color: "#E2E8F0",
        fontFamily: "Sora, Segoe UI, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
        button, input, textarea, select { font-family: inherit; }
        a { color: inherit; text-decoration: none; }
        input::placeholder { color: #475569; }
      `}</style>

      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "#0E0E1A",
            borderBottom: "1px solid #1E293B",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <Link
            href="/pm-agent"
            style={{
              background: "transparent",
              border: "1px solid #1E293B",
              width: 34,
              height: 34,
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#64748B",
            }}
          >
            ←
          </Link>

          <div style={{ position: "relative" }}>
            <Avatar />
            <div
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22C55E",
                border: "2px solid #0E0E1A",
              }}
            />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Task Tracker</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>
              AI PM execution board
            </div>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                background: "#161622",
                border: "1px solid #1E293B",
                borderRadius: 10,
                padding: 2,
              }}
            >
              {[
                { id: "board", label: "Board" },
                { id: "timeline", label: "Timeline" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  style={{
                    background:
                      view === v.id
                        ? "linear-gradient(135deg, #1D4ED8, #1E40AF)"
                        : "transparent",
                    border: "none",
                    color: view === v.id ? "#fff" : "#64748B",
                    padding: "7px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <IconButton title="Create task" onClick={() => createTask("todo")}>
              +
            </IconButton>
          </div>
        </div>

        <div style={{ padding: "30px 16px 16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 48,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            <TopStat label="Not Started" value={counts.todo} total={tasks.length} color="#D4D4D8" />
            <TopStat label="In Progress" value={counts.inprogress} total={tasks.length} color="#FCD34D" />
            <TopStat label="On Review" value={counts.review} total={tasks.length} color="#F87171" />
            <TopStat label="Completed" value={counts.done} total={tasks.length} color="#4ADE80" />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                flex: "1 1 280px",
                minWidth: 240,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#161622",
                border: "1px solid #1E293B",
                borderRadius: 14,
                padding: "0 12px",
                height: 42,
              }}
            >
              <span style={{ color: "#475569", fontSize: 14 }}>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, notes, roles..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#E2E8F0",
                  fontSize: 13,
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {roles.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {roles.map((role) => {
                  const active = filter === role;
                  const color = ROLE_COLORS[role] || "#334155";

                  return (
                    <button
                      key={role}
                      onClick={() => setFilter(role)}
                      style={{
                        background: active ? `${color}20` : "transparent",
                        border: `1px solid ${active ? color : "#1E293B"}`,
                        color: active ? "#E2E8F0" : "#64748B",
                        padding: "8px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {role === "all" ? "All roles" : role}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, color: "#64748B" }}>
              {filtered.length} visible tasks
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #1E293B",
                  color: "#94A3B8",
                  borderRadius: 10,
                  padding: "7px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyBoardState onCreate={createTask} hasFilter={hasFilters} />
          ) : view === "board" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 14 }}>
                {COLUMNS.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    tasks={filtered.filter((t) => (t.status || "todo") === column.id)}
                    onCreate={() => createTask(column.id)}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </DndContext>
          ) : (
            <TimelineView tasks={filtered} />
          )}
        </div>
      </div>

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