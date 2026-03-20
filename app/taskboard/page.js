"use client";

import { useState, useEffect } from "react";
import TaskBoard from "../../components/TaskBoard";

const safeParse = (v, fallback) => {
  try { return JSON.parse(v); } catch { return fallback; }
};

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem("pm_tasks"), []);
    setTasks(saved);
  }, []);

  return <TaskBoard tasks={tasks} setTasks={setTasks} />;
}