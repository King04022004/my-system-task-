"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  rolloverTasks,
  STORAGE_KEY,
  StoredState,
  Task,
  toJapaneseDate,
  ymd,
} from "../../lib/task-store";

type RangeType = "today" | "yesterday" | "last7" | "all";

function inRange(task: Task, currentDate: string, range: RangeType): boolean {
  if (!task.completedAt) return false;
  const done = task.completedAt.slice(0, 10);

  if (range === "all") return true;
  if (range === "today") return done === currentDate;

  const yesterday = ymd(addDays(new Date(`${currentDate}T00:00:00`), -1));
  if (range === "yesterday") return done === yesterday;

  const start = ymd(addDays(new Date(`${currentDate}T00:00:00`), -6));
  return done >= start && done <= currentDate;
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeType>("all");
  const [currentDate, setCurrentDate] = useState(ymd(new Date()));

  useEffect(() => {
    const today = ymd(new Date());
    setCurrentDate(today);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setTasks([]);
        setReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as StoredState;
      const safe = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      setTasks(rolloverTasks(safe, today));
    } catch {
      setTasks([]);
    } finally {
      setReady(true);
    }
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => task.completedAt)
      .filter((task) => inRange(task, currentDate, range))
      .filter((task) => !normalized || task.title.toLowerCase().includes(normalized))
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  }, [tasks, query, range, currentDate]);

  if (!ready) {
    return (
      <main className="app-shell">
        <div className="panel mx-auto w-full max-w-5xl">読み込み中...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">History</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">完了タスク履歴</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">保存済みの完了ログを参照します。</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-ghost">メインへ戻る</Link>
              <Link href="/settings" className="btn-ghost">設定</Link>
            </div>
          </div>
        </header>

        <section className="panel space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input min-w-[220px]"
              placeholder="タイトル検索"
            />
            <button onClick={() => setRange("today")} className={range === "today" ? "btn-primary" : "btn-mini"}>本日</button>
            <button onClick={() => setRange("yesterday")} className={range === "yesterday" ? "btn-primary" : "btn-mini"}>昨日</button>
            <button onClick={() => setRange("last7")} className={range === "last7" ? "btn-primary" : "btn-mini"}>直近7日</button>
            <button onClick={() => setRange("all")} className={range === "all" ? "btn-primary" : "btn-mini"}>全期間</button>
          </div>
          <p className="text-xs text-[var(--muted)]">{filtered.length} 件</p>

          <div className="space-y-2">
            {filtered.map((task) => (
              <article key={task.id} className="task-card">
                <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  完了日: {task.completedAt ? toJapaneseDate(task.completedAt.slice(0, 10)) : "-"}
                </p>
              </article>
            ))}
            {filtered.length === 0 && <p className="text-sm text-[var(--muted)]">該当する履歴はありません。</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
