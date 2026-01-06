import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinksDeck Admin Dashboard",
  description: "管理画面 - サービスモード設定",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
