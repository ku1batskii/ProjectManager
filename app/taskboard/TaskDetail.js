"use client";

import { useState, useEffect } from "react";

export default function TaskDetail({ task, onClose, onUpdate, onDelete }) {
  const [t, setT] = useState(task);

  useEffect(() => {
    setT(task);
  }, [task]);

  if (!t) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#00000080",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 100,
    }} onClick={onClose}>
      
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0E0E1A",
          border: "1px solid #1E293B",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 500,
          padding: 20,
        }}
      >
        {/* Title */}
        <input
          value={t.title}
          onChange={(e) => {
            const updated = { ...t, title: e.target.value };
            setT(updated);
            onUpdate(updated);
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 16,
            marginBottom: 16,
          }}
        />

        {/* Status */}
        <select
          value={t.status}
          onChange={(e) => {
            const updated = { ...t, status: e.target.value };
            setT(updated);
            onUpdate(updated);
          }}
        >
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>

        {/* Actions */}
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button onClick={onClose}>Close</button>

          <button
            onClick={() => {
              onDelete(t.id);
              onClose();
            }}
            style={{ color: "red" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}