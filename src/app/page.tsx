"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Bucket = "today" | "upcoming" | "inbox" | "completed";
type DropZone = Exclude<Bucket, "completed"> | "trash";

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

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function seedTasks(todayText: string): Task[] {
  const today = new Date(`${todayText}T00:00:00`);
  return [
    {
      id: crypto.randomUUID(),
      title: "企画書の構成ラフを作る",
      dueDate: todayText,
      bucket: "today",
      createdAt: new Date().toISOString(),
      completedAt: null,
      overdue: false,
    },
    {
      id: crypto.randomUUID(),
      title: "週次レビューの要点整理",
      dueDate: todayText,
      bucket: "today",
      createdAt: new Date().toISOString(),
      completedAt: null,
      overdue: false,
    },
    {
      id: crypto.randomUUID(),
      title: "明日、顧客提案の最終チェック",
      dueDate: ymd(addDays(today, 1)),
      bucket: "upcoming",
      createdAt: new Date().toISOString(),
      completedAt: null,
      overdue: false,
    },
    {
      id: crypto.randomUUID(),
      title: "新しいタスク分類の案",
      dueDate: null,
      bucket: "inbox",
      createdAt: new Date().toISOString(),
      completedAt: null,
      overdue: false,
    },
  ];
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(ymd(new Date()));
  const [taskTitleInput, setTaskTitleInput] = useState<string>("");
  const [taskDateInput, setTaskDateInput] = useState<string>("");
  const [showMorningPopup, setShowMorningPopup] = useState<boolean>(true);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>("");
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const today = ymd(new Date());
    setCurrentDate(today);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setTasks(seedTasks(today));
        setReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as StoredState;
      const normalized = rolloverTasks(parsed.tasks ?? [], today);
      setTasks(normalized);
    } catch {
      setTasks(seedTasks(today));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    const state: StoredState = {
      tasks,
      lastActiveDate: currentDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [tasks, currentDate, ready]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = ymd(new Date());
      if (now !== currentDate) {
        setCurrentDate(now);
        setTasks((prev) => rolloverTasks(prev, now));
        setShowMorningPopup(true);
      }
    }, 60_000);

    return () => clearInterval(timer);
  }, [currentDate]);

  useEffect(() => {
    if (!lastDeletedTask) return;
    const timeoutId = window.setTimeout(() => {
      setLastDeletedTask(null);
    }, 8000);
    return () => window.clearTimeout(timeoutId);
  }, [lastDeletedTask]);

  const todayTasks = useMemo(() => {
    return sortByPriority(tasks.filter((task) => task.bucket === "today" && !task.completedAt));
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return sortByPriority(tasks.filter((task) => task.bucket === "upcoming" && !task.completedAt));
  }, [tasks]);

  const inboxTasks = useMemo(() => {
    return sortByPriority(tasks.filter((task) => task.bucket === "inbox" && !task.completedAt));
  }, [tasks]);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.bucket === "completed" && task.completedAt),
    [tasks],
  );

  const yesterday = ymd(addDays(new Date(`${currentDate}T00:00:00`), -1));
  const yesterdayCarryOver = todayTasks.filter((task) => task.dueDate === yesterday);
  const todayDueTasks = todayTasks.filter((task) => task.dueDate === currentDate);

  const doneTodayCount = useMemo(
    () =>
      completedTasks.filter(
        (task) => task.completedAt && task.completedAt.slice(0, 10) === currentDate,
      ).length,
    [completedTasks, currentDate],
  );

  const totalToday = todayTasks.length + doneTodayCount;
  const meter = totalToday === 0 ? 0 : Math.round((doneTodayCount / totalToday) * 100);

  function addTask(titleRaw: string, dueDateRaw: string) {
    const title = titleRaw.trim();
    if (!title) {
      setInputError("タスク名を入力してください。");
      return;
    }

    const dueDate = dueDateRaw || null;
    const bucket: Bucket = !dueDate
      ? "inbox"
      : dueDate <= currentDate
        ? "today"
        : "upcoming";

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      dueDate,
      bucket,
      createdAt: new Date().toISOString(),
      completedAt: null,
      overdue: Boolean(dueDate && dueDate < currentDate),
    };

    setTasks((prev) => [newTask, ...prev]);
    setTaskTitleInput("");
    setInputError("");
  }

  function onSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask(taskTitleInput, taskDateInput);
  }

  function moveTaskToBucket(taskId: string, destination: Exclude<Bucket, "completed">) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId || task.completedAt) return task;

        if (destination === "today") {
          return {
            ...task,
            bucket: "today",
            dueDate: currentDate,
            overdue: false,
          };
        }

        if (destination === "upcoming") {
          const fallbackDate = ymd(addDays(new Date(`${currentDate}T00:00:00`), 1));
          return {
            ...task,
            bucket: "upcoming",
            dueDate: task.dueDate && task.dueDate > currentDate ? task.dueDate : fallbackDate,
            overdue: false,
          };
        }

        return {
          ...task,
          bucket: "inbox",
          dueDate: null,
          overdue: false,
        };
      }),
    );
  }

  function completeTask(taskId: string) {
    setCompletingTaskId(taskId);
    window.setTimeout(() => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                bucket: "completed",
                completedAt: new Date().toISOString(),
                overdue: false,
              }
            : task,
        ),
      );
      setCompletingTaskId(null);
    }, 360);
  }

  function reactivateTask(taskId: string) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          bucket: "today",
          dueDate: currentDate,
          completedAt: null,
          overdue: false,
        };
      }),
    );
  }

  function deleteTask(taskId: string) {
    const removed = tasks.find((task) => task.id === taskId);
    if (!removed) return;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setLastDeletedTask(removed);
  }

  function undoDeleteTask() {
    if (!lastDeletedTask) return;
    setTasks((prev) => [ensureTaskConsistency(lastDeletedTask, currentDate), ...prev]);
    setLastDeletedTask(null);
  }

  function exportTasks() {
    const payload: StoredState = { tasks, lastActiveDate: currentDate };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `focusdock-backup-${currentDate}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importTasks(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = typeof reader.result === "string" ? reader.result : "";
        const parsed = JSON.parse(raw) as StoredState;
        const safeTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        setTasks(rolloverTasks(safeTasks, currentDate));
      } catch {
        setInputError("バックアップの読み込みに失敗しました。");
      } finally {
        if (importInputRef.current) importInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function onDropToZone(zone: DropZone) {
    if (!draggingTaskId) return;
    if (zone === "trash") {
      deleteTask(draggingTaskId);
    } else {
      moveTaskToBucket(draggingTaskId, zone);
    }
    setDraggingTaskId(null);
    setActiveDropZone(null);
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 text-slate-700">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      {showMorningPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0_30px_100px_rgba(35,55,140,0.35)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Morning Focus
            </p>
            <h2 className="mt-2 font-display text-2xl text-slate-900">
              今日のスタートを宣言
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-white p-4">
                <p className="text-xs text-indigo-700">昨日残ったタスク</p>
                <p className="mt-1 text-3xl font-bold text-indigo-900">{yesterdayCarryOver.length}</p>
              </div>
              <div className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 to-white p-4">
                <p className="text-xs text-cyan-700">今日のタスク</p>
                <p className="mt-1 text-3xl font-bold text-cyan-900">{todayDueTasks.length}</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-700">
              他の情報は一旦閉じて、今日の動きだけに集中します。
            </div>
            <button
              onClick={() => setShowMorningPopup(false)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:brightness-110"
            >
              今日を開始する
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 rounded-3xl border border-white/60 bg-white/75 p-5 shadow-[0_18px_50px_rgba(58,88,175,0.18)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-indigo-500">Personal Task System</p>
              <h1 className="mt-2 font-display text-3xl text-slate-900 sm:text-4xl">FocusDock</h1>
              <p className="mt-2 text-sm text-slate-600">{toJapaneseDate(currentDate)} の集中計画</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/analytics"
                className="rounded-xl border border-indigo-300 bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-700 hover:border-indigo-400"
              >
                分析ページ
              </Link>
              <button
                onClick={exportTasks}
                className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300"
              >
                JSON出力
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300"
              >
                JSON読込
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                onChange={importTasks}
                className="hidden"
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropZone("today");
            }}
            onDragLeave={() => setActiveDropZone(null)}
            onDrop={() => onDropToZone("today")}
            className={`rounded-3xl border p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl transition ${
              activeDropZone === "today"
                ? "border-cyan-400/80 bg-cyan-50/80"
                : "border-white/70 bg-white/75"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">今日のタスク</h2>
                <p className="text-sm text-slate-600">今日集中する項目だけを表示</p>
              </div>
              <div className="min-w-[180px]">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>達成度メーター</span>
                  <span>{meter}%</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${meter}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {todayTasks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500">
                  右側からドラッグして今日の計画を作成できます。
                </div>
              )}

              {todayTasks.map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingTaskId(task.id)}
                  onDragEnd={() => {
                    setDraggingTaskId(null);
                    setActiveDropZone(null);
                  }}
                  className={`rounded-2xl border px-4 py-3 shadow-sm transition ${
                    task.overdue
                      ? "border-rose-300 bg-gradient-to-r from-rose-50 to-white"
                      : "border-slate-200 bg-white/90"
                  } ${completingTaskId === task.id ? "complete-swoop" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {task.overdue
                          ? `期限超過: ${task.dueDate ? toJapaneseDate(task.dueDate) : "未設定"}`
                          : `予定日: ${task.dueDate ? toJapaneseDate(task.dueDate) : "未設定"}`}
                      </p>
                    </div>
                    <button
                      onClick={() => completeTask(task.id)}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:brightness-110"
                    >
                      完了
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.bucket !== "today" && (
                      <button
                        onClick={() => moveTaskToBucket(task.id, "today")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        今日へ
                      </button>
                    )}
                    {task.bucket !== "upcoming" && (
                      <button
                        onClick={() => moveTaskToBucket(task.id, "upcoming")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        今後へ
                      </button>
                    )}
                    {task.bucket !== "inbox" && (
                      <button
                        onClick={() => moveTaskToBucket(task.id, "inbox")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        箱へ
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                    >
                      削除
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">完了済みエリア</h3>
                <span className="text-xs text-slate-500">{completedTasks.length} 件</span>
              </div>
              <div className="mt-3 space-y-2">
                {completedTasks.slice(0, 8).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-emerald-900">{task.title}</p>
                      <button
                        onClick={() => reactivateTask(task.id)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        戻す
                      </button>
                    </div>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-xs text-slate-500">完了タスクはここに移動します。</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-900">タスク入力</h2>
              <p className="mt-1 text-sm text-slate-600">
                タスク名と日付を分けて入力できます。日付未設定ならインボックスに入ります。
              </p>
              <form onSubmit={onSubmitTask} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={taskTitleInput}
                  onChange={(event) => {
                    setTaskTitleInput(event.target.value);
                    if (inputError) setInputError("");
                  }}
                  placeholder="例: 企画書を仕上げる"
                  className="w-full rounded-2xl border border-slate-300/90 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
                />
                {inputError && <p className="text-xs text-rose-600">{inputError}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={taskDateInput}
                    onChange={(event) => setTaskDateInput(event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setTaskDateInput(currentDate)}
                    className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300"
                  >
                    今日
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskDateInput(ymd(addDays(new Date(`${currentDate}T00:00:00`), 1)))}
                    className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300"
                  >
                    明日
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskDateInput("")}
                    className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300"
                  >
                    日付なし
                  </button>
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:brightness-110"
                >
                  追加
                </button>
              </form>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("upcoming");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("upcoming")}
              className={`rounded-3xl border p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl transition ${
                activeDropZone === "upcoming"
                  ? "border-cyan-400/80 bg-cyan-50/80"
                  : "border-white/70 bg-white/75"
              }`}
            >
              <h2 className="text-lg font-semibold text-slate-900">今後のタスク</h2>
              <div className="mt-3 space-y-2">
                {upcomingTasks.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggingTaskId(task.id)}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setActiveDropZone(null);
                    }}
                    className="cursor-grab rounded-xl border border-slate-200 bg-white/90 px-3 py-2 active:cursor-grabbing"
                  >
                    <p className="text-sm text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.dueDate ? toJapaneseDate(task.dueDate) : "日付未設定"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => moveTaskToBucket(task.id, "today")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        今日へ
                      </button>
                      <button
                        onClick={() => moveTaskToBucket(task.id, "inbox")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        箱へ
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                      >
                        削除
                      </button>
                    </div>
                  </article>
                ))}
                {upcomingTasks.length === 0 && (
                  <p className="text-xs text-slate-500">先の予定タスクはありません。</p>
                )}
              </div>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("inbox");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("inbox")}
              className={`rounded-3xl border p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl transition ${
                activeDropZone === "inbox"
                  ? "border-fuchsia-300/80 bg-fuchsia-50/70"
                  : "border-white/70 bg-white/75"
              }`}
            >
              <h2 className="text-lg font-semibold text-slate-900">とりあえず箱（インボックス）</h2>
              <div className="mt-3 space-y-2">
                {inboxTasks.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggingTaskId(task.id)}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setActiveDropZone(null);
                    }}
                    className="cursor-grab rounded-xl border border-fuchsia-200/80 bg-gradient-to-r from-fuchsia-50 to-white px-3 py-2 active:cursor-grabbing"
                  >
                    <p className="text-sm text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500">日付未確定</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => moveTaskToBucket(task.id, "today")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        今日へ
                      </button>
                      <button
                        onClick={() => moveTaskToBucket(task.id, "upcoming")}
                        className="rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        今後へ
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                      >
                        削除
                      </button>
                    </div>
                  </article>
                ))}
                {inboxTasks.length === 0 && (
                  <p className="text-xs text-slate-500">未確定タスクはありません。</p>
                )}
              </div>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("trash");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("trash")}
              className={`rounded-3xl border p-5 shadow-[0_18px_45px_rgba(51,78,164,0.14)] backdrop-blur-xl transition ${
                activeDropZone === "trash"
                  ? "border-rose-400/90 bg-rose-50/80"
                  : "border-rose-200/80 bg-white/75"
              }`}
            >
              <h2 className="text-lg font-semibold text-rose-700">ゴミ箱</h2>
              <p className="mt-2 text-xs text-rose-600">タスクをここにドラッグすると削除されます。</p>
            </section>
          </aside>
        </div>
      </div>
      {lastDeletedTask && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-700">「{lastDeletedTask.title}」を削除しました</p>
            <button
              onClick={undoDeleteTask}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              元に戻す
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
