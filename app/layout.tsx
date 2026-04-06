import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '법령 검색 | PATHWAY Partners',
  description: '한국 법령 통합 검색 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Noto Sans KR', -apple-system, sans-serif", margin: 0, backgroundColor: '#f6f7f9' }}>
        {children}
      </body>
    </html>
  )
}
