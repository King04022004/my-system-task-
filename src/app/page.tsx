"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  AppSettings,
  Bucket,
  completedInMainWindow,
  ensureTaskConsistency,
  isCompletedOnDate,
  loadSettings,
  rolloverTasks,
  saveSettings,
  seedTasks,
  SETTINGS_KEY,
  sortByPriority,
  STORAGE_KEY,
  StoredState,
  Task,
  TaskCategory,
  TaskPriority,
  toJapaneseDate,
  weekEndSunday,
  weekStartMonday,
  ymd,
} from "../lib/task-store";

type DropZone = Exclude<Bucket, "completed"> | "trash";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(ymd(new Date()));
  const [taskTitleInput, setTaskTitleInput] = useState<string>("");
  const [taskDateInput, setTaskDateInput] = useState<string>("");
  const [taskPriorityInput, setTaskPriorityInput] = useState<TaskPriority>("medium");
  const [taskCategoryInput, setTaskCategoryInput] = useState<TaskCategory>("personal");
  const [showMorningPopup, setShowMorningPopup] = useState<boolean>(true);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>("");
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
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
      const loaded = loadSettings();
      const thisWeekStart = weekStartMonday(today);
      if (loaded.weeklyGoalWeekStart !== thisWeekStart) {
        const reset: AppSettings = {
          ...loaded,
          weeklyGoalText: "",
          weeklyGoalWeekStart: thisWeekStart,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(reset));
        setSettings(reset);
      } else {
        setSettings(loaded);
      }
      setReady(true);
    }
  }, []);

  useEffect(() => {
    function syncSettings() {
      setSettings(loadSettings());
    }
    window.addEventListener("focus", syncSettings);
    document.addEventListener("visibilitychange", syncSettings);
    return () => {
      window.removeEventListener("focus", syncSettings);
      document.removeEventListener("visibilitychange", syncSettings);
    };
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

  useEffect(() => {
    function closeTaskMenu() {
      setOpenTaskMenuId(null);
    }
    window.addEventListener("pointerdown", closeTaskMenu);
    return () => window.removeEventListener("pointerdown", closeTaskMenu);
  }, []);

  const currentWeekStart = useMemo(() => weekStartMonday(currentDate), [currentDate]);
  const currentWeekEnd = useMemo(() => weekEndSunday(currentDate), [currentDate]);

  useEffect(() => {
    if (!ready) return;
    if (settings.weeklyGoalWeekStart === currentWeekStart) return;
    const reset: AppSettings = {
      ...settings,
      weeklyGoalText: "",
      weeklyGoalWeekStart: currentWeekStart,
    };
    setSettings(reset);
    saveSettings(reset);
  }, [currentWeekStart, ready, settings]);

  const todayTasks = useMemo(
    () => sortByPriority(tasks.filter((task) => task.bucket === "today" && !task.completedAt)),
    [tasks],
  );

  const weeklyTasks = useMemo(
    () =>
      sortByPriority(
        tasks.filter(
          (task) =>
            task.bucket === "upcoming" &&
            !task.completedAt &&
            Boolean(task.dueDate && task.dueDate <= currentWeekEnd),
        ),
      ),
    [tasks, currentWeekEnd],
  );

  const futureTasks = useMemo(
    () =>
      sortByPriority(
        tasks.filter(
          (task) =>
            task.bucket === "upcoming" &&
            !task.completedAt &&
            Boolean(task.dueDate && task.dueDate > currentWeekEnd),
        ),
      ),
    [tasks, currentWeekEnd],
  );

  const inboxTasks = useMemo(
    () => sortByPriority(tasks.filter((task) => task.bucket === "inbox" && !task.completedAt)),
    [tasks],
  );

  const completedTasksForMain = useMemo(
    () => completedInMainWindow(tasks, currentDate, settings.completedVisibleDays),
    [tasks, currentDate, settings.completedVisibleDays],
  );

  const yesterday = ymd(addDays(new Date(`${currentDate}T00:00:00`), -1));
  const yesterdayCarryOver = todayTasks.filter((task) => task.dueDate === yesterday);
  const todayDueTasks = todayTasks.filter((task) => task.dueDate === currentDate);

  const doneTodayCount = useMemo(
    () => tasks.filter((task) => isCompletedOnDate(task, currentDate)).length,
    [tasks, currentDate],
  );

  const totalToday = todayTasks.length + doneTodayCount;
  const meter = totalToday === 0 ? 0 : Math.round((doneTodayCount / totalToday) * 100);
  const priorityOptions: TaskPriority[] = ["high", "medium", "low"];
  const categoryOptions: TaskCategory[] = ["work", "personal"];

  function priorityLabel(priority: TaskPriority): string {
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    return "低";
  }

  function categoryLabel(category: TaskCategory): string {
    return category === "work" ? "仕事" : "個人";
  }

  function priorityBadgeClass(priority: TaskPriority): string {
    if (priority === "high") return "priority-badge priority-badge-high";
    if (priority === "medium") return "priority-badge priority-badge-medium";
    return "priority-badge priority-badge-low";
  }

  function categoryBadgeClass(category: TaskCategory): string {
    if (category === "work") return "category-badge category-badge-work";
    return "category-badge category-badge-personal";
  }

  function saveWeeklyGoal(value: string) {
    const next: AppSettings = {
      ...settings,
      weeklyGoalText: value,
      weeklyGoalWeekStart: currentWeekStart,
    };
    setSettings(next);
    saveSettings(next);
  }

  function addTask(
    titleRaw: string,
    dueDateRaw: string,
    priority: TaskPriority,
    category: TaskCategory,
  ) {
    const title = titleRaw.trim();
    if (!title) {
      setInputError("タスク名を入力してください。");
      return;
    }

    const dueDate = dueDateRaw || null;
    const bucket: Bucket = !dueDate ? "inbox" : dueDate <= currentDate ? "today" : "upcoming";

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      priority,
      category,
      dueDate,
      bucket,
      createdAt: new Date().toISOString(),
      completedAt: null,
      overdue: Boolean(dueDate && dueDate < currentDate),
    };

    setTasks((prev) => [newTask, ...prev]);
    setTaskTitleInput("");
    setTaskPriorityInput("medium");
    setTaskCategoryInput("personal");
    setInputError("");
  }

  function onSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask(taskTitleInput, taskDateInput, taskPriorityInput, taskCategoryInput);
  }

  function setTaskPriority(taskId: string, priority: TaskPriority) {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, priority } : task)),
    );
  }

  function priorityMenuActions(task: Task): Array<{ label: string; onClick: () => void }> {
    const others = priorityOptions.filter((priority) => priority !== task.priority);
    return others.map((priority) => ({
      label: `優先度を${priorityLabel(priority)}に変更`,
      onClick: () => setTaskPriority(task.id, priority),
    }));
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
    }, 280);
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

  function renderTaskMenu(
    taskId: string,
    actions: Array<{ label: string; onClick: () => void; danger?: boolean }>,
    mode: "floating" | "inline" = "floating",
  ) {
    const isOpen = openTaskMenuId === taskId;
    return (
      <div className={mode === "inline" ? "task-actions task-actions-inline" : "task-actions"}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setOpenTaskMenuId((prev) => (prev === taskId ? null : taskId));
          }}
          className={`task-actions-trigger ${isOpen ? "task-actions-trigger-visible" : ""}`}
          aria-expanded={isOpen}
          aria-label="タスク操作"
        >
          ...
        </button>
        <div className={`task-actions-menu ${isOpen ? "task-actions-menu-open" : ""}`} onClick={(event) => event.stopPropagation()}>
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick();
                setOpenTaskMenuId(null);
              }}
              className={action.danger ? "task-actions-item task-actions-item-danger" : "task-actions-item"}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderTaskMeta(task: Task, dateText?: string | null) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={categoryBadgeClass(task.category)}>{categoryLabel(task.category)}</span>
        <span className={priorityBadgeClass(task.priority)}>優先度 {priorityLabel(task.priority)}</span>
        {dateText && <span className="text-[11px] text-[var(--muted)]">期限: {toJapaneseDate(dateText)}</span>}
      </div>
    );
  }

  if (!ready) {
    return (
      <main className="app-shell">
        <div className="panel mx-auto flex min-h-[40vh] w-full max-w-4xl items-center justify-center text-sm text-[var(--muted)]">
          読み込み中...
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {showMorningPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]">
          <div className="panel w-full max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Morning Focus</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">今日の着手確認</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="panel-soft p-4">
                <p className="text-xs text-[var(--muted)]">昨日持ち越し</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{yesterdayCarryOver.length}</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-xs text-[var(--muted)]">今日の予定</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{todayDueTasks.length}</p>
              </div>
            </div>
            <button onClick={() => setShowMorningPopup(false)} className="btn-primary mt-5 w-full">
              今日を開始する
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold text-[var(--foreground)]">Personal Task System</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">{toJapaneseDate(currentDate)} の集中計画</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/analytics" className="btn-ghost">分析</Link>
              <Link href="/history" className="btn-ghost">履歴</Link>
              <Link href="/settings" className="btn-ghost">設定</Link>
              <button onClick={exportTasks} className="btn-ghost">JSON出力</button>
              <button onClick={() => importInputRef.current?.click()} className="btn-ghost">JSON読込</button>
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

        <section className="panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">今週の主要目標</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                対象週: {toJapaneseDate(currentWeekStart)} - {toJapaneseDate(currentWeekEnd)}
              </p>
            </div>
            <Link href="/settings" className="btn-mini">設定で編集</Link>
          </div>
          <input
            type="text"
            value={settings.weeklyGoalText}
            onChange={(event) => saveWeeklyGoal(event.target.value)}
            placeholder="例: 金曜までに提案資料の初稿を完成"
            className="input mt-3"
          />
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <section
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropZone("today");
            }}
            onDragLeave={() => setActiveDropZone(null)}
            onDrop={() => onDropToZone("today")}
            className={`panel ${activeDropZone === "today" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">今日のタスク</h2>
                <p className="text-sm text-[var(--muted)]">優先して進める項目</p>
              </div>
              <div className="min-w-[180px]">
                <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                  <span>達成率</span>
                  <span>{meter}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
                  <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${meter}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {todayTasks.length === 0 && <div className="panel-soft text-sm text-[var(--muted)]">タスクはありません。</div>}
              {todayTasks.map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingTaskId(task.id)}
                  onDragEnd={() => {
                    setDraggingTaskId(null);
                    setActiveDropZone(null);
                  }}
                  className={`task-card task-card-simple relative ${task.overdue ? "border-amber-300" : ""} ${completingTaskId === task.id ? "complete-swoop" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
                      {renderTaskMeta(task, task.dueDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderTaskMenu(task.id, [
                        ...priorityMenuActions(task),
                        { label: "週間タスクへ", onClick: () => moveTaskToBucket(task.id, "upcoming") },
                        { label: "箱へ", onClick: () => moveTaskToBucket(task.id, "inbox") },
                        { label: "削除", onClick: () => deleteTask(task.id), danger: true },
                      ], "inline")}
                      <button onClick={() => completeTask(task.id)} className="btn-primary">完了</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 panel-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  完了済みエリア（{settings.completedVisibleDays === 1 ? "本日" : "本日+昨日"}）
                </h3>
                <span className="text-xs text-[var(--muted)]">{completedTasksForMain.length} 件</span>
              </div>
              <div className="space-y-2">
                {completedTasksForMain.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-[var(--foreground)]">{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={categoryBadgeClass(task.category)}>{categoryLabel(task.category)}</span>
                          <span className={priorityBadgeClass(task.priority)}>優先度 {priorityLabel(task.priority)}</span>
                          <span className="text-[11px] text-[var(--muted)]">
                            完了日: {task.completedAt ? toJapaneseDate(task.completedAt.slice(0, 10)) : "-"}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => reactivateTask(task.id)} className="btn-mini">戻す</button>
                    </div>
                  </div>
                ))}
                {completedTasksForMain.length === 0 && <p className="text-xs text-[var(--muted)]">該当する完了タスクはありません。</p>}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="panel">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">タスク入力</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">仕事と個人を分けて登録できます。日付未設定はインボックスに入ります。</p>
              <form onSubmit={onSubmitTask} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={taskTitleInput}
                  onChange={(event) => {
                    setTaskTitleInput(event.target.value);
                    if (inputError) setInputError("");
                  }}
                  placeholder="例: 企画書を仕上げる"
                  className="input"
                />
                {inputError && <p className="text-xs text-rose-700">{inputError}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <input type="date" value={taskDateInput} onChange={(event) => setTaskDateInput(event.target.value)} className="input max-w-[180px]" />
                  <button type="button" onClick={() => setTaskDateInput(currentDate)} className="btn-mini">今日</button>
                  <button type="button" onClick={() => setTaskDateInput(ymd(addDays(new Date(`${currentDate}T00:00:00`), 1)))} className="btn-mini">明日</button>
                  <button type="button" onClick={() => setTaskDateInput("")} className="btn-mini">日付なし</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">区分</span>
                  {categoryOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTaskCategoryInput(option)}
                      className={taskCategoryInput === option ? "btn-primary" : "btn-mini"}
                    >
                      {categoryLabel(option)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">優先度</span>
                  {priorityOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTaskPriorityInput(option)}
                      className={taskPriorityInput === option ? "btn-primary" : "btn-mini"}
                    >
                      {priorityLabel(option)}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn-primary">追加</button>
              </form>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("upcoming");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("upcoming")}
              className={`panel ${activeDropZone === "upcoming" ? "ring-1 ring-[var(--accent)]" : ""}`}
            >
              <h2 className="text-lg font-semibold text-[var(--foreground)]">週間タスク</h2>
              <div className="mt-3 space-y-2">
                {weeklyTasks.map((task) => (
                  <article key={task.id} draggable onDragStart={() => setDraggingTaskId(task.id)} onDragEnd={() => { setDraggingTaskId(null); setActiveDropZone(null); }} className="task-card task-card-simple relative">
                    {renderTaskMenu(task.id, [
                      ...priorityMenuActions(task),
                      { label: "今日へ", onClick: () => moveTaskToBucket(task.id, "today") },
                      { label: "未定へ", onClick: () => moveTaskToBucket(task.id, "inbox") },
                      { label: "削除", onClick: () => deleteTask(task.id), danger: true },
                    ])}
                    <p className="text-sm text-[var(--foreground)]">{task.title}</p>
                    {renderTaskMeta(task, task.dueDate)}
                  </article>
                ))}
                {weeklyTasks.length === 0 && <p className="text-xs text-[var(--muted)]">週内の予定タスクはありません。</p>}
              </div>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("upcoming");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("upcoming")}
              className={`panel ${activeDropZone === "upcoming" ? "ring-1 ring-[var(--accent)]" : ""}`}
            >
              <h2 className="text-lg font-semibold text-[var(--foreground)]">今後のタスク</h2>
              <div className="mt-3 space-y-2">
                {futureTasks.map((task) => (
                  <article key={task.id} draggable onDragStart={() => setDraggingTaskId(task.id)} onDragEnd={() => { setDraggingTaskId(null); setActiveDropZone(null); }} className="task-card task-card-simple relative">
                    {renderTaskMenu(task.id, [
                      ...priorityMenuActions(task),
                      { label: "今日へ", onClick: () => moveTaskToBucket(task.id, "today") },
                      { label: "未定へ", onClick: () => moveTaskToBucket(task.id, "inbox") },
                      { label: "削除", onClick: () => deleteTask(task.id), danger: true },
                    ])}
                    <p className="text-sm text-[var(--foreground)]">{task.title}</p>
                    {renderTaskMeta(task, task.dueDate)}
                  </article>
                ))}
                {futureTasks.length === 0 && <p className="text-xs text-[var(--muted)]">来週以降のタスクはありません。</p>}
              </div>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("inbox");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("inbox")}
              className={`panel ${activeDropZone === "inbox" ? "ring-1 ring-[var(--accent)]" : ""}`}
            >
              <h2 className="text-lg font-semibold text-[var(--foreground)]">未定タスク</h2>
              <div className="mt-3 space-y-2">
                {inboxTasks.map((task) => (
                  <article key={task.id} draggable onDragStart={() => setDraggingTaskId(task.id)} onDragEnd={() => { setDraggingTaskId(null); setActiveDropZone(null); }} className="task-card task-card-simple relative">
                    {renderTaskMenu(task.id, [
                      ...priorityMenuActions(task),
                      { label: "今日へ", onClick: () => moveTaskToBucket(task.id, "today") },
                      { label: "週間タスクへ", onClick: () => moveTaskToBucket(task.id, "upcoming") },
                      { label: "削除", onClick: () => deleteTask(task.id), danger: true },
                    ])}
                    <p className="text-sm text-[var(--foreground)]">{task.title}</p>
                    {renderTaskMeta(task, null)}
                    <p className="mt-1 text-xs text-[var(--muted)]">日付未確定</p>
                  </article>
                ))}
                {inboxTasks.length === 0 && <p className="text-xs text-[var(--muted)]">未確定タスクはありません。</p>}
              </div>
            </section>

            <section
              onDragOver={(event) => {
                event.preventDefault();
                setActiveDropZone("trash");
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={() => onDropToZone("trash")}
              className={`panel ${activeDropZone === "trash" ? "ring-1 ring-rose-400" : ""}`}
            >
              <h2 className="text-lg font-semibold text-[var(--foreground)]">ゴミ箱</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">ドラッグで削除</p>
            </section>
          </aside>
        </div>
      </div>

      {lastDeletedTask && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted)]">「{lastDeletedTask.title}」を削除しました</p>
            <button onClick={undoDeleteTask} className="btn-mini">元に戻す</button>
          </div>
        </div>
      )}
    </main>
  );
}

