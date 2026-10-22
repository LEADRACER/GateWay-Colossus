import type { Metadata } from 'next'
import { GeistSans, GeistMono } from 'geist/font'
import './globals.css'
import { Header } from '@/components/shell/Header'
import { Footer } from '@/components/shell/Footer'
import { TerminalGrid } from '@/components/features/terminal/TerminalGrid'
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
          <TerminalGrid />
          <Header />

          <main id="main-content" className="flex-1 relative">
            {children}
          </main>

          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}
