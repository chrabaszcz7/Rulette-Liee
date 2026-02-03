import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rulette Lie - Multiplayer Truth or Lie Game',
  description: 'A thrilling multiplayer Russian roulette game with truth and lie mechanics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} animated-bg min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
