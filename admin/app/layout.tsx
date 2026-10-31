import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIGEN // Judge & Organizer Command Center',
  description: 'Dedicated evaluation portal and broadcast control for AIGen Hackathon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  )
}
