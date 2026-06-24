import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/features/layout/Header'

export const metadata: Metadata = {
  title: 'GateWay:Colossus',
  description: 'A community project showcase — built by Akhil, powered by the collective.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-[#333] bg-[#0a0a0a] py-8">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#666]">
            <p>GateWay:<span className="text-[#00ff41]">Colossus</span> — Built by Akhil</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
