"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  rolloverTasks,
  STORAGE_KEY,
  StoredState,
  Task,
  TaskCategory,
  toJapaneseDate,
  ymd,
} from "../../lib/task-store";

type RangeType = "today" | "yesterday" | "last7" | "all";
type HistoryFilter = "all" | TaskCategory;

type HistoryGroup = {
  date: string;
  tasks: Task[];
};

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
  const [categoryFilter, setCategoryFilter] = useState<HistoryFilter>("all");
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

  function categoryLabel(category: HistoryFilter): string {
    if (category === "work") return "仕事";
    if (category === "personal") return "個人";
    return "すべて";
  }

  function priorityLabel(priority: Task["priority"]): string {
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    return "低";
  }

  function categoryBadgeClass(category: TaskCategory): string {
    if (category === "work") return "category-badge category-badge-work";
    return "category-badge category-badge-personal";
  }

  function priorityBadgeClass(priority: Task["priority"]): string {
    if (priority === "high") return "priority-badge priority-badge-high";
    if (priority === "medium") return "priority-badge priority-badge-medium";
    return "priority-badge priority-badge-low";
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => task.completedAt)
      .filter((task) => inRange(task, currentDate, range))
      .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
      .filter((task) => !normalized || task.title.toLowerCase().includes(normalized))
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  }, [tasks, query, range, categoryFilter, currentDate]);

  const groups = useMemo<HistoryGroup[]>(() => {
    const map = new Map<string, Task[]>();
    filtered.forEach((task) => {
      const doneDate = task.completedAt?.slice(0, 10);
      if (!doneDate) return;
      const current = map.get(doneDate) ?? [];
      current.push(task);
      map.set(doneDate, current);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, groupedTasks]) => ({ date, tasks: groupedTasks }));
  }, [filtered]);

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
              <p className="mt-1 text-sm text-[var(--muted)]">仕事と個人の完了ログを日付ごとに振り返れます。</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-ghost">メインへ戻る</Link>
              <Link href="/settings" className="btn-ghost">設定</Link>
            </div>
          </div>
        </header>

        <section className="panel space-y-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted)]">表示対象</span>
            {(["all", "work", "personal"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setCategoryFilter(option)}
                className={categoryFilter === option ? "btn-primary" : "btn-mini"}
              >
                {categoryLabel(option)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <p>{filtered.length} 件</p>
            <p>{categoryLabel(categoryFilter)}の完了履歴を表示中</p>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.date} className="panel-soft space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--foreground)]">{toJapaneseDate(group.date)}</h2>
                    <p className="text-xs text-[var(--muted)]">{group.tasks.length} 件完了</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <article key={task.id} className="task-card">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={categoryBadgeClass(task.category)}>{categoryLabel(task.category)}</span>
                            <span className={priorityBadgeClass(task.priority)}>優先度 {priorityLabel(task.priority)}</span>
                            {task.dueDate && (
                              <span className="text-[11px] text-[var(--muted)]">期限: {toJapaneseDate(task.dueDate)}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          完了時刻: {task.completedAt ? task.completedAt.slice(11, 16) : "-"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
            {groups.length === 0 && <p className="text-sm text-[var(--muted)]">該当する履歴はありません。</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

