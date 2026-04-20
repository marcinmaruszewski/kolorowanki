import React from 'react'
import '@/styles/globals.css'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head />
      <body>
        <header className="site-header">
          <span className="logo">Kalendarz</span>
        </header>
        {children}
      </body>
    </html>
  )
}
