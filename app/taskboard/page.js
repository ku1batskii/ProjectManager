"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TaskDetail from "./TaskDetail";

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

const safeParse = (v, fb) => { try { return JSON.parse(v) || fb; } catch { return fb; } };
const saveTasks = (t) => { try { localStorage.setItem("pm_tasks", JSON.stringify(t)); } catch {} };

function KanbanCard({ task, onClick }) {
  const done = (task.subtasks || []).filter(s => s.done).length;
  const total = (task.subtasks || []).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = PRIORITY_COLORS[task.priority] || "#475569";
  const rc = ROLE_COLORS[task.role] || "#334155";
  return (
    <div onClick={onClick} style={{ background:"#161622", border:"1px solid #1E293B", borderRadius:10, padding:"12px 14px", marginBottom:8, cursor:"pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor="#334155"} onMouseLeave={e => e.currentTarget.style.borderColor="#1E293B"}>
      <div style={{ fontSize:13, color:"#E2E8F0", lineHeight:1.5, marginBottom:10 }}>{task.title}</div>
      {total > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:10, color:"#475569" }}>{done}/{total}</span>
            <span style={{ fontSize:10, color:"#475569" }}>{pct}%</span>
          </div>
          <div style={{ background:"#0C0C14", borderRadius:3, height:3, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:"#22C55E", borderRadius:3 }}/>
          </div>
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, color, background:`${color}15`, border:`1px solid ${color}30`, borderRadius:4, padding:"2px 5px" }}>{PRIORITY_LABELS[task.priority] || "MED"}</span>
        {task.role && <span style={{ fontSize:10, fontWeight:600, color:rc, background:`${rc}15`, border:`1px solid ${rc}30`, borderRadius:4, padding:"2px 6px" }}>{task.role}</span>}
        {task.endDate && <span style={{ fontSize:10, color:"#475569", marginLeft:"auto" }}>📅 {task.endDate}</span>}
      </div>
    </div>
  );
}

