"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../../lib/task-store";

export default function SettingsPage() {
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    const settings = loadSettings();
    if (settings.completedVisibleDays !== 2) {
      saveSettings(DEFAULT_SETTINGS);
    }
  }, []);

  function saveFixedPolicy() {
    saveSettings(DEFAULT_SETTINGS);
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
            <p className="mt-1 text-sm text-[var(--muted)]">本日と昨日の2日分を固定で表示します。</p>
            <p className="mt-2 text-xs text-[var(--muted)]">自動削除は無効です。履歴は保持され、履歴ページで参照できます。</p>
          </div>

          <button onClick={saveFixedPolicy} className="btn-primary">この方針を保存</button>
          {savedAt && <p className="text-xs text-[var(--muted)]">最終保存: {savedAt}</p>}
        </section>
      </div>
    </main>
  );
}
