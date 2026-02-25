const highlights = [
  {
    title: "LP公開まで最短1日",
    body: "最初の公開に必要な構成を最小単位で整理。あとはコピーを差し替えるだけ。",
  },
  {
    title: "運用しやすい構造",
    body: "セクションごとに目的を分解。差し替えの影響範囲が小さく、ABテストも簡単。",
  },
  {
    title: "拡張前提の設計",
    body: "問い合わせ・計測・導線などの追加を想定。早期の無理を避ける土台。",
  },
];

const metrics = [
  { label: "平均立ち上げ期間", value: "7日→2日" },
  { label: "初回CVR改善幅", value: "+38%" },
  { label: "運用工数削減", value: "-52%" },
];

const plans = [
  {
    name: "Starter",
    price: "¥0",
    desc: "検証用の最小構成",
    items: ["ヒーロー + 概要 + CTA", "計測導線の雛形", "無制限の複製"],
    accent: false,
  },
  {
    name: "Launch",
    price: "¥9,800",
    desc: "本番運用に必要な構成",
    items: ["全セクション解放", "フォーム連携ガイド", "運用テンプレ付き"],
    accent: true,
  },
  {
    name: "Scale",
    price: "¥29,800",
    desc: "チーム運用向け",
    items: ["複数LP管理", "役割別レビュー導線", "改善レポート雛形"],
    accent: false,
  },
];

const faqs = [
  {
    q: "このまま公開しても問題ありませんか？",
    a: "コピーとCTAを差し替えるだけでも公開できます。必要に応じて導線や計測を追加してください。",
  },
  {
    q: "デザインは変更できますか？",
    a: "もちろん可能です。各セクションは独立しているので、差し替えや削除も簡単です。",
  },
  {
    q: "運用開始後の改善はどう進めますか？",
    a: "セクション単位でABテストができる設計なので、影響を限定しながら改善できます。",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[color:var(--background)]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--accent-2)]" />
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">
                Aurora LP
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                Launch-ready base
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a className="text-[color:var(--muted)] hover:text-black" href="#flow">
              構成
            </a>
            <a className="text-[color:var(--muted)] hover:text-black" href="#proof">
              実績
            </a>
            <a
              className="text-[color:var(--muted)] hover:text-black"
              href="#pricing"
            >
              料金
            </a>
            <a className="text-[color:var(--muted)] hover:text-black" href="#faq">
              FAQ
            </a>
          </nav>
          <button className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/90">
            資料を受け取る
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,107,61,0.25),_transparent_55%),radial-gradient(circle_at_30%_30%,_rgba(42,179,255,0.25),_transparent_60%)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.2fr_0.8fr] md:py-28">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Launch in days
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                LPの土台を、最短で強く。
                <br />
                企画と運用のズレをなくす構成。
              </h1>
              <p className="text-lg text-[color:var(--muted)]">
                企画〜公開までの「迷い」と「やり直し」を最小化。
                実運用を前提にしたLP基盤で、初速と継続改善を両立します。
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[color:var(--accent)]/30 transition hover:-translate-y-0.5">
                  今すぐテンプレを使う
                </button>
                <button className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
                  導入相談をする
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-xs text-[color:var(--muted)]">
                <span>ノーコード運用にも対応</span>
                <span>計測導線の雛形付き</span>
                <span>導入社数 120+</span>
              </div>
            </div>
            <div className="rounded-3xl border border-[color:var(--stroke)] bg-white p-6 shadow-[0_30px_60px_rgba(11,15,26,0.08)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[color:var(--muted)]">
                  LP構成プレビュー
                </p>
                <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                  Draft
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  "Hero + Value",
                  "Problem / Solution",
                  "Social Proof",
                  "Feature Grid",
                  "Pricing + CTA",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-dashed border-[color:var(--stroke)] bg-[color:var(--background)] px-4 py-3 text-sm font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
                Run A/B Test → 15 variants
              </div>
            </div>
          </div>
        </section>

        <section id="flow" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                3ステップで構築が終わる。
              </h2>
              <p className="text-[color:var(--muted)]">
                作業順を固定し、どこから着手しても完成に向かう構成にしています。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                "要件整理: ペルソナと訴求を1枚に集約",
                "構成配置: セクション単位で組み立て",
                "公開準備: 計測と導線を確認して完了",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-[color:var(--stroke)] bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold text-[color:var(--muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 text-sm font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[color:var(--stroke)] bg-white p-6"
              >
                <h3 className="font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="proof"
          className="mx-auto w-full max-w-6xl px-6 py-16"
        >
          <div className="rounded-3xl border border-[color:var(--stroke)] bg-white p-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Proof
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  数字で見る改善効果
                </h2>
              </div>
              <button className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold">
                事例をダウンロード
              </button>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl bg-[color:var(--background)] p-6"
                >
                  <p className="text-2xl font-semibold">{metric.value}</p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Pricing
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              最初は小さく、成長したら拡張。
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-6 ${
                  plan.accent
                    ? "border-black bg-black text-white"
                    : "border-[color:var(--stroke)] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold">
                    {plan.name}
                  </h3>
                  {plan.accent ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
                      人気
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-3xl font-semibold">{plan.price}</p>
                <p
                  className={`mt-2 text-sm ${
                    plan.accent ? "text-white/70" : "text-[color:var(--muted)]"
                  }`}
                >
                  {plan.desc}
                </p>
                <div className="mt-6 space-y-3 text-sm">
                  {plan.items.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          plan.accent ? "bg-white" : "bg-black"
                        }`}
                      />
                      <span
                        className={plan.accent ? "text-white/80" : undefined}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className={`mt-8 w-full rounded-full px-4 py-2 text-sm font-semibold ${
                    plan.accent
                      ? "bg-white text-black"
                      : "border border-black/10 bg-white"
                  }`}
                >
                  {plan.accent ? "今すぐ開始" : "詳細を見る"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
                FAQ
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                よくある質問
              </h2>
              <p className="text-[color:var(--muted)]">
                LP構築に関する疑問を先回りで整理しています。
              </p>
            </div>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-[color:var(--stroke)] bg-white p-6"
                >
                  <p className="text-sm font-semibold">{faq.q}</p>
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="rounded-3xl bg-gradient-to-br from-black via-[#111827] to-[#1f2937] p-10 text-white md:p-14">
            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <h2 className="font-display text-3xl font-semibold">
                  まずは1枚。最速で公開できる状態に。
                </h2>
                <p className="text-white/70">
                  テンプレートを使って最小構成のLPを立ち上げ、成果に合わせて拡張しましょう。
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">
                  テンプレをダウンロード
                </button>
                <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white">
                  デモを予約する
                </button>
                <p className="text-xs text-white/60">
                  無料プレビューは24時間で失効します。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-[color:var(--muted)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-black">
              Aurora LP
            </p>
            <p>運用前提のLP基盤を提供</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <a className="hover:text-black" href="#flow">
              構成
            </a>
            <a className="hover:text-black" href="#pricing">
              料金
            </a>
            <a className="hover:text-black" href="#faq">
              FAQ
            </a>
            <a className="hover:text-black" href="#">
              プライバシー
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
