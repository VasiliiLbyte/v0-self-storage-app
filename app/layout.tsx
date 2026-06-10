import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  variable: '--font-inter'
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: {
    template: '%s | ПЕЛИКАН',
    default: 'ПЕЛИКАН — Умное хранение вещей',
  },
  description: 'Аренда боксов для хранения вещей. Удобно, безопасно, доступно. Бронируйте онлайн за 2 минуты.',
  generator: 'v0.app',
  keywords: ['склад', 'хранение вещей', 'селф-сторадж', 'аренда бокса', 'Санкт-Петербург'],
  icons: {
    icon: '/images/favicon_32x32.png',
    apple: '/images/favicon_32x32.png',
    shortcut: '/images/favicon_32x32.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1f36' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="bg-background">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
