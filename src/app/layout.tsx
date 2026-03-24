import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Servora - AI SaaS 제작 플랫폼",
  description: "아이디어만 입력하면 기획 → 디자인 → MVP까지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-body selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
