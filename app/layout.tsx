import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
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
    { media: '(prefers-color-scheme: light)', color: '#fcfcfc' },
    { media: '(prefers-color-scheme: dark)', color: '#02060d' },
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
    <html lang="ru" className="bg-background" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
