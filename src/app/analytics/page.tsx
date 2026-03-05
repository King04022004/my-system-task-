"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Bucket = "today" | "upcoming" | "inbox" | "completed";

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  bucket: Bucket;
  createdAt: string;
  completedAt: string | null;
  overdue: boolean;
};

type StoredState = {
  tasks: Task[];
  lastActiveDate: string;
};

type TrendPoint = {
  date: string;
  completedCount: number;
  cumulativeRate: number;
};

const STORAGE_KEY = "focus-task-system-v1";

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function toJapaneseDate(dateText: string): string {
  const [y, m, d] = dateText.split("-");
  return `${y}/${m}/${d}`;
}

function ensureTaskConsistency(task: Task, todayText: string): Task {
  if (task.completedAt) {
    return { ...task, bucket: "completed", overdue: false };
  }

  if (!task.dueDate) {
    return { ...task, bucket: "inbox", overdue: false };
  }

  if (task.dueDate <= todayText) {
    return { ...task, bucket: "today", overdue: task.dueDate < todayText };
  }

  return { ...task, bucket: "upcoming", overdue: false };
}

function rolloverTasks(tasks: Task[], todayText: string): Task[] {
  return tasks.map((task) => ensureTaskConsistency(task, todayText));
}

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
      cumulativeRate:
        createdUntil === 0 ? 0 : Math.round((completedUntil / createdUntil) * 100),
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
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 text-slate-700">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-[0_18px_50px_rgba(58,88,175,0.18)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-indigo-500">Analytics</p>
              <h1 className="mt-2 font-display text-3xl text-slate-900 sm:text-4xl">タスク分析ダッシュボード</h1>
              <p className="mt-2 text-sm text-slate-600">{toJapaneseDate(currentDate)} 時点の進捗データ</p>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300"
            >
              メインへ戻る
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-white p-5">
            <p className="text-xs text-indigo-700">総登録タスク数</p>
            <p className="mt-2 text-3xl font-bold text-indigo-900">{totalTaskCount}</p>
          </article>
          <article className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-5">
            <p className="text-xs text-emerald-700">完了済みタスク数</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">{completedCount}</p>
          </article>
          <article className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 to-white p-5">
            <p className="text-xs text-cyan-700">タスク達成率</p>
            <p className="mt-2 text-3xl font-bold text-cyan-900">{completionRate}%</p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">タスク達成の推移（直近14日）</h2>
            <p className="text-xs text-slate-500">棒: 日次完了件数 / 線: 累積達成率</p>
          </div>

          <div className="mt-5">
            <div className="flex h-56 items-end gap-2">
              {trend.map((point) => {
                const barHeight = Math.max(
                  8,
                  Math.round((point.completedCount / maxCompletedInDay) * 100),
                );
                return (
                  <div key={point.date} className="group flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="text-[10px] text-slate-500 opacity-0 transition group-hover:opacity-100">
                      {point.completedCount}件
                    </div>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400"
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex gap-2 text-[10px] text-slate-500">
              {trend.map((point) => (
                <div key={point.date} className="flex-1 text-center">
                  {point.date.slice(5)}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {trend.map((point) => (
                <div key={`${point.date}-line`} className="flex items-center gap-3">
                  <p className="w-20 text-xs text-slate-500">{point.date.slice(5)}</p>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{ width: `${point.cumulativeRate}%` }}
                    />
                  </div>
                  <p className="w-12 text-right text-xs font-semibold text-slate-700">{point.cumulativeRate}%</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-900">完了タスクログ</h2>
          <div className="mt-4 space-y-2">
            {completedTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  完了日: {task.completedAt ? toJapaneseDate(task.completedAt.slice(0, 10)) : "-"}
                </p>
              </article>
            ))}
            {completedTasks.length === 0 && (
              <p className="text-sm text-slate-500">完了ログはまだありません。</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
