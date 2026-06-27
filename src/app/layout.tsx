import type { Metadata } from 'next'
import { GeistSans, GeistMono } from 'geist/font'
import './globals.css'
import { Header } from '@/components/features/layout/Header'
import { GatewayBackground } from '@/components/GatewayBackground'
import { CursorTrail } from '@/components/CursorTrail'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: {
    default: 'GateWay:Colossus',
    template: '%s — GateWay:Colossus',
  },
  description: 'A community project showcase — discover, explore, and share open-source projects.',
  openGraph: {
    title: 'GateWay:Colossus',
    description: 'A community project showcase — discover, explore, and share open-source projects.',
    url: 'https://gateway-colossus.vercel.app',
    siteName: 'GateWay:Colossus',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GateWay:Colossus',
    description: 'A community project showcase — discover, explore, and share open-source projects.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen flex flex-col scrollbar-thin antialiased">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ToastProvider>
        <GatewayBackground />
        <CursorTrail />
        <Header />

        <main id="main-content" className="flex-1 relative">
          {children}
        </main>

        <footer className="border-t border-border bg-bg">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-text-dim">
                GateWay:<span className="text-accent">Colossus</span>
              </p>
              <p className="text-xs text-text-dim">
                Built by Akhil
              </p>
            </div>
          </div>
        </footer>
        </ToastProvider>
      </body>
    </html>
  )
}