function TimelineView({ tasks }) {
  const grouped = COLUMNS.map(c => ({ ...c, tasks: tasks.filter(t => (t.status || "todo") === c.id) }));
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {COLUMNS.map(col => {
          const count = tasks.filter(t => (t.status || "todo") === col.id).length;
          return (
            <div key={col.id} style={{ background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:10, color:col.color, fontWeight:700, letterSpacing:1, marginBottom:4 }}>{col.label.toUpperCase()}</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#E2E8F0" }}>{count}</div>
              <div style={{ fontSize:10, color:"#475569" }}>of {tasks.length}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:14, overflow:"hidden", overflowX:"auto" }}>
        <div style={{ display:"flex", borderBottom:"1px solid #1E293B", minWidth:500 }}>
          <div style={{ width:130, minWidth:130, padding:"10px 14px", fontSize:10, color:"#475569", borderRight:"1px solid #1E293B", flexShrink:0 }}>TASK</div>
          {DAYS.map(d => <div key={d} style={{ flex:1, padding:"10px 6px", fontSize:10, color:"#475569", textAlign:"center", borderRight:"1px solid #1E293B" }}>{d}</div>)}
        </div>
        {grouped.filter(g => g.tasks.length > 0).map(group => (
          <div key={group.id}>
            <div style={{ padding:"7px 14px", fontSize:10, fontWeight:700, color:group.color, background:`${group.color}08`, borderBottom:"1px solid #1E293B", display:"flex", alignItems:"center", gap:6, minWidth:500 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:group.color, display:"inline-block" }}/>{group.label} · {group.tasks.length}
            </div>
            {group.tasks.map(task => {
              const dayIdx = tasks.indexOf(task) % 5;
              const rc = ROLE_COLORS[task.role] || "#334155";
              return (
                <div key={task.id} style={{ display:"flex", borderBottom:"1px solid #1E293B", minHeight:40, minWidth:500 }}>
                  <div style={{ width:130, minWidth:130, padding:"8px 14px", fontSize:11, color:"#94A3B8", borderRight:"1px solid #1E293B", display:"flex", alignItems:"center", overflow:"hidden", flexShrink:0 }}>
                    <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{task.title}</span>
                  </div>
                  {DAYS.map((d, di) => (
                    <div key={d} style={{ flex:1, borderRight:"1px solid #1E293B", padding:"5px 3px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {di === dayIdx && <div style={{ background:rc, borderRadius:5, padding:"3px 6px", fontSize:9, color:"#fff", fontWeight:600, maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.role || "PM"}</div>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
        {tasks.length === 0 && <div style={{ padding:40, textAlign:"center", color:"#334155", fontSize:12 }}>No tasks yet</div>}
      </div>
    </div>
  );
}

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("kanban");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem("pm_tasks"), []);
    setTasks(saved.map(t => ({ ...t, status: t.status || "todo" })));
  }, []);

  const updateTasks = (updated) => { setTasks(updated); saveTasks(updated); };
  const updateTask = (updated) => { updateTasks(tasks.map(t => t.id === updated.id ? updated : t)); setSelected(updated); };
  const deleteTask = (id) => updateTasks(tasks.filter(t => t.id !== id));

  const roles = ["all", ...Array.from(new Set(tasks.map(t => t.role).filter(Boolean)))];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.role === filter);

  return (
    <div style={{ minHeight:"100dvh", background:"#0C0C14", fontFamily:"Sora, Segoe UI, sans-serif", color:"#E2E8F0" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5)}select option{background:#161622}textarea::placeholder,input::placeholder{color:#334155}`}</style>

      <div style={{ padding:"14px 16px", borderBottom:"1px solid #1E293B", background:"#0E0E1A", position:"sticky", top:0, zIndex:10, display:"flex", alignItems:"center", gap:10 }}>
        <Link href="/pm-agent" style={{ textDecoration:"none", border:"1px solid #1E293B", color:"#64748B", padding:"5px 10px", borderRadius:8, fontSize:11 }}>← Chat</Link>
        <div style={{ fontWeight:700, fontSize:14 }}>Tasks</div>
        <div style={{ fontSize:10, color:"#475569", background:"#161622", border:"1px solid #1E293B", borderRadius:20, padding:"2px 8px" }}>{tasks.length}</div>
        <div style={{ marginLeft:"auto", display:"flex", background:"#161622", border:"1px solid #1E293B", borderRadius:8, padding:2 }}>
          {[{id:"kanban",label:"Board"},{id:"timeline",label:"Timeline"}].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ background:view===v.id?"#1D4ED8":"transparent", border:"none", color:view===v.id?"#fff":"#475569", padding:"5px 12px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>{v.label}</button>
          ))}
        </div>
      </div>

      {tasks.length > 0 && (
        <div style={{ padding:"10px 14px", borderBottom:"1px solid #1E293B", display:"flex", gap:6, overflowX:"auto", background:"#0E0E1A" }}>
          {roles.map(r => {
            const active = filter === r;
            const color = ROLE_COLORS[r] || "#334155";
            return <button key={r} onClick={() => setFilter(r)} style={{ background:active?color:"transparent", border:`1px solid ${active?color:"#1E293B"}`, color:active?"#fff":"#64748B", padding:"4px 10px", borderRadius:20, fontSize:11, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>{r === "all" ? "All" : r}</button>;
          })}
        </div>
      )}

      <div style={{ padding:14 }}>
        {view === "kanban" ? (
          <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8, alignItems:"flex-start" }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => (t.status || "todo") === col.id);
              return (
                <div key={col.id} style={{ minWidth:260, width:260, flexShrink:0, background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"12px 14px", borderBottom:"1px solid #1E293B", display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:col.color }}/>
                    <span style={{ fontWeight:700, fontSize:12, color:col.color }}>{col.label}</span>
                    <span style={{ marginLeft:"auto", background:"#161622", border:"1px solid #1E293B", borderRadius:10, padding:"1px 7px", fontSize:11, color:"#475569" }}>{colTasks.length}</span>
                  </div>
                  <div style={{ padding:10, minHeight:60 }}>
                    {colTasks.map(task => <KanbanCard key={task.id} task={task} onClick={() => setSelected(task)} />)}
                    {colTasks.length === 0 && <div style={{ padding:"16px 8px", textAlign:"center", color:"#1E293B", fontSize:12 }}>empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <TimelineView tasks={filtered} />
        )}
        {tasks.length === 0 && <div style={{ textAlign:"center", color:"#334155", fontSize:13, padding:"60px 20px", lineHeight:1.8 }}>No tasks yet{"\n"}Tell Eduard to plan your sprint</div>}
      </div>

      {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} onUpdate={updateTask} onDelete={deleteTask} />}
    </div>
  );
}