import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Servora — AI SaaS 제작 플랫폼",
    template: "%s | Servora",
  },
  description: "아이디어만 입력하면 AI가 기획 → 디자인 → MVP까지 자동으로 만들어 드립니다. 코딩 없이 나만의 SaaS를 시작하세요.",
  keywords: ["AI", "SaaS", "MVP", "기획", "자동화", "노코드", "서비스 제작", "Servora", "써보라"],
  authors: [{ name: "Servora" }],
  creator: "Servora",
  metadataBase: new URL("https://servora.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    siteName: "Servora",
    title: "Servora — 생각이 서비스가 되는 순간",
    description: "10개 질문에 답하면 AI가 기획안을 작성하고, 디자인을 선택하면 MVP를 자동으로 생성합니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Servora - AI SaaS 제작 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Servora — AI SaaS 제작 플랫폼",
    description: "아이디어만 입력하면 기획 → 디자인 → MVP까지. 코딩 없이 나만의 SaaS를 시작하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
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
