export type Bucket = "today" | "upcoming" | "inbox" | "completed";

export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  bucket: Bucket;
  createdAt: string;
  completedAt: string | null;
  overdue: boolean;
};

export type StoredState = {
  tasks: Task[];
  lastActiveDate: string;
};

export type AppSettings = {
  completedVisibleDays: number;
};

export const STORAGE_KEY = "focus-task-system-v1";
export const SETTINGS_KEY = "focus-task-settings-v1";
export const DEFAULT_SETTINGS: AppSettings = { completedVisibleDays: 2 };

export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function toJapaneseDate(dateText: string): string {
  const [y, m, d] = dateText.split("-");
  return `${y}/${m}/${d}`;
}

export function ensureTaskConsistency(task: Task, todayText: string): Task {
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

export function rolloverTasks(tasks: Task[], todayText: string): Task[] {
  return tasks.map((task) => ensureTaskConsistency(task, todayText));
}

export function sortByPriority(tasks: Task[]): Task[] {
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

export function seedTasks(todayText: string): Task[] {
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

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      completedVisibleDays: parsed.completedVisibleDays === 2 ? 2 : DEFAULT_SETTINGS.completedVisibleDays,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isCompletedOnDate(task: Task, dateText: string): boolean {
  return Boolean(task.completedAt && task.completedAt.slice(0, 10) === dateText);
}

export function completedInMainWindow(tasks: Task[], currentDate: string): Task[] {
  const yesterday = ymd(addDays(new Date(`${currentDate}T00:00:00`), -1));
  return tasks
    .filter((task) => task.bucket === "completed" && task.completedAt)
    .filter((task) => {
      const doneDate = task.completedAt?.slice(0, 10);
      return doneDate === currentDate || doneDate === yesterday;
    })
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}
