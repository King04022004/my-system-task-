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

type TrendPoint = {
  date: string;
  completedCount: number;
  cumulativeRate: number;
};

function buildTrend(tasks: Task[], todayText: string, rangeDays: number): TrendPoint[] {
  const baseDate = new Date(`${todayText}T00:00:00`);
  const points: TrendPoint[] = [];

  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const targetDate = ymd(addDays(baseDate, -i));
    const createdUntil = tasks.filter((task) => task.createdAt.slice(0, 10) <= targetDate).length;
    const completedUntil = tasks.filter(
      (task) => task.completedAt && task.completedAt.slice(0, 10) <= targetDate,
    ).length;
    const completedCount = tasks.filter(
      (task) => task.completedAt && task.completedAt.slice(0, 10) === targetDate,
    ).length;

    points.push({
      date: targetDate,
      completedCount,
      cumulativeRate: createdUntil === 0 ? 0 : Math.round((completedUntil / createdUntil) * 100),
    });
  }

  return points;
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>(ymd(new Date()));

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
      const safeTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      setTasks(rolloverTasks(safeTasks, today));
    } catch {
      setTasks([]);
    } finally {
      setReady(true);
    }
  }, []);

  const totalTaskCount = tasks.length;
  const completedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.completedAt)
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [tasks],
  );
  const completedCount = completedTasks.length;
  const completionRate = totalTaskCount === 0 ? 0 : Math.round((completedCount / totalTaskCount) * 100);

  const trend = useMemo(() => buildTrend(tasks, currentDate, 14), [tasks, currentDate]);
  const maxCompletedInDay = Math.max(...trend.map((point) => point.completedCount), 1);

  if (!ready) {
    return (
      <main className="app-shell">
        <div className="panel mx-auto w-full max-w-6xl">読み込み中...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Analytics</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">タスク分析</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">{toJapaneseDate(currentDate)} 時点のデータ</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-ghost">メイン</Link>
              <Link href="/history" className="btn-ghost">履歴</Link>
              <Link href="/settings" className="btn-ghost">設定</Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="panel">
            <p className="text-xs text-[var(--muted)]">総登録タスク数</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{totalTaskCount}</p>
          </article>
          <article className="panel">
            <p className="text-xs text-[var(--muted)]">完了済みタスク数</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{completedCount}</p>
          </article>
          <article className="panel">
            <p className="text-xs text-[var(--muted)]">達成率</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{completionRate}%</p>
          </article>
        </section>

        <section className="panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">達成推移（直近14日）</h2>
            <p className="text-xs text-[var(--muted)]">棒: 日次完了件数 / 線: 累積達成率</p>
          </div>

          <div className="mt-5">
            <div className="flex h-56 items-end gap-2">
              {trend.map((point) => {
                const barHeight = Math.max(8, Math.round((point.completedCount / maxCompletedInDay) * 100));
                return (
                  <div key={point.date} className="group flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="text-[10px] text-[var(--muted)] opacity-0 transition group-hover:opacity-100">
                      {point.completedCount}件
                    </div>
                    <div className="w-full rounded-t bg-[var(--accent)]" style={{ height: `${barHeight}%` }} />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex gap-2 text-[10px] text-[var(--muted)]">
              {trend.map((point) => (
                <div key={point.date} className="flex-1 text-center">
                  {point.date.slice(5)}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {trend.map((point) => (
                <div key={`${point.date}-line`} className="flex items-center gap-3">
                  <p className="w-20 text-xs text-[var(--muted)]">{point.date.slice(5)}</p>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${point.cumulativeRate}%` }} />
                  </div>
                  <p className="w-12 text-right text-xs font-semibold text-[var(--foreground)]">{point.cumulativeRate}%</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">完了タスクログ</h2>
          <div className="mt-4 space-y-2">
            {completedTasks.map((task) => (
              <article key={task.id} className="task-card">
                <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  完了日: {task.completedAt ? toJapaneseDate(task.completedAt.slice(0, 10)) : "-"}
                </p>
              </article>
            ))}
            {completedTasks.length === 0 && <p className="text-sm text-[var(--muted)]">完了ログはまだありません。</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
