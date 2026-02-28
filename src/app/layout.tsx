import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "個人用タスク管理システム：要件定義まとめ",
  description: "個人用タスク管理システムの要件定義まとめ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans">{children}</body>
    </html>
  );
}
