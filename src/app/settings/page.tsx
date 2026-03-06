"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  weekStartMonday,
  ymd,
} from "../../lib/task-store";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const loaded = loadSettings();
    const today = ymd(new Date());
    const thisWeekStart = weekStartMonday(today);
    if (loaded.weeklyGoalWeekStart !== thisWeekStart) {
      const reset = {
        ...loaded,
        weeklyGoalText: "",
        weeklyGoalWeekStart: thisWeekStart,
      } satisfies AppSettings;
      saveSettings(reset);
      return reset;
    }
    return loaded;
  });
  const [savedAt, setSavedAt] = useState("");

  function saveCurrentSettings() {
    saveSettings(settings);
    setSavedAt(new Date().toLocaleString("ja-JP"));
  }

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <header className="panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Settings</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">表示設定</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">完了タスク表示ルールの確認ページです。</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-ghost">メインへ戻る</Link>
              <Link href="/history" className="btn-ghost">履歴</Link>
            </div>
          </div>
        </header>

        <section className="panel space-y-4">
          <div className="panel-soft">
            <p className="text-sm font-semibold text-[var(--foreground)]">完了済みエリア表示日数</p>
            <p className="mt-1 text-sm text-[var(--muted)]">トップ画面の完了済みエリアに表示する日数を選択します。</p>
            <p className="mt-2 text-xs text-[var(--muted)]">自動削除は無効です。履歴は保持され、履歴ページで参照できます。</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setSettings((prev) => (prev ? { ...prev, completedVisibleDays: 1 } : prev))}
                className={settings.completedVisibleDays === 1 ? "btn-primary" : "btn-mini"}
              >
                今日のみ
              </button>
              <button
                onClick={() => setSettings((prev) => (prev ? { ...prev, completedVisibleDays: 2 } : prev))}
                className={settings.completedVisibleDays === 2 ? "btn-primary" : "btn-mini"}
              >
                今日+昨日
              </button>
            </div>
          </div>

          <div className="panel-soft">
            <p className="text-sm font-semibold text-[var(--foreground)]">今週の主要目標</p>
            <p className="mt-1 text-sm text-[var(--muted)]">週次で1件のみ保持します（週開始は月曜日）。</p>
            <input
              type="text"
              value={settings.weeklyGoalText}
              onChange={(event) =>
                setSettings((prev) => (prev ? { ...prev, weeklyGoalText: event.target.value } : prev))
              }
              placeholder="例: 金曜までに提案資料の初稿を完成"
              className="input mt-3"
            />
          </div>

          <button onClick={saveCurrentSettings} className="btn-primary">設定を保存</button>
          {savedAt && <p className="text-xs text-[var(--muted)]">最終保存: {savedAt}</p>}
        </section>
      </div>
    </main>
  );
}
