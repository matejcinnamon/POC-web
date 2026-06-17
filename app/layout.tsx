import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Utility Bills - Računi',
  description: 'Automatizacija računa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  )
}
