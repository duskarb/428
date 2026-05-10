import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "사주시각 — 태어난 시간을 도형으로",
  description: "생년월일시로부터 사주팔자를 계산하고, 오행의 균형을 시각 시스템으로 번역해 개인 문양을 생성합니다.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
